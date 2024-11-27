// export const customRound = (num) => {
//     const decimalPart = num - Math.floor(num); // Get the decimal part of the number
    
//     if (decimalPart === 0) {
//       return num; // The number is already an integer
//     } else if (decimalPart <= 0.4) {
//       return Math.floor(num); // Round down
//     } else {
//       return Math.ceil(num); // Round up
//     }
//   };
  
export const customRound = (num) => {
  return Math.round(num);
};
