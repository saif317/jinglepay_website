/**
 * RSA/AES encryption helpers, ported from jp_website/src/Helpers/encryption.tsx
 *
 * NOTE: For local/dev builds the `jose` package might not be installed. We lazy-load it
 * so that the bundle still works without encryption. In production you should add
 * `jose` to your dependencies to enable end-to-end encryption between the website and
 * the remittance-exchange API.
 */

let jose /** @type {typeof import('jose')} */;

async function loadJose() {
  // Disable encryption if WebCrypto is not available (e.g. some browsers, localhost over http)
  if (typeof crypto === 'undefined' || !crypto.subtle || typeof crypto.subtle.importKey !== 'function') {
    console.warn('[encryption] WebCrypto API not available – falling back to plain payloads.');
    return null;
  }
  if (jose) return jose;
  try {
    jose = await import('jose');
  } catch (err) {
    console.warn('[encryption] `jose` module not found – falling back to plain payloads.');
    jose = null;
  }
  return jose;
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

const ALGORITHM = 'RSA-OAEP-256';

async function getPublicKey() {
  const j = await loadJose();
  if (!j) return null;
  return j.importJWK(PUBLIC_KEY_CONFIG, ALGORITHM);
}

async function getPrivateKey() {
  const j = await loadJose();
  if (!j) return null;
  return j.importJWK(PRIVATE_KEY_CONFIG, ALGORITHM);
}

/**
 * Encrypt request data for the remittance-exchange API.
 * If `jose` isn't available we just return raw JSON so the call still works in dev.
 * @param {any} data
 */
export async function encryptRequest(data) {
  const j = await loadJose();
  if (!j) return JSON.stringify(data);

  const rsaPublicKey = await getPublicKey();
  const enc = new j.CompactEncrypt(new TextEncoder().encode(JSON.stringify(data)))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256CBC-HS512', typ: 'JWE' });
  return enc.encrypt(rsaPublicKey);
}

/**
 * Decrypt response data from the API.
 * If `jose` isn't available the data is assumed to be raw JSON.
 * @param {string} data
 */
export async function decryptResponse(data) {
  const j = await loadJose();
  if (!j) return JSON.parse(data);

  const rsaPrivateKey = await getPrivateKey();
  const { plaintext } = await j.compactDecrypt(data, rsaPrivateKey);
  return JSON.parse(new TextDecoder().decode(plaintext));
}
