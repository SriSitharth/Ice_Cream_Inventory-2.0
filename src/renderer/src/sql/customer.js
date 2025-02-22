import axios from 'axios';

const API_BASE_URL = 'https://40.192.36.209:9091';

export const getCustomers = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Customer/GetCustomers`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Customers fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    throw error;
  }
};

export const addCustomer = async (customerData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Customer/AddCustomer`, customerData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Customer added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding customer:', error.message);
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/Customer/UpdateCustomer`, customerData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Customer updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating customer:', error.message);
    throw error;
  }
};

// Get customer by ID
export const getCustomerById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Customer/GetCustomerById`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Customer fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer by ID:', error.message);
    throw error;
  }
};

export const addCustomerPayment = async (paymentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Payment/AddCustomerPayment`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Customer payment added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding customer payment:', error.message);
    throw error;
  }
};

export const getCustomerPayments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/GetCustomerPayments`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('All customer payments fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all customer payments:', error.message);
    throw error;
  }
};

export const getCustomerPaymentsById = async (customerId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/GetCustomerPaymentsById`, {
      params: { id: customerId },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data) {
      console.log('Payments for customer fetched successfully:', response.data);
      return response.data;
    } else {
      console.warn('No customer payments found for the given ID:', customerId);
      return {};
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`No payments found for customer ID: ${customerId}`);
      return [];
    } else {
    console.error('Error fetching payments for customer:', error.message);
    throw [];
    }
  }
};

export const updateCustomerPayment = async (customerid , id , paymentData) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/UpdateCustomerPayment`, paymentData, {
      params: { customerid, id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Payment updated fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching payments for customer:', error.message);
    throw error;
  }
};
