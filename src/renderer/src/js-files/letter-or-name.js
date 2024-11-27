export const formatName =(name) => {
    return name
      .trim() // Remove leading and trailing spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces between words with a single space
      .toLowerCase() // Convert the entire string to lowercase
      .split(' ') // Split the string into an array of words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
      .join(' '); // Join the words back into a single string with a space
  }
  