import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Get all storage
export const getSpending = async () => {
    try {
      const collectionRef = collection(db, "spending");
      const querySnapshot = await getDocs(collectionRef);
      const spending = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { spending, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Create a new storage
export const createSpending = async (task) => {
  try {
    const collectionRef = collection(db, "spending");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing storage
export const updateSpending = async (storageId, updatedData) => {
  try {
    const docRef = doc(db, "spending", storageId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an storage
export const deleteSpending = async (storageId) => {
  try {
    const docRef = doc(db, "spending", storageId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};

