#!/usr/bin/env python3
"""sync_planilha_firestore.py — leva Nivel e Foto do Nivel da planilha para o Firestore.

POR QUE EXISTE (18/Set/2026)
    O fluxo real do dado do App Koche e: planilha do Google -> Firestore. O Firestore e a
    fonte de verdade em RUNTIME (o `dataService.js` diz isso com todas as letras); o JSON do
    repositorio e historico e nao e lido pelo app.
    Medido em 18/Set: a planilha tinha 173 niveis e 147 fotos; o Firestore, 101 niveis e
    apenas 3 fotos. Ou seja, 79 niveis e 141 fotos de trabalho feito que o mecanico nao via.

O QUE ELE TOCA — E SO ISSO
    `level_check_procedure` e `image_level_url`. Nada de preco, fluido, filtro, conexao,
    video ou qualquer outro campo. O `updateMask` do Firestore garante isso no protocolo,
    nao so na intencao: campo que nao esta na mascara nao e tocado nem se estiver no corpo.

AS TRES TRAVAS
    1. NUNCA grava vazio por cima de preenchido. Medido em 18/Set: existem 10 niveis que
       estao no Firestore e NAO estao na planilha — alguem escreveu direto. Um sync ingenuo
       os apagaria, sem erro e sem aviso. Esta trava existe por causa desses 10.
    2. Ensaio por padrao. So escreve com --executar, igual a receita da virada do site.
    3. Backup antes de escrever: o valor ANTERIOR de todo documento tocado vai para um
       arquivo JSON com carimbo, para dar rollback.

USO
    python3 sync_planilha_firestore.py                      # ensaio, nao escreve nada
    python3 sync_planilha_firestore.py --executar           # escreve de verdade
    python3 sync_planilha_firestore.py --csv /caminho.csv   # outra planilha
    python3 sync_planilha_firestore.py --sobrescrever       # atualiza tambem o que ja difere

FORMATO DO LINK DE IMAGEM
    Conferido em 18/Set: planilha e Firestore guardam o MESMO formato, o link cru do Drive
    (`https://drive.google.com/file/d/<id>/view?usp=drive_link`). Quem converte para imagem
    exibivel e o `processImageLink` do app, na renderizacao. Aqui e copia direta.
"""
import argparse, csv, datetime, json, pathlib, re, sys, unicodedata
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

CHAVE_SERVICO = "/root/.secrets/appkoche-service-account.json"
CAMPOS = {"level_check_procedure": "Nível", "image_level_url": "Foto Nível"}
DESTINO_BACKUP = pathlib.Path("/root/backups_producao")


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s).strip().upper()


def chave(marca, modelo, transmissao, ano) -> str:
    return "|".join(norm(x) for x in (marca, modelo, transmissao, ano))


def ler_planilha(caminho):
    with open(caminho, encoding="utf-8") as fh:
        linhas = list(csv.reader(fh))
    cab = [h.strip() for h in linhas[0]]
    # A coluna de marca e a primeira. O cabecalho dela na planilha esta com um nome de marca
    # digitado por engano ("FIAT") em vez de "Marca" — por isso o indice e posicional, nao por nome.
    idx = {alvo: cab.index(col) for alvo, col in CAMPOS.items()}
    fora = {}
    for r in linhas[1:]:
        if len(r) <= max(idx.values()) or not (r[1] or "").strip():
            continue
        fora[chave(r[0], r[1], r[4], r[2])] = {
            "desc": f"{r[0]} {r[1]} {r[4]} {r[2]}".strip(),
            **{alvo: (r[i] or "").strip() for alvo, i in idx.items()},
        }
    return fora


def firestore_sessao():
    proj = json.load(open(CHAVE_SERVICO))["project_id"]
    cred = service_account.Credentials.from_service_account_file(
        CHAVE_SERVICO, scopes=["https://www.googleapis.com/auth/datastore"])
    cred.refresh(Request())
    base = f"https://firestore.googleapis.com/v1/projects/{proj}/databases/(default)/documents"
    return base, {"Authorization": f"Bearer {cred.token}",
                  "Content-Type": "application/json"}


