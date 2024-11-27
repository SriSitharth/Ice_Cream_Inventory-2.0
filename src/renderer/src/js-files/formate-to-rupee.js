export const formatToRupee = (number,isDisableRs) => {
    if(number === 0){
        return '0.00'
    }
    let roundNumber = Math.round(number)
    // Convert the number to a string
    let numStr = roundNumber.toString();
    
    // Split the number into integer and decimal parts (if any)
    let [integerPart, decimalPart] = numStr.split('.');

    // Reverse the integer part for easier processing
    let reversedInteger = integerPart.split('').reverse().join('');

    // Add commas every 2 digits after the first 3 digits
    let withCommas = reversedInteger.replace(/(\d{3})(?=\d)/g, '$1,').replace(/(\d{2})(?=\d{3},)/g, '$1,');

    // Reverse it back to the original order
    let formattedNumber = withCommas.split('').reverse().join('');

    // If there's a decimal part, append it
    if (decimalPart) {
        formattedNumber += '.' + decimalPart;
    }
    // Add the rupee symbol prefix
    if(isDisableRs){
        return formattedNumber;
    }
    else{
        return `₹ ${formattedNumber}`;
    }   
}