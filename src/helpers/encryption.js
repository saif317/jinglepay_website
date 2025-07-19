/**
 * RSA/AES encryption helpers using browser-native Web Crypto API
 *
 * Browser-native implementation that doesn't require external dependencies.
 * Uses Web Crypto API for RSA-OAEP encryption with the same security standards
 * as the original jose implementation.
 */

/**
 * Check if Web Crypto API is available
 * @returns {boolean}
 */
function isWebCryptoAvailable() {
  return typeof crypto !== 'undefined' && 
         crypto.subtle && 
         typeof crypto.subtle.importKey === 'function';
}

/**
 * Convert base64url to ArrayBuffer
 * @param {string} base64url
 * @returns {ArrayBuffer}
 */
function base64urlToArrayBuffer(base64url) {
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padded = base64 + '==='.slice(0, (4 - base64.length % 4) % 4);
  // Decode base64 to binary string
  const binary = atob(padded);
  // Convert to ArrayBuffer
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Convert ArrayBuffer to base64url
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const PRIVATE_KEY_CONFIG = {
  d: 'F0fITN6nNTqLoIaO5SEn2fEy7z_8lrfuzd428_oWZVl9U6H3LPUf7_vqo8w0PVezgLmfBysMPc0pTjIKGQqAsokd9FeQuqgfHRLBS8vkdfSQ39UyuKe3l4PI8iyGc5RuqjwN8Yl8U-4K010fFTrw1mphJ4YeeOUu09a6CfMzgXEF0eQNiR1DOK4SJfyqNi4S_w9j7TMSMKjnZ9Sloqs9GxM8CYwzy9Ezn4sj_WeTmPUd2aH39xlyadufv0Gt-rwWtJOLV-Z_SB0VW2wMIZ_vBwSQyGnl1RvdWdWbswJflTOm8ypoZkH8L_jee3DkoO3NjisMrKpbjifYRZhRakw69w',
  dp: 'lnqgUop27gsizChe_YfxHPQB0it6OyOZVu4-QGNt6lYGBjDaigy6qez32IxE80WpPAHHhf26FNFiIQi5KNPKOuOCjCIbs_z9xfjnRCeCBPAWJ2GDyOXs-MFDmzbrZmweslLhKJHPcidEiRkLNYpRar9_PeCoRg71WgUCXVq_T8s',
  dq: 'q9LDRs4IXm0opQRJ4FffWZJbMcy_RNbR9K-chfX0BNh4ZpWPPU6iDoQA3AysTU76Pn3NLDTuSofxt8uCRfbXYFnu-ojJj0vWI2Z-AgLPi3uXdlhBvS-IvqaENE5yltjZpNi_fouTbLBjBFxrNO9DhCtxwZhntHd3UTXLqZCVUKk',
  e: 'AQAB',
  kty: 'RSA',
  n: 'jiIRvCBjTToaYMHTUxnKoTdKGHdtuymLWl-s3oeiZ9tWXqMeOdbiCYMSzC-N8kkpu5sdmknkVROeKKVS3OvmyxBuZ6hDfwAyfdg0t8273JX6Z7fZH6tL7T2HHJ4ItQesTuhPmJR5_oGiPO5mDjC5SUd5otrbKqUAAy9fLtT5_l91uUc27bZGvkL9Tzi9EHNeA_LgnYRNohOygirKx1G-hdGVWoisVIdiIY7Hc_XaViCCNwhiEELN4iS4MOD4Suut7Y6V5l_PmSCnUcn6-R194edIKHd7TiiFQrkNab2gb16Qdu8fCO41OdRlF_ifvWWxtqHeW3eqRdDYwaBxDvlsnQ',
  p: 'xZUoijVBi42hGdxkANXuRM4da6B7IMxw_i_2JTv-nS5CdjIIAXkvTBNQebhgi2Wkek89TgsBzZR2KYx04skPK3Ie7PMMcsn0jqOMF3vznF22ByXkshsEvMwCi-Dz4IGFdkakpVnqTfFa9p32UdBt03RxIW9YN05vAVSKwoE4tps',
  q: 'uCf8fWbEr8q1o5TRv96BlqxWw1P8qEq3fJT60LPDOQov21nEfu1-IznbDtf2D58JjTAYBcT_JMi9B9emcntopNsJyCIt87sYXNO-2_LgoIrwc2n8xiWjDPmqRV_EZ87En_hhwv1P5cIBDuKTNIsYperkGudOAfj7f4K5lE5NASc',
  qi: 'G-4RzwYCbCbPPZP6XXzO5WhYyYmp_hA7heRfV7bQMluN2VPhr1uyYSpH_gDjnR1cBea5Tl9bgPIDrQ-NUpWp00pGa4LJ-VhOByy0pRp-SB47-VbL9CfpV9gVmeDBkOST0ABo4jYbFZd341Pj3eq9UwHKzWrJVlz0NYWTT-yb3l4',
};

const PUBLIC_KEY_CONFIG = {
  kty: 'RSA',
  e: 'AQAB',
  n: 'jiIRvCBjTToaYMHTUxnKoTdKGHdtuymLWl-s3oeiZ9tWXqMeOdbiCYMSzC-N8kkpu5sdmknkVROeKKVS3OvmyxBuZ6hDfwAyfdg0t8273JX6Z7fZH6tL7T2HHJ4ItQesTuhPmJR5_oGiPO5mDjC5SUd5otrbKqUAAy9fLtT5_l91uUc27bZGvkL9Tzi9EHNeA_LgnYRNohOygirKx1G-hdGVWoisVIdiIY7Hc_XaViCCNwhiEELN4iS4MOD4Suut7Y6V5l_PmSCnUcn6-R194edIKHd7TiiFQrkNab2gb16Qdu8fCO41OdRlF_ifvWWxtqHeW3eqRdDYwaBxDvlsnQ',
};

const ALGORITHM = {
  name: 'RSA-OAEP',
  hash: 'SHA-256'
};

/**
 * Convert JWK to CryptoKey using Web Crypto API
 * @param {Object} jwk - JSON Web Key object
 * @param {Array<string>} keyUsages - Key usage array
 * @returns {Promise<CryptoKey>}
 */
async function importJWK(jwk, keyUsages) {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    ALGORITHM,
    false, // extractable
    keyUsages
  );
}

