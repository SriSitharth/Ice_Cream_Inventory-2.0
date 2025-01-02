export const latestFirstSort = async (data) => {
  let sorting = data.sort((a, b) => {

    let dateA = new Date(a.createdDate);
    let dateB = new Date(b.createdDate);

    // Sort in descending order (latest first)
    return dateB - dateA;
  });

  return sorting;
};

export const oldestFirstSort = async (data) => {
  let sorting = data.sort((a, b) => {

    let dateA = new Date(a.createdDate);
    let dateB = new Date(b.createdDate);

    // Sort in descending order (latest first)
    return dateA - dateB;
  });

  return sorting;
};