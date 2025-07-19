// Encryption utility for API requests
// Based on the working implementation from jp_website

import * as jose from 'jose';

const PUBLIC_KEY_CONFIG = {
  kty: 'RSA',
  e: 'AQAB',
  n: 'jiIRvCBjTToaYMHTUxnKoTdKGHdtuymLWl-s3oeiZ9tWXqMeOdbiCYMSzC-N8kkpu5sdmknkVROeKKVS3OvmyxBuZ6hDfwAyfdg0t8273JX6Z7fZH6tL7T2HHJ4ItQesTuhPmJR5_oGiPO5mDjC5SUd5otrbKqUAAy9fLtT5_l91uUc27bZGvkL9Tzi9EHNeA_LgnYRNohOygirKx1G-hdGVWoisVIdiIY7Hc_XaViCCNwhiEELN4iS4MOD4Suut7Y6V5l_PmSCnUcn6-R194edIKHd7TiiFQrkNab2gb16Qdu8fCO41OdRlF_ifvWWxtqHeW3eqRdDYwaBxDvlsnQ',
};

const ALGORITHM = 'RSA-OAEP-256';

const getPublicKey = () => {
  return jose.importJWK(PUBLIC_KEY_CONFIG, ALGORITHM);
};

export async function encryptRequest(data) {
  try {
    const rsaPublicKey = await getPublicKey();
    const encryptedData = await new jose.CompactEncrypt(new TextEncoder().encode(JSON.stringify(data)))
      .setProtectedHeader({
        alg: 'RSA-OAEP-256',
        enc: 'A256CBC-HS512',
        typ: 'JWE',
      })
      .encrypt(rsaPublicKey);

    return encryptedData;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

export async function decryptResponse(encryptedData) {
  try {
    // For now, return the data as-is since we don't have the private key
    // In production, this would decrypt the response
    return encryptedData;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}
