/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bike, Shield, Heart, Menu, X, ArrowUpRight, Settings, Globe, ShoppingCart } from 'lucide-react';
import { CategorySlug, HomepageConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  favoriteCount: number;
  cartItemCount: number;
  cartTotal: number;
  activeView: 'home' | 'store';
  onNavigate: (view: 'home' | 'store') => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenBooking: (motorcycleId: string, motorcycleName: string, category: CategorySlug, price: string) => void;
  onOpenAdmin: () => void;
  homepageConfig?: HomepageConfig;
}

export default function Navbar({
  favoriteCount,
  cartItemCount,
  cartTotal,
  activeView,
  onNavigate,
  onOpenCart,
  onOpenFavorites,
  onScrollToSection,
  onOpenBooking,
  onOpenAdmin,
  homepageConfig,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const { lang, setLang, dir, t } = useLanguage();

  const logoUrl = homepageConfig?.header?.logoUrl;
  const logoText = lang === 'ar' ? (homepageConfig?.header?.logoTextAr || 'الخولي') : (homepageConfig?.header?.logoText || 'ELKHOLY');
  const logoAccent = lang === 'ar' ? (homepageConfig?.header?.accentAr || 'موتورز') : (homepageConfig?.header?.accent || 'MOTORS');
  const logoSize = homepageConfig?.header?.logoSize || 'medium';
  const logoEffect = homepageConfig?.header?.logoEffect || 'glow';
  const logoPosition = homepageConfig?.header?.logoPosition || 'left';

  const renderLogo = () => {
    // size classes
    let sizeClass = 'h-10';
    if (logoSize === 'small') sizeClass = 'h-8';
    if (logoSize === 'large') sizeClass = 'h-14';

    // effect classes
    let effectClass = '';
    if (logoEffect === 'glow') effectClass = 'shadow-[0_0_15px_rgba(34,211,238,0.55)] border border-[#22D3EE]/30 bg-[#22D3EE]/5 px-2 py-1 rounded-xl';
    if (logoEffect === 'neon') effectClass = 'shadow-[0_0_20px_rgba(168,85,247,0.65)] border border-[#A855F7]/40 bg-[#A855F7]/10 px-2 py-1 rounded-xl';
    if (logoEffect === 'shadow') effectClass = 'shadow-2xl shadow-black/80 bg-black/50 px-2 py-1 rounded-xl border border-white/5';

    if (logoUrl) {
      return (
        <div className="flex items-center gap-2.5">
          <img 
            src={logoUrl} 
            alt="ElKholy Motors Logo" 
            className={`${sizeClass} ${effectClass} object-contain transition-all duration-300 hover:scale-105`}
            referrerPolicy="no-referrer"
          />
          {(homepageConfig?.header?.logoText || homepageConfig?.header?.logoTextAr) && (
            <div className="text-left">
              <span className="text-base sm:text-lg font-bold tracking-wider text-white">
                {logoText} <span className="text-brand-accent">{logoAccent}</span>
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent p-[1px] shadow-lg shadow-brand-primary/10">
          <div className="w-full h-full bg-[#0B0F1A] rounded-xl flex items-center justify-center transition-transform group-hover:scale-95 duration-300">
            <Bike className="w-5 h-5 text-brand-accent group-hover:text-brand-secondary transition-colors duration-300" />
          </div>
        </div>
        <div>
          <span className="text-xl font-bold tracking-wider text-white">
            {logoText} <span className="text-brand-accent group-hover:text-brand-secondary transition-colors duration-300">{logoAccent}</span>
          </span>
          <p className="text-[9px] text-gray-500 font-mono tracking-[0.25em] uppercase">
            {t('slogan')}
          </p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Determine active target based on scroll position
      const sections = ['home', 'gallery', 'categories', 'footer'];
      for (const sect of sections) {
        const el = document.getElementById(sect);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveTab(sect);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string, view: 'home' | 'store' = 'home') => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    onNavigate(view);
    if (view === 'home' && id !== 'store') {
        onScrollToSection(id);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0B0F1A]/75 backdrop-blur-md border-b border-white/[0.06] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo - click returns Home */}
          <div 
            onClick={() => handleNavClick('home', 'home')}
            className={`cursor-pointer ${logoPosition === 'center' ? 'lg:absolute lg:start-1/2 lg:-translate-x-1/2 flex justify-center' : ''}`}
          >
            {renderLogo()}
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6 font-mono text-xs font-semibold">
            {[
              { id: 'home', label: t('home'), view: 'home' },
              { id: 'categories', label: t('categories'), view: 'home' },
              { id: 'gallery', label: t('showroom'), view: 'home' },
              { id: 'store', label: lang === 'ar' ? 'المتجر' : 'Store', view: 'store' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleNavClick(tab.id, tab.view as 'home' | 'store')}
                className={`relative px-1 py-2 cursor-pointer transition-colors duration-200 uppercase tracking-widest ${
                  (activeView === tab.view && (activeView !== 'home' || activeTab === tab.id)) ? 'text-brand-accent' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {(activeView === tab.view && (activeView !== 'home' || activeTab === tab.id)) && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-primary to-brand-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Language Selection Controller */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 font-mono text-[10px] items-center relative z-20">
              <button
                onClick={() => setLang('ar')}
                className={`px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                  lang === 'ar'
                    ? 'bg-brand-accent text-[#0B0F1A] font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="العربية"
              >
                🇪🇬 عربي
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                  lang === 'en'
                    ? 'bg-brand-primary text-white font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="English"
              >
                🇺🇸 EN
              </button>
            </div>

            {/* Admin Dashboard Gear icon */}
            <button
              onClick={onOpenAdmin}
              className="p-2.5 rounded-xl border border-white/[0.08] hover:border-brand-primary bg-[#0B0F1A]/50 hover:bg-brand-primary/10 transition-colors cursor-pointer text-gray-400 hover:text-white"
              title={t('admin_panel')}
            >
              <Settings className="w-5 h-5 animate-spin-slow" />
            </button>

            {/* Cart Icon Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl border border-white/[0.08] hover:border-brand-accent bg-[#0B0F1A]/50 transition-colors cursor-pointer group"
              title={lang === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
              id="cart-btn"
            >
              <ShoppingCart className="w-5 h-5 text-white group-hover:text-brand-accent transition-colors" />
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-white text-[9px] font-bold font-mono"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Favorites Icon Button */}
            <button
              onClick={onOpenFavorites}
              className="relative p-2.5 rounded-xl border border-white/[0.08] hover:border-brand-accent bg-[#0B0F1A]/50 transition-colors cursor-pointer group"
              title={t('garage')}
              id="favorite-btn"
            >
              <Heart className={`w-5 h-5 transition-colors ${favoriteCount > 0 ? 'fill-red-500 text-red-500' : 'text-white group-hover:text-brand-accent'}`} />
              <AnimatePresence>
                {favoriteCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[#0B0F1A] text-[9px] font-bold font-mono"
                  >
                    {favoriteCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Quick Booking CTA */}
            <button
              onClick={() => onOpenBooking('sport-cybersport-v4', 'ElKholy CyberSport V4', 'A', '$42,500')}
              className="px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider font-semibold text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/20 pointer-events-auto cursor-pointer glow-border flex items-center gap-1.5"
              id="desktop-book-btn"
            >
              <span>{t('book_now')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile action controls & Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            
            {/* Quick Language switch on mobile directly */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="p-2 rounded-lg border border-white/[0.08] bg-[#0B0F1A]/50 text-xs text-brand-accent font-mono cursor-pointer uppercase font-bold"
              title="Toggle Language"
            >
              {lang === 'ar' ? '🇺🇸' : '🇪🇬'}
            </button>

            {/* Admin button mobile */}
            <button
              onClick={onOpenAdmin}
              className="p-2 rounded-lg border border-white/[0.08] bg-[#0B0F1A]/50 text-gray-400 hover:text-white"
              title={t('admin_panel')}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Cart Mobile */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-lg border border-white/[0.08] bg-[#0B0F1A]/50 text-white"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-primary text-white text-[8px] font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenFavorites}
              className="relative p-2 rounded-lg border border-white/[0.08] bg-[#0B0F1A]/50 text-white"
              id="mobile-fav-btn"
            >
              <Heart className={`w-4 h-4 ${favoriteCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-accent text-[#0B0F1A] text-[8px] font-bold">
                  {favoriteCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-white/[0.08] bg-[#0B0F1A]/50 text-white cursor-pointer"
              aria-label="Toggle menu"
              id="hamburger-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-b border-white/[0.08] bg-[#0F172A]/95 backdrop-blur-lg"
          >
            <div className="px-5 pt-3 pb-6 space-y-4">
              <div className="flex flex-col gap-2">
                {[
                  { id: 'home', label: t('home'), view: 'home' },
                  { id: 'categories', label: t('categories'), view: 'home' },
                  { id: 'gallery', label: t('showroom'), view: 'home' },
                  { id: 'store', label: lang === 'ar' ? 'المتجر' : 'Store', view: 'store' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleNavClick(tab.id, tab.view as 'home' | 'store')}
                    className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'} py-2 font-mono text-sm tracking-widest uppercase ${
                      (activeView === tab.view && (activeView !== 'home' || activeTab === tab.id)) ? 'text-brand-accent font-semibold' : 'text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="border-t border-white/5 pt-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBooking('sport-cybersport-v4', 'ElKholy CyberSport V4', 'A', '$42,500');
                  }}
                  className="w-full py-3 rounded-lg text-center font-mono text-xs tracking-widest font-bold bg-gradient-to-r from-brand-primary to-brand-secondary text-white uppercase"
                >
                  {t('book_now')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
