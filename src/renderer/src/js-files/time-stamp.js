// export const  TimestampJs =() => {
//     const date = new Date();
//     // Extract date components
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
//     const year = date.getFullYear();

//     // Extract time components
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');

//     // Format time
//     const formattedTime = `${hours}.${minutes}`;

//     // Format date
//     const formattedDate = `${day}/${month}/${year}`;

//     // Combine date and time
//     return `${formattedDate},${formattedTime}`;
// }

// export const TimestampJs = () => {
//     const date = new Date();
  
//     // Extract date components
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
//     const year = date.getFullYear();
  
//     // Extract time components
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const seconds = date.getSeconds().toString().padStart(2, '0'); // Add seconds
  
//     // Format time (without seconds)
//     const formattedTime = `${hours}.${minutes}`;
  
//     // Format date
//     const formattedDate = `${day}/${month}/${year}`;
  
//     // Combine date, time, and seconds
//     return `${formattedDate},${formattedTime},${seconds}`;
//   };

  // standered date and time formate
  export const TimestampJs = () => {
    const date = new Date();
  
    // Extract date components
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
  
    // Extract time components
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
  
    // Format date as YYYY-MM-DD
    const formattedDate = `${day}/${month}/${year}`;
  
    // Format time as HH:mm:ss
    const formattedTime = `${hours}:${minutes}:${seconds}`;
  
    // Combine date and time
    return `${formattedDate} ${formattedTime}`;
};
