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

export const updateFreezerbox = async (id, freezerboxData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/Freezerbox/UpdateFreezerbox`, freezerboxData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Freezerbox updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating freezerbox:', error.message);
    throw error;
  }
};

export const getFreezerboxById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Freezerbox/GetFreezerboxById`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data) {
      console.log('Freezerbox by Id fetched successfully:', response.data);
      return response.data;
    } else {
      console.warn('No freezerbox found for the given ID:', id);
      return {};
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`No freezerbox found for ID: ${deliveryId}`);
      return [];
    } else {
    console.error('Error fetching freezerbox by Id:', error.message);
    throw [];
    }
  }
};

export const getFreezerboxByCustomerId = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Freezerbox/GetFreezerboxByCustomerId`, {
      params: { customerId: id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data) {
      console.log('Freezerbox by customer Id fetched successfully:', response.data);
      return response.data;
    } else {
      console.warn('No freezerbox found for the given customer ID:', id);
      return {};
    }
  } catch (error) {
    console.error('Error fetching freezerbox by customer Id:', error.message);
    throw error;
  }
};