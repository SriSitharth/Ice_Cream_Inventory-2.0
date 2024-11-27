import {
  addDoc,
  collection,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  collectionGroup,
  where,
  query
} from 'firebase/firestore'
import { db } from '../firebase'

// Get all delivery
export const getDelivery = async () => {
  try {
    const collectionRef = collection(db, 'delivery')
    const querySnapshot = await getDocs(collectionRef)
    const delivery = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    return { delivery, status: 200 }
  } catch (err) {
    console.error('Error fetching documents: ', err)
    return { status: 500, message: err.message }
  }
}

// Get delivery by ID
export const getDeliveryById = async (deliveryId) => {
  if (!deliveryId) {
    console.error('Error: deliveryId is undefined or null')
    return { status: 400, message: 'Invalid delivery ID' }
  }

  try {
    const docRef = doc(db, 'delivery', deliveryId)
    const docSnapshot = await getDoc(docRef)

    if (docSnapshot.exists()) {
      return { delivery: { id: docSnapshot.id, ...docSnapshot.data() }, status: 200 }
    } else {
      return { status: 404, message: 'delivery not found' }
    }
  } catch (err) {
    console.error('Error fetching document: ', err)
    return { status: 500, message: err.message }
  }
}

// get items for delivery
export const fetchItemsForDelivery = async (deliveryId) => {
  try {
    const itemsCollectionRef = collection(db, 'delivery', deliveryId, 'items')
    const querySnapshot = await getDocs(itemsCollectionRef)
    const items = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return { items, status: 200 }
  } catch (err) {
    console.error('Error fetching items: ', err)
    return { status: 500, message: err.message }
  }
}

// get paydetial for delivery
export const fetchPayDetailsForDelivery = async (deliveryId) => {
  try {
    const payDetialsCollectionRef = collection(db, 'delivery', deliveryId, 'paydetails')
    const querySnapshot = await getDocs(payDetialsCollectionRef)
    const paymenthistory = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return { paymenthistory, status: 200 }
  } catch (err) {
    console.error('Error fetching items: ', err)
    return { status: 500, message: err.message }
  }
}

// Create a new delivery
export const createDelivery = async (task) => {
  try {
    const collectionRef = collection(db, 'delivery')
    const res = await addDoc(collectionRef, task)
    return { res, status: 200 }
  } catch (err) {
    console.error('Error adding document: ', err)
    return { status: 500, message: err.message }
  }
}

// Update an existing delivery
export const updateDelivery = async (deliveryId, updatedData) => {
  try {
    const docRef = doc(db, 'delivery', deliveryId)
    await updateDoc(docRef, updatedData)
    return { status: 200 }
  } catch (err) {
    console.error('Error updating document: ', err)
    return { status: 500, message: err.message }
  }
}

// update paydetils
export const updatePaydetailsChild = async (payId, payDetailId, updatedData) => {
  try {
    const payDetailDocRef = doc(db, 'delivery', payId, 'paydetails', payDetailId)
    await updateDoc(payDetailDocRef, updatedData)
    return { status: 200, message: 'Pay details updated successfully' }
  } catch (err) {
    console.error('Error updating pay details: ', err)
    return { status: 500, message: err.message }
  }
}

// Delete an delivery
export const deleteDelivery = async (deliveryId) => {
  try {
    const docRef = doc(db, 'delivery', deliveryId)
    await deleteDoc(docRef)
    return { status: 200 }
  } catch (err) {
    console.error('Error deleting document: ', err)
    return { status: 500, message: err.message }
  }
}

// // To get all deliverys from all Delivery
// export const getAllPayDetailsFromAllDelivery = async () => {
//   try {
//     const deliveryCollectionRef = collection(db, 'delivery') // Reference to 'delivery' collection
//     const deliverySnapshot = await getDocs(deliveryCollectionRef) // Get all documents from 'delivery' collection

//     const allPayDetails = []

//     // Loop over each 'delivery' document
//     for (const deliveryDoc of deliverySnapshot.docs) {
//       const deliveryId = deliveryDoc.id // Get the delivery document ID
//       const paydetailsCollectionRef = collection(db, 'delivery', deliveryId, 'paydetails') // Reference to 'paydetails' subcollection
//       const paydetailsSnapshot = await getDocs(paydetailsCollectionRef) // Fetch all paydetails for this delivery

//       // Loop over each paydetails document and add it to the results
//       paydetailsSnapshot.forEach((paydetailsDoc) => {
//         allPayDetails.push({
//           deliveryid, // Attach the parent delivery document ID
//           paydetailsid: paydetailsDoc.id, // Attach the paydetails document ID
//           ...paydetailsDoc.data() // Attach the paydetails data
//         })
//       })
//     }

//     console.log(allPayDetails)

//     return { paydetails: allPayDetails, status: 200 }
//   } catch (e) {
//     console.log('Error fetching paydetails:', e)
//     return { paydetails: [], status: 500, error: e.message }
//   }
// }

export const getAllPayDetailsFromAllDelivery = async () => {
  try {
    const paydetailsCollectionGroup = collectionGroup(db, 'paydetails')
    const deliveryDetailsSnapshot = await getDocs(paydetailsCollectionGroup)

    const alldeliveryDetails = []
    deliveryDetailsSnapshot.forEach((deliveryDoc) => {
      alldeliveryDetails.push({
        // deliveryId: deliveryDoc.id,
        ...deliveryDoc.data()
      })
    })
    // console.log(alldeliveryDetails)

    return { deliverys: alldeliveryDetails, status: 200 }
  } catch (e) {
    console.log(e)
  }
}


// export const getDeliveryUsingDates = async (startDate, endDate) => {
//   try {
//     const collectionRef = collection(db, 'delivery');
//     // Query Firestore documents where the 'date' field falls within the specified range
//     const deliveryQuery = query(
//       collectionRef,
//       where('date', '>=', startDate),  // Start date filter
//       where('date', '<=', endDate)     // End date filter
//     );
//     const querySnapshot = await getDocs(deliveryQuery);
//     const delivery = querySnapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data()
//     }));
//     return { delivery, status: 200 };
//   } catch (err) {
//     console.error('Error fetching documents: ', err);
//     return { status: 500, message: err.message };
//   }
// }