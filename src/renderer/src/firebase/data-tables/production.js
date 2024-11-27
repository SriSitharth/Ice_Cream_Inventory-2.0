import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Get all production
export const getProduction = async () => {
    try {
      const collectionRef = collection(db, "production");
      const querySnapshot = await getDocs(collectionRef);
      const production = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { production, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Create a new production
export const createProduction = async (task) => {
  try {
    const collectionRef = collection(db, "production");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing production
export const updateProduction = async (productionId, updatedData) => {
  try {
    const docRef = doc(db, "production", productionId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an production
export const deleteProduction = async (productionId) => {
  try {
    const docRef = doc(db, "production", productionId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};


