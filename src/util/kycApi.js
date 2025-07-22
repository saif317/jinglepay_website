// KYC API utilities for Astro project

const isSitEnvironment = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sitenv');
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment
  ? '' // Empty base URL will use the local proxy
  : isSitEnvironment
  ? 'https://sit.jinglepay.dev'
  : 'https://api.jinglepay.dev'; // Always use api.jinglepay.dev in production

export const fetchUserKYCData = async (userId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v0/kyc/rekyc/eid/?u=${userId}&t=${token}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch KYC data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: Expected an object');
    }

    // Transform the API response to match ReKYC interface
    return {
      front_eid: null,
      back_eid: null,
      address_proof: null,
      valid_from: data.eid_start_date ? new Date(data.eid_start_date).toISOString().split('T')[0] : null,
      valid_until: data.eid_expiry_date ? new Date(data.eid_expiry_date).toISOString().split('T')[0] : null,
      name: data.first_name || '',
      surname: data.last_name || '',
      number: data.eid || '',
      address_country: data.address_country || '',
      address_postal_code: data.address_postal_code || '',
      address_city: data.address_city || '',
      address_street: data.address_street || '',
      address_building: data.address_building || '',
      address_flat_no: data.address_flat_no?.toString() || '',
      transfer_to_jpl: data.transfer_to_jpl || '',
      transfer_from_jpl: data.transfer_from_jpl || '',
      purpose_relationship: data.purpose_relationship || '',
      source_of_funds: data.source_of_funds || '',
      past_ten_years_income_source: data.past_ten_years_income_source || '',
      past_ten_years_living_country: data.past_ten_years_living_country || '',
      money_transfer_countries: data.money_transfer_countries || '',
      occupation: data.occupation || '',
      nationality: data.nationality || '',
      place_of_birth: data.place_of_birth || '',
      rekyc_completed: data.rekyc_completed || false,
      need_proof: true,
    };
  } catch (error) {
    console.error('Error fetching KYC data:', error);
    throw error;
  }
};

export const submitReKYC = async (userId, token, data) => {
  // First fetch the countries list
  const countries = await fetchCountries();
  const formData = new FormData();

  // Append document files
  if (data.front_eid instanceof File) formData.append('front_eid', data.front_eid);
  if (data.back_eid instanceof File) formData.append('back_eid', data.back_eid);
  if (data.address_proof instanceof File) formData.append('address_proof', data.address_proof);

  // Append all other form data
  Object.entries(data).forEach(([key, value]) => {
    if (value && !(value instanceof File)) {
      // Format dates to YYYY-MM-DD
      if ((key === 'valid_from' || key === 'valid_until') && value) {
        // Handle ISO date format (contains 'T')
        if (typeof value === 'string' && value.includes('T')) {
          formData.append(key, value.split('T')[0]); // Just take the date part
        } else {
          formData.append(key, value.toString());
        }
      }
      // Handle nationality - ensure it's a 2-character ISO code
      else if (
        (key === 'nationality' || key === 'money_transfer_countries' || key === 'address_country') &&
        typeof value === 'string'
      ) {
        // If already a 2-char code, use it; otherwise try to convert from country name
        const code =
          value.length === 2
            ? value
            : countries.find((c) => c.name.toLowerCase() === value.toLowerCase())?.iso2_code || value;
        formData.append(key, code.slice(0, 2)); // Ensure max 2 chars
      }
      // Handle enum values - use display text directly
      else if (key === 'transfer_to_jpl' || key === 'transfer_from_jpl' || key === 'past_ten_years_income_source') {
        formData.append(key, value.toString());
      } else {
        formData.append(key, value.toString());
      }
    }
  });

  // Append user id and token
  formData.append('u', userId);
  formData.append('t', token);

  const response = await fetch(`${API_BASE_URL}/api/v0/kyc/rekyc/eid/`, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to submit Re-KYC data: ${response.status} ${response.statusText}${errorText ? `\n${errorText}` : ''}`
    );
  }

  return response.json();
};

export const fetchCountries = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v0/kyc/countries/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
};
