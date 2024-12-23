import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

export const getProductions = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Production/GetProductionDetails`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Production details fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching production details:', error.message);
    throw error;
  }
};

export const addProduction = async (productionData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Production/AddProductionDetails`, productionData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Production added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding production:', error.message);
    throw error;
  }
};