/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bike, Heart, Trash2, ArrowDown, Sparkles, Target, 
  Settings, Award, Zap, Shield, HelpCircle, X, ChevronRight, MessageCircle 
} from 'lucide-react';

import Navbar from './components/Navbar';
import FilterSection from './components/FilterSection';
import MotorcycleCard from './components/MotorcycleCard';
import BookingModal from './components/BookingModal';
import PdfModal from './components/PdfModal';
import ContactFooter from './components/ContactFooter';
import AdminPanel from './components/AdminPanel';

import { Motorcycle, CategorySlug, FilterState, BookingData, HomepageConfig } from './types';
import { MOTORCYCLES_DATA, HERO_BG_IMAGE, DEFAULT_HOMEPAGE_CONFIG } from './data';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { lang, dir, t } = useLanguage();

  // Load persistence configurations from LocalStorage
  const [motorcyclesData, setMotorcyclesData] = useState<Motorcycle[]>(() => {
    const saved = localStorage.getItem('elkholy_motorcycles');
    return saved ? JSON.parse(saved) : MOTORCYCLES_DATA;
  });

  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig>(() => {
    const saved = localStorage.getItem('elkholy_homepage_config');
    return saved ? JSON.parse(saved) : DEFAULT_HOMEPAGE_CONFIG;
  });

  const [customText, setCustomText] = useState(() => {
    const saved = localStorage.getItem('elkholy_custom_text');
    return saved ? JSON.parse(saved) : null;
  });

  // Storage for favorites saved in local client state
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('elkholy_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Filters configurations
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'ALL',
    priceRange: 100000,
    sortBy: 'default',
    onlyPopular: false,
  });

  // Special speed range slider filter state
  const [speedRange, setSpeedRange] = useState<number>(100);

  // Favorites sidebar trigger state
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  // Admin Dashboard drawer trigger state
  const [adminOpen, setAdminOpen] = useState(false);

  // Active book item context
  const [activeBookItem, setActiveBookItem] = useState<{
    motorcycleId: string;
    motorcycleName: string;
    category: CategorySlug;
    price: string;
    preSelectedAddOnIds?: string[];
  } | null>(null);

  // Active PDF document context
  const [activePdfItem, setActivePdfItem] = useState<Motorcycle | null>(null);

  // Bento Reservation states
  const [bentoBookingName, setBentoBookingName] = useState('');
  const [bentoBookingPhone, setBentoBookingPhone] = useState('');

  // Slogan, badge and hero descriptors loaded from custom texts if administrative action modified them
  const customBadgeText = useMemo(() => {
    return lang === 'ar' 
      ? (homepageConfig.header.titleAr || 'أول معرض كبار الشخصيات بمصر') 
      : (homepageConfig.header.title || "EGYPT'S FIRST CHRONOS SHOWROOM");
  }, [lang, homepageConfig]);

  const customTitleText = useMemo(() => {
    return lang === 'ar' 
      ? (homepageConfig.header.titleAr || 'الخولي') 
      : (homepageConfig.header.title || 'ELKHOLY');
  }, [lang, homepageConfig]);

  const customTitleAccent = useMemo(() => {
    return lang === 'ar' 
      ? (homepageConfig.header.accentAr || 'موتورز') 
      : (homepageConfig.header.accent || 'MOTORS');
  }, [lang, homepageConfig]);

  const customHeroSlogan = useMemo(() => {
    return lang === 'ar' 
      ? (homepageConfig.header.subtitleAr || 'سابق مع المستقبل') 
      : (homepageConfig.header.subtitle || 'RIDE THE FUTURE');
  }, [lang, homepageConfig]);

  const customHeroDesc = useMemo(() => {
    return lang === 'ar' 
      ? (homepageConfig.footer.contentAr || 'انضم إلى عالم الغد. تقدم الخولي موتورز أقوى الموتوسيكلات والاسكوترات فائقة الأداء للمستقبل. استكشف كتالوجاتنا، واقرأ المواصفات واحجز رحلتك مباشرة.') 
      : (homepageConfig.footer.content || 'Step inside the virtual grid. ElKholy Motors introduces extreme-output solid-state performance bikes, plasma touring adventurers, and high-fidelity smart urban scooters designed in 2026. Explore our catalog, review blueprints, and book a secure ride directly.');
  }, [lang, homepageConfig]);

  // Flagship Bike selector for Bento Grid
  const flagshipBike = useMemo(() => {
    const activeCat = filters.category;
    if (activeCat === 'ALL') {
      return motorcyclesData.find(b => b.id === 'sport-cybersport-v4') || motorcyclesData[0];
    }
    return motorcyclesData.find(b => b.category === activeCat && b.isPopular) || 
           motorcyclesData.find(b => b.category === activeCat) || 
           motorcyclesData[0];
  }, [filters.category, motorcyclesData]);

  // Bento Booking submit
  const handleBentoBookingSubmit = (e: any) => {
    if (e) e.preventDefault();
    if (!bentoBookingName.trim() || !bentoBookingPhone.trim()) {
      handleOpenBooking(flagshipBike.id, flagshipBike.name, flagshipBike.category, flagshipBike.price);
      return;
    }

    const vehicleType = flagshipBike.category === 'S' 
      ? (lang === 'ar' ? 'سكوتر' : 'Scooter')
      : (lang === 'ar' ? 'موتوسيكل' : 'Motorcycle');

    const catLabelMap = { A: 'Sport (A)', B: 'Cruiser (B)', C: 'Adventure (C)', S: 'Scooter (S)' };
    const arabicCategory = catLabelMap[flagshipBike.category] || flagshipBike.categoryName;
    const priceText = lang === 'ar' 
      ? `${(flagshipBike.priceNum * 50).toLocaleString()} جنيه` 
      : `${(flagshipBike.priceNum * 50).toLocaleString()} EGP`;

    let waText = '';
    if (lang === 'ar') {
      waText = 
`مرحباً، أريد حجز هذا ${vehicleType}:
الاسم: ${flagshipBike.name}
الفئة: ${arabicCategory}
السعر: ${priceText}
التاريخ: ${new Date().toISOString().split('T')[0]}
اسم الحجز: ${bentoBookingName}
رقم الهاتف: ${bentoBookingPhone}`;
    } else {
      waText = 
`Hello, I would like to book this ${vehicleType}:
Name: ${flagshipBike.name}
Category: ${flagshipBike.categoryName}
Price: ${priceText}
Date: ${new Date().toISOString().split('T')[0]}
Client Name: ${bentoBookingName}
Phone: ${bentoBookingPhone}`;
    }

    const targetPhone = '201007062123';
    const encodedText = encodeURIComponent(waText);
    const waUrl = `https://wa.me/${targetPhone}?text=${encodedText}`;

    // Persist bento booking to localStorage for the SaaS Dashboard
    try {
      const existingStr = localStorage.getItem('elkholy_bookings');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newBooking = {
        id: `book-${Date.now()}`,
        motorcycleId: flagshipBike.id,
        motorcycleName: flagshipBike.name,
        category: flagshipBike.category,
        price: flagshipBike.price,
        name: bentoBookingName,
        phone: bentoBookingPhone,
        email: 'N/A (Quick Booking)',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      existing.unshift(newBooking);
      localStorage.setItem('elkholy_bookings', JSON.stringify(existing));
    } catch (err) {
      console.error("Error saving quick booking:", err);
    }

    setBentoBookingName('');
    setBentoBookingPhone('');
    window.open(waUrl, '_blank');
  };

  // Persist favorites in client key storage
  useEffect(() => {
    localStorage.setItem('elkholy_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Dynamic design branding manager (Page Builder integration)
  useEffect(() => {
    // 1. Injected dynamic fonts stylesheet
    const fontId = 'dynamic-google-fonts';
    let link = document.getElementById(fontId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    
    const fontQueriesMap: Record<string, string> = {
      'Inter': 'family=Inter:wght@300;400;500;600;700&display=swap',
      'Poppins': 'family=Poppins:wght@300;400;500;600;700&display=swap',
      'Montserrat': 'family=Montserrat:wght@300;400;500;600;700&display=swap',
      'Roboto': 'family=Roboto:wght@300;400;500;700&display=swap',
      'Cairo': 'family=Cairo:wght@300;400;500;600;700;850&display=swap',
      'Tajawal': 'family=Tajawal:wght@300;400;500;700&display=swap',
      'IBM Plex Sans': 'family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap',
      'Open Sans': 'family=Open+Sans:wght@300;400;500;600;700&display=swap',
      'Lato': 'family=Lato:wght@300;400;700&display=swap',
      'Nunito': 'family=Nunito:wght@300;400;600;700&display=swap',
    };
    
    const activeFont = homepageConfig.font || 'Space Grotesk';
    const query = fontQueriesMap[activeFont] || 'family=Space+Grotesk:wght@300;400;500;600;700&display=swap';
    link.href = `https://fonts.googleapis.com/css2?${query}`;
    
    // 2. Injected dynamic styles tag to override general styles and spacings
    const styleId = 'dynamic-homepage-theme';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    
    const radiusMap: Record<string, string> = {
      'rounded-none': '0px',
      'rounded-md': '6px',
      'rounded-xl': '12px',
      'rounded-3xl': '24px',
      'rounded-full': '9999px',
    };
    const radValue = radiusMap[homepageConfig.theme.buttonRadius] || '12px';
    const spacingMult = homepageConfig.theme.spacingMultiplier || 1.0;
    
    styleTag.innerHTML = `
      :root {
        --color-brand-primary: ${homepageConfig.theme.primaryColor || '#6366F1'} !important;
        --color-brand-secondary: ${homepageConfig.theme.secondaryColor || '#A855F7'} !important;
        --color-brand-accent: ${homepageConfig.mainContent.iconColor || '#22D3EE'} !important;
        --color-brand-bg: ${homepageConfig.theme.backgroundColor || '#0B0F1A'} !important;
        --button-radius: ${radValue} !important;
        --spacing-scale: ${spacingMult} !important;
      }
      
      body {
        background-color: ${homepageConfig.theme.backgroundColor || '#0B0F1A'} !important;
        font-family: "${activeFont}", "Space Grotesk", "Cairo", sans-serif !important;
      }
      
      button, .rounded-xl, .rounded-2xl, .rounded-3xl, .glass-panel {
        border-radius: var(--button-radius) !important;
      }
    `;
  }, [homepageConfig]);

  // Handle section jumping
  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Toggle favorite bookmark (❤️)
  const handleToggleFavorite = (id: string, e: any) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  // Clear entire bookmarks
  const handleClearFavorites = () => {
    setFavorites([]);
  };

  // Favorites collection list lookup
  const favoriteBikes = useMemo(() => {
    return motorcyclesData.filter(bike => favorites.includes(bike.id));
  }, [favorites, motorcyclesData]);

  // Open booking modal
  const handleOpenBooking = (id: string, name: string, cat: CategorySlug, price: string, e?: any, selectedAddOnIds?: string[]) => {
    if (e) e.stopPropagation();
    setActiveBookItem({
      motorcycleId: id,
      motorcycleName: name,
      category: cat,
      price: price,
      preSelectedAddOnIds: selectedAddOnIds
    });
  };

  // Open PDF brochure
  const handleOpenPdf = (bike: Motorcycle, e: any) => {
    e.stopPropagation();
    setActivePdfItem(bike);
  };

  // Filters calculation logic
  const isFilterActive = useMemo(() => {
    return (
      filters.searchQuery.trim() !== '' ||
      filters.category !== 'ALL' ||
      filters.priceRange < 100000 ||
      speedRange > 100 ||
      filters.onlyPopular ||
      filters.sortBy !== 'default'
    );
  }, [filters, speedRange]);

  const filteredBikes = useMemo(() => {
    let result = [...motorcyclesData];

    // Search query calculation
    if (filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        bike =>
          bike.name.toLowerCase().includes(query) ||
          bike.tagline.toLowerCase().includes(query) ||
          bike.shortDesc.toLowerCase().includes(query) ||
          bike.specs.engine.toLowerCase().includes(query)
      );
    }

    // Category mapping
    if (filters.category !== 'ALL') {
      result = result.filter(bike => bike.category === filters.category);
    }

    // Price slider constraint
    result = result.filter(bike => bike.priceNum <= filters.priceRange);

    // Speed slider constraint
    result = result.filter(bike => {
      const speedVal = parseInt(bike.specs.topSpeed, 10);
      return speedVal >= speedRange;
    });

    // Popular switch
    if (filters.onlyPopular) {
      result = result.filter(bike => bike.isPopular);
    }

    // Sorting parameters
    if (filters.sortBy === 'price-asc') {
      result.sort((a, b) => a.priceNum - b.priceNum);
    } else if (filters.sortBy === 'price-desc') {
      result.sort((a, b) => b.priceNum - a.priceNum);
    } else if (filters.sortBy === 'speed-desc') {
      result.sort((a, b) => parseInt(b.specs.topSpeed, 10) - parseInt(a.specs.topSpeed, 10));
    }

    return result;
  }, [filters, speedRange, motorcyclesData]);

  // Reset helper
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'ALL',
      priceRange: 100000,
      sortBy: 'default',
      onlyPopular: false,
    });
    setSpeedRange(100);
  };

  const customSectionMeta = useMemo(() => {
    const mapAr = {
      A: { title: 'موتوسيكلات سبورت فئة (A)', desc: 'وحوش رياضية هجينة مصممة للتسارع الاستثنائي والتحكم المتفوق على حلبات السباق.' },
      B: { title: 'موتوسيكلات كروزر فئة (B)', desc: 'ملوك الطريق والترحال الطويل مع مقاعد وثيرة ورفاهية كروزر معززة هيدروليكياً.' },
      C: { title: 'دراجات مغامرات فئة (C)', desc: 'دراجات مخصصة للطرق الجبلية والوعرة قادرة على عبور الصحاري والدروب بأمان متين.' },
      S: { title: 'اسكوترات ذكية فئة (S)', desc: 'أسطورة الترحال الحضري والاسكوترات الكهربائية الخفيفة والسريعة للمدن الحديثة دون انبعاثات.' }
    };
    const mapEn = {
      A: { title: 'SPORT SEC-A FLEET', desc: 'Aerodynamic track predators built for extreme velocity and instant power response.' },
      B: { title: 'CRUISER SEC-B FLEET', desc: 'Sovereigns of the open road, featuring ultra-comfortable seating and magnetic suspension.' },
      C: { title: 'ADVENTURE SEC-C FLEET', desc: 'Heavy-duty plasma tourers engineered to bypass extreme terrains and desert storms.' },
      S: { title: 'SCOOTER SEC-S FLEET', desc: 'Fidelity lightweight electric vehicles designed for seamless, carbon-neutral city commuting.' }
    };
    return lang === 'ar' ? mapAr : mapEn;
  }, [lang]);

  return (
    <div className="relative min-h-screen bg-[#0B0F1A] text-gray-200 overflow-x-hidden selection:bg-brand-accent selection:text-[#0B0F1A] text-left">
      
      {/* Decorative cybernetic overlay scan lights */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-primary/40 via-brand-accent/50 to-brand-secondary/40 z-50 pointer-events-none" />

      {/* HEADER NAVBAR */}
      <Navbar 
        favoriteCount={favorites.length}
        onOpenFavorites={() => setFavoritesOpen(true)}
        onScrollToSection={handleScrollToSection}
        onOpenBooking={(id, name, cat, price) => handleOpenBooking(id, name, cat, price)}
        onOpenAdmin={() => setAdminOpen(true)}
        homepageConfig={homepageConfig}
      />

      {/* ===================== HERO BANNER LANDING COMPONENT ===================== */}
      <section 
        id="home" 
        className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(11, 15, 26, 0.7), rgba(11, 15, 26, 0.95)), url(${homepageConfig.header.backgroundImage || HERO_BG_IMAGE})` }}
      >
        {/* Dynamic atmospheric ambient glow bubbles */}
        <div className="absolute top-1/4 left-1/12 w-[350px] h-[350px] rounded-full bg-brand-primary/10 blur-[130px] pointer-events-none animate-pulse-slow font-sans" />
        <div className="absolute bottom-1/4 right-1/12 w-[300px] h-[300px] rounded-full bg-brand-accent/15 blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center" dir={dir}>
          
          {/* Hero text descriptor */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-6 text-left" dir={dir}>
            
            {homepageConfig.header.logoUrl && (
              <div className="mb-4 block">
                <img 
                  src={homepageConfig.header.logoUrl} 
                  alt="Brand Logo" 
                  className={`
                    ${homepageConfig.header.logoSize === 'small' ? 'h-10' : homepageConfig.header.logoSize === 'large' ? 'h-20' : 'h-14'}
                    ${homepageConfig.header.logoEffect === 'glow' ? 'shadow-[0_0_20px_rgba(34,211,238,0.6)] border border-[#22D3EE]/30 bg-[#22D3EE]/5 px-4 py-2 rounded-2xl' : ''}
                    ${homepageConfig.header.logoEffect === 'neon' ? 'shadow-[0_0_25px_rgba(168,85,247,0.73)] border border-[#A855F7]/40 bg-[#A855F7]/10 px-4 py-2 rounded-2xl' : ''}
                    ${homepageConfig.header.logoEffect === 'shadow' ? 'shadow-2xl shadow-black bg-black/60 px-4 py-2 rounded-2xl border border-white/5' : 'px-2 py-1'}
                    object-contain max-w-[280px] transition-all duration-300 hover:scale-105
                  `}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full">
              <span className="h-2 w-2 rounded-full bg-[#22D3EE] animate-ping" />
              <span className="text-xs font-mono tracking-widest text-[#22D3EE] font-extrabold uppercase">
                {customBadgeText}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black font-sans tracking-tight text-white uppercase leading-none">
              {customTitleText} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent glow-cyan">
                {customTitleAccent}
              </span>
            </h1>

            <p className="text-lg font-mono text-brand-accent tracking-widest font-semibold italic">
              "{customHeroSlogan}"
            </p>

            <p className="max-w-xl text-base text-gray-400 font-sans leading-relaxed">
              {customHeroDesc}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => handleScrollToSection('gallery')}
                className="px-8 py-3.5 rounded-xl font-mono text-xs tracking-widest font-bold text-[#0B0F1A] bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent hover:brightness-115 active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-brand-primary/20 hover:shadow-brand-accent/30 uppercase"
              >
                {t('explore_vehicles')}
              </button>
              
              <button
                onClick={() => handleOpenBooking('sport-cybersport-v4', 'ElKholy CyberSport V4', 'A', '$42,500')}
                className="px-8 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-gray-300 hover:text-white hover:border-brand-accent font-mono text-xs tracking-widest font-bold transition-all hover:bg-white/[0.05]"
              >
                {t('quick_book')}
              </button>
            </div>

          </div>

          {/* Side statistics interactive diagnostics board */}
          <div className="lg:col-span-12 xl:col-span-5" dir="ltr">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel border border-[#6366F1]/20 rounded-3xl p-6 sm:p-8 space-y-6 relative box-glow-indigo overflow-hidden text-left"
            >
              {/* Blur panel */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-brand-accent/10 rounded-full blur-xl" />

              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-mono text-gray-400 font-bold tracking-widest flex items-center gap-1.5 uppercase">
                  <Target className="w-4 h-4 text-brand-accent animate-spin-slow" /> {t('performance_title')}
                </span>
                <span className="px-2 py-0.5 bg-black/50 text-[9px] font-mono rounded border border-white/5 text-gray-500 font-extrabold uppercase">
                  {t('real_time_sys')}
                </span>
              </div>

              {/* Stat elements */}
              <div className="space-y-4 font-mono">
                
                <div className="flex justify-between items-center bg-black/30 p-3 rounded-2xl border border-white/[0.03]">
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono tracking-widest block uppercase">{t('max_horsepower')}</span>
                    <span className="text-xl font-bold font-mono text-white tracking-widest">240 HP / 310 Nm</span>
                  </div>
                  <span className="text-xs font-mono text-brand-accent font-black tracking-widest animate-pulse px-2 py-1 bg-brand-accent/10 rounded">MAX</span>
                </div>

                <div className="flex justify-between items-center bg-black/30 p-3 rounded-2xl border border-white/[0.03]">
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono tracking-widest block uppercase">{t('carbon_emissions')}</span>
                    <span className="text-sm font-bold font-mono text-white tracking-widest uppercase">{t('carbon_emissions_val')}</span>
                  </div>
                  <span className="text-xs font-mono text-green-400 font-black tracking-widest px-2 py-1 bg-green-500/10 rounded">100% ECO</span>
                </div>

                <div className="flex justify-between items-center bg-black/30 p-3 rounded-2xl border border-white/[0.03]">
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono tracking-widest block uppercase">{t('top_speed_cap')}</span>
                    <span className="text-xl font-bold font-mono text-white tracking-widest">{t('top_speed_val')}</span>
                  </div>
                  <span className="text-xs font-mono text-brand-secondary font-black tracking-widest px-2 py-1 bg-brand-secondary/10 rounded">HYPER</span>
                </div>

              </div>

              <div className="text-[9px] font-mono text-gray-500 text-center flex items-center justify-center gap-1.5 pt-2 border-t border-white/[0.05]">
                <Shield className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span className="font-bold uppercase">{t('warranty_info')}</span>
              </div>

            </motion.div>
          </div>

        </div>

        {/* Scroll helper */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[10px] font-mono text-gray-500 animate-bounce pointer-events-none uppercase">
          <span>{lang === 'ar' ? 'انزل لأسفل لعرض صالة الألعاب' : 'SCROLL FOR SHOWROOM'}</span>
          <ArrowDown className="w-4 h-4 text-brand-accent" />
        </div>
      </section>

      {/* ===================== DYNAMIC PAGE BUILDER CUSTOM HTML SECTION ===================== */}
      {homepageConfig.header.customHtml && (
        <section 
          className="py-12 border-y border-white/[0.04] bg-white/[0.01] relative z-20"
          dangerouslySetInnerHTML={{ __html: homepageConfig.header.customHtml }}
        />
      )}

      {/* ===================== SHOWROOM CONTENT SECTION ===================== */}
      <section id="categories" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir={dir}>
        
        {/* Dynamic controls and list structure */}
        <div className="mb-12">
          <FilterSection 
            filters={filters}
            onFilterChange={setFilters}
            speedRange={speedRange}
            onSpeedRangeChange={setSpeedRange}
          />
        </div>

        {/* ===================== SHINY BENTO SECTIONS CONTAINER ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16 relative z-10" dir={dir}>
          
          {/* BENTO CARD 1: CATEGORIES SELECTOR BOARD (col-span-12 lg:col-span-3) */}
          <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden group text-left" dir={dir}>
            <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-tr from-brand-secondary/5 to-transparent blur-xl pointer-events-none" />
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-brand-secondary font-bold mb-4 font-mono">{lang === 'ar' ? 'توصيف الفئات الحالية' : 'Select Category'}</h3>
              <div className="space-y-3">
                {([
                  { code: 'ALL', label: t('cat_ALL'), desc: lang === 'ar' ? 'عرض الـ 16 طراز بالكامل' : 'Show all cyber models' },
                  { code: 'A', label: t('cat_A'), desc: lang === 'ar' ? 'الرياضية الاستثنائية الحرة' : 'Aerodynamic Predators' },
                  { code: 'B', label: t('cat_B'), desc: lang === 'ar' ? 'رحلات ملوك الطريق السريع' : 'Sovereigns of Highway' },
                  { code: 'C', label: t('cat_C'), desc: lang === 'ar' ? 'مغامرات تخترق الآفاق الرملية' : 'Uncharted Horizons' },
                  { code: 'S', label: t('cat_S'), desc: lang === 'ar' ? 'اسكوتر المدن الذكية الموفر' : 'Neo-Urban Mobility' }
                ] as const).map((cat) => {
                  const isActive = filters.category === cat.code;
                  return (
                    <div 
                      key={cat.code}
                      onClick={() => setFilters({ ...filters, category: cat.code })}
                      className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-300 ${
                        isActive 
                          ? 'bg-brand-primary/20 border-brand-primary/50 text-white shadow-md' 
                          : 'bg-white/[0.02] border-white/5 hover:border-brand-accent/50 text-gray-300'
                      }`}
                    >
                      <div className="text-left" dir={dir}>
                        <p className="text-xs font-bold font-mono tracking-wide uppercase">{cat.label}</p>
                        <p className="text-[9px] text-gray-500 font-sans mt-0.5">{cat.desc}</p>
                      </div>
                      <span className={`text-[#22D3EE] text-sm transition-transform duration-300 ${isActive ? (dir === 'rtl' ? '-translate-x-1 rotate-180' : 'translate-x-1') : 'opacity-0'}`}>→</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Promotion Section */}
            <div className="mt-6 p-4 bg-gradient-to-t from-brand-accent/10 to-transparent border border-brand-accent/20 rounded-xl relative overflow-hidden text-left" dir={dir}>
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-brand-accent/5 rounded-full blur-md" />
              <p className="text-[10px] uppercase font-bold text-brand-accent mb-1 tracking-widest font-mono">{t('active_offer')}</p>
              <p className="text-sm font-bold text-white uppercase tracking-wider">{t('free_service')}</p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t('valid_util')}</p>
            </div>
          </div>

          {/* BENTO CARD 2: BIG FLAGSHIP BIKE HERO DISPLAY (col-span-12 lg:col-span-6) */}
          <div className="lg:col-span-6 min-h-[380px] relative bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 rounded-3xl overflow-hidden group flex flex-col justify-between p-6 shadow-2xl text-left" dir={dir}>
            {/* Ambient overlay background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: `url(${flagshipBike.image})` }}
            />
            {/* Visual bottom contrast shadow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

            {/* Header / specs labels */}
            <div className="relative z-10 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#6366F1] text-[10px] font-bold tracking-widest rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] font-mono uppercase">
                  {filters.category === 'ALL' ? 'FLAGSHIP 2026' : `POPULAR IN ${t('cat_' + filters.category)}`}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter mt-4 text-white uppercase font-sans" dir="ltr">
                {flagshipBike.name.replace('ElKholy ', '')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-secondary">SPEC</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 max-w-md mt-2 font-medium leading-relaxed font-sans">
                {flagshipBike.shortDesc}
              </p>

              {/* Core Specs row metrics */}
              <div className="grid grid-cols-2 gap-4 max-w-sm mt-5">
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-gray-400 text-left">
                  <span className="block uppercase text-gray-500">{t('drive_engine')}</span>
                  <span className="text-white font-bold truncate block mt-0.5" dir="ltr">{flagshipBike.specs.engine.split(' ')[0]} Drive</span>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-gray-400 text-left">
                  <span className="block uppercase text-gray-500">{t('clock_speed')}</span>
                  <span className="text-brand-accent font-black block mt-0.5" dir="ltr">{flagshipBike.specs.topSpeed}</span>
                </div>
              </div>
            </div>

            {/* Price tag + CTA actions */}
            <div className="relative z-10 flex items-center justify-between mt-8 pt-4 border-t border-white/[0.08]" dir={dir}>
              <div className="text-left" dir={dir}>
                <p className="text-2xl font-mono font-bold text-[#22D3EE] drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                  {lang === 'ar' ? `${(flagshipBike.priceNum * 50).toLocaleString()} جنيه` : `${(flagshipBike.priceNum * 50).toLocaleString()} EGP`}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-gray-550 font-mono font-bold mt-0.5">{t('starting_price')}</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={(e) => handleToggleFavorite(flagshipBike.id, e)}
                  className="w-11 h-11 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/15 transition-all text-sm relative"
                  title="Bookmark Flagship"
                >
                  <span className={favorites.includes(flagshipBike.id) ? "text-red-500 scale-110" : "text-gray-400"}>
                    {favorites.includes(flagshipBike.id) ? '❤️' : '🤍'}
                  </span>
                </button>
                <button
                  onClick={() => handleOpenBooking(flagshipBike.id, flagshipBike.name, flagshipBike.category, flagshipBike.price)}
                  className="px-6 py-2.5 bg-white text-black font-extrabold uppercase text-xs rounded-full hover:bg-brand-accent hover:text-black transition-all cursor-pointer font-mono tracking-widest shadow-md"
                >
                  {t('explore_specs').toUpperCase()}
                </button>
              </div>
            </div>
          </div>

          {/* BENTO CARD 3: RESERVATION TERMINAL INPUT TILE (col-span-12 lg:col-span-3) */}
          <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-lg flex flex-col justify-between relative overflow-hidden" dir={dir}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-left" dir={dir}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-center mb-5 text-[#22D3EE] font-mono">{t('digital_reservation')}</h3>
              
              <div className="space-y-3.5">
                <div className="space-y-1 text-left" dir={dir}>
                  <label className="text-[9px] uppercase text-gray-500 tracking-wider font-mono block">{t('full_name')}</label>
                  <input 
                    type="text" 
                    placeholder={t('full_name_placeholder')}
                    value={bentoBookingName}
                    onChange={(e) => setBentoBookingName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1] placeholder-gray-600 transition-colors font-sans text-left" dir={dir}
                  />
                </div>
                
                <div className="space-y-1 block text-left" dir={dir}>
                  <label className="text-[9px] uppercase text-gray-500 tracking-wider font-mono block">{t('contact_number')}</label>
                  <input 
                    type="tel" 
                    placeholder={t('phone_placeholder')}
                    value={bentoBookingPhone}
                    onChange={(e) => setBentoBookingPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1] placeholder-gray-600 transition-colors font-mono"
                  />
                </div>

                <div className="p-3 bg-brand-secondary/10 border border-brand-secondary/20 rounded-xl mt-3 text-left" dir={dir}>
                  <div className="flex justify-between text-[10px] font-bold font-mono">
                    <span className="text-gray-400">{t('target_model')}:</span>
                    <span className="text-brand-secondary truncate max-w-[120px] font-sans" dir="ltr">{flagshipBike.name.replace('ElKholy ', '')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold font-mono mt-1">
                    <span className="text-gray-400">{t('estimated_price')}:</span>
                    <span className="text-brand-secondary">
                      {lang === 'ar' ? `${(flagshipBike.priceNum * 50).toLocaleString()} جنيه` : `${(flagshipBike.priceNum * 50).toLocaleString()} EGP`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button 
                onClick={handleBentoBookingSubmit}
                className="w-full py-3.5 bg-gradient-to-r from-[#22D3EE] to-[#6366F1] text-black font-black uppercase text-xs tracking-wider rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 active:scale-95 transition-all mt-5 cursor-pointer font-mono"
              >
                {t('confirm_whatsapp')}
              </button>
              <p className="text-[8px] text-center text-gray-600 mt-3 uppercase tracking-widest font-mono">SECURE GPRS ENCRYPTION ACTIVE v2.26</p>
            </div>
          </div>

        </div>

        {/* Dynamic render switch */}
        <AnimatePresence mode="wait">
          {isFilterActive ? (
            // Unified grid view for filtered outputs
            <motion.div
              key="filtered-showroom-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
              dir={dir}
            >
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-3" dir={dir}>
                <p className="font-mono text-xs text-brand-accent font-bold tracking-widest uppercase">
                  {t('matching_vehicles', { count: filteredBikes.length })}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-mono text-gray-450 hover:text-white underline cursor-pointer"
                >
                  {t('clear_filters')}
                </button>
              </div>

              {filteredBikes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredBikes.map((bike) => (
                    <MotorcycleCard 
                      key={bike.id}
                      bike={bike}
                      isFavorite={favorites.includes(bike.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onOpenPdf={handleOpenPdf}
                      onOpenBooking={handleOpenBooking}
                    />
                  ))}
                </div>
              ) : (
                // Clean empty diagnostics screen
                <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl p-6" dir={dir}>
                  <Bike className="w-12 h-12 text-gray-600 mx-auto mb-4 animate-bounce" />
                  <p className="font-mono text-base font-bold text-white uppercase mb-2">
                    {t('empty_showroom')}
                  </p>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto font-sans leading-relaxed">
                    {t('empty_desc')}
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-6 px-6 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-brand-primary to-brand-accent text-white uppercase cursor-pointer"
                  >
                    {t('reset_shield')}
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            // Default 4 sections structure (A, B, C, S) which complies exactly to user specifications
            <motion.div
              key="static-sections-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-24 animate-fade-in"
              dir={dir}
            >
              {(['A', 'B', 'C', 'S'] as CategorySlug[]).map((catCode) => {
                const sectionMeta = customSectionMeta[catCode];
                const sectionBikes = filteredBikes.filter(bike => bike.category === catCode);

                return (
                  <div 
                    key={catCode} 
                    id={`section-${catCode}`}
                    className="space-y-8 scroll-mt-24 text-left"
                    dir={dir}
                  >
                    
                    {/* Glowing section headers */}
                    <div className="relative border-b border-white/[0.06] pb-4" dir={dir}>
                      {/* Vertical side glowing accent bar */}
                      <div className={`absolute top-0 bottom-4 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-1 bg-gradient-to-b from-brand-accent to-brand-primary rounded-full`} />
                      
                      <div className={`${dir === 'rtl' ? 'pr-4' : 'pl-4'} flex flex-col md:flex-row md:items-end justify-between gap-4`}>
                        <div className="max-w-2xl text-left" dir={dir}>
                          <h2 className="text-2xl sm:text-3.5xl font-black font-sans tracking-tight text-white uppercase flex items-center gap-1.5 leading-none">
                            {sectionMeta.title}
                          </h2>
                          <p className="text-sm text-gray-400 font-sans leading-relaxed mt-2 pr-4">
                            {sectionMeta.desc}
                          </p>
                        </div>

                        {/* Order classification indicator */}
                        <div className="font-mono text-[10px] text-gray-500 border border-white/5 py-1 px-3 bg-[#0B0F1A] rounded-xl shrink-0 h-fit select-none">
                          FLEET MODEL: SECTION-{catCode}
                        </div>
                      </div>
                    </div>

                    {/* Responsive Grid of Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {sectionBikes.map((bike) => (
                        <MotorcycleCard 
                          key={bike.id}
                          bike={bike}
                          isFavorite={favorites.includes(bike.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onOpenPdf={handleOpenPdf}
                          onOpenBooking={handleOpenBooking}
                        />
                      ))}
                    </div>

                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </section>

      {/* ===================== FOOTER ===================== */}
      <ContactFooter onScrollToSection={handleScrollToSection} homepageConfig={homepageConfig} />

      {/* ===================== SECURE ADMIN TUNNEL PANEL OVERLAY ===================== */}
      <AnimatePresence>
        {adminOpen && (
          <AdminPanel 
            onClose={() => setAdminOpen(false)}
            motorcycles={motorcyclesData}
            onUpdateMotorcycles={(updated) => {
              setMotorcyclesData(updated);
              localStorage.setItem('elkholy_motorcycles', JSON.stringify(updated));
            }}
            customText={customText}
            onUpdateCustomText={(updatedText) => {
              setCustomText(updatedText);
              localStorage.setItem('elkholy_custom_text', JSON.stringify(updatedText));
            }}
            homepageConfig={homepageConfig}
            onUpdateHomepageConfig={(updatedConfig) => {
              setHomepageConfig(updatedConfig);
              localStorage.setItem('elkholy_homepage_config', JSON.stringify(updatedConfig));
            }}
          />
        )}
      </AnimatePresence>

      {/* ===================== BOOKINGS DYNAMIC OVERLAY CONTAINER ===================== */}
      <AnimatePresence>
        {activeBookItem && (
          <BookingModal 
            motorcycleId={activeBookItem.motorcycleId}
            motorcycleName={activeBookItem.motorcycleName}
            category={activeBookItem.category}
            price={activeBookItem.price}
            preSelectedAddOnIds={activeBookItem.preSelectedAddOnIds}
            onClose={() => setActiveBookItem(null)}
          />
        )}
      </AnimatePresence>

      {/* ===================== PDF CATALOG MODAL OVERLAY GATE ===================== */}
      <AnimatePresence>
        {activePdfItem && (
          <PdfModal 
            bike={activePdfItem}
            onClose={() => setActivePdfItem(null)}
          />
        )}
      </AnimatePresence>

      {/* ===================== BOOKMARKS FAVORITES SIDEBAR DRAWER ===================== */}
      <AnimatePresence>
        {favoritesOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
            {/* Backdrop click dismiss */}
            <div 
              onClick={() => setFavoritesOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
            />

            <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} max-w-full flex`}>
              <motion.div
                initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: dir === 'rtl' ? '-100%' : '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-screen max-w-md bg-[#0F172A]/95 border-l border-white/[0.08] backdrop-blur-xl relative flex flex-col justify-between"
              >
                
                {/* Header Row */}
                <div className="p-6 border-b border-white/[0.08] flex items-center justify-between" dir={dir}>
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
                    <div className="text-left" dir={dir}>
                      <h3 className="text-base font-bold font-mono tracking-widest text-white uppercase">{t('garage')}</h3>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">{t('bookmarked_vehicles')} ({favoriteBikes.length})</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setFavoritesOpen(false)}
                    className="p-1.5 rounded-lg bg-white/[0.03] text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Items Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4" dir={dir}>
                  {favoriteBikes.length > 0 ? (
                    favoriteBikes.map((bike) => (
                      <div 
                        key={bike.id}
                        className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-2xl p-3 hover:border-brand-accent/25 transition-all group"
                        dir={dir}
                      >
                        <div className="w-20 h-16 bg-[#111827] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-1 relative shrink-0">
                          <img 
                            src={bike.image} 
                            alt={bike.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="flex-1 min-w-0 text-left" dir={dir}>
                          <span className="text-[9px] font-mono font-bold tracking-wider text-brand-accent block">
                            SECTION-{bike.category}
                          </span>
                          <span className="text-sm font-bold text-white truncate block font-sans" dir="ltr">
                            {bike.name}
                          </span>
                          <span className="text-xs font-mono text-gray-400 font-bold">
                            {lang === 'ar' ? `${(bike.priceNum * 50).toLocaleString()} جنيه` : `${(bike.priceNum * 50).toLocaleString()} EGP`}
                          </span>
                        </div>

                        {/* Quick Action buttons */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setFavoritesOpen(false);
                              handleOpenBooking(bike.id, bike.name, bike.category, bike.price);
                            }}
                            className="p-1.5 bg-brand-primary hover:bg-brand-accent text-[#0B0F1A] rounded-lg transition-colors cursor-pointer"
                            title="Quick Book Catalog"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          </button>
                          <button
                            onClick={(e) => handleToggleFavorite(bike.id, e)}
                            className="p-1.5 bg-white/5 hover:bg-red-500/15 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>

                      </div>
                    ))
                  ) : (
                    // Empty showcase
                    <div className="text-center py-24 text-gray-500 space-y-3 font-mono">
                      <Bike className="w-12 h-12 text-gray-700 mx-auto animate-pulse" />
                      <p className="text-xs uppercase text-gray-400 font-extrabold tracking-widest">
                        {lang === 'ar' ? 'الجراج الإلكتروني للتسوق فارغ' : 'Garage is Vacant'}
                      </p>
                      <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed font-sans normal-case text-center">
                        {lang === 'ar' 
                          ? 'راجع الأطقم المتوفرة في المعرض واضغط على زر القلب لحفظها هنا لتقارن بينها بسرعة وبدء الحجز.'
                          : 'Review the models & click the ❤️ icon on cards to save them here for fast comparisons and reservation actions.'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                {favoriteBikes.length > 0 && (
                  <div className="p-6 border-t border-white/[0.08] bg-[#070A11]/60 space-y-3" dir={dir}>
                    <button
                      onClick={handleClearFavorites}
                      className="w-full py-2.5 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs font-mono font-bold tracking-widest transition-colors cursor-pointer"
                    >
                      {t('vacate_garage').toUpperCase()} (🗑)
                    </button>
                    <button
                      onClick={() => {
                        setFavoritesOpen(false);
                        handleScrollToSection('categories');
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-[#0B0F1A] text-xs font-mono font-bold tracking-widest transition-all text-center cursor-pointer hover:brightness-110 active:scale-95"
                    >
                      {t('return_showroom').toUpperCase()}
                    </button>
                  </div>
                )}

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
