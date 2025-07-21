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
    // Import node-jose for decryption
    const { JWE } = await import('node-jose');
    
    // Check if the data is actually encrypted (JWE format)
    if (typeof encryptedData === 'string' && encryptedData.startsWith('eyJ')) {
      // This looks like a JWE token, attempt to decrypt
      // Note: In a real implementation, you would need the private key
      // For now, we'll try to parse it as a JWT to extract the payload
      try {
        // Split the JWE token to get the parts
        const parts = encryptedData.split('.');
        if (parts.length === 5) {
          // This is a JWE token format
          // For development/testing, we'll assume the server is sending unencrypted JSON
          // wrapped in a JWE-like format, so we'll try to decode the payload
          
          // In production, you would decrypt using the private key:
          // const decrypted = await JWE.createDecrypt(privateKey).decrypt(encryptedData);
          // return JSON.parse(decrypted.payload.toString());
          
          console.warn('Encrypted response detected but no private key available for decryption');
          throw new Error('Cannot decrypt response: private key not available');
        }
      } catch (jweError) {
        console.error('JWE decryption failed:', jweError);
        throw new Error('Failed to decrypt API response');
      }
    }
    
    // If it's not encrypted or is already decrypted, return as-is
    return encryptedData;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}
