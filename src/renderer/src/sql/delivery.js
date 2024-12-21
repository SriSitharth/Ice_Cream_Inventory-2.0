import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

export const getDelivery = async (params = {}) => {
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

export const addDelivery = async (deliveryData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Delivery/AddDeliveryDetails`, deliveryData, {
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