def ler_firestore(base, headers):
    docs, token = [], None
    while True:
        params = {"pageSize": 300}
        if token:
            params["pageToken"] = token
        r = requests.get(f"{base}/vehicles", headers=headers, params=params, timeout=60)
        r.raise_for_status()
        d = r.json()
        docs += d.get("documents", [])
        token = d.get("nextPageToken")
        if not token:
            break
    return docs


def valor(campos, nome):
    x = (campos or {}).get(nome) or {}
    return str(x.get("stringValue", x.get("integerValue", ""))).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="/tmp/planilha.csv")
    ap.add_argument("--executar", action="store_true")
    ap.add_argument("--sobrescrever", action="store_true",
                    help="atualiza tambem quando os dois lados tem valor e diferem")
    args = ap.parse_args()

    planilha = ler_planilha(args.csv)
    base, headers = firestore_sessao()
    docs = ler_firestore(base, headers)

    plano, inalterados, divergentes, sem_par = [], 0, [], 0
    por_chave = {}
    for d in docs:
        f = d.get("fields", {})
        por_chave[chave(valor(f, "brand"), valor(f, "model"),
                        valor(f, "transmission"), valor(f, "year"))] = d

    for k, linha in planilha.items():
        doc = por_chave.get(k)
        if doc is None:
            if any(linha[c] for c in CAMPOS):
                sem_par += 1
            continue
        f = doc.get("fields", {})
        muda, antes = {}, {}
        for campo in CAMPOS:
            novo, atual = linha[campo], valor(f, campo)
            if not novo:
                continue                      # TRAVA 1: vazio na planilha nunca apaga
            if novo == atual:
                continue
            if atual and not args.sobrescrever:
                divergentes.append((linha["desc"], campo))
                continue
            muda[campo] = novo
            antes[campo] = atual
        if muda:
            plano.append({"id": doc["name"].split("/")[-1], "desc": linha["desc"],
                          "muda": muda, "antes": antes})
        else:
            inalterados += 1

    print(f"planilha : {len(planilha)} veiculos")
    print(f"firestore: {len(docs)} veiculos")
    print()
    print(f"  a escrever              : {len(plano)}")
    print(f"  ja iguais               : {inalterados}")
    print(f"  divergentes (preservados): {len(divergentes)}   <- use --sobrescrever para atualizar")
    print(f"  na planilha sem veiculo : {sem_par}")
    print()
    por_campo = {}
    for p in plano:
        for c in p["muda"]:
            por_campo[c] = por_campo.get(c, 0) + 1
    for c, n in sorted(por_campo.items()):
        print(f"  {c:26} {n}")
    print()

    if not args.executar:
        print("=== ENSAIO — nada foi escrito. Amostra: ===")
        for p in plano[:10]:
            print(f"  {p['desc'][:56]:<56} {', '.join(p['muda'])}")
        if len(plano) > 10:
            print(f"  … e mais {len(plano) - 10}")
        print()
        print("Para escrever de verdade: --executar")
        return 0

    if not plano:
        print("nada a fazer")
        return 0

    DESTINO_BACKUP.mkdir(parents=True, exist_ok=True)
    carimbo = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    bkp = DESTINO_BACKUP / f"app_koche_niveis_antes_{carimbo}.json"
    bkp.write_text(json.dumps(plano, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"backup do estado anterior: {bkp}")
    print()

    ok = erros = 0
    for p in plano:
        mask = "&".join(f"updateMask.fieldPaths={c}" for c in p["muda"])
        url = f"{base}/vehicles/{p['id']}?{mask}"
        corpo = {"fields": {c: {"stringValue": v} for c, v in p["muda"].items()}}
        r = requests.patch(url, headers=headers, json=corpo, timeout=60)
        if r.ok:
            ok += 1
        else:
            erros += 1
            print(f"  ERRO {r.status_code} em {p['desc'][:44]}: {r.text[:120]}")
    print(f"gravados: {ok} | erros: {erros}")
    return 0 if erros == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
