/**
 * Helper functions for remittance exchange rate calculation
 * Ported from jp_website/src/Helpers/remittance-exchange.tsx
 */

// Types are included as JSDoc for documentation in JS file
/**
 * @typedef {Object} Payment
 * @property {number} amount - The payment amount
 * @property {string} currency - The currency code
 */

/**
 * @typedef {Object} Transaction
 * @property {number} amount - The transaction amount
 * @property {string} currency - The currency code
 * @property {string} country_code - The country code
 */

/**
 * @typedef {Object} Quotation
 * @property {string} id - Quotation ID
 * @property {string} provider - Provider name
 * @property {string} transfer_type - Type of transfer
 * @property {number} transfer_fx_rate - Exchange rate
 * @property {Payment} fee - Fee details
 * @property {Date} expire_at - Expiration date
 * @property {boolean} best_offer - If this is the best offer
 * @property {Transaction} receive - Receive transaction details
 * @property {string} operation - Operation type
 * @property {string} transfer_channel_name - Transfer channel name
 */

/**
 * @typedef {Object} RemittanceExchangeResponse
 * @property {string} id - Response ID
 * @property {string} quotation_mode - Mode, typically 'SEND_AMOUNT'
 * @property {Transaction} send - Send transaction details
 * @property {Transaction} receive - Receive transaction details
 * @property {Payment} user_saves - User savings details
 * @property {string} last_updated - Last updated timestamp
 * @property {string} expired_at - Expiration timestamp
 * @property {Payment} fee - Fee details
 * @property {Quotation[]} quotations - List of quotations
 */

/**
 * @typedef {Object} ExchangeRequest
 * @property {string} quotation_mode - Mode, typically 'SEND_AMOUNT'
 * @property {Object} receive - Receive details
 * @property {string} receive.country_code - Receiving country code
 * @property {string} receive.currency - Receiving currency
 * @property {Transaction} send - Send transaction details
 */

/**
 * Get remittance exchange rates from API
 *
 * @param {('AE'|'BH')} country - Country code
 * @param {ExchangeRequest} exchangeRequest - Exchange request parameters
 * @returns {Promise<RemittanceExchangeResponse>} Exchange rate response
 */
import { encryptRequest, decryptResponse } from './encryption.js';

export const getRemittanceRates = async (country, exchangeRequest) => {
  console.log('Remittance API request:', country, exchangeRequest);

  // Select API endpoint based on country
  const apiUrl =
    country === 'BH'
      ? 'https://bh-api.jinglepay.dev/api/v0/remittance/rates-review/'
      : 'https://api.jinglepay.dev/api/v0/remittance/rates-review/';

  console.log('Using API at:', apiUrl);

  try {
    // Add timestamp to debugging
    console.log(`API request initiated at ${new Date().toISOString()}`);

    // Encrypt the request body
    const encryptedRequest = await encryptRequest(exchangeRequest);
    console.log('Request encrypted successfully');

    // Make a real API call with timeout and retries
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // Log the request before sending
    console.log('Sending request to API with the following options:', {
      url: apiUrl,
      method: 'POST',
      bodyLength: encryptedRequest ? encryptedRequest.length : 0,
    });

    // In DEV environments, we may need different fetch options
    const fetchOptions = {
      method: 'POST',
      headers: {
        // Determine correct content type based on whether the request is encrypted (JWE) or plain JSON
        'Content-Type':
          typeof encryptedRequest === 'string' && encryptedRequest.startsWith('ey')
            ? 'application/jose'
            : 'application/json',
        Accept: 'application/json',
      },
      body: encryptedRequest,
      signal: controller.signal,
    };

    // Add CORS settings only in browser environments
    if (typeof window !== 'undefined') {
      fetchOptions.mode = 'cors';
      fetchOptions.headers['Origin'] = window.location.origin || 'https://jinglepay.com';
      fetchOptions.credentials = 'same-origin';
    }

    // Log the full fetch options being used
    console.log('Full fetch options:', JSON.stringify(fetchOptions));

    const response = await fetch(apiUrl, fetchOptions);

    clearTimeout(timeoutId);

    console.log(`API response received with status: ${response.status}`);

    if (!response.ok) {
      console.error('Non-OK response from API:', response.status, response.statusText);
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    // Decrypt the response body
    const text = await response.text();
    console.log('Response body received, length:', text ? text.length : 0);

    const decrypted = await decryptResponse(text);
    console.log('Successfully decrypted API response');
    return decrypted;
  } catch (error) {
    console.error('Error fetching remittance rates:', error);

    // Only fall back to mock data in development or on network errors
    console.log('Falling back to simple mock data due to API error');
    return getMockExchangeRate(
      exchangeRequest.send.currency,
      exchangeRequest.receive.currency,
      exchangeRequest.send.amount
    );
  }
};
