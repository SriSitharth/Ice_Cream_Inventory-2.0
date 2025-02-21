import axios from 'axios';

const API_BASE_URL = 'https://40.192.36.209:9091';

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

export const getMaterialsBySupplierId = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/SupplierAndMaterial/getMaterialsBySupplierId`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Materials fetched by supplier id successfully:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('No materials found for this supplier id.');
      return [];
    } else {
      console.error('Error fetching materials for supplier id:', error.message);
      throw error;
    }
  }
};

export const getMaterialById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/SupplierAndMaterial/getMaterialById`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Material fetched by id successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching material by id:', error.message);
    throw error;
  }
};

export const updateSupplierAndMaterial = async (id, materialData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/SupplierAndMaterial/UpdateSupplierAndMaterial`, materialData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Material updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating material:', error.message);
    throw error;
  }
};