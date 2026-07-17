set -euo pipefail

echo "$VULTR_REGISTRY_PASSWORD" | docker login "$REGISTRY" -u "$VULTR_REGISTRY_USERNAME" --password-stdin
docker pull "$API_IMAGE_NAME:$IMAGE_TAG"

env_file="$(mktemp)"
cleanup() {
  rm -f "$env_file"
}
trap cleanup EXIT

append_env() {
  local key="$1"
  local value="$2"

  if [ -n "$value" ]; then
    printf '%s=%s\n' "$key" "$value" >> "$env_file"
  fi
}

append_env PORT "$API_PORT"
append_env ENV "$APP_ENV"
append_env STUB_REDIS "$STUB_REDIS"
append_env REDIS_KEY_PREFIX "$REDIS_KEY_PREFIX"
append_env REDIS_URL "${REDIS_URL:-}"
append_env RACKUP_URL "${RACKUP_URL:-}"
append_env INTERNAL_SECRET_TOKEN "${INTERNAL_SECRET_TOKEN:-}"
append_env CORS_ALLOW_ORIGINS "${CORS_ALLOW_ORIGINS:-}"

docker rm -f "$API_CONTAINER_NAME" || true

docker run -d \
  --name "$API_CONTAINER_NAME" \
  --restart unless-stopped \
  -p "$API_PORT:$API_PORT" \
  --env-file "$env_file" \
  "$API_IMAGE_NAME:$IMAGE_TAG"

prune_image() {
  local image_name="$1"

  docker images "$image_name" --format "{{.Repository}}:{{.Tag}}" \
    | grep -v ":$IMAGE_TAG$" \
    | grep -v ":latest$" \
    | grep -v ":preview-latest$" \
    | xargs -r docker rmi || true
}

prune_image "$API_IMAGE_NAME"

docker image prune -f >/dev/null 2>&1 || true
