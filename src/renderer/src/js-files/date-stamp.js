export const  DatestampJs =() => {
    const date = new Date();
    // Extract date components
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();

    // Format date
    const formattedDate = `${day}/${month}/${year}`;

    // Combine date and time
    return `${formattedDate}`;
}

