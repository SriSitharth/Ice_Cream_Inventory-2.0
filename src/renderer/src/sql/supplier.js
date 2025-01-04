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

    if (response.data) {
      console.log('Supplier fetched successfully:', response.data);
      return response.data;
    } else {
      console.warn('No supplier found for the given ID:', id);
      return {};
    }
  } catch (error) {
    console.error('Error fetching supplier by ID:', error.message);
    return {};
  }
};

export const updateSupplier = async (id, supplierData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/Supplier/UpdateSupplier`, supplierData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Supplier updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating supplier:', error.message);
    throw error;
  }
};

export const addSupplierPayment = async (paymentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Payment/AddSupplierPayment`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Supplier payment added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding supplier payment:', error.message);
    throw error;
  }
};

export const getSupplierPayments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/GetSupplierPayments`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('All supplier payments fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all supplier payments:', error.message);
    throw error;
  }
};

export const getSupplierPaymentsById = async (supplierId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/GetSupplierPaymentsById`, {
      headers: {
        'Content-Type': 'application/json',
      },
      params: { id: supplierId },
    });

    console.log('Payments for supplier fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching payments for supplier:', error.message);
    throw error;
  }
};

export const updateSupplierPayment = async (supplierid , id , paymentData) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/UpdateSupplierPayment`, paymentData, {
      params: { supplierid , id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Payment updated fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching payments for supplier:', error.message);
    throw error;
  }
};
