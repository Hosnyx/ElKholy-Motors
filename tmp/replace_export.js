const fs = require('fs');
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

let start = -1;
let end = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i] === "  const captureLivePreview = async (): Promise<HTMLCanvasElement> => {") {
    start = i;
  }
  if (lines[i] === "  const handleSendInvoice = (method: 'whatsapp' | 'email' | 'both') => {") {
    end = i;
    break;
  }
}

if (start !== -1 && end !== -1) {
  console.log(`Replacing lines ${start} to ${end-1}`);
  const replacement = `
  const exportCanvasLogic = async (isPrint = false): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 794;
        canvas.height = 1123;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No Context');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(lang === 'ar' ? 'الخولي موتورز' : 'ElKholy Motors', canvas.width - 40, 60);

        ctx.font = '20px Arial, sans-serif';
        ctx.fillStyle = '#0ea5e9';
        ctx.fillText(lang === 'ar' ? 'فاتورة مبيعات' : 'Sales Invoice', canvas.width - 40, 95);

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText((lang === 'ar' ? 'رقم الفاتورة: ' : 'Invoice #: ') + (editInvoiceNumber || selectedOperation?.id || 'Pre'), canvas.width - 40, 160);
        ctx.fillText((lang === 'ar' ? 'اسم العميل: ' : 'Customer: ') + (editCustomerName || '-'), canvas.width - 40, 200);
        ctx.fillText((lang === 'ar' ? 'رقم الهاتف: ' : 'Phone: ') + (editCustomerPhone || '-'), canvas.width - 40, 240);

        let yPos = 320;
        const associatedBike = motorcycles.find(m => m.id === selectedOperation?.motorcycleId);
        
        if (associatedBike) {
           ctx.fillStyle = '#0f172a';
           ctx.font = 'bold 22px Arial, sans-serif';
           ctx.fillText('- ' + (associatedBike.name || '-'), canvas.width - 40, yPos);
           ctx.textAlign = 'left';
           ctx.fillText((associatedBike.price || 0).toLocaleString() + ' EGP', 40, yPos);
           ctx.textAlign = 'right';
           yPos += 40;
        }

        if (editSelectedProducts && editSelectedProducts.length > 0) {
          yPos += 20;
          editSelectedProducts.forEach((p) => {
             ctx.fillStyle = '#1e293b';
             ctx.font = 'bold 20px Arial, sans-serif';
             ctx.fillText('- ' + (p.product?.name || 'Item') + ' (x' + p.quantity + ')', canvas.width - 40, yPos);
             ctx.textAlign = 'left';
             ctx.fillText(((p.product?.price || 0) * p.quantity).toLocaleString() + ' EGP', 40, yPos);
             ctx.textAlign = 'right';
             yPos += 40;
          });
        }

        yPos += 40;
        ctx.beginPath();
        ctx.moveTo(40, yPos);
        ctx.lineTo(canvas.width - 40, yPos);
        ctx.stroke();

        yPos += 50;
        ctx.fillStyle = '#334155';
        ctx.fillText((lang === 'ar' ? 'الإجمالي الفرعي: ' : 'Subtotal: ') + editTotalCost.toLocaleString() + ' EGP', canvas.width - 40, yPos);
        yPos += 40;
        
        if (editDiscountAmount > 0) {
           ctx.fillStyle = '#ef4444';
           ctx.fillText((lang === 'ar' ? 'الخصم: -' : 'Discount: -') + editDiscountAmount.toLocaleString() + ' EGP', canvas.width - 40, yPos);
           yPos += 40;
        }

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillText((lang === 'ar' ? 'الإجمالي النهائي: ' : 'Total: ') + editFinalPrice.toLocaleString() + ' EGP', canvas.width - 40, yPos);

        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch(err) {
        reject(err);
      }
    });
  };

  const handlePrintInvoice = async () => {
    try {
      fireToast(lang === 'ar' ? '⏳ جاري تجهيز الطباعة المبسطة...' : '⏳ Preparing print view...', 'info');
      const pngData = await exportCanvasLogic(true);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        fireToast(lang === 'ar' ? '⚠️ يرجى السماح بالنوافذ المنبثقة لإجراء الطباعة' : '⚠️ Please allow popups to print', 'warning');
        return;
      }
      printWindow.document.write(\`
        <html><head><title>Print Invoice</title>
        <style>body{margin:0;display:flex;justify-content:center;} img{max-width:100%;max-height:100vh;}</style>
        </head><body><img src="\${pngData}" onload="window.print(); setTimeout(()=>window.close(),500)" /></body></html>
      \`);
      printWindow.document.close();
    } catch(err) {
      fireToast('Error: ' + err.message, 'error');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      fireToast(lang === 'ar' ? '⏳ جاري إنتاج ملف PDF مباشرة...' : '⏳ Creating raw PDF...', 'info');
      
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const imgData = await exportCanvasLogic(false);
      
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(\`Invoice_\${editInvoiceNumber || selectedOperation?.id || 'Doc'}.pdf\`);
      fireToast(lang === 'ar' ? '✅ تم تحميل PDF!' : '✅ PDF Downloaded!', 'success');
    } catch(err) {
      fireToast('Error: ' + err.message, 'error');
    }
  };

  const handleDownloadPNG = async () => {
    try {
      fireToast(lang === 'ar' ? '⏳ جاري استخراج صورة PNG...' : '⏳ Extracting export PNG...', 'info');
      const imgData = await exportCanvasLogic(false);
      const link = document.createElement('a');
      link.download = \`Invoice_\${editInvoiceNumber || selectedOperation?.id || 'Doc'}.png\`;
      link.href = imgData;
      link.click();
      fireToast(lang === 'ar' ? '✅ تم تحميل PNG!' : '✅ PNG Downloaded!', 'success');
    } catch(err) {
      fireToast('Error: ' + err.message, 'error');
    }
  };

  const handleTriggerTestExport = async () => {
    try {
      const imgData = await exportCanvasLogic(false);
      setTestExportImgUrl(imgData);
    } catch(err) {}
  };
`;
  lines.splice(start, end - start, replacement);
  fs.writeFileSync('src/components/AdminPanel.tsx', lines.join('\n'));
} else {
  console.log("Not found.");
}
