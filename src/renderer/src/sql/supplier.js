import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

export const getSuppliers = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Supplier/GetSuppliers`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Suppliers fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching suppliers:', error.message);
    throw error;
  }
};

export const addSupplier = async (supplierData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Supplier/AddSupplier`, supplierData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Supplier added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding supplier:', error.message);
    throw error;
  }
};

// Get supplier by ID
export const getSupplierById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Supplier/GetSupplierById`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Supplier fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching supplier by ID:', error.message);
    throw error;
  }
};