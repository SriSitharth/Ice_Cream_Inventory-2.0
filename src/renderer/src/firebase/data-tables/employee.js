import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs,getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Get all employee
export const getEmployee = async () => {
    try {
      const collectionRef = collection(db, "employee");
      const querySnapshot = await getDocs(collectionRef);
      const employee = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { employee, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  export const getEmployeeById = async (employeeId) => {
    try {
      const docRef = doc(db, "employee", employeeId);
      const docSnapshot = await getDoc(docRef);
      
      if (docSnapshot.exists()) {
        return { employee: { id: docSnapshot.id, ...docSnapshot.data() }, status: 200 };
      } else {
        return { status: 404, message: 'supplier not found' };
      }
    } catch (err) {
      console.error("Error fetching document: ", err);
      return { status: 500, message: err.message };
    }
  };

    // get paydetails for employee
    export const fetchPayDetailsForEmployee = async (empId) => {
      try {
        const itemsCollectionRef = collection(db, 'employee', empId, 'paydetails');
        const querySnapshot = await getDocs(itemsCollectionRef);
        const paydetails = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { paydetails, status: 200 };
      } catch (err) {
        console.error("Error fetching items: ", err);
        return { status: 500, message: err.message };
      }
    };

    // update paydetails for employee
    export const updatePayDetailsForEmployee = async (empId, payDetailId, updatedData) => {
      try {
        const payDetailDocRef = doc(db, 'employee', empId, 'paydetails', payDetailId);
        await updateDoc(payDetailDocRef, updatedData);
        return { status: 200, message: 'Pay details updated successfully' };
      } catch (err) {
        console.error("Error updating pay details: ", err);
        return { status: 500, message: err.message };
      }
    };

  // Create a new employee
export const createEmployee = async (task) => {
  try {
    const collectionRef = collection(db, "employee");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing employee
export const updateEmployee = async (employeeId, updatedData) => {
  try {
    const docRef = doc(db, "employee", employeeId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};

// Delete an employee
export const deleteEmployee = async (employeeId) => {
  try {
    const docRef = doc(db, "employee", employeeId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};