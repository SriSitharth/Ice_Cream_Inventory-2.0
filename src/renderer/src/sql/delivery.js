import axios from 'axios';

const API_BASE_URL = 'https://40.192.36.209:9091';

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

export const getDeliveryDetailById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Delivery/GetDeliveryDetailById`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data) {
      console.log('Delivery details fetched successfully by delivery ID:', response.data);
      return response.data;
    } else {
      console.warn('No delivery details found for the given delivery ID:', id);
      return {};
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`No delivery details found for delivery ID: ${id}`);
      return [];
    } else {
    console.error('Error fetching delivery details by delivery ID:', error.message);
    throw [];
    }
  }
};

export const addDeliveryPayment = async (paymentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Payment/AddDeliveryPayment`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Delivery payment added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding delivery payment:', error.message);
    throw error;
  }
};

export const getDeliveryPayments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/GetDeliveryPayments`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('All delivery payments fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all delivery payments:', error.message);
    throw error;
  }
};

export const getDeliveryPaymentsById = async (deliveryId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/GetDeliveryPaymentsById`, {
      headers: {
        'Content-Type': 'application/json',
      },
      params: { id: deliveryId },
    });

    console.log('Payments for delivery fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`No delivery payments found for delivery ID: ${deliveryId}`);
      return [];
    } else {
    console.error('Error fetching delivery payments by delivery ID:', error.message);
    throw [];
    }
  }
};

export const updateDeliveryPayment = async (deliveryid , id , paymentData) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/UpdateDeliveryPayment`, paymentData, {
      params: { deliveryid, id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Payment updated fetched successfully', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching payments for delivery:', error.message);
    throw error;
  }
};