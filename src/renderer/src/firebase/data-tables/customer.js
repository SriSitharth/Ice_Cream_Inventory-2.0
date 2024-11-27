import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Get all customer
export const getCustomer = async () => {
    try {
      const collectionRef = collection(db, "customer");
      const querySnapshot = await getDocs(collectionRef);
      const customer = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { customer, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

// Get customer pay details by ID
export const getCustomerPayDetailsById = async (customerId) => {
  if (!customerId) {
    console.error("Error: customerId is undefined or null");
    return { status: 400, message: 'Invalid customer ID' };
  }
  try {
    const itemsCollectionRef = collection(db, 'customer', customerId, 'paydetails');
    const querySnapshot = await getDocs(itemsCollectionRef);
    const paydetails = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { paydetails, status: 200 };
  } catch (err) {
    console.error("Error fetching items: ", err);
    return { status: 500, message: err.message };
  }
};

// update paydetils
export const updatePaydetailsCustomer = async (customerId, payDetailId, updatedData) => {
  try {
    const payDetailDocRef = doc(db, 'customer', customerId, 'paydetails', payDetailId)
    await updateDoc(payDetailDocRef, updatedData)
    return { status: 200, message: 'Pay details updated successfully' }
  } catch (err) {
    console.error('Error updating pay details: ', err)
    return { status: 500, message: err.message }
  }
}

// Get customer by ID
export const getCustomerById = async (customerId) => {
  if (!customerId) {
    console.error("Error: customerId is undefined or null");
    return { status: 400, message: 'Invalid customer ID' };
  }
  try {
    const docRef = doc(db, "customer", customerId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return { customer: { id: docSnapshot.id, ...docSnapshot.data() }, status: 200 };
    } else {
      return { status: 404, message: 'Customer not found' };
    }
  } catch (err) {
    console.error("Error fetching document: ", err);
    return { status: 500, message: err.message };
  }
};



  // Create a new customer
export const createCustomer = async (task) => {
  try {
    const collectionRef = collection(db, "customer");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing customer
export const updateCustomer = async (customerId, updatedData) => {
  try {
    const docRef = doc(db, "customer", customerId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an customer
export const deleteCustomer = async (customerId) => {
  try {
    const docRef = doc(db, "customer", customerId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};


