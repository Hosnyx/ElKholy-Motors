const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// 1. Add imports
content = content.replace(
  "import { jsPDF } from 'jspdf';",
  "import { jsPDF } from 'jspdf';\nimport { useReactToPrint } from 'react-to-print';\nimport InvoicePrintView from './InvoicePrintView';"
);

// 2. Add useRef import (if not already there)
if (!content.includes('useRef')) {
  content = content.replace(
    "import React, { useState, useEffect, useMemo } from 'react';",
    "import React, { useState, useEffect, useMemo, useRef } from 'react';"
  );
}

const hooksStart = content.indexOf("const [sessionUser, setSessionUser]");

if (hooksStart !== -1) {
    content = content.slice(0, hooksStart) + `
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const handleReactToPrint = useReactToPrint({
    contentRef: invoicePrintRef,
    documentTitle: 'ElKholy_Invoice',
  });
` + content.slice(hooksStart);
    fs.writeFileSync('src/components/AdminPanel.tsx', content);
    console.log('AdminPanel ref and imports added');
} else {
    console.log('Could not find hooks start');
}
