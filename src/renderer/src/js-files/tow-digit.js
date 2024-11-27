export const toDigit = (num) => {
    // Check if the number is an integer
    if (Number.isInteger(num)) {
      return num; // Return the number as it is if it's an integer
    } 
    else if ( num === undefined || num === null){
        return "-"
    }
    else {
      // Return the number rounded to 2 decimal places if it's not an integer
      return num.toFixed(2);
    }
  }
  
  