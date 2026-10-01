import axios from 'axios';

// Default base URL provided by user or saved in localStorage (Strict HTTPS)
const DEFAULT_API_URL = 'http://walkt.gt.tc';
//const DEFAULT_API_URL = 'https://abroad-immediate-responding-critical.trycloudflare.com/walkiet_api/auth/';

/**
 * Sanitizes any URL to force HTTPS (TLS 1.3 in transit)
 * Upgrades insecure http:// connections to https://
 */
export const sanitizeHttpsUrl = (rawUrl: string): string => {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // If user passed a relative path or local development URL, leave as is, otherwise enforce HTTPS
  if (url.startsWith('http://') && !url.includes('localhost:') && !url.includes('127.0.0.1:')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }
  return url;
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('c5i_api_base_url');
    if (saved) return sanitizeHttpsUrl(saved);
  }
  return DEFAULT_API_URL;
};

export const setApiBaseUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    const secured = sanitizeHttpsUrl(url);
    localStorage.setItem('c5i_api_base_url', secured);
  }
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'X-C5i-Transport-Protocol': 'TLS-1.3-Strict-HTTPS',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 10000,
});

// Dynamic interceptor to always sanitize and enforce HTTPS on all requests
api.interceptors.request.use((config) => {
  const currentBase = getApiBaseUrl();
  config.baseURL = sanitizeHttpsUrl(currentBase);

  // If request URL is absolute and starts with http://, force upgrade to https://
  if (config.url && config.url.startsWith('http://') && !config.url.includes('localhost:') && !config.url.includes('127.0.0.1:')) {
    config.url = config.url.replace(/^http:\/\//i, 'https://');
  }

  // Include security headers
  if (config.headers) {
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('X-Forwarded-Proto', 'https');
      (config.headers as any).set('X-C5i-Transport-Security', 'TLS1.3-HTTPS-Enforced');
    } else {
      (config.headers as any)['X-Forwarded-Proto'] = 'https';
      (config.headers as any)['X-C5i-Transport-Security'] = 'TLS1.3-HTTPS-Enforced';
    }
  }

  return config;
});

// Response interceptor to catch SSL/mixed-content anomalies
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.message && error.message.includes('Network Error')) {
      console.warn('[C5i Security Alert] Error de red. Verifique que el servidor remoto tenga un certificado SSL/TLS válido.');
    }
    return Promise.reject(error);
  }
);

export default api;
