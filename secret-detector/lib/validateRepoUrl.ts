const ALLOWED_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org']);

export type ValidatedRepoUrl = {
  normalizedUrl: string;
  hostname: string;
};

export function validateRepoUrl(input: string): ValidatedRepoUrl {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid repository URL');
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Repository URL must be a valid http(s) URL');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Repository URL must use http(s)');
  }

  const hostname = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new Error('Only GitHub, GitLab, and Bitbucket URLs are supported');
  }

  if (url.username || url.password) {
    throw new Error('Repository URL must not include credentials');
  }

  // Keep URL stable for logging and cloning
  url.hash = '';
  return { normalizedUrl: url.toString(), hostname };
}

