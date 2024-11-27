// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

// export const generatPDF = async (elementRef, fileName) => {
//   const htmlElement = elementRef.current;
//   console.log(htmlElement);
  
//   if (htmlElement) {
//     const canvas = await html2canvas(htmlElement)
//         const data = await canvas.toDataURL('image/png')
//         const pdf = await new jsPDF()
//         const imgWidth = 210 // A4 page width in mm
//         const imgHeight = (canvas.height * imgWidth) / canvas.width
//         pdf.addImage(data, 'PNG', 0, 0, imgWidth, imgHeight)
//         pdf.save(fileName )
//   }
// };

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generatPDF = async (elementRef, fileName) => {
  const htmlElement = elementRef.current;

  if (htmlElement) {
    const canvas = await html2canvas(htmlElement, { scale: 2 }); // Increase scale for better quality
    const data = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    
    const imgWidth = canvas.width / 10; // Adjust the width scaling factor to maintain original size
    const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain the aspect ratio

    // Center the image on the PDF page
    const xOffset = (210 - imgWidth) / 2; // Calculate X offset to center the image on A4 width
    const yOffset = 10; // You can adjust this to vertically center or add margins

    pdf.addImage(data, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
    pdf.save(`${fileName}.pdf`);
  }
};
