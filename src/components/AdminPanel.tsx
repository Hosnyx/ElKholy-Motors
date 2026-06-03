/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Lock, Key, ShieldCheck, Database, Upload, Eye, EyeOff, FileText, Plus, Trash2, 
  Edit2, Check, Sparkles, FolderOpen, Users, Settings, AlertCircle, TrendingUp, 
  Coins, Activity, Calendar, MessageSquare, ArrowUpRight, CheckCircle2,
  Trash, LogOut, ShieldAlert
} from 'lucide-react';
import { Motorcycle, CategorySlug, UserRole, UserAccount, AddOn, HomepageConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_HOMEPAGE_CONFIG } from '../data';
import HomepagePageBuilder from './HomepagePageBuilder';

interface AdminPanelProps {
  onClose: () => void;
  motorcycles: Motorcycle[];
  onUpdateMotorcycles: (updatedBikes: Motorcycle[]) => void;
  customText: any;
  onUpdateCustomText: (text: any) => void;
  homepageConfig?: HomepageConfig;
  onUpdateHomepageConfig?: (config: HomepageConfig) => void;
}

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

const DEFAULT_USERS: UserAccount[] = [
  { username: 'HOSNY1995', password: 'Hhrm0101995ELelkholy', role: 'Admin' }
];

