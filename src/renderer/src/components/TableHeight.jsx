import { useState, useEffect } from 'react';

export default function TableHeight (initialOffset = 200, dynamicOffset = 460){
  
    const [quotationHeight, setQuotationHeight] = useState(window.innerHeight - initialOffset);

  useEffect(() => {
    // Function to calculate and update table height based on dynamic offsets
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - dynamicOffset;
      setQuotationHeight(newHeight);
    };

    // Set initial height on mount
    updateTableHeight();

    // Update height on resize and fullscreen change
    window.addEventListener('resize', updateTableHeight);
    document.addEventListener('fullscreenchange', updateTableHeight);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('resize', updateTableHeight);
      document.removeEventListener('fullscreenchange', updateTableHeight);
    };
  }, [dynamicOffset]); // Depend on the dynamic offset

  return quotationHeight;
};