async function getPublicKey() {
  if (!isWebCryptoAvailable()) return null;
  return await importJWK(PUBLIC_KEY_CONFIG, ['encrypt']);
}

async function getPrivateKey() {
  if (!isWebCryptoAvailable()) return null;
  return await importJWK(PRIVATE_KEY_CONFIG, ['decrypt']);
}

/**
 * Encrypt request data for the remittance-exchange API.
 * Uses Web Crypto API for RSA-OAEP encryption. Falls back to plain JSON if crypto is unavailable.
 * @param {any} data
 * @returns {Promise<string>}
 */
export async function encryptRequest(data) {
  if (!isWebCryptoAvailable()) {
    console.warn('[encryption] Web Crypto API not available – falling back to plain JSON.');
    return JSON.stringify(data);
  }

  try {
    const rsaPublicKey = await getPublicKey();
    if (!rsaPublicKey) {
      console.warn('[encryption] Could not load public key – falling back to plain JSON.');
      return JSON.stringify(data);
    }

    // Convert data to ArrayBuffer
    const jsonString = JSON.stringify(data);
    const dataBuffer = new TextEncoder().encode(jsonString);

    // Encrypt with RSA-OAEP
    const encryptedBuffer = await crypto.subtle.encrypt(
      ALGORITHM,
      rsaPublicKey,
      dataBuffer
    );

    // Convert to base64url for transport
    return arrayBufferToBase64url(encryptedBuffer);
  } catch (error) {
    console.error('[encryption] Encryption failed:', error);
    console.warn('[encryption] Falling back to plain JSON.');
    return JSON.stringify(data);
  }
}

/**
 * Decrypt response data from the API.
 * Uses Web Crypto API for RSA-OAEP decryption. Falls back to JSON parsing if crypto is unavailable.
 * @param {string} data
 * @returns {Promise<any>}
 */
export async function decryptResponse(data) {
  if (!isWebCryptoAvailable()) {
    console.warn('[encryption] Web Crypto API not available – assuming plain JSON.');
    return JSON.parse(data);
  }

  try {
    const rsaPrivateKey = await getPrivateKey();
    if (!rsaPrivateKey) {
      console.warn('[encryption] Could not load private key – assuming plain JSON.');
      return JSON.parse(data);
    }

    // Convert base64url to ArrayBuffer
    const encryptedBuffer = base64urlToArrayBuffer(data);

    // Decrypt with RSA-OAEP
    const decryptedBuffer = await crypto.subtle.decrypt(
      ALGORITHM,
      rsaPrivateKey,
      encryptedBuffer
    );

    // Convert back to string and parse JSON
    const jsonString = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[encryption] Decryption failed:', error);
    console.warn('[encryption] Assuming data is plain JSON.');
    return JSON.parse(data);
  }
}
