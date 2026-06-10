import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, CheckCircle2, Package, Tag, Filter, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { StoreProduct } from '../types';
import { MOCK_STORE_PRODUCTS } from '../dataStoreMock';

interface StoreAdminPanelProps {
  storeProducts: StoreProduct[];
  onUpdateStoreProducts: (products: StoreProduct[]) => void;
}

export default function StoreAdminPanel({ storeProducts, onUpdateStoreProducts }: StoreAdminPanelProps) {
  const { lang, dir, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const sessionUser = (() => {
    try {
      const saved = localStorage.getItem('elkholy_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  
  const defaultProduct: StoreProduct = {
    id: `PRD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    category: 'Parts',
    price: 0,
    originalPrice: 0,
    discount: 0,
    discountType: 'percentage',
    image: 'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=400&q=80',
    stockCount: 10,
    soldCount: 0,
    brand: '',
    isOffer: false,
    offerLabel: '',
    offerLabelAr: '',
    isHidden: false,
    galleryUrls: [],
    specs: '',
    specsAr: ''
  };

  const [editingItem, setEditingItem] = useState<StoreProduct | null>(null);

  const getCalculatedPrice = (orig: number, disc: number, type: 'percentage' | 'fixed') => {
    if (!orig) return 0;
    if (!disc || disc <= 0) return orig;
    if (type === 'percentage') {
      return Math.max(0, Math.round(orig * (1 - disc / 100)));
    } else {
      return Math.max(0, orig - disc);
    }
  };
  
  const handleAddNew = () => {
    if (sessionUser?.role === 'Staff') {
      alert(lang === 'ar' ? 'غير مصرح لـ طاقم المعرض بإضافة منتجات' : 'Staff members are not authorized to add products.');
      return;
    }
    setEditingItem({ ...defaultProduct, id: `PRD-${Math.random().toString(36).substring(2, 8).toUpperCase()}` });
  };
  
  const handleSaveItem = () => {
    if (sessionUser?.role === 'Staff') {
      alert(lang === 'ar' ? 'غير مصرح لـ طاقم المعرض بتعديل منتجات' : 'Staff members are not authorized to edit products.');
      return;
    }
    if (editingItem) {
      // Calculate final price automatically if a discount is active
      let finalPrice = editingItem.price;
      if (editingItem.originalPrice && editingItem.discount && editingItem.discount > 0) {
        finalPrice = getCalculatedPrice(editingItem.originalPrice, editingItem.discount, editingItem.discountType || 'percentage');
      }
      
      const itemToSave = {
        ...editingItem,
        price: finalPrice
      };

      if (storeProducts.find(p => p.id === itemToSave.id)) {
        onUpdateStoreProducts(storeProducts.map(p => p.id === itemToSave.id ? itemToSave : p));
      } else {
        onUpdateStoreProducts([...storeProducts, itemToSave]);
      }
      setEditingItem(null);
    }
  };
  
  const handleRemoveItem = (id: string) => {
    if (sessionUser?.role !== 'Admin') {
      alert(lang === 'ar' ? 'غير مسموح بحذف المنتجات إلا للمشرفين الرئيسيين.' : 'Only master administrators are allowed to delete products.');
      return;
    }
    if (confirm('Are you sure you want to delete this product?')) {
      onUpdateStoreProducts(storeProducts.filter((p) => p.id !== id));
    }
  };

  const filteredProducts = storeProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.nameAr && p.nameAr.includes(searchQuery)) || p.id.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6" dir={dir}>
       
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-[#070A11]/60 p-5 rounded-2xl border border-white/5 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Package className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-bold font-sans text-white uppercase tracking-widest text-left">
            {lang === 'ar' ? 'إدارة المتجر الإلكتروني' : 'Store Management'}
          </h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input 
            type="text"
            placeholder={lang === 'ar' ? "بحث..." : "Search Products..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-primary outline-none"
          />
          {sessionUser?.role !== 'Staff' && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer shadow-lg shadow-green-500/20"
            >
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة منتج' : 'ADD PRODUCT'}
            </button>
          )}
        </div>
      </div>

      {editingItem && (
        <div className="p-6 bg-[#0F172A] border border-white/10 rounded-2xl space-y-4">
           <h3 className="text-white font-bold font-sans uppercase mb-4 pb-2 border-b border-white/10">
             {storeProducts.find(p => p.id === editingItem.id) ? 'Edit Product' : 'Add New Product'}
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1 text-left">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'اسم المنتج (انجليزي)' : 'En Name'}</label>
               <input 
                 value={editingItem.name}
                 onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                 className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" 
                 placeholder="Leather Jacket"
               />
             </div>
             
             <div className={`space-y-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'اسم المنتج (العربية)' : 'Ar Name'}</label>
               <input 
                 value={editingItem.nameAr}
                 onChange={e => setEditingItem({...editingItem, nameAr: e.target.value})}
                 className={`w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-sans ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                 placeholder="جاكيت جلد"
                 dir={lang === 'ar' ? "rtl" : "ltr"}
               />
             </div>
             
             <div className="space-y-1 text-left">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'العلامة التجارية' : 'Brand'}</label>
               <input 
                 value={editingItem.brand}
                 onChange={e => setEditingItem({...editingItem, brand: e.target.value})}
                 className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" 
                 placeholder="Alpinestars"
               />
             </div>
             
             <div className="space-y-1 text-left">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'التصنيف' : 'Category'}</label>
               <select 
                 value={editingItem.category}
                 onChange={e => setEditingItem({...editingItem, category: e.target.value as any})}
                 className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
               >
                 <option value="Oils">{lang === 'ar' ? 'زيوت ومحروقات' : 'Oils & Lubricants'}</option>
                 <option value="Safety">{lang === 'ar' ? 'معدات أمان' : 'Safety Equipment'}</option>
                 <option value="Smart">{lang === 'ar' ? 'اكسسوارات ذكية' : 'Smart Accessories'}</option>
                 <option value="Parts">{lang === 'ar' ? 'قطع غيار' : 'Spare Parts'}</option>
                 <option value="Lifestyle">{lang === 'ar' ? 'منتجات لايف ستايل' : 'Lifestyle Products'}</option>
               </select>
             </div>
             
             <div className="space-y-1 text-left">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'السعر الحالي (ج.م)' : 'Current Price (EGP)'}</label>
               <input 
                 type="number"
                 value={editingItem.price === 0 ? '' : editingItem.price}
                 placeholder="0"
                 onChange={e => setEditingItem({...editingItem, price: e.target.value === '' ? 0 : Number(e.target.value)})}
                 className="w-full bg-[#0B0F1A] border border-brand-accent/50 rounded-lg px-3 py-2 text-sm text-white font-mono" 
               />
             </div>
             
             <div className="space-y-1 text-left">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'السعر الأصلي (اختياري)' : 'Original Price (EGP - Optional)'}</label>
               <input 
                 type="number"
                 value={editingItem.originalPrice === 0 || !editingItem.originalPrice ? '' : editingItem.originalPrice}
                 placeholder="0"
                 onChange={e => {
                   const orig = e.target.value === '' ? 0 : Number(e.target.value);
                   const disc = editingItem.discount || 0;
                   const type = editingItem.discountType || 'percentage';
                   const newPrice = getCalculatedPrice(orig, disc, type);
                   setEditingItem({...editingItem, originalPrice: orig, price: newPrice});
                 }}
                 className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono" 
               />
             </div>
             
             <div className="space-y-1 text-left md:col-span-2">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'رابط الصورة' : 'Image URL'}</label>
               <input 
                 value={editingItem.image}
                 onChange={e => setEditingItem({...editingItem, image: e.target.value})}
                 className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400 font-mono" 
                 placeholder="https://..."
               />
             </div>
             
             <div className="space-y-1 text-left">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'الكمية المتاحة (المخزون)' : 'Stock Available'}</label>
               <input 
                 type="number"
                 value={editingItem.stockCount === 0 || !editingItem.stockCount ? '' : editingItem.stockCount}
                 placeholder="0"
                 onChange={e => setEditingItem({...editingItem, stockCount: e.target.value === '' ? 0 : Number(e.target.value)})}
                 className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono" 
               />
             </div>

             <div className="space-y-1 text-left flex items-end">
               <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded-xl border border-white/5 h-[38px] w-full">
                 <input 
                   type="checkbox"
                   checked={editingItem.isOffer}
                   onChange={e => setEditingItem({...editingItem, isOffer: e.target.checked})}
                   className="rounded bg-[#0B0F1A] border-white/20 text-brand-primary"
                 />
                 <span className="text-xs uppercase text-gray-300 font-bold tracking-widest">{lang === 'ar' ? 'تفعيل مفتاح شارة العرض/الخصم' : 'Active Offer/Sale Badge'}</span>
                </label>
              </div>

              {/* Discount selection fields */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'نوع الخصم' : 'Discount Type'}</label>
                <select 
                  value={editingItem.discountType || 'percentage'}
                  onChange={e => {
                    const type = e.target.value as 'percentage' | 'fixed';
                    const orig = editingItem.originalPrice || 0;
                    const disc = editingItem.discount || 0;
                    const newPrice = getCalculatedPrice(orig, disc, type);
                    setEditingItem({...editingItem, discountType: type, price: newPrice});
                  }}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
                >
                  <option value="percentage">{lang === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
                  <option value="fixed">{lang === 'ar' ? 'مبلغ ثابت (ج.م)' : 'Fixed Amount (EGP)'}</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'قيمة الخصم' : 'Discount Value'}</label>
                <input 
                  type="number"
                  value={editingItem.discount === 0 || !editingItem.discount ? '' : editingItem.discount}
                 placeholder="0"
                  onChange={e => {
                    const disc = e.target.value === '' ? 0 : Number(e.target.value);
                    const orig = editingItem.originalPrice || 0;
                    const type = editingItem.discountType || 'percentage';
                    const newPrice = getCalculatedPrice(orig, disc, type);
                    setEditingItem({...editingItem, discount: disc, price: newPrice});
                  }}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono" 
                />
              </div>

              {/* Description fields */}
              <div className="space-y-1 text-left md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'الوصف (بالإنجليزية)' : 'Description (En)'}</label>
                <textarea 
                  rows={3}
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" 
                  placeholder="Enter English description..."
                />
              </div>

              <div className={`space-y-1 md:col-span-2 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'الوصف (بالعربية)' : 'Description (Ar)'}</label>
                <textarea 
                  rows={3}
                  value={editingItem.descriptionAr || ''}
                  onChange={e => setEditingItem({...editingItem, descriptionAr: e.target.value})}
                  className={`w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-sans ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                  placeholder="أدخل الوصف بالعربية..."
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Specs fields */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'المواصفات (بالإنجليزية)' : 'Specs (En)'}</label>
                <input 
                  value={editingItem.specs || ''}
                  onChange={e => setEditingItem({...editingItem, specs: e.target.value})}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" 
                  placeholder="Material: High Grade | Weight: 1.5kg"
                />
              </div>

              <div className={`space-y-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{lang === 'ar' ? 'المواصفات (بالعربية)' : 'Specs (Ar)'}</label>
                <input 
                  value={editingItem.specsAr || ''}
                  onChange={e => setEditingItem({...editingItem, specsAr: e.target.value})}
                  className={`w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-sans ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                  placeholder="المواصفات بالعربية..."
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
            
            <div className="mt-2 text-xs text-brand-accent/80 font-mono text-center">
              * Note: Saving a product automatically calculates and stores the final price set below if original price + discount is used.
            </div>
           
           <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
             <button
               onClick={() => setEditingItem(null)}
               className="px-5 py-2 font-mono text-xs uppercase tracking-widest text-gray-400 hover:text-white cursor-pointer"
             >
               Cancel
             </button>
             <button
               onClick={handleSaveItem}
               className="px-6 py-2 bg-gradient-to-r from-brand-primary to-brand-accent text-[#0B0F1A] font-bold font-mono text-xs uppercase tracking-widest rounded-xl hover:brightness-110 cursor-pointer shadow-lg shadow-brand-primary/20"
             >
               Save Product
             </button>
           </div>
        </div>
      )}

      {/* Product List Grid */}
      <div className="space-y-2">
        {filteredProducts.map((p) => (
          <div key={p.id} className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors relative group">
             <img src={p.image} className="w-16 h-16 rounded-xl object-contain bg-[#070A11] p-1" />
             <div className="flex-1 min-w-0 md:text-left text-center">
               <div className="flex items-center gap-2 justify-center sm:justify-start">
                 <span className="text-[10px] font-mono text-gray-500 bg-black tracking-widest px-2 py-0.5 rounded uppercase">{p.id}</span>
                 {p.isOffer && <span className="bg-red-500 text-white text-[9px] px-1 rounded font-bold uppercase tracking-widest">OFFER</span>}
               </div>
               <h4 className="text-white font-bold font-sans mt-0.5 truncate">{lang === 'ar' ? p.nameAr : p.name}</h4>
               <p className="text-[10px] text-brand-accent tracking-widest uppercase mt-0.5 font-mono">{p.brand} | {p.category}</p>
             </div>
             
             <div className="text-right">
               <div className="text-white font-bold font-mono">{p.price.toLocaleString()} EGP</div>
               <div className="text-xs text-gray-500 font-mono tracking-widest uppercase">Stock: {p.stockCount}</div>
             </div>
             
             <div className="flex gap-2">
               {sessionUser?.role !== 'Staff' && (
                 <button onClick={() => setEditingItem(p)} className="p-2 border border-white/10 hover:border-brand-primary hover:text-brand-primary rounded-xl transition-all cursor-pointer bg-[#0B0F1A]" title="Edit product">
                   <Edit2 className="w-4 h-4" />
                 </button>
               )}
               {sessionUser?.role === 'Admin' && (
                 <button onClick={() => handleRemoveItem(p.id)} className="p-2 border border-white/10 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer bg-[#0B0F1A]" title="Delete product">
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
             </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="p-10 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
             <Package className="w-8 h-8 text-gray-600 mx-auto mb-3" />
             <p className="text-gray-500 font-mono text-xs tracking-widest uppercase">No products available</p>
          </div>
        )}
      </div>

    </div>
  );
}
