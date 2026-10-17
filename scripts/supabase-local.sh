#!/usr/bin/env bash
# Levanta un "Supabase mínimo" local para las pruebas de integración:
# Postgres (cluster temporal) + PostgREST, con supabase/esquema.sql aplicado.
#
#   scripts/supabase-local.sh iniciar   → imprime las variables SUPABASE_PRUEBA_*
#   scripts/supabase-local.sh detener
#
# Requiere: Postgres 14+ (initdb, pg_ctl, psql) y el binario `postgrest` en el PATH
# o en POSTGREST_BIN. El secreto JWT es solo para pruebas.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${SUPABASE_LOCAL_DIR:-${TMPDIR:-/tmp}/banobrino-supabase-local}"
PUERTO_PG="${PUERTO_PG:-54329}"
PUERTO_API="${PUERTO_API:-54321}"
SECRETO="${SUPABASE_PRUEBA_SECRETO:-secreto-solo-para-pruebas-locales-0123456789}"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
POSTGREST_BIN="${POSTGREST_BIN:-postgrest}"

detener() {
  [ -f "$DIR/postgrest.pid" ] && kill "$(cat "$DIR/postgrest.pid")" 2>/dev/null || true
  [ -d "$DIR/datos" ] && "$PG_BIN/pg_ctl" -D "$DIR/datos" -m fast stop >/dev/null 2>&1 || true
  rm -rf "$DIR"
}

iniciar() {
  detener
  mkdir -p "$DIR"
  "$PG_BIN/initdb" -D "$DIR/datos" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
  "$PG_BIN/pg_ctl" -D "$DIR/datos" -o "-p $PUERTO_PG -k $DIR -c listen_addresses=127.0.0.1" -l "$DIR/pg.log" -w start >/dev/null
  local PSQL=("$PG_BIN/psql" -h 127.0.0.1 -p "$PUERTO_PG" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
  "${PSQL[@]}" -f "$RAIZ/tests/integracion/supabase-simulado.sql"
  "${PSQL[@]}" -f "$RAIZ/supabase/esquema.sql"
  "${PSQL[@]}" -f "$RAIZ/supabase/esquema.sql"   # debe poder ejecutarse dos veces
  cat > "$DIR/postgrest.conf" <<CONF
db-uri = "postgres://authenticator:authenticator@127.0.0.1:$PUERTO_PG/postgres"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$SECRETO"
server-port = $PUERTO_API
server-host = "127.0.0.1"
CONF
  "$POSTGREST_BIN" "$DIR/postgrest.conf" >"$DIR/postgrest.log" 2>&1 &
  echo $! > "$DIR/postgrest.pid"
  for _ in $(seq 1 50); do curl -fs "http://127.0.0.1:$PUERTO_API/" >/dev/null 2>&1 && break; sleep 0.2; done
  curl -fs "http://127.0.0.1:$PUERTO_API/" >/dev/null || { cat "$DIR/postgrest.log"; exit 1; }
  echo "SUPABASE_PRUEBA_URL=http://127.0.0.1:$PUERTO_API"
  echo "SUPABASE_PRUEBA_SECRETO=$SECRETO"
  echo "SUPABASE_PRUEBA_PG=postgres://postgres@127.0.0.1:$PUERTO_PG/postgres"
}

case "${1:-}" in
  iniciar) iniciar ;;
  detener) detener ;;
  *) echo "Uso: $0 iniciar|detener" >&2; exit 2 ;;
esac
