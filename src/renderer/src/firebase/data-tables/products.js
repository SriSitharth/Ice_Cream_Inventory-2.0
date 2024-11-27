import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Get all product
export const getproduct = async () => {
    try {
      const collectionRef = collection(db, "product");
      const querySnapshot = await getDocs(collectionRef);
      const product = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { product, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Get product by ID
export const getProductById = async (productId) => {
  try {
    const docRef = doc(db, "product", productId);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      return { product: { id: docSnapshot.id, ...docSnapshot.data() }, status: 200 };
    } else {
      return { status: 404, message: 'Product not found' };
    }
  } catch (err) {
    console.error("Error fetching document: ", err);
    return { status: 500, message: err.message };
  }
};

  // Create a new product
export const createproduct = async (task) => {
  try {
    const collectionRef = collection(db, "product");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

// Update an existing product
export const updateproduct = async (productId, updatedData) => {
  try {
    const docRef = doc(db, "product", productId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};


// Delete an product
export const deleteproduct = async (productId) => {
  try {
    const docRef = doc(db, "product", productId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};
