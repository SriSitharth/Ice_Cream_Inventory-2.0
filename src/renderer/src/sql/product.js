import axios from 'axios';

const API_BASE_URL = 'https://40.192.36.209:9091';

export const getProducts = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Product/GetProducts`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Products fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error.message);
    throw error;
  }
};

export const addProduct = async (productData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Product/AddProduct`, productData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Product added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding product:', error.message);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Product/GetProductById`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data) {
      console.log('Product fetched successfully by ID:', response.data);
      return response.data;
    } else {
      console.warn('No product found for the given ID:', id);
      return {};
    }
  } catch (error) {
    console.error('Error fetching product:', error.message);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/Product/UpdateProduct`, productData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Product updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error.message);
    throw error;
  }
};

