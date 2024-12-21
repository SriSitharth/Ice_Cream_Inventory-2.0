import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

export const getRawMaterials = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/RawMaterial/GetRawMaterialDetails`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Raw material details fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching raw material details:', error.message);
    throw error;
  }
};

export const addRawMaterial = async (rawmaterialData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/RawMaterial/AddRawMaterialDetails`, rawmaterialData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Raw material added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding raw material:', error.message);
    throw error;
  }
};