import { addDoc, collection, query, where, updateDoc,doc,deleteDoc, getDocs,getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Get all Freezerbox
export const getFreezerbox = async () => {
    try {
      const collectionRef = collection(db,"freezerbox");
      const querySnapshot = await getDocs(collectionRef);
      const freezerbox = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { freezerbox, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };


// Get Freezerbox by ID
export const getFreezerboxById = async (boxId) => {
  try {
    const docRef = doc(db, "freezerbox", boxId);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      return { freezerbox: { id: docSnapshot.id, ...docSnapshot.data() }, status: 200 };
    } else {
      return { status: 404, message: 'Box not found' };
    }
  } catch (err) {
    console.error("Error fetching document: ", err);
    return { status: 500, message: err.message };
  }
};

// Get Freezerbox IDs by Customer ID
export const getFreezerboxByCustomerId = async (customerId) => {
  try {
    const freezerboxRef = collection(db, "freezerbox");
    const q = query(freezerboxRef, where("customerid", "==", customerId));
    const querySnapshot = await getDocs(q);
    
    const boxIds = [];
    querySnapshot.forEach((doc) => {
      boxIds.push({ id: doc.id, ...doc.data() });
    });

    if (boxIds.length > 0) {
      return { boxIds, status: 200 };
    } else {
      return { status: 404, message: 'No freezer boxes found for this customer' };
    }
  } catch (err) {
    console.error("Error fetching freezer boxes: ", err);
    return { status: 500, message: err.message };
  }
};
 
 // Create a new Freezerbox
 export const createFreezerbox = async (task) => {
    try {
      const collectionRef = collection(db, "freezerbox");
      const res = await addDoc(collectionRef, task);
      return { res, status: 200 };
    } catch (err) {
      console.error("Error adding document: ", err);
      return { status: 500, message: err.message };
    }
  };
  
  // Update an existing Freezerbox
  export const updateFreezerbox = async (FreezerboxId, updatedData) => {
    try {
      const docRef = doc(db, "freezerbox", FreezerboxId);
      await updateDoc(docRef, updatedData);
      return { status: 200 };
    } catch (err) {
      console.error("Error updating document: ", err);
      return { status: 500, message: err.message };
    }
  };
  
  // Delete an Freezerbox
  export const deleteFreezerbox = async (FreezerboxId) => {
    try {
      const docRef = doc(db, "freezerbox", FreezerboxId);
      await deleteDoc(docRef);
      return { status: 200 };
    } catch (err) {
      console.error("Error deleting document: ", err);
      return { status: 500, message: err.message };
    }
  };