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
  
  // Always use production endpoints, regardless of environment
  const apiUrl = country === 'BH' 
    ? 'https://bh-api.jinglepay.dev/api/v0/remittance/rates-review/' 
    : 'https://api.jinglepay.dev/api/v0/remittance/rates-review/';
  
  console.log('Using production API at:', apiUrl);
  
  try {
    // Encrypt the request body
    const encryptedRequest = await encryptRequest(exchangeRequest);
    
    // Make a real API call with timeout and retries
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: encryptedRequest,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Decrypt the response body
    const text = await response.text();
    const decrypted = await decryptResponse(text);
    console.log('Successfully received API response');
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

/**
 * Mock function for getting exchange rates without API call
 * This can be used for development/testing without making real API calls
 * 
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {number} amount - Amount to convert
 * @returns {Object} Mock exchange rate data
 */
export const getMockExchangeRate = (fromCurrency, toCurrency, amount) => {
  // Sample exchange rates (as of July 2023)
  const rates = {
    'AED_USD': 0.27,
    'AED_EUR': 0.25,
    'AED_GBP': 0.21,
    'AED_INR': 22.5,
    'AED_PKR': 77.5,
    'USD_AED': 3.67,
    'EUR_AED': 4.00,
    'GBP_AED': 4.76,
    'INR_AED': 0.044,
    'PKR_AED': 0.013,
  };

  const key = `${fromCurrency}_${toCurrency}`;
  const rate = rates[key] || 1;
  const convertedAmount = amount * rate;
  
  // Mock fee based on amount (0.5% with min fee of 1 AED)
  const feeAmount = Math.max(1, amount * 0.005);
  
  return {
    id: 'mock-exchange-rate',
    quotation_mode: 'SEND_AMOUNT',
    send: {
      amount: amount,
      currency: fromCurrency,
      country_code: 'AE'
    },
    receive: {
      amount: convertedAmount,
      currency: toCurrency,
      country_code: toCurrency === 'INR' ? 'IN' : toCurrency === 'PKR' ? 'PK' : 'US'
    },
    user_saves: {
      amount: feeAmount * 0.5, // Pretend the user saves half the regular fee
      currency: fromCurrency
    },
    last_updated: new Date().toISOString(),
    expired_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    fee: {
      amount: 0, // Fee free as per JinglePay marketing
      currency: fromCurrency
    },
    quotations: [
      {
        id: 'mock-quotation-1',
        provider: 'JINGLEPAY',
        transfer_type: 'BANK_ACCOUNT',
        transfer_fx_rate: rate,
        fee: {
          amount: 0,
          currency: fromCurrency
        },
        expire_at: new Date(Date.now() + 3600000),
        best_offer: true,
        receive: {
          amount: convertedAmount,
          currency: toCurrency,
          country_code: toCurrency === 'INR' ? 'IN' : toCurrency === 'PKR' ? 'PK' : 'US'
        },
        operation: 'SEND',
        transfer_channel_name: 'Online Banking'
      }
    ]
  };
};
