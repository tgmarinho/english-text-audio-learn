#!/usr/bin/env bash
# Entrada única para sincronizar uma coleção do aulasdeinglesgratis.net.
# Uso:
#   ./sync.sh <INDEX_URL> [--out DIR] [--jobs N] [--force]
#
# Exemplos:
#   ./sync.sh https://aulasdeinglesgratis.net/110-textos-em-ingles-intermediario-e-avancado-com-audio-e-traducao/
#   ./sync.sh https://aulasdeinglesgratis.net/100-conversacoes-em-ingles/ --out ~/english-study/100-conversacoes
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
exec python3 "$HERE/sync_collection.py" "$@"