export default function AdminPanel({
  onClose,
  motorcycles,
  onUpdateMotorcycles,
  customText,
  onUpdateCustomText,
  homepageConfig = DEFAULT_HOMEPAGE_CONFIG,
  onUpdateHomepageConfig,
}: AdminPanelProps) {
  const { lang, dir, t } = useLanguage();

  // Authentication & Core Session State
  const [sessionUser, setSessionUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('elkholy_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // User Accounts State (persisted inside localStorage)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('elkholy_users');
    if (saved) return JSON.parse(saved);
    // Persist defaults on first run
    localStorage.setItem('elkholy_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  });

  // Sidebar navigation panel: 'dashboard' | 'motorcycles' | 'users' | 'settings'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'motorcycles' | 'users' | 'settings'>('dashboard');

  // Bookings queue state
  const [bookings, setBookings] = useState<any[]>(() => {
    const saved = localStorage.getItem('elkholy_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  // Toasts list state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Dashboard category filter
  const [dashCategoryFilter, setDashCategoryFilter] = useState<'All' | 'A' | 'B' | 'C' | 'S'>('All');

  // Multi-tab sub-layout state for Edit/Add forms
  const [formSubTab, setFormSubTab] = useState<'basic' | 'pricing' | 'catalog' | 'addons'>('basic');

  // New accessory creation temp state
  const [newAddOn, setNewAddOn] = useState<AddOn>({
    id: '',
    name: '',
    nameAr: '',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=150',
    description: '',
    descAr: '',
    price: 0
  });

  // Bike Form States
  const [editingBike, setEditingBike] = useState<Motorcycle | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [bikeForm, setBikeForm] = useState({
    id: '',
    name: '',
    category: 'A' as CategorySlug,
    categoryName: 'Sport',
    price: '$45,000',
    priceNum: 45000,
    image: '',
    tagline: 'Ride the Future',
    shortDesc: '',
    longDesc: '',
    isPopular: false,
    specs: {
      engine: '1200cc Solid-State Hub',
      topSpeed: '320 km/h',
      fuelConsumption: '0.0 L/100km',
      power: '190 hp',
      weight: '170 kg'
    },
    isCustom: true,
    catalogFileName: '',
    catalogFileContent: '',
    originalPrice: 45000 as number | undefined,
    discount: 0 as number | undefined,
    discountType: 'percentage' as 'percentage' | 'fixed',
    offerLabel: '',
    addOns: [] as AddOn[],
  });

  // Users creation state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Staff');

  // Home details text form
  const [textForm, setTextForm] = useState({
    arTitle: customText?.arTitle || 'الخولي',
    arTitleAccent: customText?.arTitleAccent || 'موتورز',
    enTitle: customText?.enTitle || 'ELKHOLY',
    enTitleAccent: customText?.enTitleAccent || 'MOTORS',
    arSlogan: customText?.arSlogan || 'سابق مع المستقبل',
    enSlogan: customText?.enSlogan || 'Ride the Future',
    arHeroDesc: customText?.arHeroDesc || 'انضم إلى عالم الغد. تقدم الخولي موتورز أقوى الموتوسيكلات والاسكوترات فائقة الأداء للمستقبل. استكشف كتالوجاتنا، واقرأ المواصفات واحجز رحلتك مباشرة.',
    enHeroDesc: customText?.enHeroDesc || 'Step inside the virtual grid. ElKholy Motors introduces extreme-output solid-state performance bikes, plasma touring adventurers, and high-fidelity smart urban scooters designed in 2026. Explore our catalog, review blueprints, and book a secure ride directly.',
    arBadge: customText?.arBadge || 'أول معرض كبار الشخصيات بمصر',
    enBadge: customText?.enBadge || "EGYPT'S FIRST CHRONOS SHOWROOM",
  });

  // Dynamic page builder state management
  const [builderConfig, setBuilderConfig] = useState<HomepageConfig>(homepageConfig);
  const [history, setHistory] = useState<HomepageConfig[]>([homepageConfig]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [templates, setTemplates] = useState<{name: string, config: HomepageConfig}[]>(() => {
    const loaded = localStorage.getItem('elkholy_templates');
    return loaded ? JSON.parse(loaded) : [];
  });
  const [newTemplateName, setNewTemplateName] = useState('');
  const [activeBuilderTab, setActiveBuilderTab] = useState<'fonts' | 'theme' | 'header' | 'main' | 'footer' | 'templates'>('header');

  // Sync state if outward prop changes
  useEffect(() => {
    if (homepageConfig) {
      setBuilderConfig(homepageConfig);
    }
  }, [homepageConfig]);

  // Multi-state configuration update helper
  const updateBuilderConfig = (newConfig: HomepageConfig) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newConfig);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setBuilderConfig(newConfig);
    if (onUpdateHomepageConfig) {
      onUpdateHomepageConfig(newConfig);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setBuilderConfig(history[prevIndex]);
      if (onUpdateHomepageConfig) {
        onUpdateHomepageConfig(history[prevIndex]);
      }
      fireToast(lang === 'ar' ? 'تم التراجع عن التعديل' : 'Design undone successfully', 'info');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setBuilderConfig(history[nextIndex]);
      if (onUpdateHomepageConfig) {
        onUpdateHomepageConfig(history[nextIndex]);
      }
      fireToast(lang === 'ar' ? 'تمت إعادة تطبيق التعديل' : 'Design redone successfully', 'info');
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      fireToast(lang === 'ar' ? 'يرجى إدخال اسم القالب أولاً' : 'Template name cannot be empty', 'error');
      return;
    }
    const updated = [...templates, { name: newTemplateName.trim(), config: builderConfig }];
    setTemplates(updated);
    localStorage.setItem('elkholy_templates', JSON.stringify(updated));
    setNewTemplateName('');
    fireToast(lang === 'ar' ? 'تم حفظ هذا التموضع في قائمة قوالبك بنجاح!' : 'Current matrix saved as custom template!', 'success');
  };

  const handleApplyTemplate = (config: HomepageConfig) => {
    updateBuilderConfig(config);
    fireToast(lang === 'ar' ? 'تم تحميل القالب وتثبيته!' : 'Template deployed as active matrix!', 'success');
  };

  const handleRemoveTemplate = (idx: number) => {
    const updated = templates.filter((_, i) => i !== idx);
    setTemplates(updated);
    localStorage.setItem('elkholy_templates', JSON.stringify(updated));
    fireToast(lang === 'ar' ? 'تم حذف القالب المختار' : 'Selected template deleted', 'info');
  };

  const handleResetToDefault = () => {
    updateBuilderConfig(DEFAULT_HOMEPAGE_CONFIG);
    fireToast(lang === 'ar' ? 'تمت إعادة تهيئة المعاينة للسمات الافتراضية للمعرض' : 'Reset interactive showcase style deck', 'info');
  };

  // Fire a dynamic toast
  const fireToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = { id: `toast-${Date.now()}`, text, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  // Synchronize dynamic bookings queue updates from storage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedBookings = localStorage.getItem('elkholy_bookings');
      if (savedBookings) {
        setBookings(JSON.parse(savedBookings));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync users to storage
  useEffect(() => {
    localStorage.setItem('elkholy_users', JSON.stringify(users));
  }, [users]);

  // Auth Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = usernameInput.trim();
    // Validate credentials against stored list
    const found = users.find(u => u.username.toLowerCase() === cleanUser.toLowerCase() && u.password === passwordInput);
    if (found) {
      setSessionUser(found);
      localStorage.setItem('elkholy_session_user', JSON.stringify(found));
      setUsernameInput('');
      setPasswordInput('');
      fireToast(lang === 'ar' ? `مرحباً بك مجدداً ${scoreRoleLabel(found.role)}` : `Welcome back ${found.role} operator`, 'success');
    } else {
      fireToast(lang === 'ar' ? 'البوابة المغلقة: بيانات دخول خاطئة' : 'Gateway Refused: Incorrect credentials', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('elkholy_session_user');
    setSessionUser(null);
    fireToast(lang === 'ar' ? 'تم فصل الجلسة بأمان' : 'Session terminated securely', 'info');
  };

  // Memoized filtered motorcycles for Dash panel view
  const dashFilteredBikes = useMemo(() => {
    if (dashCategoryFilter === 'All') return motorcycles;
    return motorcycles.filter(b => b.category === dashCategoryFilter);
  }, [motorcycles, dashCategoryFilter]);

  // Image Base64 Uploader
  const handleFormImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        fireToast(lang === 'ar' ? 'الحد الأقصى لحجم الملف هو 2 ميجابايت' : 'Max attachment limit is 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBikeForm((prev) => ({ ...prev, image: reader.result as string }));
          fireToast(lang === 'ar' ? 'تم تشفير الصورة وإرفاقها بنجاح' : 'Resource image attached and base64 encoded', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Bike Actions
  const handleEditBikeClick = (bike: Motorcycle) => {
    // Role check: Staff cannot edit or delete
    if (sessionUser?.role === 'Staff') {
      fireToast(lang === 'ar' ? 'صلاحيات منخفضة: لا يمكنك تعديل المركبات' : 'Low Privilege Node: Staff cannot modify machines', 'error');
      return;
    }
    setEditingBike(bike);
    setIsAddingNew(false);
    setFormSubTab('basic');
    setBikeForm({
      id: bike.id,
      name: bike.name,
      category: bike.category,
      categoryName: bike.categoryName,
      price: bike.price,
      priceNum: bike.priceNum || 45000,
      image: bike.image,
      tagline: bike.tagline || 'Apex Performance',
      shortDesc: bike.shortDesc,
      longDesc: bike.longDesc || '',
      isPopular: !!bike.isPopular,
      specs: { ...bike.specs },
      isCustom: true,
      catalogFileName: bike.catalogFileName || '',
      catalogFileContent: bike.catalogFileContent || '',
      originalPrice: bike.originalPrice !== undefined ? bike.originalPrice : (bike.priceNum || 45000),
      discount: bike.discount || 0,
      discountType: bike.discountType || 'percentage',
      offerLabel: bike.offerLabel || '',
      addOns: bike.addOns ? [...bike.addOns] : [],
    });
  };

  const handleAddNewClick = () => {
    setIsAddingNew(true);
    setEditingBike(null);
    setFormSubTab('basic');
    setBikeForm({
      id: `custom-bike-${Date.now()}`,
      name: 'NEW APEX MACHINE V4',
      category: 'A',
      categoryName: 'Sport',
      price: '$45,000',
      priceNum: 45000,
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600',
      tagline: 'Defying Hybrid Propulsion Gravity',
      shortDesc: 'State-of-the-art futuristic motorcycle prototype built for top speed and luxury.',
      longDesc: 'Engineered with double aero-dynamics, plasma thrust controls, adaptive visual HUD panels, and lightweight solid-state lithium cells for continuous power output.',
      isPopular: false,
      specs: {
        engine: '1200cc Quad-Pulse Solid',
        topSpeed: '340 km/h',
        fuelConsumption: '0.0 L/100km',
        power: '210 HP',
        weight: '172 kg'
      },
      isCustom: true,
      catalogFileName: '',
      catalogFileContent: '',
      originalPrice: 45000,
      discount: 0,
      discountType: 'percentage',
      offerLabel: '',
      addOns: [],
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bikeForm.name || !bikeForm.image) {
      fireToast(lang === 'ar' ? 'الرجاء إدخال اسم المركبة وصورة صالحة' : 'Machine name and visual are both mandatory', 'error');
      return;
    }

    const catNames = { A: 'Sport', B: 'Cruiser', C: 'Adventure', S: 'Scooter' };
    
    // Dynamically calculate final price from originalPrice and discount
    let calculatedPriceNum = Number(bikeForm.originalPrice !== undefined ? bikeForm.originalPrice : (bikeForm.priceNum || 45000));
    const discVal = Number(bikeForm.discount || 0);
    if (discVal > 0 && bikeForm.originalPrice) {
      if (bikeForm.discountType === 'percentage') {
        calculatedPriceNum = Math.round(bikeForm.originalPrice * (1 - discVal / 100));
      } else {
        calculatedPriceNum = Math.round(Math.max(0, bikeForm.originalPrice - discVal));
      }
    }

    const completedForm: Motorcycle = {
      ...bikeForm,
      priceNum: calculatedPriceNum,
      categoryName: catNames[bikeForm.category],
      price: `${calculatedPriceNum.toLocaleString()} جنيه`,
    };

    let nextBikes: Motorcycle[] = [];
    if (isAddingNew) {
      nextBikes = [completedForm, ...motorcycles];
      fireToast(lang === 'ar' ? 'تمت إضافة آلة جديدة للأسطول!' : 'New heavy machine commissioned successfully!', 'success');
    } else if (editingBike) {
      if (sessionUser?.role === 'Staff') {
        fireToast(lang === 'ar' ? 'خطأ في الترخيص: لا تملك حق التعديل' : 'Staff node unauthorized for writes', 'error');
        return;
      }
      nextBikes = motorcycles.map((b) => (b.id === editingBike.id ? completedForm : b));
      fireToast(lang === 'ar' ? 'تم تحديث بيانات المعايرة بنجاح!' : 'Machine parameters updated in showrooms!', 'success');
    }

    onUpdateMotorcycles(nextBikes);
    setEditingBike(null);
    setIsAddingNew(false);
  };

  const handleDeleteBike = (bikeId: string) => {
    // Only Admin can delete
    if (sessionUser?.role !== 'Admin') {
      fireToast(lang === 'ar' ? 'العملية مرفوضة: المسؤولون فقط يمكنهم الحذف' : 'Privilege Breach: Only core admins can decommission equipment', 'error');
      return;
    }
    const nextBikes = motorcycles.filter((b) => b.id !== bikeId);
    onUpdateMotorcycles(nextBikes);
    fireToast(lang === 'ar' ? 'تم شطب وإزالة المركبة من قاعدة البيانات' : 'Heavy cycle decommissioned successfully', 'success');
  };

  // User Actions (Core Admin Only)
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionUser?.role !== 'Admin') {
      fireToast(lang === 'ar' ? 'صلاحيات كافية فقط للمشرف الرئيسي' : 'Master administrator key required for nodes curation', 'error');
      return;
    }

    const cleanUsername = newUsername.trim();
    if (!cleanUsername || !newPassword) {
      fireToast(lang === 'ar' ? 'خطأ: يرجى ملء كافة خانات المشرفين' : 'Node username and code key are required', 'error');
      return;
    }

    const userExists = users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (userExists) {
      fireToast(lang === 'ar' ? 'هذا الحساب مسجل بالفعل في الأتمتة' : 'Operator node identity key already online', 'error');
      return;
    }

    const newUser: UserAccount = {
      username: cleanUsername,
      password: newPassword,
      role: newRole
    };

    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    setNewUsername('');
    setNewPassword('');
    fireToast(lang === 'ar' ? 'تم تفويض المشغل الجديد بنجاح!' : `Operator node delegated: ${cleanUsername} [${newRole}]`, 'success');
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    if (sessionUser?.role !== 'Admin') {
      fireToast('Core admin authorization required', 'error');
      return;
    }

    // Protect master HOSNY1995 from deletion lockout
    if (usernameToDelete.toUpperCase() === 'HOSNY1995') {
      fireToast(lang === 'ar' ? 'لوائح الأمان: لا يمكن حذف حساب المالك الرئيسي' : 'Security Directive: Locked node [HOSNY1995] cannot be erased', 'error');
      return;
    }

    // Protect current self from deletion
    if (usernameToDelete === sessionUser.username) {
      fireToast(lang === 'ar' ? 'لوائح الأمان: لا يمكن حذف مشغل الجلسة الحالي' : 'Security Directive: You cannot delete your own session node', 'error');
      return;
    }

    const next = users.filter(u => u.username !== usernameToDelete);
    setUsers(next);
    fireToast(lang === 'ar' ? 'تم سحب صلاحيات المشغل بنجاح' : `Privileges revoked for node: ${usernameToDelete}`, 'success');
  };

  // Update Settings homepage Text Content
  const handleContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionUser?.role !== 'Admin') {
      fireToast(lang === 'ar' ? 'صلاحيات منخفضة: المشرفون فقط يحق لهم تعديل المحتوى المالي والوصفي' : 'Forbidden: Homepage layouts restricted to Admin operators', 'error');
      return;
    }
    onUpdateCustomText(textForm);
    if (onUpdateHomepageConfig) {
      onUpdateHomepageConfig(builderConfig);
    }
    fireToast(lang === 'ar' ? 'تم حفظ وتطوير تصميم صفحة المعرض بنجاح!' : 'Advanced layout configuration deployed successfully!', 'success');
  };

  // Clear bookings queue logs (Admin privilege)
  const handleClearBookings = () => {
    if (sessionUser?.role !== 'Admin') {
      fireToast(lang === 'ar' ? 'الوصول مرفوض: الإداريون فقط يحق لهم الحذف' : 'Privilege Breach: Only admins can clean logs', 'error');
      return;
    }
    localStorage.removeItem('elkholy_bookings');
    setBookings([]);
    fireToast(lang === 'ar' ? 'تم تفريغ طابور الحجوزات نهائياً' : 'Holographic lead queue purged successfully', 'info');
  };

  // Score stats values
  const fleetValue = useMemo(() => {
    return motorcycles.reduce((acc, current) => acc + (current.priceNum || 45000), 0);
  }, [motorcycles]);

  const catA_Count = useMemo(() => motorcycles.filter(b => b.category === 'A').length, [motorcycles]);
  const catB_Count = useMemo(() => motorcycles.filter(b => b.category === 'B').length, [motorcycles]);
  const catC_Count = useMemo(() => motorcycles.filter(b => b.category === 'C').length, [motorcycles]);
  const catS_Count = useMemo(() => motorcycles.filter(b => b.category === 'S').length, [motorcycles]);

  function scoreRoleLabel(role: UserRole) {
    if (lang === 'ar') {
      if (role === 'Admin') return 'مشرف رئيسي';
      if (role === 'Manager') return 'مدير أسطول';
      return 'فريق عمل منسق';
    }
    return role;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md overflow-hidden">
      
      {/* Toast Notification Layer */}
      <div className="fixed top-5 right-5 z-80 space-y-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 50 }}
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 shadow-xl backdrop-blur-md pointer-events-auto ${
                t.type === 'success' 
                  ? 'bg-green-950/80 border-green-500/40 text-green-400' 
                  : t.type === 'error' 
                  ? 'bg-red-950/80 border-red-500/40 text-red-400' 
                  : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-xs font-mono font-medium">{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Terminal Shell Box */}
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        className="w-full max-w-6xl h-[94vh] glass-panel border border-[#6366F1]/30 rounded-3xl overflow-hidden flex flex-col relative shadow-2xl box-glow-indigo text-white uppercase"
        dir={dir}
      >
        {/* Holographic Signal Scan Line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary z-20" />

        {/* Header Ribbon Node */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4 bg-[#0B0F1A]/90 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/30">
              <Database className="w-5 h-5 text-[#22D3EE] animate-pulse" />
            </div>
            <div className="text-left" dir={dir}>
              <h2 className="text-sm sm:text-base font-extrabold tracking-widest font-mono">
                {t('admin_title')}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5" dir="ltr">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                <span className="text-[9px] text-gray-500 font-mono tracking-widest">
                  {sessionUser ? `ACTIVE NODE: ${sessionUser.username} | ${sessionUser.role.toUpperCase()}` : 'SECURE GPRS SHELL TERMINAL | OFFLINE'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessionUser && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-[9px] rounded-lg transition-all flex items-center gap-1.5 hover:scale-[1.03]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'فصل المشترك' : 'DISCONNECT'}</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/5 bg-white/[0.03] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Shell Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#080B13]/95">
          
          {/* ===================== VIEW A: OFFLINE LOCK SCREEN ===================== */}
          {!sessionUser ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto space-y-6" dir={dir}>
              
              <div className="space-y-2">
                <motion.div 
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center mx-auto text-brand-accent shadow-lg shadow-brand-accent/5"
                >
                  <Lock className="w-6 h-6" />
                </motion.div>
                
                <h3 className="text-base font-bold font-mono tracking-wider">
                  {lang === 'ar' ? 'بوابة التحقق المشفرة' : 'OPERATOR IDENTITY PORTAL'}
                </h3>
                <p className="text-xs text-gray-500 normal-case leading-normal font-sans">
                  {lang === 'ar' 
                    ? 'الوصول محدود للأعضاء المصرح لهم فقط. يرجى تزويد رمز الدخول لإعطاء التفويض.'
                    : 'Access is limited to verified personnel only. Enter your credentials to initialize GPRS link.'
                  }
                </p>

                <div className="p-3 border border-indigo-500/20 bg-indigo-950/20 rounded-xl text-[10px] font-mono text-gray-400 leading-normal text-left capitalize font-semibold tracking-wide">
                  ⚡ {lang === 'ar' ? 'أعضاء الأوتوماتيكي الافتراضيون:' : 'Default Demo Node:'}<br />
                  <span className="text-brand-accent">HOSNY1995</span> | Code: <span className="text-brand-primary">Hhrm0101995ELelkholy</span>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="w-full space-y-3.5 text-left font-mono text-xs max-w-[320px]">
                <div className="space-y-1">
                  <label className="text-gray-400 tracking-wider text-[10px]">{lang === 'ar' ? 'اسم المستخدم للمشغل' : 'OPERATOR ACCOUNT NAME'}:</label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder={lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter Username Identity'}
                    className="w-full bg-black/60 border border-white/[0.08] focus:border-indigo-400 text-white rounded-xl px-4 py-2.5 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 tracking-wider text-[10px]">{lang === 'ar' ? 'كلمة المرور' : 'ACCESS CODE KEY'}:</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/60 border border-white/[0.08] focus:border-indigo-400 text-white rounded-xl px-4 py-2.5 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-[#0B0F1A] font-black tracking-widest rounded-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <Key className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تسجيل دخول المحطة' : 'INITIALIZE LINK'}</span>
                </button>
              </form>

            </div>
          ) : (
            
            // ===================== VIEW B: LOGGED IN WORKSTATION =====================
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10 h-full">
              
              {/* Sidebar Tabs Selectors */}
              <div className="w-full md:w-56 bg-black/30 border-b md:border-b-0 md:border-r border-white/[0.05] flex md:flex-col gap-1.5 p-3 shrink-0">
                <p className="hidden md:block text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-2 p-1.5">
                  {lang === 'ar' ? 'أقسام الواجهة' : 'WORKSPACE TERMINALS'}
                </p>
                
                {/* Tab: Dashboard */}
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-2 rounded-xl font-mono text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-brand-primary/15 to-transparent border border-brand-primary/35 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.01]'
                  }`}
                >
                  <Activity className="w-4 h-4 text-[#22D3EE]" />
                  <span>{lang === 'ar' ? 'لوحة القيادة' : 'DASHBOARD'}</span>
                </button>

                {/* Tab: Fleet Manager */}
                <button
                  onClick={() => setActiveTab('motorcycles')}
                  className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-2 rounded-xl font-mono text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === 'motorcycles'
                      ? 'bg-gradient-to-r from-brand-primary/15 to-transparent border border-brand-primary/35 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.01]'
                  }`}
                >
                  <Database className="w-4 h-4 text-brand-accent" />
                  <span>{lang === 'ar' ? 'أسطول الدراجات' : 'MOTORCYCLES'}</span>
                </button>

                {/* Tab: Operators Node Settings */}
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-2 rounded-xl font-mono text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-gradient-to-r from-brand-primary/15 to-transparent border border-brand-primary/35 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.01]'
                  }`}
                >
                  <Users className="w-4 h-4 text-brand-secondary" />
                  <span>{lang === 'ar' ? 'المشرفون والأسماء' : 'USERS LIST'}</span>
                </button>

                {/* Tab: Application Customization */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-2 rounded-xl font-mono text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-gradient-to-r from-brand-primary/15 to-transparent border border-brand-primary/35 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.01]'
                  }`}
                >
                  <Settings className="w-4 h-4 text-white" />
                  <span>{lang === 'ar' ? 'إعدادات المعرض' : 'SETTINGS'}</span>
                </button>
              </div>

              {/* Dynamic Console Desk Screen */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-left relative z-10">
                
                {/* ================================== TAB 1: SAAS DASHBOARD HUB ================================== */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-base font-bold tracking-widest font-mono">
                        {lang === 'ar' ? 'بيانات أداء المعرض' : 'HQ COMMAND AND ANALYTICS'}
                      </h3>
                      <p className="text-[11px] text-gray-500 normal-case leading-normal font-sans">
                        {lang === 'ar' ? 'معلومات عامة متكاملة ومؤشرات أداء المعرض والزوار.' : 'Real-time telemetry oversight of booking nodes, brand capital flow, and operator statistics.'}
                      </p>
                    </div>

                    {/* Stat Cards Matrix Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Metric A: Val */}
                      <div className="p-4 rounded-2xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-brand-accent/20 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'قيمة الأسطول' : 'BRAND ASSETS'}</span>
                          <Coins className="w-4 h-4 text-brand-accent" />
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-black font-mono tracking-tight text-white">${fleetValue.toLocaleString()}</span>
                          <span className="block text-[8px] mt-0.5 text-green-400 font-sans tracking-widest leading-none">⚡ MILLION CODE VALUE</span>
                        </div>
                      </div>

                      {/* Metric B: Cycle nodes */}
                      <div className="p-4 rounded-2xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-brand-primary/20 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'مركبات في المعرض' : 'FLEET MACHINES'}</span>
                          <Database className="w-4 h-4 text-brand-primary" />
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-black font-mono tracking-tight text-white">{motorcycles.length}</span>
                          <span className="block text-[8px] mt-0.5 text-brand-accent font-sans tracking-widest leading-none">● ACTIVE DESIGNS IN 2026</span>
                        </div>
                      </div>

                      {/* Metric C: Operator Nodes */}
                      <div className="p-4 rounded-2xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-brand-secondary/20 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'المشرفون النشطون' : 'CURATORS'}</span>
                          <Users className="w-4 h-4 text-brand-secondary" />
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-black font-mono tracking-tight text-white">{users.length}</span>
                          <span className="block text-[8px] mt-0.5 text-gray-400 font-sans tracking-widest leading-none">👤 ROLE-BASED ACCESS KEYS</span>
                        </div>
                      </div>

                      {/* Metric D: Bookings Leads */}
                      <div className="p-4 rounded-2xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-white/10 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'الحجوزات المعلقة' : 'RESERVATIONS'}</span>
                          <MessageSquare className="w-4 h-4 text-red-500 animate-pulse" />
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-black font-mono tracking-tight text-white">{bookings.length}</span>
                          <span className="block text-[8px] mt-0.5 text-red-400 font-mono tracking-widest leading-none">📱 DIRECT WHATSAPP LEADS</span>
                        </div>
                      </div>
                    </div>

                    {/* Category Breakdown & Allocation Visualizer */}
                    <div className="p-4.5 rounded-2xl bg-[#0F1422]/70 border border-indigo-500/10 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-mono font-bold tracking-wider">{lang === 'ar' ? 'نسب توزيع المركبات عبر الفئات' : 'VEHICLE CLASS DISTRIBUTION'}</span>
                        <span className="text-[9px] text-[#22D3EE] font-mono">CALIBRATION CAP: 100%</span>
                      </div>

                      {/* Visual Gradient Bar allocations (Sleek CSS Charting) */}
                      <div className="space-y-3">
                        {/* Sport */}
                        <div>
                          <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1 leading-none">
                            <span>SPORT CLASS A</span>
                            <span className="font-bold text-white">{catA_Count} ({Math.round(catA_Count / (motorcycles.length || 1) * 100)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${(catA_Count / (motorcycles.length || 1)) * 100}%` }} 
                              transition={{ duration: 1.2 }}
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                            />
                          </div>
                        </div>

                        {/* Cruiser */}
                        <div>
                          <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1 leading-none">
                            <span>CRUISER CLASS B</span>
                            <span className="font-bold text-white">{catB_Count} ({Math.round(catB_Count / (motorcycles.length || 1) * 100)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${(catB_Count / (motorcycles.length || 1)) * 100}%` }}
                              transition={{ duration: 1.2 }}
                              className="h-full rounded-full bg-gradient-to-r from-brand-secondary to-[#A855F7]"
                            />
                          </div>
                        </div>

                        {/* Adventure */}
                        <div>
                          <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1 leading-none">
                            <span>ADVENTURE CLASS C</span>
                            <span className="font-bold text-white">{catC_Count} ({Math.round(catC_Count / (motorcycles.length || 1) * 100)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${(catC_Count / (motorcycles.length || 1)) * 100}%` }}
                              transition={{ duration: 1.2 }}
                              className="h-full rounded-full bg-gradient-to-r from-brand-accent to-[#06B6D4]"
                            />
                          </div>
                        </div>

                        {/* Scooter */}
                        <div>
                          <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1 leading-none">
                            <span>SCOOTER CLASS S</span>
                            <span className="font-bold text-white">{catS_Count} ({Math.round(catS_Count / (motorcycles.length || 1) * 100)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${(catS_Count / (motorcycles.length || 1)) * 100}%` }}
                              transition={{ duration: 1.2 }}
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leads & Bookings Queue log (Aesthetic Stripe-styled Table) */}
                    <div className="p-4.5 rounded-2xl bg-[#0B0F1A]/85 border border-[#6366F1]/15 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-brand-accent shrink-0 animate-pulse" />
                          <span className="text-xs font-mono font-bold tracking-wider">{lang === 'ar' ? 'طابور رصد اتصالات الحجز' : 'ACTIVE CHRONOS SHOWROOM RESERVATIONS'}</span>
                        </div>
                        {sessionUser.role === 'Admin' && bookings.length > 0 && (
                          <button
                            onClick={handleClearBookings}
                            className="px-2 py-1 bg-red-600/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-500/20 transition-all font-mono text-[9px] cursor-pointer"
                          >
                            {lang === 'ar' ? 'تفريغ السجل' : 'PURGE LEADS'}
                          </button>
                        )}
                      </div>

                      {bookings.length === 0 ? (
                        <div className="text-center py-8 text-gray-600 font-mono text-[10px] space-y-1.5 select-none text-transform: lowercase">
                          <MessageSquare className="w-8 h-8 text-gray-700 mx-auto opacity-40" />
                          <p className="tracking-widest uppercase text-gray-500">{lang === 'ar' ? 'لا حواسب ولا حجوزات مسجلة بعد' : 'NO SPOOLED BOOKINGS RECIEVED'}</p>
                          <p className="text-[9px] text-gray-400 normal-case font-sans">Submit a reserve ticket using any Book Now button to populate real leads here.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-[220px] scrollbar-thin">
                          <table className="w-full text-left border-collapse font-mono text-[10px] sm:text-[11px]" dir={dir}>
                            <thead>
                              <tr className="border-b border-white/5 text-gray-500 text-[9px] tracking-widest">
                                <th className="pb-2 text-right">{lang === 'ar' ? 'العميل' : 'CLIENT'}</th>
                                <th className="pb-2 text-right">{lang === 'ar' ? 'الماكينة' : 'MACHINE'}</th>
                                <th className="pb-2 text-right">{lang === 'ar' ? 'الهاتف' : 'PHONE'}</th>
                                <th className="pb-2 text-right">{lang === 'ar' ? 'تاريخ الحجز' : 'RESERVE DATE'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bookings.map((b) => (
                                <tr key={b.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] text-gray-300">
                                  <td className="py-2.5 font-sans font-bold text-white transition-colors">
                                    {b.name}
                                    <span className="block text-[8px] font-mono text-gray-500 normal-case">{b.email}</span>
                                  </td>
                                  <td className="py-2.5 text-indigo-400 text-right">{b.motorcycleName}</td>
                                  <td className="py-2.5 text-right font-bold text-brand-accent">
                                    <a 
                                      href={`https://wa.me/${b.phone.replace(/[^0-9]/g, '')}`} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="hover:underline flex items-center justify-end gap-1 shrink-0"
                                    >
                                      <span>{b.phone}</span>
                                      <ArrowUpRight className="w-3 h-3 text-green-400 shrink-0" />
                                    </a>
                                  </td>
                                  <td className="py-2.5 text-right font-sans italic text-gray-400">{b.date}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ================================== TAB 2: INTERACTIVE FLEET MANAGER ================================== */}
                {activeTab === 'motorcycles' && (
                  <div className="space-y-4 animate-fade-in">
                    
                    {!isAddingNew && !editingBike ? (
                      // Grid list displays of active cycles
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div>
                            <h3 className="text-base font-bold font-mono tracking-wider">
                              {lang === 'ar' ? `قائمة الأسطول الحالية (${motorcycles.length})` : `FLEET COMPOSITION GRID (${motorcycles.length})`}
                            </h3>
                            <p className="text-[11px] text-gray-500 normal-case leading-normal font-sans">
                              {lang === 'ar' ? 'تفويض دراجات إلكترونية جديدة، تحديث مقاييس الدفع الحصانية أو التعديل والمسح.' : 'Review, register, modify specifications, or purge extreme dynamic cycles from Egypt showrooms.'}
                            </p>
                          </div>
                          
                          <button
                            onClick={handleAddNewClick}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-accent text-[#0B0F1A] hover:bg-[#18b5cc] font-mono text-[10.5px] font-black rounded-xl transition-all cursor-pointer shadow-md shadow-brand-accent/15"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{lang === 'ar' ? 'إضافة آلة' : 'COMMISSION NEW BIKE'}</span>
                          </button>
                        </div>

                        {/* Interactive Category Filter Tabs */}
                        <div className="flex border border-white/5 bg-black/40 p-1 rounded-xl w-fit max-w-full overflow-x-auto gap-1 self-start select-none font-mono text-[10px]">
                          {(['All', 'A', 'B', 'C', 'S'] as const).map((cat) => {
                            const isActive = dashCategoryFilter === cat;
                            const label = cat === 'All' 
                              ? (lang === 'ar' ? 'الكل 🌐' : 'Show All')
                              : cat === 'A' ? (lang === 'ar' ? 'A سبورت ⚡' : 'A - Sport')
                              : cat === 'B' ? (lang === 'ar' ? 'B كروزر 🛋️' : 'B - Cruiser')
                              : cat === 'C' ? (lang === 'ar' ? 'C مغامرات 🧭' : 'C - Touring')
                              : (lang === 'ar' ? 'S سكوتر 🔋' : 'S - Scooter');
                            
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setDashCategoryFilter(cat)}
                                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-brand-accent text-[#0B0F1A] shadow-md shadow-brand-accent/25 font-black'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {dashFilteredBikes.length > 0 ? (
                            dashFilteredBikes.map((bike) => (
                            <div
                              key={bike.id}
                              className="p-4 bg-[#111624]/80 border border-white/[0.04] hover:border-brand-primary/20 rounded-2xl flex items-center gap-4 transition-all"
                            >
                              <img
                                src={bike.image}
                                alt={bike.name}
                                referrerPolicy="no-referrer"
                                className="w-16 h-16 object-contain bg-black/40 rounded-xl p-1 shrink-0"
                              />
                              <div className="flex-1 min-w-0 text-left" dir={dir}>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                  bike.category === 'A' ? 'bg-indigo-950/80 border border-indigo-400/20 text-indigo-400' :
                                  bike.category === 'B' ? 'bg-purple-950/85 border border-purple-400/20 text-brand-secondary' :
                                  bike.category === 'C' ? 'bg-[#0f2125] border border-cyan-400/20 text-[#22D3EE]' :
                                  'bg-emerald-950 border border-emerald-400/20 text-emerald-400'
                                }`}>
                                  {bike.categoryName} Class ({bike.category})
                                </span>
                                <h4 className="text-xs font-extrabold text-white tracking-wide truncate mt-1">
                                  {bike.name}
                                </h4>
                                <p className="font-mono text-brand-accent font-bold text-[11px] mt-0.5">{bike.price}</p>
                              </div>

                              <div className="flex flex-col gap-1.5 shrink-0 select-none">
                                {sessionUser.role !== 'Staff' ? (
                                  <button
                                    onClick={() => handleEditBikeClick(bike)}
                                    className="p-1 px-2 pointer-events-auto cursor-pointer bg-indigo-500/15 hover:bg-brand-primary border border-indigo-500/10 text-brand-accent hover:text-white rounded-lg transition-all flex items-center justify-center gap-1 font-mono text-[9px] tracking-wider"
                                    title="Upgrade Machine Parameters"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>{lang === 'ar' ? 'تعديل' : 'UPGRADE'}</span>
                                  </button>
                                ) : (
                                  <span className="text-[8px] text-gray-600 font-mono italic leading-none text-right">LOCKED NODES</span>
                                )}

                                {sessionUser.role === 'Admin' && (
                                  <button
                                    onClick={() => handleDeleteBike(bike.id)}
                                    className="p-1 px-2 pointer-events-auto cursor-pointer bg-red-500/10 hover:bg-red-500 border border-red-500/10 text-red-400 hover:text-white rounded-lg transition-all flex items-center justify-center gap-1 font-mono text-[9px] tracking-wider"
                                    title="Decommission Heavy Cycle"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>{lang === 'ar' ? 'شطب' : 'DELETE'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                          ) : (
                            <div className="text-center py-12 border border-white/5 bg-black/20 rounded-2xl col-span-1 sm:col-span-2 select-none font-mono text-[11px] text-gray-500 w-full">
                              {lang === 'ar' ? 'لا توجد مركبات مسجلة في هذا الفئة بعد' : 'No commissioned designs in this category segment.'}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Full Commission / Edit form screen
                      <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl mx-auto text-left">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h3 className="text-xs font-mono font-bold tracking-widest text-brand-accent uppercase">
                            {isAddingNew ? (lang === 'ar' ? 'تسجيل مركبة كهرومغناطيسية جديدة' : 'COMMISSION NEW CYBER VEHICLE') : `${lang === 'ar' ? 'تحوير مقاييس' : 'RECONFIG MACHINE'}: ${bikeForm.name}`}
                          </h3>
                          <button
                            type="button"
                            onClick={() => { setIsAddingNew(false); setEditingBike(null); }}
                            className="text-gray-400 hover:text-white text-[10px] font-mono cursor-pointer uppercase tracking-widest inline-flex items-center gap-1 text-right"
                          >
                            &lt; {lang === 'ar' ? 'تراجع للسياق' : 'DISCARD SHELL'}
                          </button>
                        </div>

                        {/* Sub-Tabs Selector Header */}
                        <div className="flex border-b border-white/5 pb-1 gap-2 overflow-x-auto select-none font-mono text-[10px] sm:text-[11px]">
                          <button
                            type="button"
                            onClick={() => setFormSubTab('basic')}
                            className={`pb-1.5 px-1.5 border-b-2 font-bold uppercase transition-all tracking-wider cursor-pointer ${
                              formSubTab === 'basic'
                                ? 'border-brand-accent text-brand-accent'
                                : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                          >
                            📁 {lang === 'ar' ? 'البيانات الأساسية' : 'Basic Info'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormSubTab('pricing')}
                            className={`pb-1.5 px-1.5 border-b-2 font-bold uppercase transition-all tracking-wider cursor-pointer ${
                              formSubTab === 'pricing'
                                ? 'border-brand-accent text-brand-accent'
                                : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                          >
                            💰 {lang === 'ar' ? 'العروض والتسعير' : 'Pricing & Offers'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormSubTab('catalog')}
                            className={`pb-1.5 px-1.5 border-b-2 font-bold uppercase transition-all tracking-wider cursor-pointer ${
                              formSubTab === 'catalog'
                                ? 'border-brand-accent text-brand-accent'
                                : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                          >
                            📄 {lang === 'ar' ? 'كتالوج PDF' : 'Catalog Document'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormSubTab('addons')}
                            className={`pb-1.5 px-1.5 border-b-2 font-bold uppercase transition-all tracking-wider cursor-pointer ${
                              formSubTab === 'addons'
                                ? 'border-brand-accent text-brand-accent'
                                : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                          >
                            🛠️ {lang === 'ar' ? 'الإضافات والملحقات' : 'Add-ons & Accessories'}
                          </button>
                        </div>

                        {/* Render Active Sub-Tab Layout Content */}
                        <div className="mt-3">
                          
                          {/* TAB A: BASIC INFO */}
                          {formSubTab === 'basic' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left font-mono animate-fade-in">
                              <div className="space-y-1">
                                <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'اسم المحفز الدقيق' : 'MACHINE IDENTIFIER NAME'}:</label>
                                <input
                                  type="text"
                                  required
                                  value={bikeForm.name}
                                  onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })}
                                  className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'تصنيف الفئة الأفقية' : 'SERIES COMPOSITION CLASSIFICATION'}:</label>
                                <select
                                  value={bikeForm.category}
                                  onChange={(e) => setBikeForm({ ...bikeForm, category: e.target.value as CategorySlug })}
                                  className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none"
                                >
                                  <option value="A">SPORT CLASS A (⚡ Speed Master)</option>
                                  <option value="B">CRUISER CLASS B (🛋️ Low-Slung Custom)</option>
                                  <option value="C">ADVENTURE CLASS C (🧭 Offgrid Nomad)</option>
                                  <option value="S">SCOOTER CLASS S (🔋 Urban Hub)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'الشعار السلوكي الفرعي' : 'CHASSIS SLOGAN SYNOPSIS'}:</label>
                                <input
                                  type="text"
                                  value={bikeForm.tagline}
                                  onChange={(e) => setBikeForm({ ...bikeForm, tagline: e.target.value })}
                                  className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none"
                                />
                              </div>

                              <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-white/5 pt-3">
                                <div className="space-y-1.5 text-left">
                                  <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'صورة المركبة هولوجرام' : 'REACTIVE IMAGE URL / BASE64 ENCODING'}:</label>
                                  <input
                                    type="text"
                                    value={bikeForm.image}
                                    onChange={(e) => setBikeForm({ ...bikeForm, image: e.target.value })}
                                    placeholder="Paste clean direct image url links here..."
                                    className="w-full bg-[#111827]/75 border border-white/[0.08] text-white rounded-xl px-4 py-2 text-xs focus:outline-none"
                                  />
                                  <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 rounded-lg cursor-pointer hover:bg-white/10 text-[9px] font-black transition-colors">
                                      <Upload className="w-3.5 h-3.5 text-brand-accent" />
                                      <span>{lang === 'ar' ? 'رفع ملف صورة مشفرة' : 'UPLOAD CHASSIS FILE'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFormImageUpload}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </div>

                                {bikeForm.image && (
                                  <div className="p-2 border border-white/[0.04] bg-black/40 rounded-2xl flex items-center justify-center max-h-[110px] overflow-hidden select-none">
                                    <img
                                      src={bikeForm.image}
                                      alt="Payload preview card"
                                      className="max-h-20 object-contain drop-shadow"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="col-span-1 sm:col-span-2 border-t border-white/5 pt-3 space-y-2.5 text-left">
                                <h4 className="text-[10px] text-gray-400 font-black tracking-widest uppercase flex items-center gap-1">
                                  <Sparkles className="w-4.5 h-4.5 text-brand-accent animate-pulse" /> 
                                  <span>{lang === 'ar' ? 'المواصفات الهندسية الدقيقة' : 'CORE TELEMETRY AND SPECS MATRIX'}</span>
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                  {/* spec: engine */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 font-bold">1. Propulsion core</label>
                                    <input
                                      type="text"
                                      value={bikeForm.specs.engine}
                                      onChange={(e) => setBikeForm({ ...bikeForm, specs: { ...bikeForm.specs, engine: e.target.value } })}
                                      className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-accent"
                                    />
                                  </div>
                                  {/* spec: speed */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 font-bold">2. top velocity</label>
                                    <input
                                      type="text"
                                      value={bikeForm.specs.topSpeed}
                                      onChange={(e) => setBikeForm({ ...bikeForm, specs: { ...bikeForm.specs, topSpeed: e.target.value } })}
                                      className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-accent"
                                    />
                                  </div>
                                  {/* spec: power */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 font-bold">3. output energy</label>
                                    <input
                                      type="text"
                                      value={bikeForm.specs.power}
                                      onChange={(e) => setBikeForm({ ...bikeForm, specs: { ...bikeForm.specs, power: e.target.value } })}
                                      className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-accent"
                                    />
                                  </div>
                                  {/* spec: consumption */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 font-bold">4. consumption rating</label>
                                    <input
                                      type="text"
                                      value={bikeForm.specs.fuelConsumption}
                                      onChange={(e) => setBikeForm({ ...bikeForm, specs: { ...bikeForm.specs, fuelConsumption: e.target.value } })}
                                      className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-accent"
                                    />
                                  </div>
                                  {/* spec: weight */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 font-bold">5. vehicle net weight</label>
                                    <input
                                      type="text"
                                      value={bikeForm.specs.weight}
                                      onChange={(e) => setBikeForm({ ...bikeForm, specs: { ...bikeForm.specs, weight: e.target.value } })}
                                      className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-accent"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="col-span-1 sm:col-span-2 space-y-1 text-left">
                                <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'الوصف المقتضب للبطاقة' : 'SHOWROOM GRID OVERVIEW COPY'}:</label>
                                <textarea
                                  rows={2}
                                  value={bikeForm.shortDesc}
                                  onChange={(e) => setBikeForm({ ...bikeForm, shortDesc: e.target.value })}
                                  className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none font-sans"
                                />
                              </div>

                              <div className="col-span-1 sm:col-span-2 space-y-1 text-left">
                                <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'البيان الوصفي الهندسي الكامل للPDF' : 'HOLOMESH HOLOGRAPHIC HISTORIC SPECTRUM MANIFESTO (LONG DETAILS)'}:</label>
                                <textarea
                                  rows={3}
                                  value={bikeForm.longDesc}
                                  onChange={(e) => setBikeForm({ ...bikeForm, longDesc: e.target.value })}
                                  className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none font-sans"
                                />
                              </div>

                              <div className="col-span-1 sm:col-span-2 pt-1 border-b border-white/5 pb-3 text-left">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={bikeForm.isPopular}
                                    onChange={(e) => setBikeForm({ ...bikeForm, isPopular: e.target.checked })}
                                    className="w-4 h-4 rounded border-[#6366F1]/40 bg-[#111827] focus:ring-brand-primary"
                                  />
                                  <span className="text-[10px] font-mono font-bold text-white uppercase flex items-center gap-1.5 leading-none">
                                    <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
                                    <span>{lang === 'ar' ? 'ترشيح كعرض مميز وشائع بقوة بالواجهة' : 'ANCHOR AND PIN AS AN ACTIVE FLAGSHIP MOTORCYCLE'}</span>
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}

                          {/* TAB B: PRICING & OFFERS */}
                          {formSubTab === 'pricing' && (
                            <div className="space-y-4 text-left font-mono animate-fade-in" dir={dir}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'السعر الأصلي (جنيه)' : 'ORIGINAL LIST PRICE (EGP)'}:</label>
                                  <input
                                    type="number"
                                    required
                                    value={bikeForm.originalPrice || ''}
                                    onChange={(e) => setBikeForm({ ...bikeForm, originalPrice: parseInt(e.target.value, 10) || 0 })}
                                    className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'نوع الخصم' : 'DISCOUNT TYPE'}:</label>
                                  <select
                                    value={bikeForm.discountType}
                                    onChange={(e) => setBikeForm({ ...bikeForm, discountType: e.target.value as 'percentage' | 'fixed' })}
                                    className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none"
                                  >
                                    <option value="percentage">% Percentage</option>
                                    <option value="fixed">{lang === 'ar' ? 'جنيه قيمة ثابتة' : 'EGP Fixed Amount'}</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'قيمة الخصم' : 'DISCOUNT VALUE'}:</label>
                                  <input
                                    type="number"
                                    value={bikeForm.discount || ''}
                                    onChange={(e) => setBikeForm({ ...bikeForm, discount: parseInt(e.target.value, 10) || 0 })}
                                    placeholder={lang === 'ar' ? 'أدخل قيمة الخصم (مثل 15 لـ 15% أو 5000 لـ 5000 جنيه)' : 'Enter 15 for 15% or 5000 for EGP 5,000'}
                                    className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'ملصق العرض الرياضي' : 'OFFER PROMO BADGE LABEL'}:</label>
                                  <input
                                    type="text"
                                    value={bikeForm.offerLabel}
                                    onChange={(e) => setBikeForm({ ...bikeForm, offerLabel: e.target.value })}
                                    placeholder='e.g. "HOT DEAL 🔥", "LIMITED OFFER"'
                                    className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Live Dynamic Calculated Price Display */}
                              <div className="p-4 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-between">
                                <div className="space-y-1">
                                  <span className="block text-[8px] text-gray-400 uppercase tracking-wider">{lang === 'ar' ? 'السعر النهائي المحسوب وتأثير الخصم' : 'CALCULATED RETAIL VALUE AFTER PROMOTIONS'}</span>
                                  <span className="text-lg font-black text-brand-secondary">
                                    {(() => {
                                      let price = Number(bikeForm.originalPrice !== undefined ? bikeForm.originalPrice : (bikeForm.priceNum || 45000));
                                      const disc = Number(bikeForm.discount || 0);
                                      if (disc > 0 && bikeForm.originalPrice) {
                                        if (bikeForm.discountType === 'percentage') {
                                          price = Math.round(bikeForm.originalPrice * (1 - disc / 100));
                                        } else {
                                          price = Math.round(Math.max(0, bikeForm.originalPrice - disc));
                                        }
                                      }
                                      return price;
                                    })().toLocaleString()} {lang === 'ar' ? 'جنيه' : 'EGP'}
                                  </span>
                                </div>
                                <div className="text-right text-[10px] text-gray-500 max-w-[200px]" dir={dir}>
                                  {lang === 'ar' ? 'يقوم المعالج بحساب السعر لجميع أرجاء المنصة تلقائياً فور كتابة الأرقام' : 'Numerical calibrations update showrooms and catalogs instantaneously.'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TAB C: CATALOG BROCHURE */}
                          {formSubTab === 'catalog' && (
                            <div className="space-y-4 text-left font-mono animate-fade-in" dir={dir}>
                              <p className="text-[11px] text-gray-400 leading-normal font-sans" dir={dir}>
                                {lang === 'ar' ? 'مرفقات الكتالوج الرقمية بصيغة PDF تجعل المشتري يتصفح الدليل الفني بلمسة من واجهة المعاينة.' : 'Introduce digital telemetry guides. Upload high-fidelity PDF documents that attach directly to showroom card flips.'}
                              </p>

                              {bikeForm.catalogFileName ? (
                                <div className="p-4 bg-brand-primary/10 border border-brand-primary/35 rounded-2xl space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-accent/10 border border-brand-accent/25 rounded-lg text-brand-accent shrink-0">
                                      <FileText className="w-6 h-6 shrink-0" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="block text-[8px] text-gray-500 uppercase font-bold tracking-widest">ACTIVE CATALOG GUIDE File</span>
                                      <span className="text-xs font-black text-white truncate block mt-0.5">{bikeForm.catalogFileName}</span>
                                    </div>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBikeForm(prev => ({ ...prev, catalogFileName: '', catalogFileContent: '' }));
                                      fireToast(lang === 'ar' ? 'تم فصل الكتالوج' : 'Digital brochure detached', 'info');
                                    }}
                                    className="p-2 w-full text-center border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors"
                                  >
                                    {lang === 'ar' ? 'مسح وحذف الملف الحالي' : 'DETACH AND REMOVE PDF BROCHURE'}
                                  </button>
                                </div>
                              ) : (
                                <div className="p-6 border-2 border-dashed border-white/10 hover:border-brand-accent/40 bg-black/40 rounded-2xl text-center space-y-3.5 transition-all">
                                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                    <Upload className="w-6 h-6 text-gray-500 shrink-0" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-white uppercase">{lang === 'ar' ? 'حدد ملف الكتالوج بصيغة PDF' : 'NO TELEMETRY CATALOG ATTACHED'}</p>
                                    <p className="text-[9px] text-gray-500 lowercase font-sans">pdf file sizes up to 5mb. auto-encodes to base64 buffer matrix.</p>
                                  </div>

                                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-accent hover:bg-[#18b5cc] text-[#0B0F1A] font-extrabold rounded-xl cursor-pointer text-[10.5px] uppercase transition-all shadow-md shadow-brand-accent/15">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>{lang === 'ar' ? 'رفع الكتالوج الرقمي PDF' : 'UPLOAD CATALOG PDF'}</span>
                                    <input
                                      type="file"
                                      accept="application/pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.type !== 'application/pdf') {
                                            fireToast(lang === 'ar' ? 'يرجى رفع ملف PDF فقط' : 'Only PDF specs brochures are supported', 'error');
                                            return;
                                          }
                                          if (file.size > 5 * 1024 * 1024) {
                                            fireToast(lang === 'ar' ? 'أقصى حجم للملف هو 5 ميجابايت' : 'PDF size restricted to 5MB', 'error');
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            if (typeof reader.result === 'string') {
                                              setBikeForm(prev => ({
                                                ...prev,
                                                catalogFileName: file.name,
                                                catalogFileContent: reader.result as string
                                              }));
                                              fireToast(lang === 'ar' ? 'تم تخزين الكتالوج وحفظه مشفراً في آلة المعالجة' : 'PDF catalog guidance uploaded successfully', 'success');
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB D: ADD-ONS & ACCESSORIES */}
                          {formSubTab === 'addons' && (
                            <div className="space-y-4 text-left font-mono animate-fade-in" dir={dir}>
                              
                              {/* New Accessory Integration form */}
                              <div className="p-4 bg-black/50 border border-white/[0.04] rounded-2xl space-y-3">
                                <h4 className="text-[10px] font-black text-brand-secondary tracking-widest uppercase flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                                  <Plus className="w-4 h-4 text-brand-secondary shrink-0" />
                                  <span>{lang === 'ar' ? 'تعريف ملحق وأكسسوار إضافي جديد' : 'INTEGRATE NEW DYNAMIC ADD-ON'}</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-400 font-bold uppercase">Name (EN):</label>
                                    <input
                                      type="text"
                                      value={newAddOn.name}
                                      onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
                                      placeholder="Titanium Exhaust System"
                                      className="w-full bg-[#111827] border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-secondary focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-400 font-bold uppercase">Name (AR - Optional):</label>
                                    <input
                                      type="text"
                                      value={newAddOn.nameAr || ''}
                                      onChange={(e) => setNewAddOn({ ...newAddOn, nameAr: e.target.value })}
                                      placeholder="شكمان تيتانيوم رياضي"
                                      className="w-full bg-[#111827] border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-secondary focus:outline-none text-right"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-400 font-bold uppercase">{lang === 'ar' ? 'سعر التجزئة (جنيه)' : 'Retail Price (EGP)'}:</label>
                                    <input
                                      type="number"
                                      value={newAddOn.price || ''}
                                      onChange={(e) => setNewAddOn({ ...newAddOn, price: parseInt(e.target.value, 10) || 0 })}
                                      className="w-full bg-[#111827] border border-white/10 text-brand-secondary rounded-lg p-2 text-xs focus:border-brand-secondary focus:outline-none font-black"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-gray-400 font-bold uppercase">Image Illustration URL:</label>
                                    <input
                                      type="text"
                                      value={newAddOn.image}
                                      onChange={(e) => setNewAddOn({ ...newAddOn, image: e.target.value })}
                                      className="w-full bg-[#111827] border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-secondary focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[9px] text-gray-400 font-bold uppercase">Description (EN):</label>
                                    <input
                                      type="text"
                                      value={newAddOn.description}
                                      onChange={(e) => setNewAddOn({ ...newAddOn, description: e.target.value })}
                                      className="w-full bg-[#111827] border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-secondary focus:outline-none font-sans"
                                    />
                                  </div>
                                  <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[9px] text-gray-400 font-bold uppercase">Description (AR - Optional):</label>
                                    <input
                                      type="text"
                                      value={newAddOn.descAr || ''}
                                      onChange={(e) => setNewAddOn({ ...newAddOn, descAr: e.target.value })}
                                      className="w-full bg-[#111827] border border-white/10 text-white rounded-lg p-2 text-xs focus:border-brand-secondary focus:outline-none text-right font-sans"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (!newAddOn.name || newAddOn.price <= 0) {
                                      fireToast(lang === 'ar' ? 'الرجاء إدخال اسم الملحق وسعر صالح' : 'Please input a name and valid price', 'error');
                                      return;
                                    }
                                    const addonObj: AddOn = {
                                      ...newAddOn,
                                      id: `addon-${Date.now()}`
                                    };
                                    setBikeForm(prev => ({
                                      ...prev,
                                      addOns: [...(prev.addOns || []), addonObj]
                                    }));
                                    setNewAddOn({
                                      id: '',
                                      name: '',
                                      nameAr: '',
                                      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=150',
                                      description: '',
                                      descAr: '',
                                      price: 0
                                    });
                                    fireToast(lang === 'ar' ? 'تمت إضافة الأكسسوار بنجاح للآلة' : 'Accessory integrated into model spec array', 'success');
                                  }}
                                  className="w-full py-2 cursor-pointer bg-brand-secondary hover:bg-amber-400 text-[#0B0F1A] font-black tracking-widest text-[9.5px] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all"
                                >
                                  {lang === 'ar' ? 'دمج الأكسسوار بالنموذج' : 'PULL ACCESSORY INTO MOTORCYCLE SPEC'}
                                </button>
                              </div>

                              {/* Configured Add-ons inventory */}
                              <div className="space-y-2">
                                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                  {lang === 'ar' ? `المرفقات الحالية (${bikeForm.addOns?.length || 0})` : `ATTACHED ACCESSORIES (${bikeForm.addOns?.length || 0})`}
                                </h4>

                                {(!bikeForm.addOns || bikeForm.addOns.length === 0) ? (
                                  <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] text-center text-gray-500 font-sans italic text-[10px]" dir={dir}>
                                    {lang === 'ar' ? 'لا توجد أكسسوارات مخصصة لهذه الدراجة' : 'No specialized performance add-ons attached to this chassis yet.'}
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                                    {bikeForm.addOns.map((add, idx) => (
                                      <div key={add.id} className="p-2 border border-white/5 bg-black/40 rounded-xl flex items-center gap-3">
                                        <img src={add.image} className="w-8 h-8 object-cover rounded-lg shrink-0 bg-white/5" />
                                        <div className="flex-1 min-w-0 text-left">
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs font-black truncate">{lang === 'ar' && add.nameAr ? add.nameAr : add.name}</p>
                                            <p className="text-xs text-brand-secondary font-black font-mono">{add.price.toLocaleString()} {lang === 'ar' ? 'جنيه' : 'EGP'}</p>
                                          </div>
                                          <p className="text-[9px] text-gray-400 font-sans truncate">{lang === 'ar' && add.descAr ? add.descAr : add.description}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 select-none">
                                          <button
                                            type="button"
                                            disabled={idx === 0}
                                            onClick={() => {
                                              const list = [...bikeForm.addOns];
                                              const temp = list[idx];
                                              list[idx] = list[idx - 1];
                                              list[idx - 1] = temp;
                                              setBikeForm(prev => ({ ...prev, addOns: list }));
                                            }}
                                            className="p-1 px-1.5 text-gray-400 hover:text-white disabled:opacity-30 bg-white/5 rounded pointer-events-auto cursor-pointer text-[9px] transition-colors"
                                          >
                                            ▲
                                          </button>
                                          <button
                                            type="button"
                                            disabled={idx === bikeForm.addOns.length - 1}
                                            onClick={() => {
                                              const list = [...bikeForm.addOns];
                                              const temp = list[idx];
                                              list[idx] = list[idx + 1];
                                              list[idx + 1] = temp;
                                              setBikeForm(prev => ({ ...prev, addOns: list }));
                                            }}
                                            className="p-1 px-1.5 text-gray-400 hover:text-white disabled:opacity-30 bg-white/5 rounded pointer-events-auto cursor-pointer text-[9px] transition-colors"
                                          >
                                            ▼
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setBikeForm(prev => ({ ...prev, addOns: prev.addOns.filter(a => a.id !== add.id) }));
                                              fireToast(lang === 'ar' ? 'تم فصل الأكسسوار' : 'Detached accessory', 'info');
                                            }}
                                            className="p-1 text-red-400 hover:text-white hover:bg-red-500 rounded pointer-events-auto cursor-pointer text-[9px] transition-colors shrink-0"
                                          >
                                            ✕
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

                        <div className="pt-2 border-t border-white/5 flex justify-end gap-3 font-mono">
                          <button
                            type="button"
                            onClick={() => { setIsAddingNew(false); setEditingBike(null); }}
                            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold cursor-pointer text-xs uppercase"
                          >
                            {lang === 'ar' ? 'تراجع' : 'DISCARD CHANGES'}
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-[#22D3EE] text-[#0B0F1A] font-extrabold uppercase hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                          >
                            <Check className="w-4 h-4" />
                            <span>{lang === 'ar' ? 'تثبيت الآلة وحفظها' : 'AUTHORIZE INVENTORY WRITE'}</span>
                          </button>
                        </div>
                      </form>
                    )}

                  </div>
                )}

                {/* ================================== TAB 3: NODE OPERATORS MANAGEMENT (USERS LIST) ================================== */}
                {activeTab === 'users' && (
                  <div className="space-y-5 animate-fade-in" dir={dir}>
                    <div className="border-b border-white/5 pb-2 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold tracking-widest font-mono">
                          {lang === 'ar' ? 'مشغلو العقد وجلسات العمل' : 'NODE OPERATORS SECURITY DIRECTORY'}
                        </h3>
                        <p className="text-[11px] text-gray-500 normal-case leading-normal font-sans">
                          {lang === 'ar' ? 'إنشاء حسابات جديدة وتعيين مستويات الوصول (مشرف، مدير، مشغل)' : 'Authorize secondary credentials, assign access rights, and revoke node keys safely.'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-brand-primary/10 border border-brand-primary/20 text-[#22D3EE] font-mono text-[9px] px-2 py-1 rounded">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>MASTER SYSOPS SECURITY ACTS v2.26</span>
                      </div>
                    </div>

                    {sessionUser.role !== 'Admin' ? (
                      // Unauthorized overlay for Manager & Staff
                      <div className="p-8 text-center border border-red-500/20 bg-red-950/15 rounded-2xl space-y-3 font-mono tracking-wider max-w-md mx-auto my-6 shadow-lg shadow-red-500/5">
                        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-bounce shrink-0" />
                        <div>
                          <p className="text-red-400 font-black text-xs uppercase">{lang === 'ar' ? 'لوائح الأمان: الوصول مرفوض!' : 'SECURITY BREACH WARNING: ACCESS DENIED'}</p>
                          <p className="text-[10px] text-gray-500 lowercase mt-1 normal-case font-sans">
                            {lang === 'ar' ? 'رخص كبار المطورين تتطلب صلاحيات المشرف التام (Admin). مشغلك الحالي محروم من الدخول.' : 'Curation of Operator Nodes requires Core administrator authorization. Credentials logged.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Full User configuration page
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
                        
                        {/* Column A: User Addition Panel (4 Span) */}
                        <div className="lg:col-span-5 p-4 border border-white/[0.04] bg-[#111622]/80 rounded-2xl space-y-4 shadow-sm" dir={dir}>
                          <h4 className="text-brand-secondary font-black border-b border-white/5 pb-1.5 tracking-wider uppercase flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-brand-secondary" />
                            <span>{lang === 'ar' ? 'تفويض مشغل فرعي جديد' : 'DELEGATE NEW OPERATOR'}</span>
                          </h4>

                          <form onSubmit={handleAddUserSubmit} className="space-y-3">
                            <div className="space-y-1 text-left" dir={dir}>
                              <label className="text-gray-400 text-[10px] tracking-wide uppercase">{lang === 'ar' ? 'الاسم المعرف' : 'NODE USERNAME IDENTITY'}:</label>
                              <input
                                type="text"
                                required
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="operator_id"
                                className="w-full bg-black/60 border border-white/[0.08] focus:border-brand-secondary text-white rounded-xl px-3 py-2 text-xs focus:outline-none py-2.5 lowercase font-semibold"
                              />
                            </div>

                            <div className="space-y-1 text-left" dir={dir}>
                              <label className="text-gray-400 text-[10px] tracking-wide uppercase">{lang === 'ar' ? 'الرمز المشفر للدخول' : 'SECURE DELEGATION CODE'}:</label>
                              <input
                                type="text"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-black/60 border border-white/[0.08] focus:border-brand-secondary text-white rounded-xl px-3 py-2 text-xs focus:outline-none py-2.5 font-bold"
                              />
                            </div>

                            <div className="space-y-1 text-left" dir={dir}>
                              <label className="text-gray-400 text-[10px] tracking-wide uppercase">{lang === 'ar' ? 'رتبة الوصول والشبكة' : 'ACCESS SPECTRUM ROLE'}:</label>
                              <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as UserRole)}
                                className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-secondary text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                              >
                                <option value="Admin">CORE ADMIN (Full Writes + Users)</option>
                                <option value="Manager">MANAGER NODE (Add & Edit Fleet only)</option>
                                <option value="Staff">STAFF OPERATOR (Only Add Motorcycles)</option>
                              </select>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 mt-2 bg-brand-secondary text-white font-extrabold tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all text-[11px] cursor-pointer uppercase flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>{lang === 'ar' ? 'تفعيل رمز المشغل' : 'DELEGATE NODE'}</span>
                            </button>
                          </form>
                        </div>

                        {/* Column B: Interactive User Lists (7 Span) */}
                        <div className="lg:col-span-7 p-4 border border-white/[0.04] bg-[#0E121E]/90 rounded-2xl space-y-3.5 shadow-sm">
                          <h4 className="text-brand-accent font-black border-b border-white/5 pb-1.5 tracking-wider uppercase flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-brand-accent" />
                              <span>{lang === 'ar' ? 'المشرفون المسجلون' : 'ONLINE WORKERS REGISTRY'}</span>
                            </span>
                            <span className="text-[9px] text-gray-500">{users.length} active operators</span>
                          </h4>

                          <div className="space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                            {users.map((item) => (
                              <div
                                key={item.username}
                                className="p-3 bg-black/40 border border-white/[0.03] rounded-xl flex items-center justify-between hover:border-white/10 transition-all font-mono"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-white text-xs tracking-wide">{item.username}</span>
                                    <span className={`px-1 rounded text-[8px] font-bold ${
                                      item.role === 'Admin' ? 'bg-indigo-950/80 border border-indigo-400/20 text-indigo-400' :
                                      item.role === 'Manager' ? 'bg-purple-950/80 border border-purple-400/20 text-brand-secondary' :
                                      'bg-emerald-950/80 border border-emerald-400/20 text-emerald-400'
                                    }`}>
                                      {item.role.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500 leading-none">
                                    <span>KEY:</span>
                                    <span className="font-bold text-gray-400 tracking-wider">••••••••</span>
                                  </div>
                                </div>

                                {item.username.toUpperCase() !== 'HOSNY1995' && item.username !== sessionUser.username ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(item.username)}
                                    className="p-1.5 pointer-events-auto cursor-pointer bg-red-600/10 hover:bg-red-600 hover:text-white border border-red-500/20 text-red-100 rounded-lg transition-all"
                                    title="Revoke operator credentials"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[8px] text-gray-600 italic tracking-widest font-black uppercase font-mono">CORE_LOCKED</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* ================================== TAB 4: ADVANCED PAGE BUILDER (HOMEPAGE EDITOR) ================================== */}
                {activeTab === 'settings' && (
                  <div className="p-1 animate-fade-in text-left">
                    <HomepagePageBuilder
                      homepageConfig={homepageConfig}
                      onUpdateHomepageConfig={onUpdateHomepageConfig || (() => {})}
                      lang={lang}
                      dir={dir}
                      customText={customText}
                      onUpdateCustomText={onUpdateCustomText}
                      fireToast={(msg, type) => fireToast(msg, type)}
                    />
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
}
