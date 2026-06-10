import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import { HomepageConfig } from '../types';
import { DEFAULT_HOMEPAGE_CONFIG } from '../data';

const fontToCssMap: Record<string, string> = {
  'Inter': "'Inter', 'Vazirmatn', sans-serif",
  'Poppins': "'Poppins', 'Rubik', sans-serif",
  'Montserrat': "'Montserrat', 'Almarai', sans-serif",
  'Roboto': "'Roboto', 'Vazirmatn', sans-serif",
  'Cairo': "'Cairo', sans-serif",
  'Tajawal': "'Tajawal', sans-serif",
  'IBM Plex Sans': "'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif",
  'Open Sans': "'Open Sans', 'Vazirmatn', sans-serif",
  'Lato': "'Lato', 'Almarai', sans-serif",
  'Nunito': "'Nunito', 'Rubik', sans-serif",
  'Space Grotesk': "'Space Grotesk', 'Vazirmatn', sans-serif",
};

interface HomepagePageBuilderProps {
  homepageConfig: HomepageConfig;
  onUpdateHomepageConfig: (config: HomepageConfig) => void;
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  customText: any;
  onUpdateCustomText: (text: any) => void;
  fireToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function HomepagePageBuilder({
  homepageConfig,
  onUpdateHomepageConfig,
  lang,
  dir,
  customText,
  onUpdateCustomText,
  fireToast,
}: HomepagePageBuilderProps) {
  const [builderConfig, setBuilderConfig] = useState<HomepageConfig>(homepageConfig || DEFAULT_HOMEPAGE_CONFIG);
  const [history, setHistory] = useState<HomepageConfig[]>([homepageConfig || DEFAULT_HOMEPAGE_CONFIG]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [templates, setTemplates] = useState<{ name: string; config: HomepageConfig }[]>(() => {
    const loaded = localStorage.getItem('elkholy_templates');
    return loaded ? JSON.parse(loaded) : [];
  });
  const [newTemplateName, setNewTemplateName] = useState('');
  const [activeBuilderTab, setActiveBuilderTab] = useState<'font' | 'theme' | 'header' | 'main' | 'footer' | 'templates'>('header');
  const [fontTarget, setFontTarget] = useState<'headings' | 'subheadings' | 'body'>('headings');

  useEffect(() => {
    if (homepageConfig) {
      setBuilderConfig(homepageConfig);
    }
  }, [homepageConfig]);

  const updateBuilderConfig = (newConfig: HomepageConfig) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newConfig);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setBuilderConfig(newConfig);
    onUpdateHomepageConfig(newConfig);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setBuilderConfig(history[prevIndex]);
      onUpdateHomepageConfig(history[prevIndex]);
      fireToast(lang === 'ar' ? 'تم التراجع عن التعديل من الذاكرة' : 'Design undone successfully', 'info');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setBuilderConfig(history[nextIndex]);
      onUpdateHomepageConfig(history[nextIndex]);
      fireToast(lang === 'ar' ? 'تمت إعادة تطبيق التعديل' : 'Design redone successfully', 'info');
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      fireToast(lang === 'ar' ? 'يرجى كتابة اسم للقالب أولاً' : 'Please type a valid template identity', 'error');
      return;
    }
    const updated = [...templates, { name: newTemplateName.trim(), config: builderConfig }];
    setTemplates(updated);
    localStorage.setItem('elkholy_templates', JSON.stringify(updated));
    setNewTemplateName('');
    fireToast(lang === 'ar' ? 'تم حفظ التموضع الخارجي كقالب مخصص بنجاح!' : 'Current styled config saved as active template!', 'success');
  };

  const handleApplyTemplate = (config: HomepageConfig) => {
    updateBuilderConfig(config);
    fireToast(lang === 'ar' ? 'تم تطبيق القالب وجاري المعاينة الحية فورا!' : 'Template applied with live preview rendering!', 'success');
  };

  const handleRemoveTemplate = (idx: number) => {
    const updated = templates.filter((_, i) => i !== idx);
    setTemplates(updated);
    localStorage.setItem('elkholy_templates', JSON.stringify(updated));
    fireToast(lang === 'ar' ? 'تم حذف القالب المختار' : 'Template removed', 'info');
  };

  const handleResetToDefault = () => {
    updateBuilderConfig(DEFAULT_HOMEPAGE_CONFIG);
    fireToast(lang === 'ar' ? 'تمت إعادة تعيين لوحة التصاميم للسمات الافتراضية للمعرض' : 'Showroom style layouts reset to default template', 'info');
  };

  const handleSaveAll = () => {
    onUpdateHomepageConfig(builderConfig);
    // Sync to basic customText as well to preserve backward compatibility
    onUpdateCustomText({
      arTitle: builderConfig.header.titleAr,
      enTitle: builderConfig.header.title,
      arSlogan: builderConfig.header.subtitleAr,
      enSlogan: builderConfig.header.subtitle,
      arBadge: builderConfig.header.badgeAr,
      enBadge: builderConfig.header.badge,
      arHeroDesc: builderConfig.header.descriptionAr,
      enHeroDesc: builderConfig.header.description,
    });
    fireToast(lang === 'ar' ? 'تم تثبيت ونشر كافة التعديلات والتصاميم بنجاح!' : 'Advanced layout configuration deployed successfully!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in font-mono text-xs">
      
      {/* Action Header bar (Undo/Redo) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <div className="text-left">
          <h3 className="text-sm font-bold tracking-widest font-mono uppercase flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
            <span>{lang === 'ar' ? 'منشئ الصفحات المتقدم بمصر' : 'EGYPT ELKHOLY HERO PAGE BUILDER'}</span>
          </h3>
          <p className="text-[10px] text-gray-450 font-sans tracking-tight mt-0.5 normal-case font-medium">
            {lang === 'ar' ? 'التحكم الهيكلي الفوري بالمظهر، الألوان، الزوايا، الفونتات، الخلفيات والرموز مع تراجع وحفظ القوالب.' : 'Live drafting panel with 10 font selection, custom HTML embeds, color pickers, and border curves scaling.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-45 transition-all font-bold cursor-pointer"
            title="Undo"
          >
            {lang === 'ar' ? '↩ تراجع' : '↩ Undo'}
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-45 transition-all font-bold cursor-pointer"
            title="Redo"
          >
            {lang === 'ar' ? '↪ إعادة' : '↪ Redo'}
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 bg-red-950/25 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-950/50 transition-all font-bold cursor-pointer"
          >
            {lang === 'ar' ? '⚠️ إعادة تعيين' : '⚠️ Reset'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sub tabs list Selector */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-r border-white/5 pr-0 lg:pr-3 shrink-0">
          {([
            { id: 'header', labelAr: 'نصوص البانر والمقدمة', labelEn: 'Landing Hero Header' },
            { id: 'theme', labelAr: 'لوحة الألوان والتحكم الشامل', labelEn: 'Color Palette & Spacing' },
            { id: 'font', labelAr: 'الخطوط الـ 10 المعاصرة', labelEn: 'Font Family Picker' },
            { id: 'main', labelAr: 'التحكم بأقسام العرض والرموز', labelEn: 'Grid Showroom Slots' },
            { id: 'footer', labelAr: 'الفوتر الاجتماعي والروابط', labelEn: 'Collapsible Footer Node' },
            { id: 'templates', labelAr: 'حقيبة القوالب المخصصة', labelEn: 'Template Vault Drawer' }
          ] as const).map((tab) => {
            const isSubActive = activeBuilderTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveBuilderTab(tab.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl border text-[10px] font-bold transition-all shrink-0 flex items-center justify-between whitespace-nowrap cursor-pointer ${
                  isSubActive 
                    ? 'bg-brand-primary/20 border-brand-primary text-white shadow-md' 
                    : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>
            );
          })}
        </div>

        {/* Configurations Forms Panel */}
        <div className="lg:col-span-9 bg-black/40 border border-white/5 rounded-2xl p-5 text-left space-y-5">
          
          {/* HEADER FORM */}
          {activeBuilderTab === 'header' && (
            <div className="space-y-4 animate-fade-in text-left">
              <h4 className="text-[11px] font-black uppercase text-brand-secondary tracking-widest border-b border-white/5 pb-1.5 font-mono">
                {lang === 'ar' ? 'تخصيص نصوص ترحيب الواجهة واللوجو' : 'Setup Hero Header and Branding Details'}
              </h4>

              {/* Logo text widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 block">
                  <label className="text-gray-450 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'اسم المعرض بالعربية (نص بديل):' : 'Branding Logo Text (Arabic)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.logoTextAr || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, logoTextAr: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white font-sans text-right focus:outline-none"
                  />
                </div>
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'اسم المعرض بالإنجليزية (نص بديل):' : 'Branding Logo Text (English)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.logoText || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, logoText: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* ==================== Brand Image & Logo Management System ==================== */}
              <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-black text-[#22D3EE] uppercase tracking-wider">
                    {lang === 'ar' ? '🎨 نظام وإدارة لوجو المعرض المطور' : '🎨 Advanced Logo Management System'}
                  </span>
                  <span className="px-2 py-0.5 bg-brand-secondary/10 border border-brand-secondary/25 text-[8px] font-extrabold text-[#A855F7] rounded uppercase">2026 Core Engine</span>
                </div>

                {/* Preview block */}
                <div className="space-y-1">
                  <label className="text-gray-400 text-[9px] block uppercase font-bold">{lang === 'ar' ? 'معاينة اللوجو الحالي:' : 'Live Logo Preview:'}</label>
                  <div className="flex items-center justify-center p-6 bg-[#0B0F1A]/90 border border-white/[0.08] rounded-xl relative min-h-[90px]">
                    {builderConfig.header.logoUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img 
                          src={builderConfig.header.logoUrl} 
                          alt="Logo Preview" 
                          className={`
                            ${builderConfig.header.logoSize === 'small' ? 'h-8' : builderConfig.header.logoSize === 'large' ? 'h-14' : 'h-10'}
                            ${builderConfig.header.logoEffect === 'glow' ? 'shadow-[0_0_15px_rgba(34,211,238,0.55)] border border-[#22D3EE]/30 bg-[#22D3EE]/5 px-2 py-1 rounded-xl' : ''}
                            ${builderConfig.header.logoEffect === 'neon' ? 'shadow-[0_0_20px_rgba(168,85,247,0.65)] border border-[#A855F7]/40 bg-[#A855F7]/10 px-2 py-1 rounded-xl' : ''}
                            ${builderConfig.header.logoEffect === 'shadow' ? 'shadow-2xl shadow-black/80 bg-black/50 px-2 py-1 rounded-xl border border-white/5' : ''}
                            object-contain max-w-[200px] transition-all
                          `}
                        />
                        <span className="text-[8px] text-gray-500 font-mono">
                          {builderConfig.header.logoSize?.toUpperCase()} | {builderConfig.header.logoEffect?.toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-gray-500 font-mono">
                        {lang === 'ar' ? 'لا يوجد ملف لوجو مخصص. سيتم تفعيل الوضع الافتراضي للشبكة البرمجية.' : 'No custom logo loaded. System default cyber indicator active.'}
                      </div>
                    )}
                    {builderConfig.header.logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          updateBuilderConfig({
                            ...builderConfig,
                            header: { ...builderConfig.header, logoUrl: '' }
                          });
                          fireToast(lang === 'ar' ? 'تم حذف اللوجو المخصص!' : 'Branded custom Logo removed!', 'success');
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/10 rounded-xl text-red-400"
                        title={lang === 'ar' ? 'حذف اللوجو المخصص' : 'Delete Custom Logo'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload & Url fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-gray-500 text-[9px] block uppercase font-bold">{lang === 'ar' ? 'رابط ملف اللوجو الجديد:' : 'Direct Logo Image Link URL:'}</label>
                    <input 
                      type="text" 
                      placeholder="https://..."
                      value={builderConfig.header.logoUrl || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        header: { ...builderConfig.header, logoUrl: e.target.value }
                      })}
                      className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2 py-1.5 text-white focus:outline-none text-xs"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-gray-500 text-[9px] block uppercase font-bold">{lang === 'ar' ? 'أو رفع ملف لوجو (SVG/PNG/JPG):' : 'Or upload logo image file directement:'}</label>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateBuilderConfig({
                              ...builderConfig,
                              header: { ...builderConfig.header, logoUrl: reader.result as string }
                            });
                            fireToast(lang === 'ar' ? 'تم تعيين اللوجو ورفعه بنجاح!' : 'Custom Logo uploaded and set successfully!', 'success');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-1 text-gray-400 text-xs file:bg-brand-secondary file:border-none file:text-white file:px-2.5 file:py-1 file:rounded-md file:text-[10px] file:cursor-pointer"
                    />
                  </div>
                </div>

                {/* Adjustments: Resize, Position, Effects */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Resize option */}
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[9px] block uppercase font-bold">{lang === 'ar' ? 'تعديل حجم اللوجو:' : 'Resize Logo Dimensions:'}</label>
                    <select
                      value={builderConfig.header.logoSize || 'medium'}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        header: { ...builderConfig.header, logoSize: e.target.value as any }
                      })}
                      className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2 text-white focus:outline-none text-xs"
                    >
                      <option value="small">{lang === 'ar' ? 'صغير (Small - 32px)' : 'Small (32px)'}</option>
                      <option value="medium">{lang === 'ar' ? 'متوسط (Medium - 40px)' : 'Medium (40px)'}</option>
                      <option value="large">{lang === 'ar' ? 'كبير (Large - 56px)' : 'Large (56px)'}</option>
                    </select>
                  </div>

                  {/* Position option */}
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[9px] block uppercase font-bold">{lang === 'ar' ? 'موضع وموقع اللوجو:' : 'Logo Position Layout:'}</label>
                    <select
                      value={builderConfig.header.logoPosition || 'left'}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        header: { ...builderConfig.header, logoPosition: e.target.value as any }
                      })}
                      className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2 text-white focus:outline-none text-xs"
                    >
                      <option value="left">{lang === 'ar' ? 'على اليسار (الأطراف)' : 'Align Left / Start'}</option>
                      <option value="center">{lang === 'ar' ? 'في المنتصف (مركز)' : 'Center Aligned'}</option>
                    </select>
                  </div>

                  {/* Effects option */}
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[9px] block uppercase font-bold">{lang === 'ar' ? 'تأثير الهالة المحيطة باللوجو:' : 'Logo Background Effect:'}</label>
                    <select
                      value={builderConfig.header.logoEffect || 'none'}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        header: { ...builderConfig.header, logoEffect: e.target.value as any }
                      })}
                      className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2 text-white focus:outline-none text-xs"
                    >
                      <option value="none">{lang === 'ar' ? 'بدون تأثير' : 'None / Default transparency'}</option>
                      <option value="glow">{lang === 'ar' ? 'هالة النيون الفيروزية' : 'Cyan Cyber Glow'}</option>
                      <option value="neon">{lang === 'ar' ? 'هالة النيون البنفسجية' : 'Purple Aurora Glow'}</option>
                      <option value="shadow">{lang === 'ar' ? 'ظل عميق عالي التباين' : 'Deep Dynamic Shadow'}</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Titles widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'العنوان الترحيبي العريض (عربي):' : 'Display Main Title (Arabic)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.titleAr || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, titleAr: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white font-sans text-right focus:outline-none"
                  />
                </div>
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'العنوان الترحيبي العريض (إنجليزي):' : 'Display Main Title (English)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.title || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, title: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'النص الكلمي الملون المصاحب (عربي):' : 'Color Accent Part (Arabic)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.accentAr || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, accentAr: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white font-sans text-right focus:outline-none"
                  />
                </div>
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'النص الكلمي الملون المصاحب (إنجليزي):' : 'Color Accent Part (English)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.accent || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, accent: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Slogans widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'الشعار السلوجان الترويجي (عربي):' : 'Hero Subtitle Slogan (Arabic)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.subtitleAr || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, subtitleAr: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white font-sans text-right focus:outline-none"
                  />
                </div>
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'الشعار السلوجان الترويجي (إنجليزي):' : 'Hero Subtitle Slogan (English)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.subtitle || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, subtitle: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Badges and descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'الشارة الترحيبية العائمة العليا (عربي):' : 'Floating Hero Upper Badge (Arabic)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.badgeAr || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, badgeAr: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white font-sans text-right focus:outline-none"
                  />
                </div>
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'الشارة الترحيبية العائمة العليا (إنجليزي):' : 'Floating Hero Upper Badge (English)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.header.badge || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, badge: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'وصف السرد والبيان الفاخر (عربي):' : 'Landing Narrative Paragraph (Arabic)'}</label>
                  <textarea 
                    rows={3}
                    value={builderConfig.header.descriptionAr || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, descriptionAr: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white font-sans text-right focus:outline-none"
                  />
                </div>
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[10px] uppercase font-bold tracking-wider">{lang === 'ar' ? 'وصف السرد والبيان الفاخر (إنجليزي):' : 'Landing Narrative Paragraph (English)'}</label>
                  <textarea 
                    rows={3}
                    value={builderConfig.header.description || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      header: { ...builderConfig.header, description: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white font-sans focus:outline-none"
                  />
                </div>
              </div>

              {/* IMAGE CONTROL SYSTEM: Header Background */}
              <div className="space-y-1.5 block">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#22D3EE]">{lang === 'ar' ? 'نظام التحكم الشامل بالصور والخلفيات' : 'DYNAMIC IMAGE CONTROL DRAWER'}</span>
                
                <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                  {builderConfig.header.backgroundImage && (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                      <img 
                        src={builderConfig.header.backgroundImage} 
                        alt="Hero background" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-[9px] bg-black/50 border border-brand-primary/20 px-2 py-0.5 rounded text-brand-primary uppercase font-extrabold">
                          {lang === 'ar' ? 'معاينة الخلفية الحية النشطة لمعرض الخولي' : 'ACTIVE LANDING HERO BANNER IMAGE'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateBuilderConfig({
                          ...builderConfig,
                          header: { ...builderConfig.header, backgroundImage: '' }
                        })}
                        className="absolute top-2 right-2 p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/10 rounded-xl text-red-400"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1">
                      <label className="text-gray-500 text-[9px] block uppercase">{lang === 'ar' ? 'رابط ملف الصورة المباشر:' : 'Load image from external URL Link:'}</label>
                      <input 
                        type="text" 
                        placeholder="https://..."
                        value={builderConfig.header.backgroundImage || ''}
                        onChange={(e) => updateBuilderConfig({
                          ...builderConfig,
                          header: { ...builderConfig.header, backgroundImage: e.target.value }
                        })}
                        className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-500 text-[9px] block uppercase">{lang === 'ar' ? 'أو رفع ملف مباشرة من جهازك:' : 'Or convert image file to Base64:'}</label>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              updateBuilderConfig({
                                ...builderConfig,
                                header: { ...builderConfig.header, backgroundImage: reader.result as string }
                              });
                              fireToast(lang === 'ar' ? 'تم تحويل الملف وتعيينه بنجاح!' : 'File transformed to Base64 vector!', 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-1.5 text-gray-400 file:bg-brand-primary file:border-none file:text-white file:px-2.5 file:py-1 file:rounded-md file:text-[10px] file:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Injected HTML */}
              <div className="space-y-1 block mt-2">
                <label className="text-brand-accent text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span>{lang === 'ar' ? 'صندوق الكود المخصص (Safe HTML Injector):' : 'Custom HTML Injector Panel (Banners, Promos)'}</span>
                  <span className="px-1.5 py-0.5 bg-brand-primary/10 border border-brand-primary/20 text-[7px] font-extrabold text-brand-primary uppercase rounded">Enterprise Node</span>
                </label>
                <textarea 
                  rows={4}
                  placeholder="e.g. <div class='p-5 bg-gradient-to-r from-teal-950/40 text-left rounded-2xl border border-teal-500/20 text-teal-400'><p class='font-bold uppercase'>FLASH DEAL</p><p class='text-[10px] mt-1'>Save up to 12% on Scooter accessories this week.</p></div>"
                  value={builderConfig.header.customHtml || ''}
                  onChange={(e) => updateBuilderConfig({
                    ...builderConfig,
                    header: { ...builderConfig.header, customHtml: e.target.value }
                  })}
                  className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* WhatsApp Invoice Number */}
              <div className="space-y-1 block mt-4">
                <label className="text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span>{lang === 'ar' ? 'رقم الواتساب لاستلام الفواتير:' : 'WhatsApp Number for Invoices:'}</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. +201012345678"
                  value={builderConfig.invoiceWhatsappNumber || ''}
                  onChange={(e) => updateBuilderConfig({
                    ...builderConfig,
                    invoiceWhatsappNumber: e.target.value
                  })}
                  className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* THEME CONFIG FORM */}
          {activeBuilderTab === 'theme' && (
            <div className="space-y-4 animate-fade-in text-left">
              <h4 className="text-[11px] font-black uppercase text-brand-secondary tracking-widest border-b border-white/5 pb-1.5 font-mono">
                {lang === 'ar' ? 'لوحة الألوان والتحكم الشامل للموقع' : 'Branding Palette Colors & Scale Controls'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[9px] uppercase tracking-wider block">{lang === 'ar' ? 'اللون الترويجي الأساسي:' : 'Primary Brand accent:'}</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={builderConfig.theme.primaryColor || '#6366F1'}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        theme: { ...builderConfig.theme, primaryColor: e.target.value }
                      })}
                      className="w-9 h-9 rounded-lg pointer-events-auto cursor-pointer"
                    />
                    <span className="font-mono text-[9px] uppercase">{builderConfig.theme.primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[9px] uppercase tracking-wider block">{lang === 'ar' ? 'اللون الترويجي الثانوي:' : 'Secondary Brand color:'}</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={builderConfig.theme.secondaryColor || '#A855F7'}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        theme: { ...builderConfig.theme, secondaryColor: e.target.value }
                      })}
                      className="w-9 h-9 rounded-lg pointer-events-auto cursor-pointer"
                    />
                    <span className="font-mono text-[9px] uppercase">{builderConfig.theme.secondaryColor}</span>
                  </div>
                </div>

                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[9px] uppercase tracking-wider block">{lang === 'ar' ? 'لون الهيدر وشارات العرض:' : 'Showroom Highlight badge:'}</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={builderConfig.mainContent.iconColor || '#22D3EE'}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        mainContent: { ...builderConfig.mainContent, iconColor: e.target.value }
                      })}
                      className="w-9 h-9 rounded-lg pointer-events-auto cursor-pointer"
                    />
                    <span className="font-mono text-[9px] uppercase">{builderConfig.mainContent.iconColor}</span>
                  </div>
                </div>

                <div className="space-y-1 block">
                  <label className="text-gray-455 text-[9px] uppercase tracking-wider block">{lang === 'ar' ? 'لون الخلفية الأساسية:' : 'Chamber Canvas Bg:'}</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={builderConfig.theme.backgroundColor || '#0B0F1A'}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        theme: { ...builderConfig.theme, backgroundColor: e.target.value }
                      })}
                      className="w-9 h-9 rounded-lg pointer-events-auto cursor-pointer"
                    />
                    <span className="font-mono text-[9px] uppercase">{builderConfig.theme.backgroundColor}</span>
                  </div>
                </div>
              </div>

              {/* Borders Radius option */}
              <div className="space-y-2 block mt-4 p-4 border border-white/5 rounded-2xl bg-white/[0.01]">
                <span className="text-xs font-bold text-gray-300 block mb-1">{lang === 'ar' ? 'زوايا انحناء الأزرار والبطاقات (Radius profile):' : 'Borders and buttons border-radius profiles:'}</span>
                <div className="flex flex-wrap gap-2">
                  {([
                    { id: 'rounded-none', label: lang === 'ar' ? 'حاد راديكالي (Sharp Brutalist)' : 'Sharp Bounds (none)' },
                    { id: 'rounded-md', label: lang === 'ar' ? 'شبه دائري كلاسيكي (Standard)' : 'Semi-Round (md)' },
                    { id: 'rounded-xl', label: lang === 'ar' ? 'زاوية مريحة فاخرة (Cyber)' : 'Cyber Luxury (xl)' },
                    { id: 'rounded-3xl', label: lang === 'ar' ? 'تقوس كبسولة انسيابي (Round)' : 'Capsule Profile (3xl)' }
                  ] as const).map((r) => {
                    const isSel = builderConfig.theme.buttonRadius === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => updateBuilderConfig({
                          ...builderConfig,
                          theme: { ...builderConfig.theme, buttonRadius: r.id }
                        })}
                        className={`px-3 py-1.5 text-[10px] uppercase font-mono tracking-tight border rounded-lg transition-all cursor-pointer ${
                          isSel ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white/5 border-white/5 hover:border-white/10 text-gray-400'
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spacing multiplier */}
              <div className="space-y-1 block mt-2">
                <div className="flex items-center justify-between font-bold text-[9px] uppercase">
                  <span>{lang === 'ar' ? 'مقاييس تباعد العناصر والبطاقات (Spacing multiplier):' : 'Interactive Spacing Multiplier Scale:'}</span>
                  <span className="text-brand-accent">{builderConfig.theme.spacingMultiplier || 1.0}x</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.25"
                  value={builderConfig.theme.spacingMultiplier || 1.0}
                  onChange={(e) => updateBuilderConfig({
                    ...builderConfig,
                    theme: { ...builderConfig.theme, spacingMultiplier: parseFloat(e.target.value) }
                  })}
                  className="w-full accent-brand-accent cursor-pointer"
                />
                <div className="flex items-center justify-between text-[8px] text-gray-500 font-mono">
                  <span>Compact spacing (0.5x)</span>
                  <span>Standard size (1.0x)</span>
                  <span>Spacious layout (1.5x)</span>
                </div>
              </div>
            </div>
          )}

          {/* FONT SELECTOR FORM */}
          {activeBuilderTab === 'font' && (
            <div className="space-y-4 animate-fade-in text-left">
              <h4 className="text-[11px] font-black uppercase text-brand-secondary tracking-widest border-b border-white/5 pb-1.5 font-mono">
                {lang === 'ar' ? 'متحكم خطوط وتيبوغرافيات الموقع المفصلة' : 'Detailed Multi-Font Typography Controllers'}
              </h4>
              <p className="text-[10px] text-gray-550 font-sans mt-0.5 leading-normal">
                {lang === 'ar' 
                  ? 'اختر تخصيص خط منفصل لكل جزء من أجزاء الموقع (العناوين الكبيرة، العناوين الفرعية، نصوص الوصف والفقرات).'
                  : 'Customize separate fonts for headings, small labels/buttons, and main body description paragraphs.'}
              </p>

              {/* Sub-tabs selector for font target scope */}
              <div className="grid grid-cols-3 gap-1 bg-[#111827]/85 p-1 rounded-xl border border-white/5 mt-3">
                <button
                  type="button"
                  onClick={() => setFontTarget('headings')}
                  className={`py-2 px-1 text-[10px] font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center text-center leading-none ${
                    fontTarget === 'headings'
                      ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20 font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[9px] font-extrabold">{lang === 'ar' ? 'العناوين الرئيسية' : 'Headings'}</span>
                  <span className="text-[7.5px] opacity-75 font-mono mt-1 text-center truncate max-w-[100px]" dir="ltr">
                    {builderConfig.fontHeadings || builderConfig.font || 'Space Grotesk'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFontTarget('subheadings')}
                  className={`py-2 px-1 text-[10px] font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center text-center leading-none ${
                    fontTarget === 'subheadings'
                      ? 'bg-brand-secondary text-white shadow-md shadow-brand-secondary/20 font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[9px] font-extrabold">{lang === 'ar' ? 'العناوين الفرعية' : 'Subheadings'}</span>
                  <span className="text-[7.5px] opacity-75 font-mono mt-1 text-center truncate max-w-[100px]" dir="ltr">
                    {builderConfig.fontSubheadings || builderConfig.font || 'Cairo'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFontTarget('body')}
                  className={`py-2 px-1 text-[10px] font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center text-center leading-none ${
                    fontTarget === 'body'
                      ? 'bg-[#22D3EE] text-black shadow-md shadow-[#22D3EE]/20 font-extrabold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[9px] font-extrabold">{lang === 'ar' ? 'النصوص والوصف' : 'Body Text'}</span>
                  <span className="text-[7.5px] opacity-75 font-mono mt-1 text-center truncate max-w-[100px]" dir="ltr">
                    {builderConfig.fontBody || builderConfig.font || 'Inter'}
                  </span>
                </button>
              </div>

              {/* Dynamic instruction for the selected font category */}
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5 text-center text-[10px] text-gray-400 font-sans mt-2">
                {fontTarget === 'headings' && (
                  <span>
                    👉 {lang === 'ar' 
                      ? 'تعديل خط العناوين الرئيسية الكبيرة (مثل اسم المعرض في الهيدر، وعناوين الفئات والأقسام).' 
                      : 'Configuring main hero labels, large module section titles, and header text.'}
                  </span>
                )}
                {fontTarget === 'subheadings' && (
                  <span>
                    👉 {lang === 'ar' 
                      ? 'تعديل خط العناوين الفرعية، الأزرار، الشارات، وأقسام التصفية واللوجو الفرعي للمترو.' 
                      : 'Configuring categories slots, primary filter pills, badges, and action buttons.'}
                  </span>
                )}
                {fontTarget === 'body' && (
                  <span>
                    👉 {lang === 'ar' 
                      ? 'تعديل خط النصوص العادية، فقرات الوصف داخل الكروت، التفاصيل التقنية، وفوتر المعرض.' 
                      : 'Configuring standard paragraph specifications, item details, catalogs context, and footer info.'}
                  </span>
                )}
              </div>

              {/* The 10 fonts list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {([
                  { name: 'Inter', desc: lang === 'ar' ? 'الخط السويسري الأنيق والقابل للقراءة العالية' : 'Sleek, Swiss highly legible technology display' },
                  { name: 'Poppins', desc: lang === 'ar' ? 'هندسي حديث ملائم لواجهات المستقبل' : 'Modern energetic geometric sans-serif standard' },
                  { name: 'Montserrat', desc: lang === 'ar' ? 'عريض وجريء، مخصص للعناوين اللافتة' : 'Architecturally bold structural display' },
                  { name: 'Cairo', desc: lang === 'ar' ? 'الخط العربي المعاصر الأكثر شعبية وقوة' : 'High contrast standard for contemporary Arabic' },
                  { name: 'Tajawal', desc: lang === 'ar' ? 'خط عربي نحيف وأنيق ذو طابع تحريري متميز' : 'Elegant slim high-contrast editorial arabic' },
                  { name: 'IBM Plex Sans', desc: lang === 'ar' ? 'خط كود تقني احترافي عالي الدقة' : 'Engineering-inspired professional system font' },
                  { name: 'Open Sans', desc: lang === 'ar' ? 'تصميم كلاسيكي نظيف ومريح للعين' : 'Highly balanced neutral consumer layout' },
                  { name: 'Lato', desc: lang === 'ar' ? 'خط تكنولوجي ملائم للنصوص الفرعية والفقرات' : 'Warm structural display typography standard' },
                  { name: 'Nunito', desc: lang === 'ar' ? 'خط مستدير يعطي حيوية وتفاعلية للموقع' : 'Curved friendly consumer interactive font' },
                  { name: 'Space Grotesk', desc: lang === 'ar' ? 'خط مستقبلي بلمسة من تصميم Brutalist الهندسي للموتوسيكلات' : 'Futuristic modern brutalist tech display' }
                ] as const).map((f) => {
                  const isSel = (fontTarget === 'headings' 
                    ? builderConfig.fontHeadings || builderConfig.font || 'Space Grotesk'
                    : fontTarget === 'subheadings'
                      ? builderConfig.fontSubheadings || builderConfig.font || 'Cairo'
                      : builderConfig.fontBody || builderConfig.font || 'Inter') === f.name;
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => {
                        if (fontTarget === 'headings') {
                          updateBuilderConfig({ ...builderConfig, fontHeadings: f.name });
                        } else if (fontTarget === 'subheadings') {
                          updateBuilderConfig({ ...builderConfig, fontSubheadings: f.name });
                        } else {
                          updateBuilderConfig({ ...builderConfig, fontBody: f.name });
                        }
                        fireToast(
                          lang === 'ar' 
                            ? `تم تغيير خط ${fontTarget === 'headings' ? 'العناوين الرئيسية' : fontTarget === 'subheadings' ? 'العناوين الفرعية' : 'النصوص والوصف'} إلى: ${f.name}` 
                            : `Updated ${fontTarget} typography layout to: ${f.name}`, 
                          'success'
                        );
                      }}
                      className={`p-3 border rounded-xl transition-all cursor-pointer flex flex-col text-left ${
                        isSel 
                          ? fontTarget === 'headings' 
                            ? 'bg-brand-primary/20 border-brand-primary text-white shadow-md' 
                            : fontTarget === 'subheadings'
                              ? 'bg-brand-secondary/20 border-brand-secondary text-white shadow-md'
                              : 'bg-[#22D3EE]/20 border-[#22D3EE] text-white shadow-md'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className={`font-bold text-xs font-preview-${f.name.replace(/\s+/g, '')}`} style={{ fontFamily: fontToCssMap[f.name] || `"${f.name}", sans-serif` }}>{f.name}</span>
                      <span className={`text-[9px] text-gray-550 mt-0.5 leading-tight font-preview-${f.name.replace(/\s+/g, '')}`} style={{ fontFamily: fontToCssMap[f.name] || `"${f.name}", sans-serif` }}>{f.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Real-time typography preview card */}
              <div className="p-4 rounded-xl border border-white/5 bg-[#111827]/40 block text-left space-y-2 mt-4">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">{lang === 'ar' ? 'معاينة خطوط الواجهة الحالية بالفهرس:' : 'ACTIVE TYPOGRAPHY MIX MATRIX:'}</span>
                
                {/* Heading style preview */}
                <div className={`text-sm font-black text-white font-preview-${(builderConfig.fontHeadings || builderConfig.font || 'Space Grotesk').replace(/\s+/g, '')}`} style={{ fontFamily: fontToCssMap[builderConfig.fontHeadings || builderConfig.font || 'Space Grotesk'] || `"${builderConfig.fontHeadings || builderConfig.font || 'Space Grotesk'}", sans-serif` }}>
                  {lang === 'ar' ? 'الخولي موتورز - معرض المستقبل بمصر' : 'ELKHOLY MOTORS - FUTURE SHOWROOM'}
                </div>

                {/* Subheadings preview */}
                <div className={`text-[11px] font-extrabold text-[#22D3EE] font-preview-${(builderConfig.fontSubheadings || builderConfig.font || 'Cairo').replace(/\s+/g, '')}`} style={{ fontFamily: fontToCssMap[builderConfig.fontSubheadings || builderConfig.font || 'Cairo'] || `"${builderConfig.fontSubheadings || builderConfig.font || 'Cairo'}", sans-serif` }}>
                  ⚡ {lang === 'ar' ? 'أقوى الموتوسيكلات والاسكوترز الذكية' : 'SUPREME PERFORMANCE ELECTRIC & GAS SUPERBIKES'}
                </div>

                {/* Body paragraph preview */}
                <div className={`text-[10px] text-gray-400 leading-normal mt-2 font-preview-${(builderConfig.fontBody || builderConfig.font || 'Inter').replace(/\s+/g, '')}`} style={{ fontFamily: fontToCssMap[builderConfig.fontBody || builderConfig.font || 'Inter'] || `"${builderConfig.fontBody || builderConfig.font || 'Inter'}", sans-serif` }}>
                  {lang === 'ar' 
                    ? 'هذا النص يعبر عن الوصف الدقيق وكافة كروت الموتوسيكلات وساعات العمل وملاحظات العروض الحصرية الحالية.' 
                    : 'This is a sample layout description showing user details inside motorcycle specs cards and general catalog features.'}
                </div>
              </div>

            </div>
          )}

          {/* GRID SHOWROOM ELEMENTS */}
          {activeBuilderTab === 'main' && (
            <div className="space-y-4 animate-fade-in text-left">
              <h4 className="text-[11px] font-black uppercase text-brand-secondary tracking-widest border-b border-white/5 pb-1.5 font-mono">
                {lang === 'ar' ? 'التحكم الهيكلي وحجرات صالة العرض والمبيعات' : 'Enable/Disable Visual Grid Elements'}
              </h4>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-left" dir="ltr">
                    <p className="text-xs font-bold text-white uppercase">{lang === 'ar' ? 'مربع فئات الموتوسيكلات والسكوترز (A / B / C / S):' : 'Bento Categories filtering Slot:'}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{lang === 'ar' ? 'إظهار شريط الفئات لتصفية الموتوسيكلات المتاحة.' : 'Toggle category filter grid tags.'}</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={builderConfig.mainContent.showCategories}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      mainContent: { ...builderConfig.mainContent, showCategories: e.target.checked }
                    })}
                    className="w-5 h-5 accent-brand-accent cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="text-left" dir="ltr">
                    <p className="text-xs font-bold text-white uppercase">{lang === 'ar' ? 'قسم المركبة الرائدة المميزة (Flagship Center Stage):' : 'Flagship Display Center block:'}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{lang === 'ar' ? 'إظهار لوح عرض الدراجة الرائدة الضخم في صالة العرض.' : 'Large bento container highlighting first flagship.'}</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={builderConfig.mainContent.showFeatured}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      mainContent: { ...builderConfig.mainContent, showFeatured: e.target.checked }
                    })}
                    className="w-5 h-5 accent-brand-accent cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="text-left" dir="ltr">
                    <p className="text-xs font-bold text-white uppercase">{lang === 'ar' ? 'شارات ومصلقات الخصم والعروض (Hot Deals Stickers):' : 'Enable promotions and original price stickers:'}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{lang === 'ar' ? 'شارات تدل بشكل فوري على توفير الموتوسيكلات.' : 'Toggle percentages label sticker tags.'}</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={builderConfig.mainContent.showOffers}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      mainContent: { ...builderConfig.mainContent, showOffers: e.target.checked }
                    })}
                    className="w-5 h-5 accent-brand-accent cursor-pointer"
                  />
                </div>
              </div>

              {/* Custom Headline names editing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-1 block">
                  <label className="text-gray-440 text-[9px] uppercase">{lang === 'ar' ? 'عنوان صالة العرض بالعربية:' : 'Showroom section header (Arabic)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.mainContent.titleAr || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      mainContent: { ...builderConfig.mainContent, titleAr: e.target.value }
                    })}
                    className="w-full bg-[#111827]/85 border border-white/10 rounded-xl p-2.5 text-white font-sans text-right focus:outline-none"
                  />
                </div>
                <div className="space-y-1 block">
                  <label className="text-gray-445 text-[9px] uppercase">{lang === 'ar' ? 'عنوان صالة العرض بالإنجليزية:' : 'Showroom section header (English)'}</label>
                  <input 
                    type="text"
                    value={builderConfig.mainContent.title || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      mainContent: { ...builderConfig.mainContent, title: e.target.value }
                    })}
                    className="w-full bg-[#111827]/85 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC COLLAPSIBLE FOOTER */}
          {activeBuilderTab === 'footer' && (
            <div className="space-y-4 animate-fade-in text-left">
              <h4 className="text-[11px] font-black uppercase text-brand-secondary tracking-widest border-b border-white/5 pb-1.5 font-mono">
                {lang === 'ar' ? 'التحكم بالفوتر والقنوات الإرشادية وسوشيال ميديا' : 'Footer Collapsing & Channels options'}
              </h4>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-left" dir="ltr">
                    <p className="text-xs font-bold text-white uppercase">{lang === 'ar' ? 'إظهار وإخفاء الفوتر العام بالكامل:' : 'Global Footer Visibility Toggle:'}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{lang === 'ar' ? 'بلمسة واحدة يمكنك حجب أو تفعيل الفوتر بمصر.' : 'Toggle whether footer sections display at all.'}</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={builderConfig.footer.visible}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      footer: { ...builderConfig.footer, visible: e.target.checked }
                    })}
                    className="w-5 h-5 accent-brand-accent cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="text-left" dir="ltr">
                    <p className="text-xs font-bold text-white uppercase">{lang === 'ar' ? 'دعم الفوتر القابل للفتح والطي (Collapsible):' : 'Enable Drawer Collapsing behaviors:'}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{lang === 'ar' ? 'يمنح العمل زر لطي الفوتر لتقليل الملاحات.' : 'Provide expand/collapse buttons for compact presentation.'}</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={builderConfig.footer.collapsible}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      footer: { ...builderConfig.footer, collapsible: e.target.checked }
                    })}
                    className="w-5 h-5 accent-brand-accent cursor-pointer"
                  />
                </div>
              </div>

              {/* Spacing custom description texts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-1 block text-right">
                  <label className="text-gray-445 text-[10px] uppercase block">{lang === 'ar' ? 'الوصف الداخلي بالفوتر (عربي):' : 'Footer Manifesto descriptive text (Arabic)'}</label>
                  <textarea 
                    rows={2}
                    value={builderConfig.footer.contentAr || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      footer: { ...builderConfig.footer, contentAr: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2 text-white font-sans text-right focus:outline-none animate-fade-in"
                  />
                </div>
                <div className="space-y-1 block text-left">
                  <label className="text-gray-445 text-[10px] uppercase block">{lang === 'ar' ? 'الوصف الداخلي بالفوتر (إنجليزي):' : 'Footer Manifesto descriptive text (English)'}</label>
                  <textarea 
                    rows={2}
                    value={builderConfig.footer.content || ''}
                    onChange={(e) => updateBuilderConfig({
                      ...builderConfig,
                      footer: { ...builderConfig.footer, content: e.target.value }
                    })}
                    className="w-full bg-[#111827]/80 border border-white/10 rounded-xl p-2 text-white font-sans focus:outline-none animate-fade-in"
                  />
                </div>
              </div>

              {/* SOCIAL CONTROL LINKS */}
              <div className="space-y-1.5 block">
                <span className="text-[9px] font-black uppercase text-brand-primary tracking-widest block">{lang === 'ar' ? 'تخصيص قنوات التواصل وسوشيال المعرض بمصر:' : 'Customize Active Social Media Target Links:'}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left">
                  {([
                    { platform: 'facebook', label: 'Facebook' },
                    { platform: 'instagram', label: 'Instagram' },
                    { platform: 'whatsapp', label: 'WhatsApp' },
                    { platform: 'youtube', label: 'YouTube' }
                  ] as const).map((social) => (
                    <div key={social.platform} className="space-y-1 block text-left">
                      <span className="text-[9px] text-[#A855F7] font-bold uppercase">{social.label} Link URL:</span>
                      <input 
                        type="text" 
                        value={builderConfig.footer.socialLinks?.[social.platform] || ''}
                        onChange={(e) => {
                          updateBuilderConfig({
                            ...builderConfig,
                            footer: { 
                              ...builderConfig.footer, 
                              socialLinks: {
                                ...builderConfig.footer.socialLinks,
                                [social.platform]: e.target.value
                              }
                            }
                          });
                        }}
                        className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* CONTACT & HEADQUARTERS EDITORS */}
              <div className="space-y-3 pt-2">
                <span className="text-[9px] font-black uppercase text-brand-secondary tracking-widest block">{lang === 'ar' ? 'بيانات مقر المعرض ومعلومات التواصل بالكامل (Contact details):' : 'HEADQUARTERS LOCATION & CONTACT TELEMETRY:'}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left">
                  
                  {/* Address */}
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'العنوان بمصر (عربي):' : 'Egyptian Address (Arabic)'}</label>
                    <input 
                      type="text" 
                      value={builderConfig.footer.addressAr || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, addressAr: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white font-sans text-right focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'العنوان (إنجليزي):' : 'Headquarters Address (English)'}</label>
                    <input 
                      type="text" 
                      value={builderConfig.footer.address || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, address: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white font-sans focus:outline-none"
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'رقم الهاتف:' : 'Contact Phone Number:'}</label>
                    <input 
                      type="text" 
                      value={builderConfig.footer.phone || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, phone: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Contact E-mail Address:'}</label>
                    <input 
                      type="text" 
                      value={builderConfig.footer.email || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, email: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white font-mono focus:outline-none"
                    />
                  </div>

                  {/* Working Times */}
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'ساعات العمل الأحد - الخميس:' : 'Working Hours Sun-Thu:'}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10:00 AM - 10:00 PM"
                      value={builderConfig.footer.hoursSunThu || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, hoursSunThu: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'ساعات العمل الأحد - الخميس (عربي اختيارى):' : 'Working Hours Sun-Thu (Arabic optional):'}</label>
                    <input 
                      type="text" 
                      placeholder="مثال: 10:00 ص - 10:00 م"
                      value={builderConfig.footer.hoursSunThuAr || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, hoursSunThuAr: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white text-right focus:outline-none animate-fade-in"
                    />
                  </div>

                  {/* Hours Friday */}
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'ساعات العمل الجمعة:' : 'Working Hours Friday:'}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 04:00 PM - 11:00 PM"
                      value={builderConfig.footer.hoursFri || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, hoursFri: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'ساعات العمل الجمعة (عربي اختيارى):' : 'Working Hours Friday (Arabic optional):'}</label>
                    <input 
                      type="text" 
                      placeholder="مثال: 04:00 م - 11:00 م"
                      value={builderConfig.footer.hoursFriAr || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, hoursFriAr: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white text-right focus:outline-none"
                    />
                  </div>

                  {/* Hours Saturday */}
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'ساعات العمل السبت:' : 'Working Hours Saturday:'}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 11:00 AM - 09:00 PM"
                      value={builderConfig.footer.hoursSat || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, hoursSat: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'ساعات العمل السبت (عربي اختيارى):' : 'Working Hours Saturday (Arabic optional):'}</label>
                    <input 
                      type="text" 
                      placeholder="مثال: 11:00 ص - 09:00 م"
                      value={builderConfig.footer.hoursSatAr || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, hoursSatAr: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white text-right focus:outline-none"
                    />
                  </div>

                  {/* Copyright */}
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'حقوق النشر والملكيات (عربي):' : 'Copyright message (Arabic)'}</label>
                    <input 
                      type="text" 
                      value={builderConfig.footer.copyrightAr || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, copyrightAr: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white text-right focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 block text-left">
                    <label className="text-gray-400 text-[10px] uppercase block">{lang === 'ar' ? 'حقوق النشر والملكيات (إنجليزي):' : 'Copyright message (English)'}</label>
                    <input 
                      type="text" 
                      value={builderConfig.footer.copyright || ''}
                      onChange={(e) => updateBuilderConfig({
                        ...builderConfig,
                        footer: { ...builderConfig.footer, copyright: e.target.value }
                      })}
                      className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none"
                    />
                  </div>

                </div>
              </div>

              {/* DYNAMIC CUSTOM SOCIAL NETWORKS */}
              <div className="space-y-2.5 pt-3 border-t border-white/[0.05]">
                <div className="flex justify-between items-center text-left">
                  <div className="block">
                    <span className="text-[10px] font-black uppercase text-[#22D3EE] tracking-widest block">{lang === 'ar' ? 'قنوات تواصل إضافية مخصصة (تيك توك، إلخ):' : 'ADDITIONAL SOCIAL TARGET NETWORKS (TIKTOK, ETC.):'}</span>
                    <p className="text-[8px] text-gray-500 mt-0.5">{lang === 'ar' ? 'يمكنك رفع أيقونات مخصصة لكل منصة وحفظ رابطها.' : 'Provide custom logos and profile URLs for secondary accounts.'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newList = [...(builderConfig.footer.customSocialLinks || [])];
                      newList.push({
                        id: 'custom-' + Date.now(),
                        name: 'TikTok',
                        url: '',
                        iconUrl: ''
                      });
                      updateBuilderConfig({
                        ...builderConfig,
                        footer: {
                          ...builderConfig.footer,
                          customSocialLinks: newList
                        }
                      });
                      fireToast(lang === 'ar' ? 'تمت إضافة تواصل مخصص جديد!' : 'Added alternative social link placeholder!', 'success');
                    }}
                    className="px-3 py-1.5 text-[9px] font-black tracking-wider bg-brand-primary hover:brightness-110 text-white uppercase rounded-lg transition-all cursor-pointer"
                  >
                    + {lang === 'ar' ? 'إضافة وسيلة مخصصة' : 'ADD DYNAMIC LINK'}
                  </button>
                </div>

                {(!builderConfig.footer.customSocialLinks || builderConfig.footer.customSocialLinks.length === 0) ? (
                  <div className="text-center p-5 bg-white/[0.01] border border-white/5 border-dashed rounded-2xl block">
                    <p className="text-xs text-gray-505">{lang === 'ar' ? 'اضغط على زر الإضافة لتشغيل قنوات أخرى مخصصة (مثل تيك توك) بمصر.' : 'No additional links defined. Boost client navigation by establishing TikTok pages.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {builderConfig.footer.customSocialLinks.map((custom, idx) => (
                      <div key={custom.id || idx} className="p-4 bg-[#0B0F19]/40 border border-white/5 rounded-2xl space-y-3 relative text-left">
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = builderConfig.footer.customSocialLinks?.filter((_, i) => i !== idx) || [];
                            updateBuilderConfig({
                              ...builderConfig,
                              footer: {
                                ...builderConfig.footer,
                                customSocialLinks: filtered
                              }
                            });
                            fireToast(lang === 'ar' ? 'تم مسح وسيلة التواصل' : 'Removed custom channel', 'info');
                          }}
                          className="absolute top-4 right-4 text-gray-400 hover:text-red-505 cursor-pointer p-1"
                          title={lang === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                          <div className="space-y-1 block text-left">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{lang === 'ar' ? 'اسم المنصة (كـ تيك توك):' : 'Platform Identity:'}</span>
                            <input 
                              type="text" 
                              value={custom.name}
                              onChange={(e) => {
                                const list = [...(builderConfig.footer.customSocialLinks || [])];
                                list[idx] = { ...list[idx], name: e.target.value };
                                updateBuilderConfig({
                                  ...builderConfig,
                                  footer: { ...builderConfig.footer, customSocialLinks: list }
                                });
                              }}
                              className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1 block text-left">
                            <span className="text-[9px] text-[#A855F7] font-bold uppercase">{lang === 'ar' ? 'رابط الصفحة الشخصية URL:' : 'Platform Destination Web URL:'}</span>
                            <input 
                              type="text" 
                              placeholder="https://tiktok.com/@..."
                              value={custom.url}
                              onChange={(e) => {
                                const list = [...(builderConfig.footer.customSocialLinks || [])];
                                list[idx] = { ...list[idx], url: e.target.value };
                                updateBuilderConfig({
                                  ...builderConfig,
                                  footer: { ...builderConfig.footer, customSocialLinks: list }
                                });
                              }}
                              className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        {/* File image Base64 logo direct inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left border-t border-white/5 pt-3">
                          <div className="space-y-1 block text-left">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{lang === 'ar' ? 'أو رابط مباشر للأيقونة (URL):' : 'Platform Icon Image Link URL:'}</span>
                            <input 
                              type="text" 
                              placeholder="https://icon-cloud.com/tiktok.png"
                              value={custom.iconUrl || ''}
                              onChange={(e) => {
                                const list = [...(builderConfig.footer.customSocialLinks || [])];
                                list[idx] = { ...list[idx], iconUrl: e.target.value };
                                updateBuilderConfig({
                                  ...builderConfig,
                                  footer: { ...builderConfig.footer, customSocialLinks: list }
                                });
                              }}
                              className="w-full bg-[#111827]/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none font-mono"
                            />
                          </div>

                          <div className="space-y-1 block text-left">
                            <span className="text-[9px] text-[#22D3EE] font-bold uppercase">{lang === 'ar' ? 'رفع ملف أيقونة شعار المنصة من جهازك:' : 'Or Upload Device Logo (PNG/SVG):'}</span>
                            <div className="flex items-center gap-2">
                              {custom.iconUrl && (
                                <img src={custom.iconUrl} alt="custom icon logo" className="w-8 h-8 object-contain bg-white/5 border border-white/10 rounded-lg p-1" referrerPolicy="no-referrer" />
                              )}
                              <input 
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const list = [...(builderConfig.footer.customSocialLinks || [])];
                                      list[idx] = { ...list[idx], iconUrl: reader.result as string };
                                      updateBuilderConfig({
                                        ...builderConfig,
                                        footer: { ...builderConfig.footer, customSocialLinks: list }
                                      });
                                      fireToast(lang === 'ar' ? 'تم رفع أيقونة المنصة بنجاح!' : 'Platform logo uploaded successfully', 'success');
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl p-1 text-gray-400 text-xs file:bg-brand-secondary file:border-none file:text-white file:px-2.5 file:py-0.5 file:rounded-md file:text-[9px] file:cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOM TEMPLATES SYSTEM */}
          {activeBuilderTab === 'templates' && (
            <div className="space-y-4 animate-fade-in text-left">
              <h4 className="text-[11px] font-black uppercase text-brand-secondary tracking-widest border-b border-white/5 pb-1.5 font-mono">
                {lang === 'ar' ? 'حقيبة القوالب والنسخ وتصميم السمات' : 'Templates Vault and Visual Presets Archiver'}
              </h4>

              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl block text-left">
                <span className="text-gray-400 font-bold text-[10px] uppercase block mb-1.5">{lang === 'ar' ? 'حفظ تصميمك ومسافات ألوان الموقع الحالي في سجل القوالب:' : 'Save current design config palette as visual template preset:'}</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'اكتب اسم مميز (مثال: الشتاء الأخاذ، كربون، رمضان الأكحل)' : 'e.g. Carbon Edition, Summer Sunset'}
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-brand-primary hover:brightness-110 text-white font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    {lang === 'ar' ? '💾 حفظ كقالب' : '💾 Save Template'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 block">
                <span className="text-xs font-bold text-gray-300 block">{lang === 'ar' ? 'قوالبك الإبداعية المحفوظة بالكامل:' : 'Your Creative Saved Presets:'}</span>
                
                {templates.length === 0 ? (
                  <p className="p-8 text-center text-gray-650 bg-white/[0.01] border border-white/5 border-dashed rounded-xl font-mono leading-normal">
                    {lang === 'ar' ? 'حقيبة قوالبك فارغة حالياً. اكتب اسماً للألوان والتموضع بالأعلى لحفظ القالب فورا.' : 'No custom presets registered. Write a creative title above to buffer your sandbox styles.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((tpl, tplIdx) => (
                      <div 
                        key={`${tpl.name}-${tplIdx}`}
                        className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/[0.04] transition-all"
                      >
                        <div className="text-left font-sans">
                          <p className="text-xs font-black text-gray-200">{tpl.name}</p>
                          <p className="text-[9px] text-[#A855F7] font-mono mt-0.5 tracking-wider font-extrabold uppercase">{tpl.config.font} Font • BorderRadius: {tpl.config.theme.buttonRadius}</p>
                        </div>
                        
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate(tpl.config)}
                            className="px-2.5 py-1 bg-brand-accent hover:brightness-110 text-black font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                          >
                            {lang === 'ar' ? 'تطبيق' : 'Apply'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTemplate(tplIdx)}
                            className="p-1 text-red-500 hover:bg-red-950/20 rounded border border-red-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Global Save Trigger button */}
        <div className="lg:col-span-12 border-t border-white/5 pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-7 py-3 bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-accent text-white font-black tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all uppercase flex items-center gap-2 cursor-pointer text-xs shadow-xl shadow-brand-primary/10"
          >
            <CheckCircle2 className="w-4.5 h-4.5 animate-bounce" />
            <span>{lang === 'ar' ? 'تثبيت وحفظ التصميم نهائياً بمصر' : 'DEPLOY LIVE THEME CONFIG'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
