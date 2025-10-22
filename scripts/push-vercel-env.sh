#!/bin/bash

set -euo pipefail

echo "📦 SmartStore SaaS – Vercel Env Push"

# Optional: load envs from a file passed as first arg (e.g., ./scripts/push-vercel-env.sh ./.env.prod)
if [[ ${1-} != "" ]]; then
  ENV_FILE="$1"
  if [[ -f "$ENV_FILE" ]]; then
    echo "🔐 Loading env vars from $ENV_FILE"
    # export all vars defined in the file into current env
    set -a
    # shellcheck source=/dev/null
    source "$ENV_FILE"
    set +a
  else
    echo "❌ Env file not found: $ENV_FILE" >&2
    exit 1
  fi
fi

# Required for non-interactive Vercel commands
: "${VERCEL_TOKEN:?Set VERCEL_TOKEN}"
: "${VERCEL_SCOPE:?Set VERCEL_SCOPE (team or user slug)}"
: "${VERCEL_PROJECT:?Set VERCEL_PROJECT (project name)}"

echo "🔗 Linking project to Vercel (project=$VERCEL_PROJECT, scope=$VERCEL_SCOPE)"
npx vercel link --yes --project "$VERCEL_PROJECT" --scope "$VERCEL_SCOPE" --token "$VERCEL_TOKEN"

# Default NODE_ENV to production if not set
export NODE_ENV="${NODE_ENV:-production}"

required_vars=(
  DATABASE_URL
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  JWT_SECRET
  JWT_REFRESH_SECRET
  ENCRYPTION_KEY
  SESSION_SECRET
  MFA_ENCRYPTION_KEY
  NODE_ENV
  NEXT_PUBLIC_APP_URL
)

optional_vars=(
  STRIPE_SECRET_KEY
  STRIPE_PUBLISHABLE_KEY
  PAYPAL_CLIENT_ID
  PAYPAL_CLIENT_SECRET
  PAYHERE_MERCHANT_ID
  PAYHERE_SECRET_KEY
  TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
)

push_var() {
  local key="$1"
  local val="${!key-}"
  if [[ -z "$val" ]]; then
    return 1
  fi
  printf "%s" "$val" | npx vercel env add "$key" production --project "$VERCEL_PROJECT" --scope "$VERCEL_SCOPE" --token "$VERCEL_TOKEN" --yes
}

echo "🚀 Pushing required env vars to Vercel (production)"
missing=()
for key in "${required_vars[@]}"; do
  if ! push_var "$key"; then
    missing+=("$key")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "❌ Missing required env vars: ${missing[*]}" >&2
  exit 1
fi

echo "ℹ️ Pushing optional env vars (if present)"
for key in "${optional_vars[@]}"; do
  push_var "$key" || true
done

echo "✅ Done. Review envs in Vercel Dashboard > Settings > Environment Variables."



