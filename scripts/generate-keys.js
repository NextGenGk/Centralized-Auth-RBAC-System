/**
 * generate-keys.js
 * Cross-platform RSA key generator for the Auth RBAC system.
 * Usage: node scripts/generate-keys.js
 */

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const ROOT        = path.resolve(__dirname, '..');
const KEYS_DIR    = path.join(ROOT, 'keys');
const AUTH_ENV    = path.join(ROOT, 'auth-service',   '.env');
const ORDERS_ENV  = path.join(ROOT, 'orders-service', '.env');
const AUTH_EXAMPLE   = path.join(ROOT, 'auth-service',   '.env.example');
const ORDERS_EXAMPLE = path.join(ROOT, 'orders-service', '.env.example');

// ── 1. Generate RSA key pair ─────────────────────────────────────
console.log('🔑 Generating 2048-bit RSA key pair...');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength:    2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// ── 2. Save raw PEM files ────────────────────────────────────────
fs.mkdirSync(KEYS_DIR, { recursive: true });
fs.writeFileSync(path.join(KEYS_DIR, 'private.key'), privateKey);
fs.writeFileSync(path.join(KEYS_DIR, 'public.key'),  publicKey);
console.log('✅ Keys written to keys/private.key and keys/public.key');

// ── 3. Base64 encode (single line) ──────────────────────────────
const PRIVATE_B64 = Buffer.from(privateKey).toString('base64');
const PUBLIC_B64  = Buffer.from(publicKey).toString('base64');

// ── 4. Helper: set a key=value line in a .env file ──────────────
function setEnvValue(filePath, examplePath, updates) {
  // Start from .env.example if .env doesn't exist yet
  let content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8')
    : fs.readFileSync(examplePath, 'utf8');

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^(${key}=).*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${value}`);
    } else {
      // Key not present — append it
      content += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

// ── 5. Update auth-service/.env ──────────────────────────────────
setEnvValue(AUTH_ENV, AUTH_EXAMPLE, {
  JWT_PRIVATE_KEY: PRIVATE_B64,
  JWT_PUBLIC_KEY:  PUBLIC_B64,
});
console.log('✅ auth-service/.env  — JWT keys updated');

// ── 6. Update orders-service/.env ────────────────────────────────
setEnvValue(ORDERS_ENV, ORDERS_EXAMPLE, {
  JWT_PUBLIC_KEY: PUBLIC_B64,
});
console.log('✅ orders-service/.env — JWT_PUBLIC_KEY updated');

// ── 7. Print summary ─────────────────────────────────────────────
console.log('\n── Generated Values ─────────────────────────────────');
console.log(`JWT_PRIVATE_KEY=${PRIVATE_B64.substring(0, 40)}... (truncated)`);
console.log(`JWT_PUBLIC_KEY=${PUBLIC_B64.substring(0, 40)}... (truncated)`);
console.log('\n🚀 Ready! Next steps:');
console.log('   Docker:  docker-compose up --build');
console.log('   Manual:  cd auth-service && npm run dev');
