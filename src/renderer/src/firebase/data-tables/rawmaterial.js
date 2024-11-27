import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Get all rawmaterial
export const getRawmaterial = async () => {
    try {
      const collectionRef = collection(db, "rawmaterial");
      const querySnapshot = await getDocs(collectionRef);
      const rawmaterial = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { rawmaterial, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // get items for delivery
export const fetchMaterials = async (materialId) => {
  try {
    const materialCollectionRef = collection(db, 'rawmaterial', materialId, 'materialdetails')
    const querySnapshot = await getDocs(materialCollectionRef)
    const materialitem = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return { materialitem, status: 200 }
  } catch (err) {
    console.error('Error fetching items: ', err)
    return { status: 500, message: err.message }
  }
}

  // Create a new rawmaterial
export const createRawmaterial = async (task) => {
  try {
    const collectionRef = collection(db, "rawmaterial");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing rawmaterial
export const updateRawmaterial = async (rawmaterialId, updatedData) => {
  try {
    const docRef = doc(db, "rawmaterial", rawmaterialId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an rawmaterial
export const deleteRawmaterial = async (rawmaterialId) => {
  try {
    const docRef = doc(db, "rawmaterial", rawmaterialId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};


