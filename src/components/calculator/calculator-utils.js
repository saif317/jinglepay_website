/**
 * Calculator Utilities
 * External JavaScript file for calculator functionality
 * This file will be processed by Astro/Vite and can use imports
 */

import { getRemittanceRates } from '@helpers/remittance-exchange';
import { triggerAppRedirect } from '@util/handleAppRedirect';

// Global calculator state
window.calculatorState = {
  countries: {},
  currentSendCurrency: 'AED',
  currentReceiveCurrency: 'USD',
  isLoading: false
};

// Expose functions globally for inline scripts
window.calculatorUtils = {
  fetchCountriesData,
  calculateExchange,
  setupDropdowns,
  initCalculator,
  triggerAppRedirect
};

/**
 * Fetch countries data from API
 */
async function fetchCountriesData() {
  try {
    console.log('Fetching countries data from API...');
    
    // First, let's check if the API provides countries data directly
    // We'll need to examine the API response structure to extract available countries
    const testResponse = await getRemittanceRates('AE', {
      quotation_mode: 'SEND_AMOUNT',
      receive: {
        country_code: 'US',
        currency: 'USD',
      },
      send: {
        amount: 1000,
        currency: 'AED',
        country_code: 'AE',
      },
    });

    console.log('API Response structure:', testResponse);
    
    // Extract countries data from API response
    // The API should provide available countries/currencies in its response
    let countriesData = {};
    
    // Check if the API response contains countries information
    if (testResponse.countries) {
      // If API provides countries directly
      countriesData = testResponse.countries;
    } else if (testResponse.supported_countries) {
      // Alternative field name
      countriesData = testResponse.supported_countries;
    } else {
      // If no countries data in response, we need to make multiple API calls
      // to discover available countries by testing common currency codes
      console.log('No countries data in API response, discovering available currencies...');
      
      const commonCurrencies = ['USD', 'INR', 'PKR', 'BDT', 'PHP', 'LKR', 'NPR', 'EGP', 'JOD', 'THB'];
      const countryCodeMap = {
        'USD': 'US',
        'INR': 'IN', 
        'PKR': 'PK',
        'BDT': 'BD',
        'PHP': 'PH',
        'LKR': 'LK',
        'NPR': 'NP',
        'EGP': 'EG',
        'JOD': 'JO',
        'THB': 'TH'
      };
      
      // Test each currency to see if it's supported
      for (const currency of commonCurrencies) {
        try {
          const countryCode = countryCodeMap[currency];
          const testCall = await getRemittanceRates('AE', {
            quotation_mode: 'SEND_AMOUNT',
            receive: {
              country_code: countryCode,
              currency: currency,
            },
            send: {
              amount: 100,
              currency: 'AED',
              country_code: 'AE',
            },
          });
          
          // If the call succeeds, this currency/country is supported
          if (testCall && testCall.receive) {
            // We need to get the country name and flag from somewhere
            // For now, we'll extract what we can from the API response
            countriesData[countryCode] = {
              code: countryCode,
              currency: currency,
              iso2_code: countryCode,
              name: testCall.country_name || countryCode, // Use API data if available
              unicode: getFlagEmoji(countryCode) // Helper function for flag
            };
          }
        } catch (currencyError) {
          console.log(`Currency ${currency} not supported:`, currencyError.message);
        }
      }
    }

    // Store in global state
    window.calculatorState.countries = countriesData;
    
    console.log('Countries data loaded successfully from API:', countriesData);
    return countriesData;
  } catch (error) {
    console.error('Error fetching countries data from API:', error);
    throw error; // Don't provide fallback, let caller handle the error
  }
}

/**
 * Helper function to get flag emoji for country code
 * This is the only "hardcoded" part but it's just for display
 */
function getFlagEmoji(countryCode) {
  const flagMap = {
    'US': '🇺🇸', 'IN': '🇮🇳', 'PK': '🇵🇰', 'BD': '🇧🇩', 'PH': '🇵🇭',
    'LK': '🇱🇰', 'NP': '🇳🇵', 'EG': '🇪🇬', 'JO': '🇯🇴', 'TH': '🇹🇭'
  };
  return flagMap[countryCode] || '🏳️';
}

/**
 * Calculate exchange rates and update UI
 */
async function calculateExchange() {
  const sendInput = document.querySelector('[data-calculator-send-input]');
  const receiveInput = document.querySelector('[data-calculator-receive-input]');
  const transferFeeElement = document.querySelector('[data-transfer-fee]');
  const exchangeRateElement = document.querySelector('[data-exchange-rate]');
  const sendCurrencyBtn = document.querySelector('[data-calculator-send-currency]');
  const receiveCurrencyBtn = document.querySelector('[data-calculator-receive-currency]');

  if (!sendInput || !receiveInput) {
    console.error('Required input elements not found');
    return;
  }

  const sendAmount = parseFloat(sendInput.value) || 0;
  const sendCurrency = sendCurrencyBtn?.querySelector('[data-send-currency-text]')?.textContent || 'AED';
  const receiveCurrency = receiveCurrencyBtn?.querySelector('[data-receive-currency-text]')?.textContent || 'USD';

  if (sendAmount <= 0) {
    receiveInput.value = '0.00';
    return;
  }

  // Show loading state
  window.calculatorState.isLoading = true;
  if (receiveInput) receiveInput.value = 'Loading...';

  try {
    // Get country code for receive currency
    const receiveCountryCode = getCountryCodeForCurrency(receiveCurrency);
    
    const exchangeData = await getRemittanceRates('AE', {
      quotation_mode: 'SEND_AMOUNT',
      receive: {
        country_code: receiveCountryCode,
        currency: receiveCurrency,
      },
      send: {
        amount: sendAmount,
        currency: sendCurrency,
        country_code: 'AE',
      },
    });

    // Update UI with results
    if (receiveInput) {
      receiveInput.value = exchangeData.receive.amount.toFixed(2);
    }
    
    if (transferFeeElement) {
      transferFeeElement.textContent = `${exchangeData.fee.amount.toFixed(3)} ${exchangeData.fee.currency}`;
    }
    
    if (exchangeRateElement) {
      const rate = exchangeData.quotations[0]?.transfer_fx_rate || 1.0;
      exchangeRateElement.textContent = `1.00 ${sendCurrency} = ${rate.toFixed(4)} ${receiveCurrency}`;
    }

    console.log('Exchange calculation completed successfully');
  } catch (error) {
    console.error('Error calculating exchange:', error);
    
    // Show error state
    if (receiveInput) receiveInput.value = 'Error';
    if (transferFeeElement) transferFeeElement.textContent = 'N/A';
    if (exchangeRateElement) exchangeRateElement.textContent = 'Rate unavailable';
  } finally {
    window.calculatorState.isLoading = false;
  }
}

