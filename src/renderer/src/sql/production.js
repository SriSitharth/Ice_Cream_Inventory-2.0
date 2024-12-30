import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

export const getProductions = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Production/GetProductions`, {
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
    const response = await axios.post(`${API_BASE_URL}/Production/AddProduction`, productionData, {
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

export const updateProduction = async (id, productionData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/Production/UpdateProduction`, productionData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Production updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating production:', error.message);
    throw error;
  }
};