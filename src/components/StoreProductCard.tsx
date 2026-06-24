/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Share2, RefreshCw, Check, Copy, X, Tag, Heart, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { StoreProduct } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StoreProductCardProps {
  key?: string | number;
  product: StoreProduct;
  onAddToCart: (product: StoreProduct) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: any) => void;
}

export default function StoreProductCard({ product, onAddToCart, isFavorite, onToggleFavorite }: StoreProductCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const { lang, dir } = useLanguage();

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 1,
          color: {
            dark: '#0B0F1A',
            light: '#FFFFFF',
          },
        });
        setQrUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR', err);
      }
    };
    generateQR();
  }, [product.id]);

  const handleCardClick = (e: any) => {
    if (e.target.closest('.no-flip')) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  const formatPrice = (pNum: number) => {
    if (lang === 'ar') {
      return `${pNum.toLocaleString()} ج.م`;
    } else {
      return `${pNum.toLocaleString()} EGP`;
    }
  };

  const getSharedMessage = () => {
    const formattedPrice = formatPrice(product.price);
    const prodName = lang === 'ar' ? product.nameAr : product.name;
    if (lang === 'ar') {
      return `شاهد هذا المنتج الممتاز من ElKholy Motors:
[${prodName}]
السعر الحالي: ${formattedPrice}`;
    } else {
      return `Check out this cool product from ElKholy Motors:
[${product.name}]
Price: ${formattedPrice}`;
    }
  };

  const handleShareClick = (platform: 'wa' | 'fb' | 'x' | 'copy', e: any) => {
    e.stopPropagation();
    e.preventDefault();
    const msg = getSharedMessage();
    const currentUrl = window.location.href;

    if (platform === 'wa') {
      const url = `https://wa.me/?text=${encodeURIComponent(msg + '\n' + currentUrl)}`;
      window.open(url, '_blank');
    } else if (platform === 'fb') {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } else if (platform === 'x') {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg + '\n' + currentUrl)}`;
      window.open(url, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(`${msg}\n${currentUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check if a original price is presented and discount is configured
  const hasDiscount = !!(product.originalPrice && product.originalPrice > product.price);

  return (
    <div 
      onClick={handleCardClick}
      className="perspective-1000 h-[480px] w-full cursor-pointer group pointer-events-auto"
      id={`store-card-${product.id}`}
    >
      <div 
        className={`relative w-full h-full duration-700 preserve-3d transition-all ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ==================== FRONT SIDE OF PRODUCT CARD ==================== */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden glass-panel rounded-3xl overflow-hidden border border-white/[0.08] hover:border-brand-primary/50 hover:shadow-[0_0_20px_rgba(235,166,42,0.15)] flex flex-col transition-all duration-500 bg-[#070A11]/40"
        >
          {/* Badge overlays */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between no-flip">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-black/60 rounded-full text-[9px] font-mono tracking-widest text-[#E5E7EB] border border-white/5 uppercase select-none">
                {product.id}
              </span>

              {product.isOffer && (
                <span className="px-2.5 py-1 bg-red-600/90 text-white text-[9px] font-black tracking-widest rounded-xl uppercase flex items-center gap-1 shadow-lg shadow-red-600/20">
                  <Tag className="w-3.5 h-3.5 text-white" />
                  {lang === 'ar' ? (product.offerLabelAr || 'عرض خاص') : (product.offerLabel || 'SPECIAL')}
                </span>
              )}
            </div>

            {/* Favorite button ( ❤️ ) */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id, e); }}
              className="p-2 rounded-xl border border-white/[0.06] bg-black/60 hover:bg-black/80 hover:scale-110 active:scale-95 transition-all text-white cursor-pointer select-none shadow-lg"
              title={isFavorite ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from Favorites') : (lang === 'ar' ? 'إضافة إلى المفضلة' : 'Add to Favorites')}
              id={`fav-btn-${product.id}`}
            >
              <Heart 
                className={`w-3.5 h-3.5 transition-transform ${
                  isFavorite ? 'fill-red-500 text-red-500 scale-105' : 'text-gray-400 hover:text-red-400'
                }`} 
              />
            </button>
          </div>

          {/* Product Image Stage (Strict 1:1 format) */}
          <div className="relative aspect-square w-full bg-gradient-to-b from-[#090D18] to-[#070A11] p-2 flex items-center justify-center overflow-hidden border-b border-white/5">
            <img 
              src={product.image} 
              referrerPolicy="no-referrer"
              alt={lang === 'ar' ? product.nameAr : product.name}
              onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=200'; }}
              className="w-full h-full object-contain filter drop-shadow-[0_12px_12px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500 select-none pb-1"
            />
          </div>

          {/* Details Row */}
          <div className="flex flex-col flex-1 p-5">
            <div className="text-[10px] text-brand-accent uppercase tracking-widest font-mono mb-1">
              {product.brand || 'ElKholy'}
            </div>
            
            <h3 className="text-white font-bold text-base mb-1 truncate font-sans">
              {lang === 'ar' ? product.nameAr : product.name}
            </h3>

            {/* Micro details indicator */}
            <div className="text-gray-500 text-[10px] uppercase font-mono tracking-wider flex items-center gap-2 mt-0.5 mb-2">
              <span>{lang === 'ar' ? 'التصنيف:' : 'Category:'} {product.category}</span>
            </div>

            {/* Bottom Actions footer inside Card Front */}
            <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5 no-flip">
              <div>
                {hasDiscount && product.originalPrice && (
                  <div className="text-gray-500 text-xs line-through font-mono">
                    {formatPrice(product.originalPrice)}
                  </div>
                )}
                <div className="text-brand-accent font-mono font-bold text-lg">
                  {formatPrice(product.price)}
                </div>
              </div>
              
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                disabled={product.stockCount <= 0}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  product.stockCount > 0 
                    ? 'bg-brand-primary text-[#0B0F1A] hover:brightness-110 shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
                title={lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
              >
                <ShoppingCart className="w-4 h-4 font-bold" />
              </button>
            </div>
          </div>
        </div>

        {/* ==================== BACK SIDE OF PRODUCT CARD ==================== */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-panel rounded-3xl overflow-hidden border border-brand-accent/20 flex flex-col p-5 [backface-visibility:hidden] bg-[#0A0E1A]"
          style={{ WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Header Row: Flip back [قلب] and Share [المشاركة] */}
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4 no-flip">
            {/* Flip back button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-brand-accent transition-all text-xs font-mono text-gray-300 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'رجوع' : 'Flip'}</span>
            </button>

            {/* Share action indicator */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShareOpen(!shareOpen); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary/20 hover:text-brand-accent text-brand-primary transition-all text-xs font-mono font-semibold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Grid overlay */}
          <AnimatePresence>
            {shareOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-16 left-4 right-4 z-20 bg-[#0F172A]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 no-flip shadow-2xl space-y-2.5"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-accent">
                    {lang === 'ar' ? 'خيارات المشاركة السريعة' : 'QUICK SHARE'}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShareOpen(false); }}
                    className="p-1 text-gray-400 hover:text-white rounded bg-white/5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-semibold">
                  <button
                    onClick={(e) => handleShareClick('wa', e)}
                    className="flex items-center gap-1.5 p-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/24 rounded-xl transition-all cursor-pointer text-left"
                  >
                    <span>🟢 WhatsApp</span>
                  </button>
                  <button
                    onClick={(e) => handleShareClick('fb', e)}
                    className="flex items-center gap-1.5 p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/24 rounded-xl transition-all cursor-pointer text-left"
                  >
                    <span>🔵 Facebook</span>
                  </button>
                  <button
                    onClick={(e) => handleShareClick('x', e)}
                    className="flex items-center gap-1.5 p-2 bg-gray-800/80 border border-white/10 text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer text-left"
                  >
                    <span>⚫ Twitter (X)</span>
                  </button>
                  <button
                    onClick={(e) => handleShareClick('copy', e)}
                    className="flex items-center gap-1.5 p-2 bg-brand-accent/10 border border-brand-accent/20 text-brand-primary hover:bg-brand-accent/20 rounded-xl transition-all cursor-pointer text-left"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : (lang === 'ar' ? 'نسخ الرابط' : 'Copy Link')}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back Body Scroll container */}
          <div className="flex-1 overflow-y-auto pr-1 select-text space-y-4 text-left font-sans text-xs scrollbar-thin">
            <div className={`flex justify-between items-start gap-4 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-brand-accent uppercase tracking-widest font-mono block">
                  {product.brand}
                </span>
                <h4 className="text-white font-black text-sm uppercase font-sans mt-0.5 break-words">
                  {lang === 'ar' ? product.nameAr : product.name}
                </h4>
                
                {/* Clickable & Copyable ID Badge */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(product.id);
                    setIdCopied(true);
                    setTimeout(() => setIdCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded bg-white/[0.04] border border-white/10 hover:bg-white/[0.1] active:bg-white/[0.15] text-gray-400 hover:text-brand-primary hover:border-brand-primary/20 transition-all cursor-pointer select-all font-mono text-[9px] font-bold active:scale-95 no-flip"
                  title={lang === 'ar' ? 'انقر لنسخ الكود' : 'Click to copy ID'}
                >
                  {idCopied ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-400" />
                      <span>{lang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                    </span>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>ID: {product.id}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Small Elegant QR Code Display on Top Right (LTR) / Top Left (RTL flipped layout) */}
              <div className="shrink-0 flex flex-col items-center gap-1 bg-white p-1.5 rounded-xl border border-white/10 shadow-lg no-flip w-[86px]">
                {qrUrl ? (
                  <>
                    <img 
                      src={qrUrl} 
                      alt="Product QR Code" 
                      className="w-[74px] h-[74px] object-contain rounded"
                    />
                    <a
                      href={qrUrl}
                      download={`QR-${product.id}.png`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[8px] font-mono font-bold text-[#0B0F1A] bg-brand-primary hover:bg-brand-primary/95 transition-all py-0.5 px-1.5 rounded-md flex items-center gap-0.5 cursor-pointer select-none"
                    >
                      <Download className="w-2.5 h-2.5" />
                      <span>{lang === 'ar' ? 'تحميل' : 'PNG'}</span>
                    </a>
                  </>
                ) : (
                  <div className="w-[74px] h-[74px] flex items-center justify-center text-[8px] text-gray-400 font-mono">
                    ...
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">
                {lang === 'ar' ? 'الوصف والتفاصيل' : 'Description'}
              </span>
              <p className="text-gray-300 leading-relaxed font-sans text-xs whitespace-pre-line">
                {lang === 'ar' ? product.descriptionAr : product.description}
              </p>
            </div>

            {/* Available Stock */}
            <div className="space-y-1 pt-2 border-t border-white/5">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">
                {lang === 'ar' ? 'الكمية المتوفرة بالمخزون' : 'Stock Quantity Available'}
              </span>
              <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${
                product.stockCount <= 0 
                  ? 'text-red-500' 
                  : product.stockCount <= 3 
                    ? 'text-amber-400' 
                    : 'text-brand-accent'
              }`}>
                <span>●</span>
                <span>
                  {product.stockCount <= 0 
                    ? (lang === 'ar' ? 'غير متوفر / نفذت الكمية' : 'Out of stock') 
                    : `${product.stockCount} ${lang === 'ar' ? 'قطعة متوفرة حالياً' : 'units available currently'}`}
                </span>
              </span>
            </div>

            {/* Specifications */}
            {product.specs && (
              <div className="space-y-1 pt-2 border-t border-white/5">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">
                  {lang === 'ar' ? 'المواصفات الفنية' : 'Technical Specifications'}
                </span>
                <p className="text-brand-accent/90 leading-relaxed font-mono text-[11px]">
                  {lang === 'ar' ? product.specsAr : product.specs}
                </p>
              </div>
            )}
          </div>

          {/* Back Footer: Quick Add and price summary */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto no-flip">
            <div>
              <span className="text-[10px] text-gray-500 font-mono tracking-wider block uppercase">{lang === 'ar' ? 'السعر' : 'Price'}</span>
              <span className="text-brand-accent font-mono font-bold text-base">{formatPrice(product.price)}</span>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              disabled={product.stockCount <= 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer text-xs font-bold ${
                product.stockCount > 0 
                  ? 'bg-brand-primary text-[#0B0F1A] hover:brightness-110 shadow-lg shadow-brand-primary/20 active:scale-95' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'شراء' : 'Buy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
