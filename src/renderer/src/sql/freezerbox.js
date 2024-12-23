import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

export const getFreezerboxes = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Freezerbox/GetFreezerboxDetails`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Freezerbox details fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching freezerbox details:', error.message);
    throw error;
  }
};

export const addFreezerbox = async (freezerboxData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Freezerbox/AddFreezerboxDetails`, freezerboxData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Freezerbox added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding freezerbox:', error.message);
    throw error;
  }
};