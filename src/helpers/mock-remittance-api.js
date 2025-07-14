/**
 * Mock API implementation for remittance exchange rates
 * Simulates the production API behavior for development testing
 */

// Required encryption helpers
import { encryptRequest, decryptResponse } from './encryption.js';

// Define mock API endpoints - will be intercepted by our mock handler
export const API_ENDPOINTS = {
  UAE: '/api/v0/remittance/rates-review/',
  BH: '/api/v0/remittance/rates-review/',
};

// More comprehensive exchange rates between all supported currencies
const EXCHANGE_RATES = {
  // AED to others
  AED: {
    USD: 0.272,
    EUR: 0.249,
    GBP: 0.213,
    INR: 22.51,
    PKR: 77.65,
  },
  // USD to others
  USD: {
    AED: 3.673,
    EUR: 0.915,
    GBP: 0.783,
    INR: 82.71,
    PKR: 285.12,
  },
  // EUR to others
  EUR: {
    AED: 4.013,
    USD: 1.093,
    GBP: 0.856,
    INR: 90.44,
    PKR: 311.68,
  },
  // GBP to others
  GBP: {
    AED: 4.690,
    USD: 1.277,
    EUR: 1.168,
    INR: 105.76,
    PKR: 364.22,
  },
  // INR to others
  INR: {
    AED: 0.044,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    PKR: 3.447,
  },
  // PKR to others
  PKR: {
    AED: 0.013,
    USD: 0.0035,
    EUR: 0.0032,
    GBP: 0.0027,
    INR: 0.290,
  }
};

// Provider details for realistic responses
const PROVIDERS = {
  JINGLEPAY: {
    name: 'JinglePay',
    logo: '/images/jp-logo.png',
    transferTypes: ['BANK_ACCOUNT', 'CASH_PICKUP'],
    channels: ['Online Banking', 'Mobile App'],
    feesPercent: 0 // JinglePay charges no fees
  },
  AL_ANSARI: {
    name: 'Al Ansari Exchange',
    logo: '/images/providers/al-ansari.png',
    transferTypes: ['BANK_ACCOUNT', 'CASH_PICKUP'],
    channels: ['Store Visit', 'Online'],
    feesPercent: 0.015 // 1.5% fee
  },
  UAE_EXCHANGE: {
    name: 'UAE Exchange',
    logo: '/images/providers/uae-exchange.png',
    transferTypes: ['BANK_ACCOUNT'],
    channels: ['Store Visit', 'Online'],
    feesPercent: 0.02 // 2% fee
  }
};

// Map of currencies to ISO country codes
const CURRENCY_TO_COUNTRY = {
  AED: 'AE',
  USD: 'US',
  EUR: 'EU',
  GBP: 'GB',
  INR: 'IN',
  PKR: 'PK',
};

/**
 * Mock API handler for remittance exchange rates
 * @param {Object} requestBody - The encrypted request body
 * @returns {Promise<Object>} - The encrypted response
 */
