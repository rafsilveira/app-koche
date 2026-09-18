#!/usr/bin/env python3
"""devolve_nivel_para_planilha.py -- leva de volta a planilha os niveis que so existem no app.

POR QUE EXISTE (18/Set/2026)
    Duas portas de escrita (planilha e tela de Admin do app) nunca foram reconciliadas. Sobrou
    um punhado de niveis gravados SO no Firestore, com a celula correspondente vazia na
    planilha. Enquanto ficarem so de um lado eles correm risco: a regra travada por Rafael e
    "a planilha e a fonte", entao qualquer sync futuro que confie nela os apaga. A TRAVA 1 do
    `sync_planilha_firestore.py` existe exatamente por causa deles -- esta e a correcao de raiz
    que torna a trava desnecessaria.

    Sentido da escrita: Firestore -> planilha. E o unico script do projeto que escreve na
    planilha; todos os outros leem dela.

AS TRAVAS
    1. So escreve em celula VAZIA. Se a planilha tiver qualquer coisa ali, nao encosta -- a
       planilha e a fonte e ganha sempre, inclusive de si mesma.
    2. So escreve em linha unica. Se a chave casar com 0 ou 2+ linhas, pula e reporta.
    3. Ensaio por padrao. So escreve com --executar.
    4. Backup do estado anterior das celulas antes de escrever.
    5. URL solta nao e procedimento. Um valor que e so um link vira RECUSA, nao escrita.
       Achado em 18/Set: o FIAT TORO 948TE tinha, no campo do procedimento, um link do Drive
       IDENTICO ao do proprio `image_level_url` -- foto colada no campo errado. Devolver isso
       para a planilha daria a um erro o carimbo de dado bom, porque a planilha e a fonte.
       Erro de campo se conserta na origem, nao se propaga.

USO
    python3 devolve_nivel_para_planilha.py             # ensaio
    python3 devolve_nivel_para_planilha.py --executar  # escreve
"""
import argparse, datetime, glob, importlib.util, json, pathlib, re, sys
import requests

SYNC = "/root/app-koche/scripts/sync_planilha_firestore.py"
PLANILHA = "1GhL4CzjtSHZTwbXR-PWZt8BCb1A3imYUs4t-29GMXJI"
ABA = "Sheet1"
COLUNA = "Nível"
CAMPO = "level_check_procedure"
ESCOPO = "https://www.googleapis.com/auth/spreadsheets"
DESTINO_BACKUP = pathlib.Path("/root/backups_producao")
SO_URL = re.compile(r"^https?://\S+$")


def carrega(caminho, nome):
    spec = importlib.util.spec_from_file_location(nome, caminho)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def acha_vigia():
    a = glob.glob("/root/Central-IA-Koche/07*/Python/APIs_Marketing/vigia_divergencia_app.py")
    if len(a) != 1:
        raise SystemExit(f"esperava 1 vigia, achei {len(a)}")
    return a[0]


def letra(i):
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--executar", action="store_true")
    args = ap.parse_args()

    vd = carrega(acha_vigia(), "vd")
    sy = carrega(SYNC, "sy")

    cred = vd.credencial(ESCOPO)
    h = {"Authorization": f"Bearer {cred.token}"}
    r = requests.get(
        f"https://sheets.googleapis.com/v4/spreadsheets/{PLANILHA}/values/{ABA}",
        headers=h, timeout=90)
    r.raise_for_status()
    linhas = r.json().get("values", [])
    cab = [c.strip() for c in linhas[0]]
    alvo = [i for i, c in enumerate(cab) if vd.norm(c) == vd.norm(COLUNA)]
    if len(alvo) != 1:
        raise SystemExit(f"coluna {COLUNA!r}: esperava 1, achei {len(alvo)} -> {alvo}")
    col = alvo[0]
    print(f"coluna {COLUNA!r} = {letra(col)} (indice {col})")

    por_chave = {}
    for n, row in enumerate(linhas[1:], start=2):
        if len(row) < 5 or not (row[1] or "").strip():
            continue
        k = vd.chave(row[0], row[1], row[4], row[2])
        atual = (row[col] if len(row) > col else "").strip()
        por_chave.setdefault(k, []).append((n, atual))

    base, hf = sy.firestore_sessao()
    fire = {}
    for d in sy.ler_firestore(base, hf):
        f = d.get("fields", {})
        fire[sy.chave(sy.valor(f, "brand"), sy.valor(f, "model"),
                      sy.valor(f, "transmission"), sy.valor(f, "year"))] = \
            sy.valor(f, CAMPO).strip()

    plano, pulados = [], []
    for k, texto in fire.items():
        if not texto or k not in por_chave:
            continue
        ocor = por_chave[k]
        if len(ocor) != 1:
            pulados.append((k, f"casou com {len(ocor)} linhas"))
            continue
        if SO_URL.match(texto):
            pulados.append((k, "valor e so uma URL, nao um procedimento -- erro de campo"))
            continue                      # TRAVA 5
        n, atual = ocor[0]
        if atual:
            continue                      # TRAVA 1: planilha preenchida nunca e sobrescrita
        plano.append({"chave": k, "linha": n, "celula": f"{ABA}!{letra(col)}{n}",
                      "texto": texto})

    print(f"planilha : {len(linhas) - 1} linhas")
    print(f"firestore: {len(fire)} veiculos")
    print()
    print(f"  a devolver para a planilha : {len(plano)}")
    print(f"  recusados pelas travas     : {len(pulados)}")
    for k, m in pulados:
        print(f"     {k[:60]} -- {m}")
    print()
    for p in plano:
        print(f"  {p['celula']:<14} {p['chave'][:48]}")
        print(f"                 {p['texto'][:95]}")

    if not plano:
        print("nada a devolver")
        return 0

    if not args.executar:
        print()
        print("=== ENSAIO -- nada foi escrito. Para escrever: --executar ===")
        return 0

    DESTINO_BACKUP.mkdir(parents=True, exist_ok=True)
    carimbo = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    bkp = DESTINO_BACKUP / f"planilha_niveis_devolvidos_{carimbo}.json"
    bkp.write_text(json.dumps(plano, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nbackup: {bkp}  (as celulas estavam VAZIAS -- desfazer = limpar de novo)")

    corpo = {"valueInputOption": "RAW",
             "data": [{"range": p["celula"], "values": [[p["texto"]]]} for p in plano]}
    w = requests.post(
        f"https://sheets.googleapis.com/v4/spreadsheets/{PLANILHA}/values:batchUpdate",
        headers={**h, "Content-Type": "application/json"}, json=corpo, timeout=90)
    if not w.ok:
        print(f"ERRO {w.status_code}: {w.text[:300]}")
        return 1
    j = w.json()
    print(f"celulas atualizadas: {j.get('totalUpdatedCells')} "
          f"em {j.get('totalUpdatedRows')} linhas")
    return 0


if __name__ == "__main__":
    sys.exit(main())