import axios from 'axios';

const API_BASE_URL = 'https://40.192.36.209:9091';

export const getSpendings = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Spending/GetSpendingDetails`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Spending details fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching spending details:', error.message);
    throw error;
  }
};

export const addSpending = async (spendingData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Spending/AddSpendingDetails`, spendingData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Spending added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding spending:', error.message);
    throw error;
  }
};