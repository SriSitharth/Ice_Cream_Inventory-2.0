import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Get all storage
export const getStorage = async () => {
    try {
      const collectionRef = collection(db, "storage");
      const querySnapshot = await getDocs(collectionRef);
      const storage = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { storage, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Create a new storage
export const createStorage = async (task) => {
  try {
    const collectionRef = collection(db, "storage");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing storage
export const updateStorage = async (storageId, updatedData) => {
  try {
    const docRef = doc(db, "storage", storageId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an storage
export const deleteStorage = async (storageId) => {
  try {
    const docRef = doc(db, "storage", storageId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};


