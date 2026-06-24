import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface InvoicePrintViewProps {
  operation: any;
  motorcycles: any[];
  editInvoiceNumber: string;
  editCustomerId: string;
  editCustomerName: string;
  editCustomerPhone: string;
  editCustomerGov: string;
  editCustomerAddress: string;
  editOrderDate: string;
  editOrderTime: string;
  editSelectedProducts: any[];
  editDiscountAmount: number;
  editTaxRate: number;
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  standalone?: boolean;
}

const InvoicePrintView = forwardRef<HTMLDivElement, InvoicePrintViewProps>(({
  operation,
  motorcycles,
  editInvoiceNumber,
  editCustomerId,
  editCustomerName,
  editCustomerPhone,
  editCustomerGov,
  editCustomerAddress,
  editOrderDate,
  editOrderTime,
  editSelectedProducts,
  editDiscountAmount,
  editTaxRate,
  lang,
  dir,
  standalone
}, ref) => {

  const associatedBike = motorcycles.find(m => m.id === operation.motorcycleId);
  const bikeCost = associatedBike ? parseFloat(String(associatedBike.price).replace(/[^0-9]/g, '')) || 0 : 0;
  const prodsCost = editSelectedProducts.reduce((sum, item) => sum + (parseFloat(String(item.product.price).replace(/[^0-9]/g, '')) || 0) * (item.quantity || 1), 0);
  const orderPriceTotal = bikeCost + prodsCost;
  const calculatedTax = (orderPriceTotal - editDiscountAmount) * editTaxRate / 100;
  const grandOrderFinalTotal = (orderPriceTotal - editDiscountAmount) + calculatedTax;

  const invoiceNum = editInvoiceNumber || '';

  return (
    <div className={standalone ? "w-full flex justify-center bg-[#0B101E] min-h-screen" : "hidden print:block"} dir={dir}>
      <div 
        id="invoice-print-root" 
        ref={ref}
        className="w-[210mm] bg-[#0B101E] text-white p-8 overflow-hidden relative shadow-2xl font-sans"
        style={{ color: '#E2E8F0' }}
      >
        {/* TOP HEADER */}
        <div className="flex justify-between items-start pt-4 pb-6 border-b border-white/5">
          <div className="text-[10px] sm:text-xs text-gray-400 font-mono space-y-1">
             <div dir="ltr" className="flex items-center gap-2 justify-end mb-1">
               <span>+201021464319</span>
               <span className="text-gray-500 font-sans" dir="rtl">:هاتف</span>
             </div>
             <div dir="ltr" className="flex items-center gap-2 justify-end mb-1">
               <span className="text-[#22D3EE] font-bold">+201021464319</span>
               <span className="text-[#22D3EE]/70 font-sans" dir="rtl">:واتساب</span>
             </div>
             <div dir="rtl" className="flex items-center gap-2 text-gray-500">
               <span>العنوان:</span>
               <span>مصر، القاهرة، شبرا الخيمة</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right">
                <h1 className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 font-sans drop-shadow-md">ELKHOLY MOTORS</h1>
                <p className="text-[9px] text-gray-500 tracking-widest uppercase mt-0.5 font-mono">Premium Fleet & Accessories</p>
             </div>
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.15)] flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-400/10 backdrop-blur-sm"></div>
                {/* SVG Icon similar to image */}
                <svg className="w-6 h-6 text-cyan-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
             </div>
          </div>
        </div>

        {/* 5 INFO CARDS ROW */}
        <div className="mt-8 grid grid-cols-5 gap-3">
          {/* Card 1 */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-inner">
             <div className="text-[9px] text-gray-500 mb-1.5 font-sans" dir="rtl">رقم الفاتورة:</div>
             <div className="font-mono text-xs font-bold text-yellow-500 truncate w-full">{invoiceNum || 'N/A'}</div>
          </div>
          {/* Card 2 */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-inner">
             <div className="text-[9px] text-gray-500 mb-1.5 font-sans" dir="rtl">رمز المعاملة:</div>
             <div className="font-mono text-[10px] font-bold text-cyan-500 truncate w-full">STORE-OR#</div>
          </div>
          {/* Card 3 */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-inner">
             <div className="text-[9px] text-gray-500 mb-1.5 font-sans" dir="rtl">معرف العميل:</div>
             <div className="font-mono text-[10px] font-bold text-emerald-500 truncate w-full">{editCustomerId || 'N/A'}</div>
          </div>
          {/* Card 4 */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-inner">
             <div className="text-[9px] text-gray-500 mb-1.5 font-sans" dir="rtl">تاريخ التحرير:</div>
             <div className="font-mono text-xs font-bold text-white truncate w-full">{editOrderDate || operation.createdAt}</div>
          </div>
          {/* Card 5 */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-inner">
             <div className="text-[9px] text-gray-500 mb-1.5 font-sans" dir="rtl">وقت الإصدار:</div>
             <div className="font-mono text-xs font-bold text-white truncate w-full">{editOrderTime || '12:00'}</div>
          </div>
        </div>

        {/* CUSTOMER DETAILS DUAL PANE */}
        <div className="mt-6 bg-[#111827]/50 border border-white/5 rounded-xl p-5 shadow-inner">
           <h3 className="text-xs font-bold text-purple-400 mb-4 border-b border-white/5 pb-2 flex items-center justify-end gap-2 font-sans" dir="rtl">
             <span>👥 بيانات العميل الحصري</span>
           </h3>
           <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-right font-sans" dir="rtl">
              <div>
                <span className="text-[10px] text-gray-500 block mb-1">اسم العميل الكلي:</span>
                <div className="font-bold text-sm text-white">{editCustomerName || 'غير مسجل'}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block mb-1">المحافظة:</span>
                <div className="font-bold text-white text-sm">{editCustomerGov || 'لم يحدد'}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block mb-1">رقم الهاتف المعتمد:</span>
                <div className="font-mono text-sm font-bold text-white" dir="ltr">{editCustomerPhone || 'N/A'}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block mb-1">العنوان الجغرافي:</span>
                <div className="font-bold text-white text-sm">{editCustomerAddress || 'لم يحدد'}</div>
              </div>
           </div>
        </div>

        {/* MOTORCYCLE PURCHASE */}
        <div className="mt-6 bg-[#111827]/50 border border-indigo-500/20 rounded-xl p-5 shadow-inner relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
           <h3 className="text-xs font-bold text-indigo-400 mb-3 border-b border-white/5 pb-2 flex items-center justify-end gap-2 font-sans" dir="rtl">
             <span>🏍️ دراجة المعرض المشتراة</span>
           </h3>
           <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
             <div className="font-mono text-sm font-bold text-indigo-300">
               EGP {bikeCost.toLocaleString()}
             </div>
             <div className="flex items-center gap-3">
               <div className="text-right">
                 <div className="font-bold text-white font-sans text-sm">{associatedBike ? associatedBike.name : 'لا يوجد دراجة'}</div>
                 <div className="text-[10px] text-gray-500 font-mono mt-0.5">M-ID: {operation.motorcycleId?.substring(0,8)}</div>
               </div>
               {associatedBike?.image && (
                 <img crossOrigin="anonymous" src={associatedBike.image} alt="Motorcycle" className="w-16 h-12 object-cover rounded shadow-md border border-white/10" />
               )}
             </div>
           </div>
        </div>

        {/* ACCESSORIES (if any) */}
        {editSelectedProducts.length > 0 && (
          <div className="mt-6 bg-[#111827]/50 border border-emerald-500/20 rounded-xl p-5 shadow-inner">
             <h3 className="text-xs font-bold text-emerald-400 mb-3 border-b border-white/5 pb-2 flex items-center justify-end gap-2 font-sans" dir="rtl">
               <span>📦 الملحقات والإكسسوارات المشتراة</span>
             </h3>
             <div className="space-y-2">
                {editSelectedProducts.map((op, i) => {
                   const unitPrice = parseFloat(String(op.product.price).replace(/[^0-9]/g, '')) || 0;
                   const total = unitPrice * (op.quantity || 1);
                   return (
                     <div key={i} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                        <div className="font-mono text-xs font-bold text-emerald-300">
                          EGP {total.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-gray-500 mx-2">×{op.quantity || 1}</span>
                            <span className="font-bold text-white text-xs">{lang === 'ar' ? op.product.nameAr || op.product.name : op.product.name}</span>
                          </div>
                          {op.product.image && (
                            <img crossOrigin="anonymous" src={op.product.image} className="w-10 h-10 object-cover rounded shadow border border-white/10" alt="product" />
                          )}
                        </div>
                     </div>
                   )
                })}
             </div>
          </div>
        )}

        {/* FINANCIAL SUMMARY */}
        <div className="mt-8 border border-white/5 rounded-xl bg-black/40 p-5 shadow-inner font-sans text-sm">
           <div className="space-y-3">
             <div className="flex justify-between text-gray-400 items-center">
               <span className="font-mono font-bold">EGP {bikeCost.toLocaleString()}</span>
               <span dir="rtl">:سعر الدراجات النارية</span>
             </div>
             <div className="flex justify-between text-gray-400 items-center border-t border-white/5 pt-3">
               <span className="font-mono font-bold">EGP {prodsCost.toLocaleString()}</span>
               <span dir="rtl">:إجمالي الملحقات والإكسسوارات</span>
             </div>
             <div className="flex justify-between text-yellow-500 items-center border-t border-white/5 pt-3">
               <span className="font-mono font-bold">EGP {editDiscountAmount.toLocaleString()}-</span>
               <span dir="rtl">:الخصم الخاص الممنوح للعميل</span>
             </div>
             <div className="flex justify-between text-gray-400 items-center border-t border-white/5 pt-3">
               <span className="font-mono font-bold">EGP {calculatedTax.toLocaleString()}+</span>
               <span dir="rtl">ضريبة القيمة المضافة الإجمالية ({editTaxRate}%):</span>
             </div>
           </div>
           
           <div className="flex justify-between items-center mt-5 pt-4 border-t border-dashed border-white/20">
             <span className="font-mono text-xl font-bold text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-lg border border-emerald-400/20">EGP {grandOrderFinalTotal.toLocaleString()}</span>
             <span className="text-base font-bold text-white tracking-widest pl-4" dir="rtl">:الصافي النهائي للمطالبة المالية</span>
           </div>
        </div>

        {/* SECURITY & QR CODES */}
        <div className="mt-8 bg-[#111827]/80 rounded-xl p-5 border border-yellow-500/10">
           <h4 className="text-center text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-4 font-mono flex items-center justify-center gap-2">
             <span>SECURITY AUTHENTICATION SHIFT DECK & VERIFIABLE LOGS QR</span>
             <span className="text-xs">🔍</span>
           </h4>
           <div className="flex justify-center gap-6">
              <div className="border border-white/10 p-3 rounded-xl bg-black/60 shadow-lg flex flex-col items-center">
                 <QRCodeSVG value={`https://elkholy.com/products/${operation.id}`} size={64} bgColor="#ffffff" fgColor="#000000" className="rounded p-1 bg-white" />
                 <span className="text-[9px] text-gray-400 mt-2 font-sans">منتجات</span>
              </div>
              <div className="border border-white/10 p-3 rounded-xl bg-black/60 shadow-lg flex flex-col items-center">
                 <QRCodeSVG value={`https://elkholy.com/bike/${operation.motorcycleId}`} size={64} bgColor="#ffffff" fgColor="#000000" className="rounded p-1 bg-white" />
                 <span className="text-[9px] text-gray-400 mt-2 font-sans">دراجة</span>
              </div>
              <div className="border border-white/10 p-3 rounded-xl bg-black/60 shadow-lg flex flex-col items-center">
                 <QRCodeSVG value={`https://elkholy.com/customer/${editCustomerId}`} size={64} bgColor="#ffffff" fgColor="#000000" className="rounded p-1 bg-white" />
                 <span className="text-[9px] text-gray-400 mt-2 font-sans">عميل</span>
              </div>
              <div className="border border-white/10 p-3 rounded-xl bg-black/60 shadow-lg flex flex-col items-center">
                 <QRCodeSVG value={`https://elkholy.com/op/${operation.id}`} size={64} bgColor="#ffffff" fgColor="#000000" className="rounded p-1 bg-white" />
                 <span className="text-[9px] text-gray-400 mt-2 font-sans">عملية</span>
              </div>
           </div>
        </div>

        {/* SIGNATURES */}
        <div className="mt-12 flex justify-between px-10 pb-4">
           <div className="text-center font-sans">
             <div className="text-[10px] text-gray-400 mb-6 font-bold" dir="rtl">إقرار العميل المستلم</div>
             <div className="w-40 border-b border-dashed border-gray-600 mx-auto"></div>
           </div>
           <div className="text-center font-sans">
             <div className="text-[10px] text-gray-400 mb-6 font-bold" dir="rtl">توقيع وختم المعرض المرخص</div>
             <div className="w-40 border-b border-dashed border-gray-600 mx-auto"></div>
           </div>
        </div>

      </div>
    </div>
  );
});

InvoicePrintView.displayName = 'InvoicePrintView';

export default InvoicePrintView;
