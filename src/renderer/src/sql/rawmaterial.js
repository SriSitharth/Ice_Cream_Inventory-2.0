import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

export const getRawMaterials = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/RawMaterial/GetRawMaterials`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Raw materials fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching raw materials:', error.message);
    throw error;
  }
};

export const addRawMaterial = async (rawmaterialData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/RawMaterial/AddRawMaterial`, rawmaterialData, {
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

export const updateRawMaterial = async (id, rawmaterialData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/RawMaterial/UpdateRawMaterial`, rawmaterialData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Rawmaterial updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating rawmaterial:', error.message);
    throw error;
  }
};

export const getRawMaterialDetails = async (params = {}) => {
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

export const addRawMaterialDetail = async (rawmaterialData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/RawMaterial/AddRawMaterialDetail`, rawmaterialData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Raw material detail added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding raw material detail:', error.message);
    throw error;
  }
};

export const updateRawMaterialDetail = async (id, rawmaterialdetailData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/RawMaterial/UpdateRawMaterialDetail`, rawmaterialdetailData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Rawmaterial detail updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating rawmaterial detail:', error.message);
    throw error;
  }
};