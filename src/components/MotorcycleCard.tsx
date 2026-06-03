/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Zap, Gauge, Droplet, Fuel, Cpu, Key, FileText, ChevronRight, RefreshCw, Sparkles, Award, Share2, Check, Copy, X, ListCollapse, ShoppingBag } from 'lucide-react';
import { Motorcycle, CategorySlug, AddOn } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MotorcycleCardProps {
  key?: string | number;
  bike: Motorcycle;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: any) => void;
  onOpenPdf: (bike: Motorcycle, e: any) => void;
  onOpenBooking: (id: string, name: string, cat: CategorySlug, price: string, e?: any, selectedAddOnIds?: string[]) => void;
}

export default function MotorcycleCard({
  bike,
  isFavorite,
  onToggleFavorite,
  onOpenPdf,
  onOpenBooking,
}: MotorcycleCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backTab, setBackTab] = useState<'specs' | 'addons'>('specs');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const { lang, dir, t } = useLanguage();

  const handleCardClick = (e: any) => {
    // If clicking target is a button or is inside share menu, do not flip
    if (e.target.closest('.no-flip')) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  // Color theme selectors based on bike category
  const getThemeColor = () => {
    switch (bike.category) {
      case 'A': return { border: 'group-hover:border-brand-accent/40', text: 'text-brand-accent', shadow: 'hover:shadow-[0_0_25px_rgba(34,211,238,0.2)]', glow: 'glow-cyan', bg: 'bg-brand-accent/10', borderSolid: 'border-brand-accent/20' };
      case 'B': return { border: 'group-hover:border-brand-secondary/40', text: 'text-brand-secondary', shadow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]', glow: 'glow-purple', bg: 'bg-brand-secondary/10', borderSolid: 'border-brand-secondary/20' };
      case 'C': return { border: 'group-hover:border-orange-400/40', text: 'text-orange-400', shadow: 'hover:shadow-[0_0_25px_rgba(251,146,60,0.15)]', glow: 'text-shadow: 0 0 10px rgba(251,146,60,0.5)', bg: 'bg-orange-450/10', borderSolid: 'border-orange-400/20' };
      default: return { border: 'group-hover:border-brand-accent/40', text: 'text-brand-accent', shadow: 'hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]', glow: 'glow-cyan', bg: 'bg-brand-accent/10', borderSolid: 'border-brand-accent/20' };
    }
  };

  const themeColors = getThemeColor();

  // Price Calculation logic
  const originalPriceUsd = bike.originalPrice || bike.priceNum;
  const isDiscounted = !!(bike.originalPrice && bike.discount && bike.discount > 0);

  const getDiscountedPriceUsd = () => {
    if (isDiscounted && bike.discount && bike.originalPrice) {
      if (bike.discountType === 'percentage') {
        return Math.max(0, bike.originalPrice * (1 - bike.discount / 100));
      } else {
        return Math.max(0, bike.originalPrice - bike.discount);
      }
    }
    return bike.priceNum;
  };

  const basePriceUsd = getDiscountedPriceUsd();

  // Selected add-ons pricing
  const activeAddOns = bike.addOns || [];
  const selectedAddOnsPriceUsd = activeAddOns
    .filter(addon => selectedAddOnIds.includes(addon.id))
    .reduce((sum, addon) => sum + addon.price, 0);

  const totalLivePriceUsd = basePriceUsd + selectedAddOnsPriceUsd;

  const formatPrice = (usd: number) => {
    if (lang === 'ar') {
      return `${(usd * 50).toLocaleString()} جنيه`;
    } else {
      return `${(usd * 50).toLocaleString()} EGP`;
    }
  };

  const getSharedMessage = () => {
    const formattedTotal = formatPrice(totalLivePriceUsd);
    let addonsListMsg = '';
    if (selectedAddOnIds.length > 0) {
      const names = activeAddOns
        .filter(a => selectedAddOnIds.includes(a.id))
        .map(a => lang === 'ar' && a.nameAr ? a.nameAr : a.name)
        .join(', ');
      addonsListMsg = lang === 'ar' ? `\nالإضافات: ${names}` : `\nAdd-ons: ${names}`;
    }

    if (lang === 'ar') {
      return `شاهد هذا الموتوسيكل من ElKholy Motors:
[${bike.name}]${addonsListMsg}
السعر الإجمالي: ${formattedTotal}`;
    } else {
      return `Check out this motorcycle from ElKholy Motors:
[${bike.name}]${addonsListMsg}
Total Price: ${formattedTotal}`;
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

  const toggleAddOn = (id: string, e: any) => {
    e.stopPropagation();
    if (selectedAddOnIds.includes(id)) {
      setSelectedAddOnIds(selectedAddOnIds.filter(x => x !== id));
    } else {
      setSelectedAddOnIds([...selectedAddOnIds, id]);
    }
  };

  const handleBookNowClick = (e: any) => {
    e.stopPropagation();
    onOpenBooking(
      bike.id,
      bike.name,
      bike.category,
      formatPrice(totalLivePriceUsd),
      e,
      selectedAddOnIds
    );
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`perspective-1000 h-[500px] w-full min-w-[280px] cursor-pointer group pointer-events-auto`}
      id={`bike-card-${bike.id}`}
    >
      <div 
        className={`relative w-full h-full duration-700 preserve-3d transition-all ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        
        {/* ==================== FRONT SIDE OF MOTORCYCLE CARD ==================== */}
        <div 
          className={`absolute inset-0 w-full h-full backface-hidden glass-panel rounded-3xl overflow-hidden border border-white/[0.08] ${themeColors.border} ${themeColors.shadow} flex flex-col transition-all duration-500`}
        >
          {/* Top Info row (Category + Favorites button + Share toggle + Catalog indicator) */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <span className="px-3 py-1 bg-black/60 rounded-full text-[10px] font-mono font-semibold tracking-widest text-[#E5E7EB] border border-white/10 uppercase">
              {t('cat_' + bike.category).replace('فئة', '').replace('Series', '')}
            </span>

            {/* Icons Action Grid */}
            <div className="flex items-center gap-1.5 no-flip">
              
              {/* Custom uploaded catalog halo icon indicator */}
              {(bike.catalogFileContent || bike.catalogFileName) && (
                <a 
                  href={bike.catalogFileContent || "#"}
                  download={bike.catalogFileName || `${bike.name}-catalog.pdf`}
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-brand-accent hover:bg-blue-500/25 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 transition-all text-white cursor-pointer select-none no-flip inline-flex items-center justify-center"
                  title={lang === 'ar' ? 'تحميل الكتالوج الرقمي PDF المخصص' : 'Download Custom spec PDF Catalog'}
                >
                  <FileText className="w-4 h-4 text-[#22D3EE]" />
                </a>
              )}

              {/* Share Popover Switch button */}
              <button
                onClick={(e) => { e.stopPropagation(); setShareOpen(!shareOpen); }}
                className="p-2 sm:p-2.5 rounded-xl border border-white/[0.06] bg-black/50 hover:bg-black/75 hover:scale-110 active:scale-95 transition-all text-white cursor-pointer select-none"
                title={t('share_title')}
                id={`share-btn-${bike.id}`}
              >
                <Share2 className="w-4 h-4 text-[#22D3EE] hover:text-white" />
              </button>

              {/* Favorite button ( ❤️ ) */}
              <button
                onClick={(e) => onToggleFavorite(bike.id, e)}
                className="p-2 sm:p-2.5 rounded-xl border border-white/[0.06] bg-black/50 hover:bg-black/75 hover:scale-110 active:scale-95 transition-all text-white cursor-pointer select-none"
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                id={`fav-btn-${bike.id}`}
              >
                <Heart 
                  className={`w-4 h-4 transition-transform ${
                    isFavorite ? 'fill-red-500 text-red-500 scale-105' : 'text-gray-400 hover:text-red-400'
                  }`} 
                />
              </button>
            </div>
          </div>

          {/* Glowing Share popup dialog overlay inside Card context */}
          <AnimatePresence>
            {shareOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-16 left-4 right-4 z-30 bg-[#0F172A]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 no-flip shadow-2xl space-y-3"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#22D3EE]">
                    {t('share_options')}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShareOpen(false); }}
                    className="p-1 text-gray-400 hover:text-white rounded bg-white/5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono font-semibold">
                  <button
                    onClick={(e) => handleShareClick('wa', e)}
                    className="flex items-center gap-1.5 p-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-xl transition-all cursor-pointer"
                  >
                    <span>🟢 WhatsApp</span>
                  </button>
                  <button
                    onClick={(e) => handleShareClick('fb', e)}
                    className="flex items-center gap-1.5 p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all cursor-pointer"
                  >
                    <span>🔵 Facebook</span>
                  </button>
                  <button
                    onClick={(e) => handleShareClick('x', e)}
                    className="flex items-center gap-1.5 p-2 bg-gray-800/55 border border-white/10 text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                  >
                    <span>⚫ Twitter (X)</span>
                  </button>
                  <button
                    onClick={(e) => handleShareClick('copy', e)}
                    className="flex items-center gap-1.5 p-2 bg-brand-accent/10 border border-brand-accent/20 text-[#22D3EE] hover:bg-brand-accent/20 rounded-xl transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : t('copy_link')}</span>
                  </button>
                </div>

                {/* Micro Preview of message */}
                <div className="bg-black/40 border border-white/5 p-2 rounded-lg text-[9px] text-gray-500 font-sans leading-tight text-right" dir={dir}>
                  {getSharedMessage()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popular Tag */}
          {bike.isPopular && (
            <div className={`absolute top-16 ${dir === 'rtl' ? 'right-4' : 'left-4'} z-10 flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-xl`}>
              <Award className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-red-400">
                {t('crowned_popular')}
              </span>
            </div>
          )}

          {/* Glowing Active Offer Label */}
          {bike.offerLabel && (
            <div className={`absolute top-16 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-10 flex items-center gap-1.5 px-3 py-1 bg-[#22D3EE]/15 border border-[#22D3EE]/40 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.25)] animate-pulse`}>
              <Sparkles className="w-3 h-3 text-[#22D3EE]" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#22D3EE]">
                {bike.offerLabel}
              </span>
            </div>
          )}

          {/* Product Thumbnail block */}
          <div className="w-full h-[240px] relative overflow-hidden bg-gradient-to-b from-[#111827]/10 to-[#070A11]/30">
            {/* Visual background atmospheric halo strip */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-12 rounded-full ${themeColors.bg} filter blur-xl opacity-80`} />
            
            <img
              src={bike.image}
              alt={bike.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 select-none"
            />
          </div>

          {/* Card Meta Content Details */}
          <div className="p-5 flex-1 flex flex-col justify-between relative bg-gradient-to-t from-black/80 to-[#0F172A]/10 text-left" dir={dir === 'rtl' ? 'rtl' : 'ltr'}>
            <div>
              <span className="font-mono text-[10px] tracking-widest text-gray-400 font-semibold uppercase block mb-1">
                {t('cat_' + bike.category)}
              </span>
              {/* BRAND CONSISTENCY: KEEP BIKE NAMES IN ENGLISH */}
              <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-brand-accent transition-colors duration-300 font-sans" dir="ltr">
                {bike.name}
              </h3>
              <p className="text-xs font-mono text-brand-accent/80 italic mt-0.5">
                "{bike.tagline}"
              </p>
              <p className="text-xs text-gray-400 font-sans line-clamp-2 mt-2 leading-relaxed">
                {bike.shortDesc}
              </p>
            </div>

            {/* Price display section with old strikethrough support */}
            <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">{t('starting_price').replace('Retail Price', '')}</p>
                
                {isDiscounted ? (
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-mono line-through leading-tight">
                      {formatPrice(originalPriceUsd)}
                    </span>
                    <span className={`text-xl font-bold tracking-wider font-mono ${themeColors.glow} text-brand-accent`}>
                      {formatPrice(basePriceUsd)}
                    </span>
                  </div>
                ) : (
                  <p className={`text-xl font-bold tracking-wider font-mono ${themeColors.glow} text-white`}>
                    {formatPrice(basePriceUsd)}
                  </p>
                )}
              </div>

              {/* Tap to flip action indicator */}
              <div className="flex items-center gap-1.5 py-1.5 px-3 bg-white/[0.03] border border-white/5 rounded-xl font-mono text-[9px] text-gray-400 group-hover:text-white transition-colors">
                <RefreshCw className="w-3 h-3 text-brand-accent animate-spin-slow" />
                <span>{t('explore_specs').toUpperCase()}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ==================== BACK SIDE OF MOTORCYCLE CARD ==================== */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-panel rounded-3xl overflow-hidden border border-brand-accent/20 flex flex-col p-5 [backface-visibility:hidden]"
        >
          {/* Header on back side */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-3 shrink-0" dir={dir}>
            <div>
              <p className="text-[9.5px] text-brand-accent font-mono tracking-widest font-bold uppercase">{t('specifications')}</p>
              <h4 className="text-base font-bold text-white tracking-wide leading-none font-sans mt-0.5 truncate max-w-[150px]" dir="ltr">{bike.name}</h4>
            </div>

            {/* Back flip control & Sub-navigation Tabs */}
            <div className="flex items-center gap-1.5 no-flip">
              <button 
                onClick={(e) => { e.stopPropagation(); setBackTab(backTab === 'specs' ? 'addons' : 'specs'); }}
                className={`p-1 px-2 rounded-lg border text-[9px] font-mono font-bold transition-all ${
                  backTab === 'addons' 
                    ? 'bg-brand-accent/15 border-brand-accent/30 text-brand-accent shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
                title="Toggle accessories"
              >
                {lang === 'ar' ? 'الإضافات' : 'ADDONS'}
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); handleCardClick(e); }}
                className="p-1 px-2.5 rounded-lg border border-white/10 bg-white/5 font-mono text-[9px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                {t('flip_back')}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {backTab === 'specs' ? (
              /* TAB A: SPEC DETAILS MATRIX */
              <motion.div 
                key="specs"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[11px] text-gray-300 flex-1 overflow-y-auto max-h-[305px] pr-1" 
                dir={dir}
              >
                <div className="p-1.5 border border-white/[0.03] rounded-xl bg-white/[0.01]">
                  <span className="text-gray-500 text-[8.5px] flex items-center gap-1 uppercase">
                    <Zap className="w-3 h-3 text-brand-accent" /> {t('drive_engine')}
                  </span>
                  <p className="font-semibold text-white truncate pr-1 mt-0.5" dir="ltr">{bike.specs.engine}</p>
                </div>

                <div className="p-1.5 border border-white/[0.03] rounded-xl bg-white/[0.01]">
                  <span className="text-gray-500 text-[8.5px] flex items-center gap-1 uppercase">
                    <Gauge className="w-3 h-3 text-brand-secondary animate-pulse" /> {t('clock_speed')}
                  </span>
                  <p className="font-semibold text-white mt-0.5" dir="ltr">{bike.specs.topSpeed}</p>
                </div>

                <div className="p-1.5 border border-[#6366F1]/10 border-dashed rounded-xl bg-white/[0.01]">
                  <span className="text-gray-500 text-[8.5px] flex items-center gap-1 uppercase">
                    <Droplet className="w-3 h-3 text-brand-accent" /> {t('energy_consumption')}
                  </span>
                  <p className="font-semibold text-white mt-0.5" dir="ltr">{bike.specs.fuelConsumption}</p>
                </div>

                <div className="p-1.5 border border-[#6366F1]/10 border-dashed rounded-xl bg-white/[0.01]">
                  <span className="text-gray-500 text-[8.5px] flex items-center gap-1 uppercase">
                    <Cpu className="w-3 h-3 text-brand-secondary" /> {t('output_capacity')}
                  </span>
                  <p className="font-semibold text-white mt-0.5" dir="ltr">{bike.specs.power}</p>
                </div>

                {/* Deep details paragraph in back side */}
                <div className="col-span-2 p-2.5 bg-black/40 border border-white/[0.05] rounded-xl font-sans text-[11px] text-gray-400 leading-relaxed overflow-y-auto max-h-[140px] text-right" dir={dir}>
                  <p className="font-semibold text-white font-mono text-[9px] mb-1 text-left uppercase" dir="ltr">{t('craft_manifesto')}</p>
                  {bike.longDesc}
                </div>
              </motion.div>
            ) : (
              /* TAB B: ACCESSORIES & SMART ADD-ONS SELECTOR */
              <motion.div
                key="addons"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col flex-1 overflow-hidden font-mono text-xs no-flip"
              >
                <div className="text-[10px] text-gray-400 flex items-center justify-between mb-2 pb-1 border-b border-white/5" dir={dir}>
                  <span className="font-bold flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-brand-accent" />
                    {lang === 'ar' ? 'اختر الكماليات والإضافات:' : 'SELECT PREMIUM PLUG-IN ADD-ONS:'}
                  </span>
                  <span className="text-[9px] shrink-0 font-bold text-[#A855F7] animate-pulse">
                    {selectedAddOnIds.length} {lang === 'ar' ? 'محدد' : 'SELECTED'}
                  </span>
                </div>

                {/* Scrollable grid products */}
                <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[220px] pr-1 scrollbar-thin" dir={dir}>
                  {activeAddOns.length > 0 ? (
                    activeAddOns.map(addon => {
                      const isChecked = selectedAddOnIds.includes(addon.id);
                      const displayAddonName = lang === 'ar' && addon.nameAr ? addon.nameAr : addon.name;
                      const displayAddonDesc = lang === 'ar' && addon.descAr ? addon.descAr : addon.description;

                      return (
                        <div 
                          key={addon.id}
                          onClick={(e) => toggleAddOn(addon.id, e)}
                          className={`flex items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-[#22D3EE]/5 border-brand-accent/40 shadow-[0_0_10px_rgba(34,211,238,0.06)]'
                              : 'bg-black/30 border-white/[0.04] hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center gap-2 max-w-[70%]" dir={dir}>
                            {/* Checkbox state */}
                            <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${
                              isChecked 
                                ? 'bg-brand-accent border-brand-accent text-[#0B0F1A]' 
                                : 'border-white/20 bg-black/40'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            {/* Image Thumbnail */}
                            {addon.image && (
                              <img 
                                src={addon.image} 
                                alt={addon.name} 
                                className="w-7 h-7 rounded-md object-cover border border-white/10" 
                                referrerPolicy="no-referrer"
                              />
                            )}

                            <div className="text-left leading-normal" dir={dir}>
                              <p className="font-semibold text-white text-[11px] truncate max-w-[130px]">{displayAddonName}</p>
                              <p className="text-[8.5px] text-gray-500 truncate max-w-[130px]" title={displayAddonDesc}>{displayAddonDesc}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-white">+{formatPrice(addon.price)}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-[10px] font-mono lowercase">
                      {lang === 'ar' ? 'لا يوجد إضافات متوفرة لطلبها حالياً' : 'No compatible accessories located.'}
                    </div>
                  )}
                </div>

                {/* Sub-total indicator frame */}
                <div className="bg-black/40 border border-white/[0.05] p-2 mt-2 rounded-xl flex items-center justify-between text-[11px] shrink-0" dir={dir}>
                  <div className="text-[9.5px] text-gray-400">
                    {lang === 'ar' ? 'سعر الخيار الكلي المباشر:' : 'ACTIVE TOTAL DYNAMIC PRICE:'}
                  </div>
                  <div className="text-brand-accent font-extrabold text-sm tracking-wider">
                    {formatPrice(totalLivePriceUsd)}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions panel at bottom (📄 PDF icon catalog button + 🟢 Book Now button) */}
          <div className="pt-3.5 border-t border-white/[0.08] flex items-center justify-between gap-3 mt-auto no-flip shrink-0">
            
            {/* View PDF catalogs button */}
            <button
              onClick={(e) => onOpenPdf(bike, e)}
              className="px-4 py-2 rounded-xl border border-white/[0.08] hover:border-brand-accent font-mono text-xs font-semibold text-gray-300 hover:text-white bg-[#0B0F1A]/50 transition-all duration-200 flex items-center gap-2 select-none pointer-events-auto cursor-pointer"
              title="Open specifications PDF Catalog"
              id={`pdf-btn-${bike.id}`}
            >
              <FileText className="w-4 h-4 text-brand-accent" />
              <span>{t('catalog_btn')}</span>
            </button>

            {/* Book Now Button of the specific vehicle */}
            <button
              onClick={handleBookNowClick}
              className="flex-1 py-2 rounded-xl font-mono text-xs font-semibold tracking-wider text-white bg-gradient-to-r from-brand-primary to-brand-accent hover:brightness-110 active:scale-95 transition-all scroll-smooth shadow-md shadow-brand-primary/10 select-none cursor-pointer flex items-center justify-center gap-1 uppercase"
              id={`book-now-card-${bike.id}`}
            >
              <span>{t('book_now')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
