// Ensure this file exports the function
// Ensure this file exports the function
export const latestFirstSort = async (data) => {
  let sorting = data.sort((a, b) => {
    let parseDate = (dateStr) => {
      let [datePart, timePart] = dateStr.split(' ');
      let [day, month, year] = datePart.split('/');
      let [hour, minute, second] = timePart.split(':');

      // Create the date object with correct format for month/day/year
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    };

    let dateA = parseDate(a.createddate);
    let dateB = parseDate(b.createddate);

    // Sort in descending order (latest first)
    return dateB - dateA;
  });

  return sorting;
};

export const oldestFirstSort = async (data) => {
  let sorting = data.sort((a, b) => {
    let parseDate = (dateStr) => {
      let [datePart, timePart] = dateStr.split(' ');
      let [day, month, year] = datePart.split('/');
      let [hour, minute, second] = timePart.split(':');

      // Create the date object with correct format for month/day/year
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    };

    let dateA = parseDate(a.createddate);
    let dateB = parseDate(b.createddate);

    // Sort in descending order (latest first)
    return dateA - dateB;
  });

  return sorting;
};