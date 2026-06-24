import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import InvoicePrintView from './InvoicePrintView';
import { Printer, FileText, ImageIcon, MessageCircle, Mail, AlertTriangle, X } from 'lucide-react';

export default function InvoiceLandingPage({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<any>(null);
  const [showPngNotice, setShowPngNotice] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const docRef = doc(db, 'bookings', invoiceId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const booking = { id: docSnap.id, ...docSnap.data() } as any;
          
          let motorcycles = [];
          if (booking.motorcycleId) {
             const bikeRef = doc(db, 'motorcycles', booking.motorcycleId);
             const bikeSnap = await getDoc(bikeRef);
             if (bikeSnap.exists()) {
                motorcycles.push({ id: bikeSnap.id, ...bikeSnap.data() });
             }
          }

          setPayload({
             operation: booking,
             motorcycles: motorcycles,
             editInvoiceNumber: booking.invoiceNumber || '',
             editCustomerId: booking.customerId || '',
             editCustomerName: booking.name || '',
             editCustomerPhone: booking.phone || '',
             editCustomerGov: booking.customerGov || '',
             editCustomerAddress: booking.customerAddress || '',
             editOrderDate: booking.date || booking.createdAt || '',
             editOrderTime: booking.orderTime || '',
             editSelectedProducts: booking.orderedProducts || [],
             editDiscountAmount: booking.discountAmount || 0,
             editTaxRate: booking.taxRate || 0,
             lang: 'ar',
             dir: 'rtl'
          });
        } else {
          setError('لم يتم العثور على الفاتورة (Invoice Not Found)');
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError('حدث خطأ أثناء الاتصال بقاعدة البيانات.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handleDownloadPNG = () => {
    setShowPngNotice(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsapp = () => {
    const url = window.location.href;
    const phone = payload?.editCustomerPhone ? payload.editCustomerPhone.replace(/\D/g, '') : '';
    const text = encodeURIComponent(`مرحباً،\n\nيمكنك عرض فاتورتك من الرابط التالي:\n${url}\n\nشكراً لتعاملكم مع ELKHOLY MOTORS`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const url = window.location.href;
    const body = encodeURIComponent(`مرحباً،\n\nيمكنك عرض فاتورتك من الرابط التالي:\n${url}\n\nشكراً لتعاملكم مع ELKHOLY MOTORS`);
    const subject = encodeURIComponent(`فاتورة جديدة من ELKHOLY MOTORS - ${payload?.editInvoiceNumber || invoiceId}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B101E] text-cyan-400 flex items-center justify-center font-mono">
        جارِ تحميل الفاتورة...
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="min-h-screen bg-[#0B101E] flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#111827] text-red-500 border border-red-500/20 p-8 rounded-xl shadow-xl font-sans text-center max-w-md">
           <h2 className="text-xl font-bold mb-3">يلاحظ</h2>
           <p className="text-sm text-gray-300 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B101E] flex flex-col items-center justify-start py-8 standalone-print-page">
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }
        @media print {
          body {
            background: #0B101E !important;
            margin: 0;
            padding: 0;
          }
          .standalone-print-page {
            background: #0B101E !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #invoice-print-root {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto;
            background: #0B101E !important;
            box-shadow: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
      
      {/* TOOLBAR */}
      <div className="no-print w-[210mm] max-w-full bg-[#111827] border border-white/10 rounded-xl p-4 mb-6 flex flex-wrap gap-3 justify-center items-center shadow-lg" dir="rtl">
         <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-750 hover:from-white hover:to-white text-gray-200 hover:text-black rounded-lg font-bold text-sm transition-all shadow-md">
           <Printer className="w-4 h-4" />
           <span>طباعة A4</span>
         </button>
         <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/20 to-red-500/10 hover:from-red-600/30 text-red-400 border border-red-500/20 rounded-lg font-bold text-sm transition-all shadow">
           <FileText className="w-4 h-4 text-red-500" />
           <span>حفظ PDF</span>
         </button>
         <button onClick={handleDownloadPNG} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#22D3EE]/20 to-[#22D3EE]/10 hover:from-[#22D3EE]/30 text-[#22D3EE] border border-cyan-500/20 rounded-lg font-bold text-sm transition-all shadow">
           <ImageIcon className="w-4 h-4 text-cyan-400" />
           <span>تحميل PNG</span>
         </button>
         <div className="w-[1px] h-8 bg-white/10 mx-2 hidden sm:block"></div>
         <button onClick={handleShareWhatsapp} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20 rounded-lg font-bold text-sm transition-all shadow">
           <MessageCircle className="w-4 h-4 text-green-500" />
           <span>مشاركة واتساب</span>
         </button>
         <button onClick={handleShareEmail} className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 rounded-lg font-bold text-sm transition-all shadow">
           <Mail className="w-4 h-4 text-blue-500" />
           <span>إرسال بريد</span>
         </button>
      </div>

      <div className="w-[210mm] max-w-full bg-[#0B101E] printable-container relative">
         <InvoicePrintView 
            {...payload}
            standalone={true}
         />
      </div>

      {/* Warning/Modal Notice for PNG export */}
      {showPngNotice && (
        <div className="no-print fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4 transition-all" dir="rtl">
           <div className="bg-[#111827] border border-cyan-500/25 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setShowPngNotice(false)} 
                className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors cursor-pointer animate-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 animate-bounce">
                    <AlertTriangle className="w-6 h-6" />
                 </div>
                 
                 <h3 className="text-lg font-bold text-white mb-2 font-sans">تصدير جودة مستندات عالية</h3>
                 
                 <p className="text-xs text-gray-300 leading-relaxed font-sans mb-5">
                    التقاط ملفات <strong className="text-cyan-400">PNG</strong> عبر المتصفح يتأثر بمحددات أبعاد الشاشة وصور الدراجات والـ QR الخارجية مما قد يقلل من جودة الطباعة ووضوحها.
                    <br/><br/>
                    للحصول على جودة خارقة، يرجى النقر على <strong className="text-red-400 font-bold">حفظ PDF</strong> أو <strong className="text-indigo-400 font-bold">طباعة A4</strong> المدمجة واختيار الوجهة كـ <strong>حفظ بتنسيق PDF</strong>. الفواتير والـ QR فيها ذات جودة متجهة (Vector) وغير مشوشة.
                 </p>

                 <div className="flex w-full gap-3">
                    <button 
                      onClick={() => {
                        setShowPngNotice(false);
                        handlePrint();
                      }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      متابعة لحفظ PDF
                    </button>
                    <button 
                      onClick={() => setShowPngNotice(false)}
                      className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold cursor-pointer transition-all border border-white/5"
                    >
                      إغلاق
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
