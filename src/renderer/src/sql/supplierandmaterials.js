import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

export const getSupplierAndMaterials = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/SupplierAndMaterial/GetSupplierAndMaterials`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Supplier and materials fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching supplier and materials:', error.message);
    throw error;
  }
};

export const addSupplierAndMaterial = async (supplierData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/SupplierAndMaterial/AddSupplierAndMaterial`, supplierData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Supplier and material added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding supplier and material:', error.message);
    throw error;
  }
};