export async function mockApiHandler(requestBody) {
  try {
    // Decrypt the request
    const request = await decryptResponse(requestBody);
    console.log('Decrypted request:', request);
    
    // Extract key parameters
    const { send, receive, quotation_mode } = request;
    const fromCurrency = send?.currency || 'AED';
    const toCurrency = receive?.currency || 'USD';
    const sendAmount = send?.amount || 1000;
    
    // Get the exchange rate
    const rate = getExchangeRate(fromCurrency, toCurrency);
    const receiveAmount = quotation_mode === 'SEND_AMOUNT' 
      ? sendAmount * rate 
      : sendAmount / rate;
    
    // Generate quotations from different providers
    const quotations = generateQuotations(
      fromCurrency, 
      toCurrency, 
      sendAmount,
      receiveAmount
    );
    
    // Find best offer (JinglePay is always best)
    const bestOffer = quotations.find(q => q.provider === 'JINGLEPAY');
    if (bestOffer) {
      bestOffer.best_offer = true;
    }
    
    // Create response object
    const response = {
      id: generateId(),
      quotation_mode,
      send: {
        amount: sendAmount,
        currency: fromCurrency,
        country_code: send?.country_code || CURRENCY_TO_COUNTRY[fromCurrency] || 'AE'
      },
      receive: {
        amount: quotation_mode === 'SEND_AMOUNT' ? receiveAmount : sendAmount,
        currency: toCurrency,
        country_code: receive?.country_code || CURRENCY_TO_COUNTRY[toCurrency] || 'US'
      },
      user_saves: {
        amount: calculateUserSavings(quotations),
        currency: fromCurrency
      },
      last_updated: new Date().toISOString(),
      expired_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiry
      fee: {
        amount: 0, // JinglePay has no fees
        currency: fromCurrency
      },
      quotations
    };
    
    console.log('Generated mock response:', response);
    
    // Encrypt the response
    const encryptedResponse = await encryptRequest(response);
    return encryptedResponse;
  } catch (error) {
    console.error('Error in mock API handler:', error);
    throw error;
  }
}

/**
 * Get the exchange rate between two currencies
 * @param {string} fromCurrency - The source currency
 * @param {string} toCurrency - The target currency
 * @returns {number} - The exchange rate
 */
function getExchangeRate(fromCurrency, toCurrency) {
  // Direct rate if available
  if (EXCHANGE_RATES[fromCurrency]?.[toCurrency]) {
    return EXCHANGE_RATES[fromCurrency][toCurrency];
  }
  
  // If currencies are the same, rate is 1
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  // Default fallback
  return 1;
}

/**
 * Generate realistic quotations from different providers
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {number} sendAmount - Send amount
 * @param {number} receiveAmount - Receive amount
 * @returns {Array} - Array of quotations
 */
function generateQuotations(fromCurrency, toCurrency, sendAmount, receiveAmount) {
  const quotations = [];
  const baseRate = getExchangeRate(fromCurrency, toCurrency);
  
  // Add quotations for each provider with slight rate variations
  Object.entries(PROVIDERS).forEach(([providerId, provider]) => {
    // JinglePay always has the best rate
    const rateFactor = providerId === 'JINGLEPAY' ? 1 : (0.95 + Math.random() * 0.03);
    const adjustedRate = baseRate * rateFactor;
    
    // Apply provider's fee
    const fee = sendAmount * provider.feesPercent;
    
    provider.transferTypes.forEach((transferType) => {
      quotations.push({
        id: generateId(),
        provider: providerId,
        transfer_type: transferType,
        transfer_fx_rate: adjustedRate,
        fee: {
          amount: fee,
          currency: fromCurrency
        },
        expire_at: new Date(Date.now() + 3600000),
        best_offer: false, // Will set true for JinglePay later
        receive: {
          amount: receiveAmount * rateFactor,
          currency: toCurrency,
          country_code: CURRENCY_TO_COUNTRY[toCurrency] || 'US'
        },
        operation: 'SEND',
        transfer_channel_name: provider.channels[0]
      });
    });
  });
  
  return quotations;
}

/**
 * Calculate how much the user saves with JinglePay
 * @param {Array} quotations - List of quotations
 * @returns {number} - Amount saved
 */
function calculateUserSavings(quotations) {
  // Find JinglePay quotation and the next best
  const jinglePayQuote = quotations.find(q => q.provider === 'JINGLEPAY');
  const otherQuotes = quotations.filter(q => q.provider !== 'JINGLEPAY');
  
  if (!jinglePayQuote || otherQuotes.length === 0) {
    return 0;
  }
  
  // Sort other quotes by fee
  otherQuotes.sort((a, b) => a.fee.amount - b.fee.amount);
  
  // Calculate savings (difference in fees + better exchange rate benefit)
  const nextBest = otherQuotes[0];
  return nextBest.fee.amount - jinglePayQuote.fee.amount;
}

/**
 * Generate a random ID for quotations
 * @returns {string} - Random ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
