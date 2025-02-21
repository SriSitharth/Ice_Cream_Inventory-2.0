import axios from 'axios';

const API_BASE_URL = 'https://40.192.36.209:9091';

export const getStorages = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Storage/GetStorage`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Storage details fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching storage details:', error.message);
    throw error;
  }
};

export const addStorage = async (storageData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Storage/AddStorage`, storageData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Storage added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding storage:', error.message);
    throw error;
  }
};

export const updateStorage = async (id, storageData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/Storage/UpdateStorage`, storageData, {
        params: { id },
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      console.log('Storage updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating storage:', error.message);
      throw error;
    }
  };