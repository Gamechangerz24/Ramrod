#!/usr/bin/env bash

set -euo pipefail

commit="${1:-origin/main}"
repo_url="${RAMROD_REPO_URL:-https://github.com/Gamechangerz24/Ramrod.git}"
app_dir="${RAMROD_APP_DIR:-/opt/ramrod}"
backup_root="${RAMROD_BACKUP_DIR:-/opt/ramrod-backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
stage_dir="${app_dir}-release-${timestamp}"
old_dir="${app_dir}-previous-${timestamp}"
backup_dir="${backup_root}/${timestamp}"

cleanup() {
  rm -rf "${stage_dir}"
}
trap cleanup EXIT

if [[ ! -f "${app_dir}/deploy/.env.production" ]]; then
  echo "Missing ${app_dir}/deploy/.env.production" >&2
  exit 1
fi

mkdir -p "${backup_dir}"
chmod 700 "${backup_root}" "${backup_dir}"

git clone --quiet "${repo_url}" "${stage_dir}"
git -C "${stage_dir}" checkout --quiet "${commit}"
resolved_commit="$(git -C "${stage_dir}" rev-parse HEAD)"

cp -p "${app_dir}/deploy/.env.production" "${stage_dir}/deploy/.env.production"
node "${stage_dir}/deploy/update-production-env.mjs" "${stage_dir}/deploy/.env.production"
chmod 600 "${stage_dir}/deploy/.env.production"

cp -a "${app_dir}" "${backup_dir}/app"
docker inspect ramrod-ramrod-1 > "${backup_dir}/container.json" 2>/dev/null || true
printf '%s\n' "${resolved_commit}" > "${backup_dir}/new-commit.txt"
chmod -R go-rwx "${backup_dir}"

docker compose -p ramrod -f "${stage_dir}/compose.prod.yaml" build

mv "${app_dir}" "${old_dir}"
mv "${stage_dir}" "${app_dir}"
trap - EXIT

rollback() {
  echo "Release healthcheck failed; restoring previous deployment." >&2
  mv "${app_dir}" "${app_dir}-failed-${timestamp}"
  mv "${old_dir}" "${app_dir}"
  docker compose -p ramrod -f "${app_dir}/compose.prod.yaml" up -d --build
  exit 1
}

docker compose -p ramrod -f "${app_dir}/compose.prod.yaml" up -d

healthy=false
for _ in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:3001/api/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "${healthy}" != "true" ]]; then
  rollback
fi

rm -rf "${old_dir}"
echo "RAMROD deployed at ${resolved_commit}. Backup: ${backup_dir}"
