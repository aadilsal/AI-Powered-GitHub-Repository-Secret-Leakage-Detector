// Collection of common secret regex patterns used for classification
export const SECRET_PATTERNS: Record<string, RegExp> = {
  // Cloud / Provider keys
  AWS_ACCESS_KEY: /AKIA[0-9A-Z]{16}/g,
  AWS_SECRET_KEY: /aws(.{0,20})?(secret|key)["'\s:=]+([A-Za-z0-9\/+=]{40})/i,

  // Google API keys / GCP
  GOOGLE_API_KEY: /AIza[0-9A-Za-z\-_]{35}/g,
  GCP_SERVICE_ACCOUNT: /"type"\s*:\s*"service_account"/i,

  // Azure
  AZURE_ACCESS_TOKEN: /eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6/,

  // Payment providers
  STRIPE_LIVE_KEY: /sk_live_[0-9a-zA-Z]{24,}/g,
  STRIPE_TEST_KEY: /sk_test_[0-9a-zA-Z]{24,}/g,
  PAYPAL_SECRET: /A21AA[0-9A-Za-z\-_]{50,}/g,

  // Provider tokens / PATs
  GITHUB_PAT: /ghp_[0-9A-Za-z_]{36,}/g,
  GITLAB_TOKEN: /glpat-[0-9A-Za-z]{20,}/g,
  BITBUCKET_TOKEN: /[a-z0-9]{40,}/i,

  // Auth / Sessions
  JWT: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  OAUTH_TOKEN: /ya29\.[0-9A-Za-z-_]+/g,
  BASIC_AUTH: /Basic\s+[A-Za-z0-9=:\-_.]+/i,
  EMAIL_PASSWORD_PAIR: /[\w.+-]+@[\w-]+\.[\w.-]+["'\s:=,]+(?:pwd|password|pass|passwd|passphrase)["'\s:=]+[^\s,;]+/i,

  // Infrastructure
  MONGODB_URI: /mongodb(?:\+srv)?:\/\/[A-Za-z0-9:@\-._]+\/[A-Za-z0-9_\-]+/i,
  POSTGRESQL_CONN: /(postgres(?:ql)?:\/\/)[^\s]+/i,
  REDIS_URL: /redis:\/\/[A-Za-z0-9:@\-._]+/i,

  // SSH / PEM
  SSH_PRIVATE_KEY: /-----BEGIN ([A-Z ]+ )?PRIVATE KEY-----[\s\S]*?-----END ([A-Z ]+ )?PRIVATE KEY-----/g,
  PEM_KEY: /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,

  // .env style key-values
  ENV_API_KEY: /(?:API_KEY|API-KEY|APIKEY)["'\s]*[:=]["'\s]*([^\s\n"']{16,})/i,
  ENV_SECRET_KEY: /(?:SECRET_KEY|SECRET)["'\s]*[:=]["'\s]*([^\s\n"']{8,})/i,
  ENV_DB_PASSWORD: /(?:DB_PASSWORD|DATABASE_PASSWORD)["'\s]*[:=]["'\s]*([^\s\n"']{8,})/i,

  // Generic high-entropy token fallback (base64-like long token)
  GENERIC_BASE64_TOKEN: /[A-Za-z0-9+/=]{30,}/g,
};
