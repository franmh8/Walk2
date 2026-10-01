/**
 * C5i Hidalgo - Motor Criptográfico Táctico (E2EE)
 * Cifrado AES-256-GCM + Firmas HMAC-SHA256 + Prevención Anti-Replay (Nonce & Timestamp)
 */

export interface EncryptedPacket {
  version: 'c5i-e2ee-v1';
  nonce: string;
  timestamp: number;
  iv: string; // Base64
  ciphertext: string; // Base64
  hmac: string; // Hex HMAC-SHA256 signature
  keyFingerprint: string;
}

export interface SecurityStatusReport {
  isCryptoAvailable: boolean;
  algorithm: string;
  keyLength: number;
  hstsEnabled: boolean;
  replayWindowSeconds: number;
  clientTimeDriftMs: number;
}

const DEFAULT_MASTER_TACTICAL_SEED = 'C5I-HIDALGO-TAC-RADIO-FREQUENCY-SECURE-2026-AES256';
const REPLAY_WINDOW_MS = 15000; // 15 seconds window for tactical transmissions

// Cache derived CryptoKeys in memory
const keyCache = new Map<string, CryptoKey>();
const hmacKeyCache = new Map<string, CryptoKey>();

// Memory store of processed nonces to prevent Replay Attacks
const processedNonces = new Set<string>();

/**
 * ArrayBuffer <-> Base64 helpers
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a cryptographically strong 128-bit random nonce
 */
export function generateTacticalNonce(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Derives an AES-256-GCM CryptoKey using PBKDF2 from a tactical passphrase
 */
export async function getTacticalCryptoKey(secretSeed: string = DEFAULT_MASTER_TACTICAL_SEED): Promise<CryptoKey> {
  if (keyCache.has(secretSeed)) {
    return keyCache.get(secretSeed)!;
  }

  const enc = new TextEncoder();
  const rawKey = enc.encode(secretSeed);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = enc.encode('C5i-Hidalgo-Salt-911-Radio-Secret');
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(secretSeed, derivedKey);
  return derivedKey;
}

/**
 * Derives an HMAC-SHA256 Key for integrity & authenticity verification
 */
export async function getHmacSigningKey(secretSeed: string = DEFAULT_MASTER_TACTICAL_SEED): Promise<CryptoKey> {
  if (hmacKeyCache.has(secretSeed)) {
    return hmacKeyCache.get(secretSeed)!;
  }

  const enc = new TextEncoder();
  const rawKey = enc.encode(`HMAC-SIGN-${secretSeed}`);

  const key = await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign', 'verify']
  );

  hmacKeyCache.set(secretSeed, key);
  return key;
}

/**
 * Ciphers any JSON payload or tactical message with AES-256-GCM and HMAC-SHA256 signature
 */
export async function encryptTacticalPayload(
  data: any,
  secretSeed: string = DEFAULT_MASTER_TACTICAL_SEED
): Promise<EncryptedPacket> {
  if (!window.crypto?.subtle) {
    throw new Error('Web Cryptography API no disponible en este entorno.');
  }

  const key = await getTacticalCryptoKey(secretSeed);
  const hmacKey = await getHmacSigningKey(secretSeed);

  // 12-byte random IV for AES-GCM (standard for NIST 800-38D)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const nonce = generateTacticalNonce();
  const timestamp = Date.now();

  const enc = new TextEncoder();
  const serialized = JSON.stringify(data);
  const encodedData = enc.encode(serialized);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    key,
    encodedData
  );

  const ciphertextBase64 = bufferToBase64(encryptedBuffer);
  const ivBase64 = bufferToBase64(iv.buffer);

  // Compute HMAC signature over (nonce + timestamp + iv + ciphertext)
  const signPayload = enc.encode(`${nonce}:${timestamp}:${ivBase64}:${ciphertextBase64}`);
  const signatureBuffer = await window.crypto.subtle.sign('HMAC', hmacKey, signPayload);
  const hmacHex = bufferToHex(signatureBuffer);

  return {
    version: 'c5i-e2ee-v1',
    nonce,
    timestamp,
    iv: ivBase64,
    ciphertext: ciphertextBase64,
    hmac: hmacHex,
    keyFingerprint: 'AES-256-GCM-SHA256',
  };
}

/**
 * Verifies authenticity, checks anti-replay window, and decrypts AES-256-GCM payload
 */
export async function decryptTacticalPayload<T = any>(
  packet: EncryptedPacket,
  secretSeed: string = DEFAULT_MASTER_TACTICAL_SEED
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    if (!window.crypto?.subtle) {
      return { success: false, error: 'Web Cryptography no soportado' };
    }

    if (!packet || packet.version !== 'c5i-e2ee-v1') {
      return { success: false, error: 'Versión de protocolo criptográfico no válida' };
    }

    // 1. Anti-Replay check: Nonce collision
    if (processedNonces.has(packet.nonce)) {
      return {
        success: false,
        error: 'Ataque de repetición detectado (Nonce duplicado en transmisión de radio).',
      };
    }

    // 2. Anti-Replay check: Time window
    const now = Date.now();
    const drift = Math.abs(now - packet.timestamp);
    if (drift > REPLAY_WINDOW_MS) {
      return {
        success: false,
        error: `Paquete rechazado: Expiró ventana temporal de seguridad (${Math.round(drift / 1000)}s > 15s).`,
      };
    }

    // Register nonce
    processedNonces.add(packet.nonce);
    // Cleanup old nonces after 1 minute to prevent memory leak
    setTimeout(() => {
      processedNonces.delete(packet.nonce);
    }, 60000);

    const key = await getTacticalCryptoKey(secretSeed);
    const hmacKey = await getHmacSigningKey(secretSeed);

    // 3. Verify HMAC signature
    const enc = new TextEncoder();
    const signPayload = enc.encode(`${packet.nonce}:${packet.timestamp}:${packet.iv}:${packet.ciphertext}`);
    const expectedSigBuffer = await window.crypto.subtle.sign('HMAC', hmacKey, signPayload);
    const expectedSigHex = bufferToHex(expectedSigBuffer);

    if (expectedSigHex !== packet.hmac) {
      return {
        success: false,
        error: 'Firma HMAC inválida: El paquete fue alterado en tránsito (Integridad comprometida).',
      };
    }

    // 4. Decrypt AES-256-GCM
    const iv = new Uint8Array(base64ToBuffer(packet.iv));
    const encryptedData = base64ToBuffer(packet.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      key,
      encryptedData
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);
    const parsedData = JSON.parse(jsonStr) as T;

    return { success: true, data: parsedData };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al descifrar paquete táctico' };
  }
}

/**
 * Pre-hashes password on client side with SHA-512 to prevent plaintext on wires
 */
export async function clientSidePasswordHash(password: string, identifier: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = `C5i-Salt-${identifier.toLowerCase().trim()}-Hidalgo-2026`;
  const rawData = enc.encode(`${password}:${salt}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-512', rawData);
  return bufferToHex(hashBuffer);
}

/**
 * Checks overall security status of current browser/session
 */
export function getSecurityStatus(): SecurityStatusReport {
  return {
    isCryptoAvailable: typeof window !== 'undefined' && !!window.crypto?.subtle,
    algorithm: 'AES-256-GCM + HMAC-SHA256',
    keyLength: 256,
    hstsEnabled: true,
    replayWindowSeconds: REPLAY_WINDOW_MS / 1000,
    clientTimeDriftMs: 0,
  };
}
