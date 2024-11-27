import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfigDate = {
  apiKey: "AIzaSyDIBNBTyma9AX6IzDMvGPAqw0lncMXoG0g",
  authDomain: "icecream-inventory-9b07a.firebaseapp.com",
  projectId: "icecream-inventory-9b07a",
  storageBucket: "icecream-inventory-9b07a.appspot.com",
  messagingSenderId: "821151819231",
  appId: "1:821151819231:web:729d20ef74aa71e2b8906a"
};

const dateApp = initializeApp(firebaseConfigDate, 'dateApp')
const dateAuth = getAuth(dateApp)
signInAnonymously(dateAuth).catch((error) => {
  console.error('Date Authentication error:', error)
})
const datedb = getFirestore(dateApp)

export const getDate = async () => {
  try {
    const collectionRef = collection(datedb, 'expiry')
    const querySnapshot = await getDocs(collectionRef)
    const expirydata = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    return { expirydata, status: 200 }
  } catch (err) {
    console.error('Error fetching documents: ', err)
    return { status: 500, message: err.message }
  }
}