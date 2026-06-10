/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, Phone, Mail, CheckCircle2, MessageSquare, ArrowRight, Bike, ShoppingBag, Check } from 'lucide-react';
import { CategorySlug, Motorcycle, AddOn, StoreProduct } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { MOTORCYCLES_DATA } from '../data';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface BookingModalProps {
  motorcycleId: string;
  motorcycleName: string;
  category: CategorySlug;
  price: string;
  serialCode?: string; // New field
  preSelectedAddOnIds?: string[];
  storeProducts?: StoreProduct[];
  onAddToCart?: (product: any, type?: 'product' | 'motorcycle' | 'addon') => void;
  onClose: () => void;
  invoiceWhatsappNumber?: string;
}

export default function BookingModal({
  motorcycleId,
  motorcycleName,
  category,
  price,
  serialCode, // New field
  preSelectedAddOnIds = [],
  storeProducts = [],
  onAddToCart,
  onClose,
  invoiceWhatsappNumber,
}: BookingModalProps) {
  const { lang, dir, t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: new Date().toISOString().split('T')[0], // Default to current date
  });

  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>(preSelectedAddOnIds);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Retrieve current motorcycles data to find this bike's active add-ons
  const motorcyclesData = (() => {
    try {
      const saved = localStorage.getItem('elkholy_motorcycles');
      return saved ? JSON.parse(saved) : MOTORCYCLES_DATA;
    } catch {
      return MOTORCYCLES_DATA;
    }
  })() as Motorcycle[];

  const selectedBike = motorcyclesData.find(b => b.id === motorcycleId);
  const bikeAddOns = selectedBike?.addOns || [];

  const categoryNameMap = {
    A: { ar: 'سبورت (A)', en: 'Sport (A)' },
    B: { ar: 'كروزر (B)', en: 'Cruiser (B)' },
    C: { ar: 'مغامرات (C)', en: 'Adventure (C)' },
    S: { ar: 'سكوتر (S)', en: 'Scooter (S)' },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleToggleAddOn = (id: string) => {
    if (selectedAddOnIds.includes(id)) {
      setSelectedAddOnIds(selectedAddOnIds.filter(x => x !== id));
    } else {
      setSelectedAddOnIds([...selectedAddOnIds, id]);
    }
  };

  // Pricing calculations
  const originalPriceUsd = selectedBike ? (selectedBike.originalPrice || selectedBike.priceNum) : parseFloat(price.replace(/[^0-9]/g, ''));
  const isDiscounted = !!(selectedBike && selectedBike.originalPrice && selectedBike.discount && selectedBike.discount > 0);

  const getDiscountedPriceUsd = () => {
    if (selectedBike) {
      if (isDiscounted && selectedBike.discount && selectedBike.originalPrice) {
        if (selectedBike.discountType === 'percentage') {
          return Math.max(0, selectedBike.originalPrice * (1 - selectedBike.discount / 100));
        } else {
          return Math.max(0, selectedBike.originalPrice - selectedBike.discount);
        }
      }
      return selectedBike.priceNum;
    }
    return parseFloat(price.replace(/[^0-9]/g, '')) || 0;
  };

  const basePriceUsd = getDiscountedPriceUsd();
  const selectedAddOnsPriceUsd = bikeAddOns
    .filter(addon => selectedAddOnIds.includes(addon.id))
    .reduce((sum, addon) => sum + addon.price, 0);

  const finalTotalPriceUsd = basePriceUsd + selectedAddOnsPriceUsd;

  const formatPrice = (usd: number) => {
    if (lang === 'ar') {
      return `${usd.toLocaleString()} جنيه`;
    } else {
      return `${usd.toLocaleString()} EGP`;
    }
  };

  const displayPriceText = formatPrice(finalTotalPriceUsd);

  // Accessories payload strings for WhatsApp
  const selectedAddOns = bikeAddOns.filter(a => selectedAddOnIds.includes(a.id));
  const addonsTextEn = selectedAddOns.length > 0
    ? `\nAdd-ons Selected: ${selectedAddOns.map(a => `${a.name} (+${a.price.toLocaleString()} EGP)`).join(', ')}`
    : '';
  const addonsTextAr = selectedAddOns.length > 0
    ? `\nالكماليات المحددة: ${selectedAddOns.map(a => `${a.nameAr || a.name} (+${a.price.toLocaleString()} جنيه)`).join('، ')}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || !formData.date) {
      setErrorMsg(t('required_fields'));
      return;
    }

    const vehicleType = category === 'S' 
      ? (lang === 'ar' ? 'سكوتر' : 'Scooter')
      : (lang === 'ar' ? 'موتوسيكل' : 'Motorcycle');

    const activeCategory = categoryNameMap[category][lang];

    // Build multilingual WhatsApp message with add-ons and dynamic pricing
    let waText = '';
    if (lang === 'ar') {
      waText = 
`مرحباً، أريد حجز هذا ال${vehicleType}:
الموديل: ${motorcycleName}
الفئة: ${activeCategory}${addonsTextAr}
السعر الرياضي الإجمالي: ${displayPriceText}
التاريخ: ${formData.date}
اسم العميل: ${formData.name}
الهاتف: ${formData.phone}
البريد: ${formData.email}`;
    } else {
      waText = 
`Hello, I would like to reserve this ${vehicleType}:
Model: ${motorcycleName}
Category: ${activeCategory}${addonsTextEn}
Total Combined Price: ${displayPriceText}
Date: ${formData.date}
Customer Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}`;
    }

    const targetPhone = invoiceWhatsappNumber || '201007062123';
    const encodedText = encodeURIComponent(waText);
    const waUrl = `https://wa.me/${targetPhone}?text=${encodedText}`;

    const newBookingId = `book-${Date.now()}`;
    const newBooking = {
      id: newBookingId,
      motorcycleId,
      motorcycleName,
      category,
      price: displayPriceText,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      date: formData.date,
      selectedAddOns: selectedAddOns.map(a => ({ id: a.id, name: a.name, price: a.price })),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // 1. Persist booking to Firestore using our secure schema
    try {
      await setDoc(doc(db, 'bookings', newBookingId), {
        customerName: formData.name || 'Anonymous User',
        customerPhone: formData.phone || '000000000',
        motorcycleId: motorcycleId,
        motorcycleName: motorcycleName,
        totalPrice: finalTotalPriceUsd,
        status: 'pending'
      });
    } catch (err) {
      console.warn("Firestore save failed, falling back gracefully to local index:", err);
      // Optional: handleFirestoreError(err, OperationType.WRITE, `bookings/${newBookingId}`);
    }

    // 2. Persist booking to localStorage with complete details
    try {
      const existingStr = localStorage.getItem('elkholy_bookings');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(newBooking);
      localStorage.setItem('elkholy_bookings', JSON.stringify(existing));
    } catch (err) {
      console.error("Error persisting booking locally:", err);
    }

    setSubmitted(true);
    
    setTimeout(() => {
      window.open(waUrl, '_blank');
      onClose();
    }, 2000);
  };

  // Multi-lingual dynamic live text construction for preview
  const vehicleType = category === 'S' 
    ? (lang === 'ar' ? 'سكوتر' : 'Scooter')
    : (lang === 'ar' ? 'موتوسيكل' : 'Motorcycle');

  const activeCategory = categoryNameMap[category][lang];

  let waPreviewText = '';
  if (lang === 'ar') {
    waPreviewText = 
`مرحباً، أريد حجز هذا ال${vehicleType}:
الموديل: ${motorcycleName}
الفئة: ${activeCategory}${addonsTextAr}
السعر الكلي: ${displayPriceText}
التاريخ: ${formData.date || '[تحديد التاريخ]'}
اسم العميل: ${formData.name || '[اسمك بالكامل]'}`;
  } else {
    waPreviewText = 
`Hello, I would like to reserve this ${vehicleType}:
Model: ${motorcycleName}
Category: ${activeCategory}${addonsTextEn}
Total Price: ${displayPriceText}
Date: ${formData.date || '[Selected Date]'}
Customer Name: ${formData.name || '[Your Name]'}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      
      {/* Container Card with Entry Bounce */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-lg glass-panel border border-[#6366F1]/30 rounded-3xl overflow-hidden relative shadow-2xl box-glow-cyan my-8"
      >
        {/* Glow corner highlights */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-brand-accent/20 blur-xl rounded-full animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-bl from-transparent to-brand-primary/20 blur-xl rounded-full animate-pulse pointer-events-none" />

        {/* Modal Window Title Panel */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-5 shrink-0 relative z-20" dir={dir}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/20">
              <Bike className="w-5 h-5 text-brand-accent" />
            </div>
            <div className="text-left" dir={dir}>
              <h2 className="text-lg font-bold tracking-wider text-white uppercase font-mono">
                {lang === 'ar' ? <>حجز <span className="text-brand-accent">آمن ومباشر</span></> : <>SECURE <span className="text-brand-accent">RESERVATION</span></>}
              </h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Model: {motorcycleName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/5 bg-white/[0.03] text-gray-400 hover:text-white transition-colors cursor-pointer relative z-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-left" dir={dir}>
              
              <div className="text-xs text-gray-400 font-sans leading-relaxed border-l-2 border-brand-primary pl-3 bg-brand-primary/5 py-2.5 rounded-r-lg mb-2 text-right" dir={dir}>
                {lang === 'ar' ? (
                  <>تقدير سعر الماكينة المختارة: <span className="text-brand-accent font-extrabold font-mono text-sm">{displayPriceText}</span>. أكمل معايير الاستمارة لفتح بوابة الحجز فائقة الأمان.</>
                ) : (
                  <>Selected machine price estimate: <span className="text-brand-accent font-extrabold font-mono text-sm">{displayPriceText}</span>. Complete the form parameters to start the secure WhatsApp order gateway.</>
                )}
              </div>

              {/* Name input */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-gray-400 font-semibold uppercase">{t('full_name')}:</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-brand-accent" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('full_name_placeholder')}
                    className="w-full bg-black/65 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* WhatsApp Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-gray-400 font-semibold uppercase">{t('contact_number')}:</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 w-4 h-4 text-brand-accent" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t('phone_placeholder')}
                    className="w-full bg-black/65 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-gray-400 font-semibold uppercase">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}:</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-brand-accent" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('email_placeholder')}
                    className="w-full bg-black/65 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-gray-400 font-semibold uppercase">{t('preferred_date')}:</label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3.5 w-4 h-4 text-brand-accent" />
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-black/65 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Interactive Accessories Custom Widget inside Modal */}
              {bikeAddOns.length > 0 && (
                <div className="space-y-2 p-3.5 bg-black/40 border border-white/[0.05] rounded-xl font-mono">
                  <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-brand-accent" />
                    {lang === 'ar' ? 'تعديل ملحقات وكماليات الطلب:' : 'CUSTOMIZE SELECTED ACCENTS & ADDONS:'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 max-h-[170px] overflow-y-auto scrollbar-thin pr-1 text-xs">
                    {bikeAddOns.map(addon => {
                      const isChecked = selectedAddOnIds.includes(addon.id);
                      const displayAddonName = lang === 'ar' && addon.nameAr ? addon.nameAr : addon.name;
                      const displayAddonDesc = lang === 'ar' && addon.descAr ? addon.descAr : addon.description;
                      return (
                        <div 
                          key={addon.id}
                          onClick={() => handleToggleAddOn(addon.id)}
                          className={`flex flex-col justify-between p-2 rounded-xl border relative cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] ${
                            isChecked 
                              ? 'bg-[#22D3EE]/5 border-[#22D3EE]/40 shadow-[0_0_10px_rgba(34,211,238,0.12)] ring-1 ring-[#22D3EE]/20' 
                              : 'bg-black/40 border-white/[0.05] hover:bg-black/20 hover:border-white/10'
                          }`}
                        >
                          {/* Selection circle indicator */}
                          <div className={`absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border transition-all ${
                            isChecked ? 'bg-[#22D3EE] border-[#22D3EE] text-[#0B0F1A]' : 'border-white/20 bg-black/60'
                          }`}>
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>

                          <div className="flex flex-col items-center text-center gap-1.5 pt-1">
                            {addon.image && (
                              <img 
                                src={addon.image} 
                                alt={addon.name} 
                                className="w-10 h-10 rounded-lg object-cover border border-white/10 shadow-sm shadow-black/30 animate-pulse-slow" 
                                referrerPolicy="no-referrer"
                              />
                            )}

                            <div className="leading-tight w-full">
                              <span className="text-white text-[10px] font-bold block truncate max-w-[125px]">
                                {displayAddonName}
                              </span>
                              <span className="text-[8px] text-gray-500 block truncate max-w-[125px]">
                                {displayAddonDesc}
                              </span>
                            </div>
                          </div>

                          <div className="text-center mt-2 pt-1 border-t border-white/[0.05] shrink-0">
                            <span className="text-[9.5px] text-brand-accent font-bold">
                              +{formatPrice(addon.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STORE: FREQUENTLY BOUGHT TOGETHER */}
              {selectedBike?.relatedProductIds && selectedBike.relatedProductIds.length > 0 && storeProducts.length > 0 && (
                <div className="space-y-2 p-3.5 bg-black/40 border border-white/[0.05] rounded-xl font-mono">
                  <p className="text-[10px] text-brand-secondary font-bold uppercase flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-brand-secondary" />
                    {lang === 'ar' ? 'ينصح بشرائها مع الموديل:' : 'FREQUENTLY BOUGHT TOGETHER:'}
                  </p>

                  <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
                    {selectedBike.relatedProductIds.map(productId => {
                      const sp = storeProducts.find(p => p.id === productId);
                      if (!sp) return null;
                      return (
                        <div key={sp.id} className="min-w-[140px] flex flex-col justify-between p-2 rounded-xl border border-white/[0.05] bg-white/[0.02] relative transition-all duration-300">
                          <div className="flex justify-center mb-2">
                             <img src={sp.image} className="w-12 h-12 rounded-lg object-contain bg-black/50 overflow-hidden" />
                          </div>
                          
                          <div className="text-center w-full mb-2">
                             <div className="text-white text-[10px] font-bold truncate max-w-[120px]">{lang === 'ar' ? sp.nameAr : sp.name}</div>
                             <div className="text-[10px] text-brand-secondary font-bold">{sp.price.toLocaleString()} {lang === 'ar' ? 'ج' : 'EGP'}</div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (onAddToCart) {
                                onAddToCart(sp, 'product');
                                alert(lang === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart');
                              }
                            }}
                            className="w-full text-center py-1.5 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-secondary text-[9px] uppercase tracking-widest rounded transition-colors"
                          >
                            + {lang === 'ar' ? 'إضافة' : 'ADD'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic WhatsApp Preview */}
              <div className="rounded-xl border border-white/[0.06] bg-[#070A11] p-3 text-xs leading-relaxed space-y-1.5 font-mono">
                <p className="text-[10px] text-[#A855F7] uppercase tracking-wider font-bold border-b border-white/5 pb-1 flex items-center justify-between">
                  <span>{t('preview_message')}</span>
                  <span className="text-[9px] text-gray-500 uppercase">{lang}</span>
                </p>
                <pre className="text-gray-300 font-sans whitespace-pre-wrap text-right text-xs pt-1" dir={dir}>
                  {waPreviewText}
                </pre>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <p className="text-xs text-red-500 font-mono text-center">{errorMsg}</p>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3 mt-4 rounded-xl font-mono text-xs font-bold tracking-widest text-[#0B0F1A] bg-gradient-to-r from-brand-accent to-brand-primary hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-brand-accent/20 uppercase flex items-center justify-center gap-2"
                id="modal-submit-booking"
              >
                <span>{lang === 'ar' ? 'إرسال طلب الحجز إلى واتساب الكترونياً' : 'TRANSMIT RESERVATION TO WHATSAPP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          ) : (
            // Success Transmission state of-the-art visual panel
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-400 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-wider text-white uppercase font-mono">
                  {lang === 'ar' ? <>تم <span className="text-green-400">تفويض الحجز</span></> : <>TRANSMISSION <span className="text-green-400">AUTHORIZED</span></>}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto font-sans">
                  {lang === 'ar' 
                    ? <>جاري توجيه بياناتك بنجاح إلى لوحة شركة <strong>الخولي موتورز</strong> عبر خدمة الواتساب الآمنة وتجهيز الرابط المباشر.</>
                    : <>We are forwarding your parameters to <strong>ElKholy Motors WhatsApp</strong> secure dashboard. Continue booking steps in the upcoming window tab.</>
                  }
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-[11px] font-mono text-gray-400 flex items-center justify-center gap-2 max-w-xs mx-auto animate-pulse">
                <MessageSquare className="w-4 h-4 text-brand-accent shrink-0" />
                <span>{t('transmitting_link')}</span>
              </div>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
