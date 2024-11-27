import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Get all balancesheet
export const getBalanceSheet = async () => {
    try {
      const collectionRef = collection(db, "balancesheet");
      const querySnapshot = await getDocs(collectionRef);
      const balancesheet = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { balancesheet, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // get items for balancesheet
  export const fetchItemsForBalanceSheet = async (balaceSheetId) => {
    try {
      const itemsCollectionRef = collection(db, 'balancesheet', balaceSheetId, 'items');
      const querySnapshot = await getDocs(itemsCollectionRef);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { items, status: 200 };
    } catch (err) {
      console.error("Error fetching items: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Create a new balancesheet
export const createBalanceSheet = async (task) => {
  try {
    const collectionRef = collection(db, "balancesheet");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing balancesheet
export const updateBalanceSheet = async (balaceSheetId, updatedData) => {
  try {
    const docRef = doc(db, "balancesheet", balaceSheetId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};

// Delete an balancesheet
export const deleteBalanceSheet = async (balaceSheetId) => {
  try {
    const docRef = doc(db, "balancesheet", balaceSheetId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};


