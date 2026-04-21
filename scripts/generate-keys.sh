#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
KEYS_DIR="$ROOT_DIR/keys"

mkdir -p "$KEYS_DIR"

echo "🔑 Generating 2048-bit RSA key pair..."

# Generate private key
openssl genpkey \
  -algorithm RSA \
  -out "$KEYS_DIR/private.key" \
  -pkcs8 \
  -pkeyopt rsa_keygen_bits:2048 \
  2>/dev/null

# Derive public key
openssl rsa \
  -pubout \
  -in  "$KEYS_DIR/private.key" \
  -out "$KEYS_DIR/public.key" \
  2>/dev/null

echo "✅ Keys written to keys/private.key and keys/public.key"
echo ""

# Base64 encode (single line, no newlines)
PRIVATE_B64=$(base64 < "$KEYS_DIR/private.key" | tr -d '\n')
PUBLIC_B64=$(base64  < "$KEYS_DIR/public.key"  | tr -d '\n')

# Write auth-service .env
AUTH_ENV="$ROOT_DIR/auth-service/.env"
cp "$ROOT_DIR/auth-service/.env.example" "$AUTH_ENV"
sed -i.bak "s|JWT_PRIVATE_KEY=.*|JWT_PRIVATE_KEY=$PRIVATE_B64|" "$AUTH_ENV"
sed -i.bak "s|JWT_PUBLIC_KEY=.*|JWT_PUBLIC_KEY=$PUBLIC_B64|"   "$AUTH_ENV"
rm -f "$AUTH_ENV.bak"

# Write orders-service .env
ORDERS_ENV="$ROOT_DIR/orders-service/.env"
cp "$ROOT_DIR/orders-service/.env.example" "$ORDERS_ENV"
sed -i.bak "s|JWT_PUBLIC_KEY=.*|JWT_PUBLIC_KEY=$PUBLIC_B64|" "$ORDERS_ENV"
rm -f "$ORDERS_ENV.bak"

echo "✅ .env files updated for both services"
echo ""
echo "JWT_PRIVATE_KEY=$PRIVATE_B64"
echo "JWT_PUBLIC_KEY=$PUBLIC_B64"
echo ""
echo "🚀 Ready! Run: cd .. && docker-compose up --build"
