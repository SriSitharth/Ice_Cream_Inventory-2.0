import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

export const getDelivery = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Delivery/GetDelivery`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Delivery fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery:', error.message);
    throw error;
  }
};

export const addDelivery = async (deliveryData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Delivery/AddDelivery`, deliveryData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Delivery added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding delivery:', error.message);
    throw error;
  }
};

export const getDeliveryById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Delivery/GetDeliveryById`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Delivery fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery:', error.message);
    throw error;
  }
};

export const updateDelivery = async (id, deliveryData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/Delivery/UpdateDelivery`, deliveryData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Delivery updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating delivery:', error.message);
    throw error;
  }
};

export const getDeliveryDetails = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Delivery/GetDeliveryDetails`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Delivery details fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery details:', error.message);
    throw error;
  }
};

export const addDeliveryDetail = async (deliverydetailData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Delivery/AddDeliveryDetail`, deliverydetailData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Delivery detail added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding delivery detail:', error.message);
    throw error;
  }
};