export const  areArraysEqual =(arr1, arr2) => {
    if (arr1.length !== arr2.length) {
        return false; // Arrays are of different lengths, so not equal
    }

    return arr1.every((obj1, index) => {
        const obj2 = arr2[index];

        // Compare each property of both objects
        return Object.keys(obj1).every(key => obj1[key] === obj2[key]);
    });
}


export function compareArrays(a, b) {
    // Check if the arrays have the same length
    if (a.length !== b.length) {
      return false;
    }
    
    // Compare each string in the arrays
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;  // If any string is different, return false
      }
    }
  
    return true;  // If all strings are the same, return true
  }