set -euo pipefail

echo "$VULTR_REGISTRY_PASSWORD" | docker login "$REGISTRY" -u "$VULTR_REGISTRY_USERNAME" --password-stdin
docker pull "$API_IMAGE_NAME:$IMAGE_TAG"

DOCKER_NETWORK="${DOCKER_NETWORK:-rackupscoreboard-net}"
REDIS_CONTAINER_NAME="${REDIS_CONTAINER_NAME:-rackupscoreboard-redis}"
REDIS_IMAGE="${REDIS_IMAGE:-redis:7-alpine}"
REDIS_VOLUME="${REDIS_VOLUME:-rackupscoreboard-redis-data}"

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

if [ "$STUB_REDIS" = "false" ] && [ -z "${REDIS_URL:-}" ]; then
  echo "REDIS_URL is required when STUB_REDIS=false." >&2
  exit 1
fi

uses_local_redis_container=false
case "${REDIS_URL:-}" in
  redis://rackupscoreboard-redis:*|rediss://rackupscoreboard-redis:*)
    uses_local_redis_container=true
    ;;
esac

if [ "$uses_local_redis_container" = "true" ]; then
  docker network create "$DOCKER_NETWORK" >/dev/null 2>&1 || true
  docker volume create "$REDIS_VOLUME" >/dev/null

  if ! docker inspect "$REDIS_CONTAINER_NAME" >/dev/null 2>&1; then
    docker run -d \
      --name "$REDIS_CONTAINER_NAME" \
      --restart unless-stopped \
      --network "$DOCKER_NETWORK" \
      -v "$REDIS_VOLUME:/data" \
      "$REDIS_IMAGE" \
      redis-server --appendonly yes
  else
    docker network connect "$DOCKER_NETWORK" "$REDIS_CONTAINER_NAME" >/dev/null 2>&1 || true
    docker start "$REDIS_CONTAINER_NAME" >/dev/null
  fi
fi

append_env PORT "$API_PORT"
append_env ENV "$APP_ENV"
append_env STUB_REDIS "$STUB_REDIS"
append_env REDIS_KEY_PREFIX "$REDIS_KEY_PREFIX"
append_env REDIS_URL "${REDIS_URL:-}"
append_env RACKUP_URL "${RACKUP_URL:-}"
append_env INTERNAL_SECRET_TOKEN "${INTERNAL_SECRET_TOKEN:-}"
append_env CORS_ALLOW_ORIGINS "${CORS_ALLOW_ORIGINS:-}"

docker rm -f "$API_CONTAINER_NAME" || true

api_network_args=()
if [ "$uses_local_redis_container" = "true" ]; then
  api_network_args=(--network "$DOCKER_NETWORK")
fi

docker run -d \
  --name "$API_CONTAINER_NAME" \
  --restart unless-stopped \
  "${api_network_args[@]}" \
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
