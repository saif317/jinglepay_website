/**
 * Mock Countries API for populating currency dropdowns
 * Provides realistic country/currency data for development
 */

// API endpoint for countries data
export const COUNTRIES_API_ENDPOINT = '/api/v0/countries/';

// Define supported countries with their currencies
export const SUPPORTED_COUNTRIES = [
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: 'ae',
    currencies: [
      {
        code: 'AED',
        name: 'UAE Dirham',
        symbol: 'د.إ'
      }
    ],
    send_supported: true,
    receive_supported: true
  },
  {
    code: 'US',
    name: 'United States',
    flag: 'us',
    currencies: [
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$'
      }
    ],
    send_supported: true,
    receive_supported: true
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: 'gb',
    currencies: [
      {
        code: 'GBP',
        name: 'Pound Sterling',
        symbol: '£'
      }
    ],
    send_supported: true,
    receive_supported: true
  },
  {
    code: 'EU',
    name: 'European Union',
    flag: 'eu',
    currencies: [
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€'
      }
    ],
    send_supported: true,
    receive_supported: true
  },
  {
    code: 'IN',
    name: 'India',
    flag: 'in',
    currencies: [
      {
        code: 'INR',
        name: 'Indian Rupee',
        symbol: '₹'
      }
    ],
    send_supported: false,
    receive_supported: true
  },
  {
    code: 'PK',
    name: 'Pakistan',
    flag: 'pk',
    currencies: [
      {
        code: 'PKR',
        name: 'Pakistani Rupee',
        symbol: '₨'
      }
    ],
    send_supported: false,
    receive_supported: true
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    flag: 'bd',
    currencies: [
      {
        code: 'BDT',
        name: 'Bangladeshi Taka',
        symbol: '৳'
      }
    ],
    send_supported: false,
    receive_supported: true
  },
  {
    code: 'PH',
    name: 'Philippines',
    flag: 'ph',
    currencies: [
      {
        code: 'PHP',
        name: 'Philippine Peso',
        symbol: '₱'
      }
    ],
    send_supported: false,
    receive_supported: true
  },
  {
    code: 'LK',
    name: 'Sri Lanka',
    flag: 'lk',
    currencies: [
      {
        code: 'LKR',
        name: 'Sri Lankan Rupee',
        symbol: 'Rs'
      }
    ],
    send_supported: false,
    receive_supported: true
  }
];

/**
 * Get list of supported countries with currencies
 * @param {string} filter - Filter for send or receive supported countries ('send', 'receive', or '' for all)
 * @returns {Promise<Array>} - Array of country objects
 */
export async function getCountries(filter = '') {
  try {
    console.log('Getting supported countries with filter:', filter);
    
    let countries = [...SUPPORTED_COUNTRIES];
    
    // Apply filter if specified
    if (filter === 'send') {
      countries = countries.filter(country => country.send_supported);
    } else if (filter === 'receive') {
      countries = countries.filter(country => country.receive_supported);
    }
    
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

/**
 * Mock API handler for countries endpoint
 * @param {string} filter - Optional filter parameter
 * @returns {Promise<Array>} - Array of country objects
 */
export async function mockCountriesApiHandler(filter = '') {
  return await getCountries(filter);
}
