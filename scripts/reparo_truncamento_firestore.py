#!/usr/bin/env python3
"""reparo_truncamento_firestore.py -- devolve ao app o prefixo que a planilha ja recuperou.

POR QUE EXISTE (18/Set/2026)
    Em 18/Set, 57 dos 173 niveis da planilha comecavam em letra minuscula, no meio da frase --
    truncamento antigo, de origem desconhecida. 50 foram reparados NA PLANILHA com o prefixo
    "Deixe o " (confirmado por Rafael). O reparo parou ali: o Firestore, que e o que o app le
    em runtime, seguiu com o texto decapitado. O mecanico abria o veiculo e lia um procedimento
    comecando em "motor operando em marcha lenta...".

    Este script fecha esse vao -- e so ele.

A TRAVA QUE O DEFINE
    So toca um documento quando o texto da planilha e, literalmente, PREFIXO + texto atual do
    app, e o prefixo e exatamente "Deixe o ". Isso torna a escrita nao-destrutiva por
    construcao: nenhum caractere ja gravado no app muda, so se acrescenta o comeco que faltava.
    Temperatura divergente, reescrita inteira, asterisco de markdown -- nada disso casa com a
    regra, nada disso e tocado.

    A planilha e lida AO VIVO pela API do Sheets, nao por CSV em /tmp, para nao escrever a
    partir de uma copia velha.

USO
    python3 reparo_truncamento_firestore.py             # ensaio, nao escreve
    python3 reparo_truncamento_firestore.py --executar  # escreve de verdade
"""
import argparse, datetime, glob, importlib.util, json, pathlib, sys
import requests

# O caminho real tem travessao e acento ("07 - Scripts e Automacoes" nao existe no disco).
# Resolver por glob evita carregar isso literal e quebrar em NFD/NFC.
def _acha_vigia():
    achados = glob.glob("/root/Central-IA-Koche/07*/Python/APIs_Marketing/"
                        "vigia_divergencia_app.py")
    if len(achados) != 1:
        raise SystemExit(f"esperava 1 vigia, achei {len(achados)}: {achados}")
    return achados[0]
SYNC = "/root/app-koche/scripts/sync_planilha_firestore.py"
CAMPO = "level_check_procedure"
PREFIXO = "Deixe o "
DESTINO_BACKUP = pathlib.Path("/root/backups_producao")


def carrega(caminho, nome):
    spec = importlib.util.spec_from_file_location(nome, caminho)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--executar", action="store_true")
    ap.add_argument("--vigia", default=None)
    args = ap.parse_args()

    vd = carrega(args.vigia or _acha_vigia(), "vd")
    sy = carrega(SYNC, "sy")

    plan, erro = vd.ler_planilha()
    if plan is None:
        print(f"nao consegui ler a planilha: {erro}")
        return 1

    base, headers = sy.firestore_sessao()
    docs = sy.ler_firestore(base, headers)
    por_chave = {}
    for d in docs:
        f = d.get("fields", {})
        por_chave[sy.chave(sy.valor(f, "brand"), sy.valor(f, "model"),
                           sy.valor(f, "transmission"), sy.valor(f, "year"))] = d

    plano, recusados = [], 0
    for k, doc in por_chave.items():
        if k not in plan:
            continue
        novo = (plan[k].get(CAMPO) or "").strip()
        atual = sy.valor(doc.get("fields", {}), CAMPO).strip()
        if not novo or not atual or novo == atual:
            continue
        if novo.endswith(atual) and novo[:len(novo) - len(atual)] == PREFIXO:
            plano.append({"id": doc["name"].split("/")[-1], "desc": k,
                          "antes": atual, "depois": novo})
        else:
            recusados += 1

    print(f"planilha : {len(plan)} veiculos (leitura ao vivo)")
    print(f"firestore: {len(docs)} veiculos")
    print()
    print(f"  reparo de prefixo {PREFIXO!r} : {len(plano)}")
    print(f"  divergentes que a trava recusou : {recusados}")
    print()

    if not plano:
        print("nada a reparar")
        return 0

    if not args.executar:
        print("=== ENSAIO -- nada foi escrito ===")
        for p in plano[:5]:
            print(f"  {p['desc'][:60]}")
            print(f"     antes : {p['antes'][:80]}")
            print(f"     depois: {p['depois'][:80]}")
        if len(plano) > 5:
            print(f"  ... e mais {len(plano) - 5}")
        print()
        print("Para escrever: --executar")
        return 0

    DESTINO_BACKUP.mkdir(parents=True, exist_ok=True)
    carimbo = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    bkp = DESTINO_BACKUP / f"app_koche_truncamento_antes_{carimbo}.json"
    bkp.write_text(json.dumps(plano, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"backup do estado anterior: {bkp}")
    print()

    ok = erros = 0
    for p in plano:
        url = f"{base}/vehicles/{p['id']}?updateMask.fieldPaths={CAMPO}"
        corpo = {"fields": {CAMPO: {"stringValue": p["depois"]}}}
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