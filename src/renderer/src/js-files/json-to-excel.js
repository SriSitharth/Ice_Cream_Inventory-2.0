import * as XLSX from 'xlsx';

const jsonToExcel = (jsonData, fileName) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert JSON data to a worksheet
  const ws = XLSX.utils.json_to_sheet(jsonData);

  // Append the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // Generate a binary string of the workbook
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

  // Convert binary string to an array buffer
  const s2ab = s => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };

  // Create a blob from the array buffer
  const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });

  // Create a link element
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.xlsx`;

  // Append the link to the body and trigger a click
  document.body.appendChild(link);
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);
};

export default jsonToExcel;
