import { addDoc, collection, updateDoc,doc,deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Get all supplier
export const getSupplier = async () => {
    try {
      const collectionRef = collection(db, "supplier");
      const querySnapshot = await getDocs(collectionRef);
      const supplier = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
      }));
      return { supplier, status: 200 };
    } catch (err) {
      console.error("Error fetching documents: ", err);
      return { status: 500, message: err.message };
    }
  };

// Get Supplier by ID
export const getSupplierById = async (supplierId) => {
  try {
    const docRef = doc(db, "supplier", supplierId);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      return { supplier: { id: docSnapshot.id, ...docSnapshot.data() }, status: 200 };
    } else {
      return { status: 404, message: 'supplier not found' };
    }
  } catch (err) {
    console.error("Error fetching document: ", err);
    return { status: 500, message: err.message };
  }
};

// get pay details from supplier
export const getSupplierPayDetailsById = async (supplierId) => {
  try {
    const itemsCollectionRef = collection(db, 'supplier', supplierId, 'paydetails');
    const querySnapshot = await getDocs(itemsCollectionRef);
    const paydetails = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { paydetails, status: 200 };
  } catch (err) {
    console.error("Error fetching items: ", err);
    return { status: 500, message: err.message };
  }
};

// update paydetils
export const updatePaydetailsChildSupplier = async (supplierId, payDetailId, updatedData) => {
  try {
    const payDetailDocRef = doc(db, 'supplier', supplierId, 'paydetails', payDetailId)
    await updateDoc(payDetailDocRef, updatedData)
    return { status: 200, message: 'Pay details updated successfully' }
  } catch (err) {
    console.error('Error updating pay details: ', err)
    return { status: 500, message: err.message }
  }
}

  // get items for delivery
  export const getMaterialDetailsById = async (supplierId) => {
    try {
      const itemsCollectionRef = collection(db, 'supplier', supplierId, 'materialdetails');
      const querySnapshot = await getDocs(itemsCollectionRef);
      const materials = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { materials, status: 200 };
    } catch (err) {
      console.error("Error fetching items: ", err);
      return { status: 500, message: err.message };
    }
  };

  export const getOneMaterialDetailsById = async (supplierId, materialId) => {
    try {
      // Step 1: Reference the specific material document by its ID
      const itemDocRef = doc(db, 'supplier', supplierId, 'materialdetails', materialId);

      // Step 2: Fetch the document
      const docSnap = await getDoc(itemDocRef);
  
      // Step 3: Check if the document exists
      if (docSnap.exists()) {
        return { material: { id: docSnap.id, ...docSnap.data() }, status: 200 };
      } else {
        return { status: 404, message: "Material not found" };
      }
    } catch (err) {
      console.error("Error fetching material: ", err);
      return { status: 500, message: err.message };
    }
  };

  // To get all materials from all suppliers
  export const getAllMaterialDetailsFromAllSuppliers = async () => {
    try {
      const suppliersCollectionRef = collection(db, 'supplier');
      const suppliersSnapshot = await getDocs(suppliersCollectionRef);
      const allMaterialDetails = [];
      for (const supplierDoc of suppliersSnapshot.docs) {
        const supplierId = supplierDoc.id;
        const materialDetailsRef = collection(db, 'supplier', supplierId, 'materialdetails');
        const materialDetailsSnapshot = await getDocs(materialDetailsRef);
        materialDetailsSnapshot.forEach(materialDoc => {
          allMaterialDetails.push({
            supplierId,
            materialId: materialDoc.id,
            ...materialDoc.data(),
          });
        });
      }
      return { materials: allMaterialDetails, status: 200 };
    } catch (err) {
      console.error("Error fetching material details from all suppliers: ", err);
      return { status: 500, message: err.message };
    }
  };

  // Create a new supplier
export const createSupplier = async (task) => {
  try {
    const collectionRef = collection(db, "supplier");
    const res = await addDoc(collectionRef, task);
    return { res, status: 200 };
  } catch (err) {
    console.error("Error adding document: ", err);
    return { status: 500, message: err.message };
  }
};

export const addNewMaterialItem = async (supplierId, newData) => {
  try {
      const materialRef = collection(db, 'supplier', supplierId, 'materialdetails');
      await addDoc(materialRef, newData); // Add new material item with auto-generated ID
      return { status: 200, message: 'Material item added successfully' };
  } catch (err) {
      console.error('Error adding material item: ', err);
      return { status: 500, message: err.message };
  }
};

// Update an existing supplier
export const updateSupplier = async (supplierId, updatedData) => {
  try {
    const docRef = doc(db, "supplier", supplierId);
    await updateDoc(docRef, updatedData);
    return { status: 200 };
  } catch (err) {
    console.error("Error updating document: ", err);
    return { status: 500, message: err.message };
  }
};

export const updateMaterialItsms = async (supplierId, materialItemsId, updatedData) => {
  try {
    const payDetailDocRef = doc(db, 'supplier', supplierId, 'materialdetails', materialItemsId);
    await updateDoc(payDetailDocRef, updatedData);
    return { status: 200, message: 'Pay details updated successfully' };
  } catch (err) {
    console.error("Error updating pay details: ", err);
    return { status: 500, message: err.message };
  }
};

// Delete an supplier
export const deleteSupplier = async (supplierId) => {
  try {
    const docRef = doc(db, "supplier", supplierId);
    await deleteDoc(docRef);
    return { status: 200 };
  } catch (err) {
    console.error("Error deleting document: ", err);
    return { status: 500, message: err.message };
  }
};
