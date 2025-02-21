import axios from 'axios';

const API_BASE_URL = 'https://40.192.36.209:9091';

export const getEmployees = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Employee/GetEmployees`, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Employees fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error.message);
    throw error;
  }
};

export const addEmployee = async (employeeData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Employee/AddEmployee`, employeeData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Employee added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding employee:', error.message);
    throw error;
  }
};

export const getEmployeeById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Employee/GetEmployeeById`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Employee fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee by ID:', error.message);
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/Employee/UpdateEmployee`, employeeData, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Employee updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating employee:', error.message);
    throw error;
  }
};

export const addEmployeePayment = async (paymentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/Payment/AddEmployeePayment`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Employee payment added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding employee payment:', error.message);
    throw error;
  }
};

export const getEmployeePayments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/GetEmployeePayments`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Employee payments fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee payments:', error.message);
    throw error;
  }
};

export const getEmployeePaymentsById = async (employeeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Payment/GetEmployeePaymentsById`, {
      params: { id:employeeId },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Payments for employee fetched successfully:', response.data);
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('No payments found for this employee.');
      return [];
    } else {
      console.error('Error fetching payments for employee:', error.message);
      throw error;
    }
  }
};

export const updateEmployeePayment = async (empid , id , data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/Payment/UpdateEmployeePayment`, data, {
      params: { empid , id },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Payment updated fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching payments for employee:', error.message);
    throw error;
  }
};
