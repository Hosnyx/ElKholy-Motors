/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bike, Instagram, Facebook, MessageCircle, MapPin, Phone, Mail, Clock, ArrowUp, Sparkles, ChevronDown, ChevronUp, Youtube } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { HomepageConfig } from '../types';

interface FooterProps {
  onScrollToSection: (sectionId: string) => void;
  homepageConfig: HomepageConfig;
}

export default function ContactFooter({ onScrollToSection, homepageConfig }: FooterProps) {
  const { lang, dir, t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!homepageConfig?.footer || homepageConfig.footer.visible === false) {
    return null;
  }

  const fbLink = homepageConfig.footer.socialLinks?.facebook || "https://facebook.com";
  const igLink = homepageConfig.footer.socialLinks?.instagram || "https://instagram.com";
  const waLink = homepageConfig.footer.socialLinks?.whatsapp || "https://wa.me/201007062123";
  const ytLink = homepageConfig.footer.socialLinks?.youtube || "https://youtube.com";

  const logoUrl = homepageConfig?.header?.logoUrl;
  const logoText = lang === 'ar' ? (homepageConfig?.header?.logoTextAr || 'الخولي') : (homepageConfig?.header?.logoText || 'ELKHOLY');
  const logoAccent = lang === 'ar' ? (homepageConfig?.header?.accentAr || 'موتورز') : (homepageConfig?.header?.accent || 'MOTORS');
  const logoSize = homepageConfig?.header?.logoSize || 'medium';
  const logoEffect = homepageConfig?.header?.logoEffect || 'glow';
  const logoPosition = homepageConfig?.header?.logoPosition || 'left';

  const renderLogo = () => {
    let sizeClass = 'h-10';
    if (logoSize === 'small') sizeClass = 'h-8';
    if (logoSize === 'large') sizeClass = 'h-14';

    let effectClass = '';
    if (logoEffect === 'glow') effectClass = 'shadow-[0_0_15px_rgba(34,211,238,0.55)] border border-[#22D3EE]/30 bg-[#22D3EE]/5 px-2 py-1 rounded-xl';
    if (logoEffect === 'neon') effectClass = 'shadow-[0_0_20px_rgba(168,85,247,0.65)] border border-[#A855F7]/40 bg-[#A855F7]/10 px-2 py-1 rounded-xl';
    if (logoEffect === 'shadow') effectClass = 'shadow-2xl shadow-black/80 bg-black/50 px-2 py-1 rounded-xl border border-white/5';

    if (logoUrl) {
      return (
        <div className={`flex items-center gap-2.5 ${logoPosition === 'center' ? 'mx-auto justify-center' : ''}`}>
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
      <div className={`flex items-center gap-3 ${logoPosition === 'center' ? 'mx-auto justify-center' : ''} group`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent p-[0.5px]">
          <div className="w-full h-full bg-[#070A11] rounded-xl flex items-center justify-center">
            <Bike className="w-5 h-5 text-brand-accent animate-pulse" />
          </div>
        </div>
        <div className="text-left" dir={dir}>
          <span className="text-lg font-bold tracking-wider text-white select-none">
            {logoText} <span className="text-brand-accent">{logoAccent}</span>
          </span>
          <p className="text-[8px] text-gray-500 font-mono tracking-widest uppercase">{t('slogan')}</p>
        </div>
      </div>
    );
  };

  return (
    <footer id="footer" className="relative border-t border-white/[0.08] bg-[#070A11] pt-12 pb-8 overflow-hidden text-left" dir={dir}>
      
      {/* Visual background lights */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[300px] h-[300px] rounded-full bg-brand-accent/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Collapsible toggle header */}
        {homepageConfig.footer.collapsible && (
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{lang === 'ar' ? '▼ خيارات العرض والطي متوفرة للفوتر' : '▼ COLLAPSIBLE FOOTER REGIONS'}</span>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-brand-accent bg-[#0B0F1A]/50 text-gray-400 hover:text-white transition-all text-xs font-mono cursor-pointer"
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-brand-accent" /> : <ChevronUp className="w-3.5 h-3.5 text-brand-secondary" />}
              <span>{isCollapsed ? (lang === 'ar' ? 'توسيع القائمة' : 'EXPAND FOOTER') : (lang === 'ar' ? 'طي القائمة' : 'COLLAPSE FOOTER')}</span>
            </button>
          </div>
        )}

        {!isCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Brand Intro info */}
            <div className="space-y-4">
              {renderLogo()}
              
              <p className="text-sm text-gray-400 font-sans leading-relaxed">
                {lang === 'ar' 
                  ? homepageConfig.footer.contentAr || 'الوجهة الأولى والوحيدة بمصر للموتوسيكلات والاسكوترات الكهربائية والهجينة فائقة الأداء للمستقبل. ندمج الكفاءة العالية بالأناقة والسيطرة الهندسية.'
                  : homepageConfig.footer.content || "Egypt's premier boutique destination for high-end cybernetic motorcycles and tech-scooters. Launching the next generation of style, hyper-efficiency, and track dominance."
                }
              </p>

              {/* Social Grid */}
              <div className="flex items-center gap-3 pt-2">
                {waLink && (
                  <a 
                    href={waLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-green-400 hover:border-green-500/30 hover:bg-green-500/5 transition-all duration-300"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                {igLink && (
                  <a 
                    href={igLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-pink-500 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all duration-300"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {fbLink && (
                  <a 
                    href={fbLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {ytLink && (
                  <a 
                    href={ytLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-300"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {/* Custom Social Links (e.g. TikTok) with custom image or initials icon */}
                {homepageConfig.footer.customSocialLinks?.map((customLink, idx) => {
                  if (!customLink.url) return null;
                  return (
                    <a 
                      key={customLink.id || idx}
                      href={customLink.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-brand-accent hover:border-brand-accent/35 hover:bg-brand-accent/5 transition-all duration-300 overflow-hidden"
                      aria-label={customLink.name}
                    >
                      {customLink.iconUrl ? (
                        <img 
                          src={customLink.iconUrl} 
                          alt={customLink.name} 
                          className="w-5 h-5 object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] uppercase font-mono font-black tracking-wider text-brand-secondary">{customLink.name.slice(0, 2)}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Navigate Links */}
            <div className="text-left" dir={dir}>
              <h3 className="text-sm font-mono tracking-widest text-white uppercase mb-6 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" /> {lang === 'ar' ? 'أقسام الموقع' : 'SHOWROOM NAVIGATION'}
              </h3>
              <ul className="space-y-3 text-xs font-mono text-gray-400">
                {homepageConfig.footer.quickLinks?.map((link, idx) => (
                  <li key={idx}>
                    <button 
                      onClick={() => {
                        const targetId = link.url.replace('#', '');
                        onScrollToSection(targetId);
                      }}
                      className="hover:text-brand-accent transition-colors duration-200 cursor-pointer flex items-center gap-1 group uppercase"
                    >
                      <span className="text-brand-primary opacity-0 group-hover:opacity-100 transition-all duration-300">&gt;</span> {lang === 'ar' ? link.labelAr : link.label}
                    </button>
                  </li>
                )) || (
                  <>
                    <li>
                      <button 
                        onClick={() => onScrollToSection('home')}
                        className="hover:text-brand-accent transition-colors duration-200 cursor-pointer flex items-center gap-1 group uppercase"
                      >
                        <span className="text-brand-primary opacity-0 group-hover:opacity-100 transition-all duration-300">&gt;</span> {t('home')}
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => onScrollToSection('categories')}
                        className="hover:text-brand-accent transition-colors duration-200 cursor-pointer flex items-center gap-1 group uppercase"
                      >
                        <span className="text-brand-primary opacity-0 group-hover:opacity-100 transition-all duration-300">&gt;</span> {t('categories')}
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => onScrollToSection('gallery')}
                        className="hover:text-brand-accent transition-colors duration-200 cursor-pointer flex items-center gap-1 group uppercase"
                      >
                        <span className="text-brand-primary opacity-0 group-hover:opacity-100 transition-all duration-300">&gt;</span> {t('showroom')}
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Luxury Egyptian Headquarters Address/Details */}
            <div className="text-left" dir={dir}>
              <h3 className="text-sm font-mono tracking-widest text-white uppercase mb-6 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-accent" /> {lang === 'ar' ? 'المقر الفاخر بمصر' : 'THE LUXURY CODES'}
              </h3>
              <ul className="space-y-4 text-xs text-gray-400">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ar' ? (
                      homepageConfig.footer.addressAr || 'أرض رقم 18، الطريق الدائري الإقليمي، التجمع الخامس، القاهرة الجديدة، مصر'
                    ) : (
                      homepageConfig.footer.address || 'Plot 18, Royal Zone Road, Fifth Settlement, New Cairo, Egypt'
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="font-mono text-gray-300">{homepageConfig.footer.phone || "+20 100 7062 123"}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-brand-secondary shrink-0" />
                  <span className="font-mono text-gray-205">{homepageConfig.footer.email || "sales@elkholymotors.com"}</span>
                </li>
              </ul>
            </div>

            {/* Brand Working Times details */}
            <div className="text-left" dir={dir}>
              <h3 className="text-sm font-mono tracking-widest text-white uppercase mb-6 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-brand-accent" /> {lang === 'ar' ? 'ساعات العمل الرسمية' : 'DIGITAL CONCIERGE'}
              </h3>
              <div className="space-y-3 text-xs text-gray-400 bg-white/[0.02] border border-white/5 rounded-xl p-4 font-mono">
                <div className="flex justify-between text-xs">
                  <span>{lang === 'ar' ? 'الأحد - الخميس:' : 'SUN - THU:'}</span>
                  <span className="text-white">
                    {lang === 'ar' 
                      ? (homepageConfig.footer.hoursSunThuAr || homepageConfig.footer.hoursSunThu || "10:00 AM - 10:00 PM") 
                      : (homepageConfig.footer.hoursSunThu || "10:00 AM - 10:00 PM")}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{lang === 'ar' ? 'الجمعة:' : 'FRIDAY:'}</span>
                  <span className="text-brand-accent">
                    {lang === 'ar' 
                      ? (homepageConfig.footer.hoursFriAr || homepageConfig.footer.hoursFri || "04:00 PM - 11:00 PM") 
                      : (homepageConfig.footer.hoursFri || "04:00 PM - 11:00 PM")}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{lang === 'ar' ? 'السبت:' : 'SATURDAY:'}</span>
                  <span className="text-white">
                    {lang === 'ar' 
                      ? (homepageConfig.footer.hoursSatAr || homepageConfig.footer.hoursSat || "11:00 AM - 09:00 PM") 
                      : (homepageConfig.footer.hoursSat || "11:00 AM - 09:00 PM")}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 italic mt-2 border-t border-white/5 pt-2 font-sans leading-relaxed">
                  {lang === 'ar' 
                    ? '* دعم الحجز على الواتساب يعمل تلقائياً على مدار الساعة طوال الأسبوع.' 
                    : '* Online support desk operates 24/7 on WhatsApp.'
                  }
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Closing details and copy right */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gray-500 font-mono tracking-wider">
            &copy; {new Date().getFullYear()} {lang === 'ar' ? homepageConfig.header.logoTextAr || 'الخولي موتورز' : homepageConfig.header.logoText || 'ELKHOLY MOTORS'}. {
              lang === 'ar' 
                ? (homepageConfig.footer.copyrightAr || 'جميع الحقوق محفوظة. مشروع جراج رقمي 2026.') 
                : (homepageConfig.footer.copyright || 'ALL RIGHTS RESERVED. YEAR 2026 CYBER SHOWROOM PROJECT.')
            }
          </p>
          <div className="flex items-center gap-6 text-[10px] font-mono text-gray-400">
            <span className="hover:text-brand-accent transition-colors duration-200 cursor-help uppercase">{lang === 'ar' ? 'شروط القيادة للتجارب' : 'TERMS OF RIDE'}</span>
            
            {/* Scroll back up button */}
            <button 
              onClick={scrollToTop} 
              className="p-2 bg-gradient-to-tr from-brand-primary to-brand-accent rounded-lg text-white hover:brightness-125 focus:ring-1 focus:ring-brand-accent hover:-translate-y-1 transition-all cursor-pointer shadow-lg shadow-brand-primary/10"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