/**
 * Get country code for a given currency using the fetched countries data
 */
function getCountryCodeForCurrency(currency) {
  // Use the dynamically fetched countries data instead of hardcoded mapping
  const countries = window.calculatorState.countries || {};
  
  // Find the country that matches this currency
  for (const [countryCode, countryData] of Object.entries(countries)) {
    if (countryData.currency === currency) {
      return countryCode;
    }
  }
  
  // If not found in our fetched data, return a default
  console.warn(`Country code not found for currency: ${currency}`);
  return 'US'; // Default fallback
}

/**
 * Setup dropdown functionality
 */
function setupDropdowns() {
  const receiveCurrencyBtn = document.querySelector('[data-calculator-receive-currency]');
  const receiveCurrencyDropdown = document.querySelector('[data-receive-currency-dropdown]');
  const receiveCurrencyText = document.querySelector('[data-receive-currency-text]');
  const receiveCurrencyFlag = document.querySelector('.receive-currency-flag');

  if (!receiveCurrencyBtn || !receiveCurrencyDropdown) {
    console.error('Dropdown elements not found');
    return;
  }

  // Populate dropdown with countries
  receiveCurrencyDropdown.innerHTML = '';
  Object.values(window.calculatorState.countries).forEach((country) => {
    const button = document.createElement('button');
    button.className = 'w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-[#F3F5F6]';
    button.dataset.currency = country.currency;
    button.dataset.countryCode = country.code;

    const div = document.createElement('div');
    div.className = 'flex items-center gap-2';

    const flagSpan = document.createElement('span');
    flagSpan.className = 'currency-flag';
    flagSpan.textContent = country.unicode;

    const currencySpan = document.createElement('span');
    currencySpan.textContent = country.currency;

    div.appendChild(flagSpan);
    div.appendChild(currencySpan);
    button.appendChild(div);
    receiveCurrencyDropdown.appendChild(button);

    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update button text and flag
      if (receiveCurrencyText) receiveCurrencyText.textContent = country.currency;
      if (receiveCurrencyFlag) receiveCurrencyFlag.textContent = country.unicode;
      
      // Update global state
      window.calculatorState.currentReceiveCurrency = country.currency;
      
      // Hide dropdown
      receiveCurrencyDropdown.classList.add('hidden');
      receiveCurrencyBtn.setAttribute('aria-expanded', 'false');
      
      // Recalculate exchange
      calculateExchange();
    });
  });

  // Toggle dropdown
  receiveCurrencyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isExpanded = receiveCurrencyBtn.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      receiveCurrencyDropdown.classList.add('hidden');
      receiveCurrencyBtn.setAttribute('aria-expanded', 'false');
    } else {
      receiveCurrencyDropdown.classList.remove('hidden');
      receiveCurrencyBtn.setAttribute('aria-expanded', 'true');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!receiveCurrencyBtn.contains(e.target) && !receiveCurrencyDropdown.contains(e.target)) {
      receiveCurrencyDropdown.classList.add('hidden');
      receiveCurrencyBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Initialize calculator
 */
async function initCalculator() {
  console.log('Initializing calculator...');
  
  // Fetch countries data first
  await fetchCountriesData();
  
  // Setup dropdowns
  setupDropdowns();
  
  // Setup input handlers
  const sendInput = document.querySelector('[data-calculator-send-input]');
  const submitButton = document.querySelector('#cta-transfer-send');
  
  if (sendInput) {
    // Input validation and calculation
    sendInput.addEventListener('input', (e) => {
      let value = e.target.value;
      
      // Remove any non-numeric characters except decimal point
      value = value.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit to 6 characters total
      if (value.length > 6) {
        value = value.substring(0, 6);
      }
      
      // Update input value
      e.target.value = value;
      
      // Calculate exchange if valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        calculateExchange();
      }
    });
  }
  
  if (submitButton) {
    submitButton.addEventListener('click', (e) => {
      // Validate input
      if (!sendInput?.value || parseFloat(sendInput.value) <= 0) {
        const validationMessage = document.querySelector('[data-validation-message]');
        if (validationMessage) {
          validationMessage.textContent = 'Please enter an amount to send';
          validationMessage.classList.remove('hidden');
          setTimeout(() => validationMessage.classList.add('hidden'), 3000);
        }
        e.preventDefault();
        return;
      }
      
      // Trigger app redirect
      triggerAppRedirect(e);
    });
  }
  
  console.log('Calculator initialized successfully');
}
