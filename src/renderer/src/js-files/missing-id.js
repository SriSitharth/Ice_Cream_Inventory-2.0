export const  getMissingIds =(oldArray, newArray) => {
    // Get IDs of items from the oldArray (olddata.item) that are not present in the newArray (material)
    const missingIds = oldArray
        .filter(oldItem => !newArray.some(newItem => newItem.id === oldItem.id))
        .map(item => item.id);
    
    return missingIds;
}