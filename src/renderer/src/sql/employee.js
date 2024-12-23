import axios from 'axios';

const API_BASE_URL = 'http://localhost:40384';

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