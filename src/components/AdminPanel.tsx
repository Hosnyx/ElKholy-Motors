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
  Trash, LogOut, ShieldAlert, ShoppingBag, Package, Download, Search, Github, Link, RefreshCw, Code, MapPin, User, Copy, Printer, Shield, Maximize2, Minimize2, Send, Mail, Image as ImageIcon
} from 'lucide-react';
import { Motorcycle, CategorySlug, UserRole, UserAccount, AddOn, HomepageConfig, StoreProduct, StoreCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_HOMEPAGE_CONFIG } from '../data';
import HomepagePageBuilder from './HomepagePageBuilder';
import StoreAdminPanel from './StoreAdminPanel';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import * as Recharts from 'recharts';
import * as Docx from 'docx';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Helper to resolve oklch/oklab colors using browser's built-in canvas parser to avoid html2canvas crash
let colorResolverCanvas: HTMLCanvasElement | null = null;
let colorResolverCtx: CanvasRenderingContext2D | null = null;

const resolveColorToRgb = (colorStr: string): string => {
  if (!colorStr) return colorStr;
  const trimmed = colorStr.trim();
  if (trimmed.includes('oklch') || trimmed.includes('oklab')) {
    try {
      if (!colorResolverCanvas) {
        colorResolverCanvas = document.createElement('canvas');
        colorResolverCanvas.width = 1;
        colorResolverCanvas.height = 1;
        colorResolverCtx = colorResolverCanvas.getContext('2d');
      }
      if (colorResolverCtx) {
        colorResolverCtx.fillStyle = trimmed;
        const resolved = colorResolverCtx.fillStyle;
        if (resolved && !resolved.includes('oklch') && !resolved.includes('oklab')) {
          return resolved;
        }
      }
    } catch (e) {
      // ignore
    }
    return 'rgb(99, 102, 241)'; // Indigo fallback
  }
  return colorStr;
};

const sanitizeColorValue = (value: string): string => {
  if (!value) return value;
  if (!value.includes('oklch') && !value.includes('oklab')) return value;
  return value.replace(/(oklch|oklab)\([^)]+\)/g, (match) => {
    return resolveColorToRgb(match);
  });
};

interface AdminPanelProps {
  onClose: () => void;
  motorcycles: Motorcycle[];
  onUpdateMotorcycles: (updatedBikes: Motorcycle[]) => void;
  storeProducts?: StoreProduct[];
  onUpdateStoreProducts?: (updated: StoreProduct[]) => void;
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
  storeProducts = [],
  onUpdateStoreProducts,
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

  // Sidebar navigation panel: 'dashboard' | 'motorcycles' | 'store' | 'users' | 'settings' | 'home_editor' | 'bookings'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'motorcycles' | 'store' | 'users' | 'settings' | 'home_editor' | 'bookings'>('dashboard');

  const canAccess = (tab: string) => {
    if (sessionUser?.role === 'Admin') return true;
    if (sessionUser?.role === 'Manager') return ['dashboard', 'motorcycles', 'store', 'bookings'].includes(tab);
    if (sessionUser?.role === 'Staff') return ['motorcycles', 'store', 'bookings'].includes(tab);
    return false;
  };

  // Ensure active node role is appropriate after session load if user is restricted
  useEffect(() => {
    if (sessionUser && !canAccess(activeTab)) {
      if (sessionUser.role === 'Manager') setActiveTab('dashboard');
      else setActiveTab('motorcycles');
    }
  }, [sessionUser, activeTab]);

  // Bookings queue state
  const [bookings, setBookings] = useState<any[]>(() => {
    const saved = localStorage.getItem('elkholy_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  // Toasts list state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // GitHub Integration States
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('elkholy_github_token') || '');
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('elkholy_github_repo') || '');
  const [githubBranch, setGithubBranch] = useState(() => localStorage.getItem('elkholy_github_branch') || 'main');
  const [githubPath, setGithubPath] = useState(() => localStorage.getItem('elkholy_github_path') || 'elkholy_backup.json');
  const [githubImportUrl, setGithubImportUrl] = useState('');
  const [isGithubExporting, setIsGithubExporting] = useState(false);
  const [isGithubImporting, setIsGithubImporting] = useState(false);
  const [isPushingProject, setIsPushingProject] = useState(false);
  const [projectPushStep, setProjectPushStep] = useState('');

  // Dashboard category filter
  const [dashCategoryFilter, setDashCategoryFilter] = useState<'All' | 'A' | 'B' | 'C' | 'S'>('All');
  // Dashboard motorcycle search term
  const [bikeSearchTerm, setBikeSearchTerm] = useState('');

  // E-commerce Store Analytics Date Filters
  const [storeFilterPeriod, setStoreFilterPeriod] = useState<'today' | 'week' | 'month' | '3months' | 'custom'>('month');
  const [storeStartDate, setStoreStartDate] = useState<string>(() => {
    // Default start date to 30 days before June 4, 2026 (May 5, 2026)
    const d = new Date(2026, 4, 5, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [storeEndDate, setStoreEndDate] = useState<string>(() => {
    // Default end date to June 4, 2026
    const d = new Date(2026, 5, 4, 23, 59);
    return d.toISOString().slice(0, 16);
  });

  // Vehicle Class Sales Analytics Date Filters
  const [vehicleFilterPeriod, setVehicleFilterPeriod] = useState<'today' | 'week' | 'month' | '3months' | 'custom'>('month');
  const [vehicleStartDate, setVehicleStartDate] = useState<string>(() => {
    // Default start date to 30 days before June 4, 2026 (May 5, 2026)
    const d = new Date(2026, 4, 5, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [vehicleEndDate, setVehicleEndDate] = useState<string>(() => {
    // Default end date to June 4, 2026
    const d = new Date(2026, 5, 4, 23, 59);
    return d.toISOString().slice(0, 16);
  });

  // Multi-tab sub-layout state for Edit/Add forms
  const [formSubTab, setFormSubTab] = useState<'basic' | 'pricing' | 'catalog' | 'addons' | 'related'>('basic');

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
    serialCode: '',
  });

  // ==========================================
  // ADVANCED OPERATIONS MANAGEMENT STATES
  // ==========================================
  const [opsSearchQuery, setOpsSearchQuery] = useState('');
  const [opsStatusFilter, setOpsStatusFilter] = useState<'ALL' | 'new' | 'pending' | 'reserved' | 'confirmed' | 'sold' | 'delivered' | 'cancelled'>('ALL');
  const [selectedOperation, setSelectedOperation] = useState<any | null>(null);

  // Operation Details Edit States
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');
  const [editCustomerGov, setEditCustomerGov] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');
  const [editCustomerRegDate, setEditCustomerRegDate] = useState('');
  const [editPrevOrders, setEditPrevOrders] = useState(0);
  const [editTotalPurchases, setEditTotalPurchases] = useState(0);

  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editOrderType, setEditOrderType] = useState<'motorcycle' | 'product' | 'combined'>('motorcycle');
  const [editOrderStatus, setEditOrderStatus] = useState('New');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editOrderTime, setEditOrderTime] = useState('');
  const [editEmployeeAssigned, setEditEmployeeAssigned] = useState('');

  const [editDiscountAmount, setEditDiscountAmount] = useState(0);
  const [editTaxRate, setEditTaxRate] = useState(14); // 14% Default
  const [editEmployeeNotes, setEditEmployeeNotes] = useState('');
  const [editReservationExpiry, setEditReservationExpiry] = useState('');
  const [editInventoryUpdateOpt, setEditInventoryUpdateOpt] = useState<'auto' | 'manual' | 'none'>('auto');

  // Protected State Fields
  const [editExecutiveNotes, setEditExecutiveNotes] = useState('');
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editCustomerVerification, setEditCustomerVerification] = useState('');
  const [editIdentityStatus, setEditIdentityStatus] = useState<'Verified' | 'Pending' | 'Rejected'>('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState('Unpaid');
  const [editInvoiceConfirmation, setEditInvoiceConfirmation] = useState('Pending');
  const [editAccountingNotes, setEditAccountingNotes] = useState('');
  const [editProductVisibility, setEditProductVisibility] = useState<'show' | 'hide'>('show');
  const [editHideShowMotorcycle, setEditHideShowMotorcycle] = useState<'show' | 'hide'>('show');

  // Invoice Preview Modal States
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [isInvoiceFullScreen, setIsInvoiceFullScreen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'whatsapp' | 'email' | 'both'>('whatsapp');
  const [isSending, setIsSending] = useState(false);

  const [editSelectedProducts, setEditSelectedProducts] = useState<any[]>([]); // { product: StoreProduct, quantity: number }
  const [editActivityLog, setEditActivityLog] = useState<any[]>([]);
  const [editTimeline, setEditTimeline] = useState<any[]>([]);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [tempStatusToConfirm, setTempStatusToConfirm] = useState('');
  const [opsProductSearchQuery, setOpsProductSearchQuery] = useState('');
  const [opsCustomLogInput, setOpsCustomLogInput] = useState('');

  const handleOpenOperationDetails = (b: any) => {
    setSelectedOperation(b);
    setEditCustomerName(b.name || '');
    setEditCustomerPhone(b.phone || b.customerPhone || '');
    setEditCustomerEmail(b.email || b.customerEmail || 'customer@elkholy.com');
    setEditCustomerGov(b.customerGov || 'القاهرة');
    setEditCustomerAddress(b.customerAddress || '');
    
    // Derived customer info
    setEditCustomerRegDate(b.customerRegDate || b.date || new Date().toISOString().split('T')[0]);
    setEditPrevOrders(b.customerPrevOrders !== undefined ? b.customerPrevOrders : Math.floor(Math.random() * 3) + 1);
    const calculatedPurchaseTotal = (b.totalPrice || parseFloat((b.price || '0').replace(/[^0-9]/g, '')) || 45000);
    setEditTotalPurchases(b.customerTotalPurchases !== undefined ? b.customerTotalPurchases : calculatedPurchaseTotal);

    setEditInvoiceNumber(b.invoiceNumber || `INV-${b.id.slice(-6).toUpperCase()}`);
    setEditOrderType(b.orderType || (b.motorcycleId ? 'motorcycle' : 'product'));
    
    // Standardize status
    let statusFormatted = 'New';
    if (b.status) {
      if (b.status.toLowerCase() === 'sold') statusFormatted = 'Sold';
      else if (b.status.toLowerCase() === 'pending') statusFormatted = 'Pending Review';
      else statusFormatted = b.status.charAt(0).toUpperCase() + b.status.slice(1);
    }
    setEditOrderStatus(statusFormatted);
    setEditOrderDate(b.date || new Date().toISOString().split('T')[0]);
    setEditOrderTime(b.orderTime || new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5));
    setEditEmployeeAssigned(b.employeeAssigned || sessionUser?.username || 'HOSNY1995');

    setEditDiscountAmount(b.discountAmount || 0);
    setEditTaxRate(b.taxRate !== undefined ? b.taxRate : 14);
    setEditEmployeeNotes(b.employeeNotes || '');
    setEditReservationExpiry(b.reservationExpiry || '');
    setEditInventoryUpdateOpt(b.inventoryUpdateOpt || 'auto');

    // Load Protected Fields
    setEditExecutiveNotes(b.executiveNotes || '');
    setEditCustomerId(b.customerId || `CID-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setEditCustomerVerification(b.customerVerification || 'H-PASS-VERIFIED');
    setEditIdentityStatus(b.identityStatus || 'Pending');
    setEditPaymentStatus(b.paymentStatus || 'Unpaid');
    setEditInvoiceConfirmation(b.invoiceConfirmation || 'Pending');
    setEditAccountingNotes(b.accountingNotes || '');
    setEditProductVisibility(b.productVisibility || 'show');
    setEditHideShowMotorcycle(b.hideShowMotorcycle || 'show');

    // Load any store products linked
    setEditSelectedProducts(b.orderedProducts || []);

    // Create activity logs or load
    setEditActivityLog(b.activityLog || [
      { employee: 'System Automatic', action: 'Order Created from Showroom Portal', date: b.date || new Date().toISOString().split('T')[0], time: '09:00' }
    ]);

    // Create timeline stages or load
    const isSoldState = b.status === 'sold';
    setEditTimeline(b.timeline || [
      { stage: 'Order Created', active: true, date: b.date || new Date().toISOString().split('T')[0], time: '09:00' },
      { stage: 'WhatsApp Generated', active: true, date: b.date || new Date().toISOString().split('T')[0], time: '10:15' },
      { stage: 'Customer Contacted', active: b.status === 'contacted' || isSoldState, date: b.date || '', time: '' },
      { stage: 'Reserved', active: b.status === 'reserved', date: b.isReserved ? b.reservationExpiry : '', time: '' },
      { stage: 'Confirmed', active: b.status === 'confirmed' || isSoldState, date: '', time: '' },
      { stage: 'Sold', active: isSoldState, date: isSoldState ? b.date : '', time: '' },
      { stage: 'Delivered', active: b.status === 'delivered', date: '', time: '' },
      { stage: 'Cancelled', active: b.status === 'cancelled', date: '', time: '' }
    ]);

    // Add logging check
    const trackOpenLog = {
      employee: sessionUser?.username || 'Staff',
      action: 'Opened Operation Details File',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)
    };
    setEditActivityLog(prev => {
      const alreadyHas = prev.some(l => l.employee === trackOpenLog.employee && l.action === trackOpenLog.action);
      if (alreadyHas) return prev;
      return [...prev, trackOpenLog];
    });
  };

  const handleAddProductToOperation = (prod: StoreProduct) => {
    const existingIndex = editSelectedProducts.findIndex(item => item.product?.id === prod.id || item.product?.code === prod.id);
    if (existingIndex !== -1) {
      const copy = [...editSelectedProducts];
      copy[existingIndex].quantity = (copy[existingIndex].quantity || 1) + 1;
      setEditSelectedProducts(copy);
    } else {
      setEditSelectedProducts([...editSelectedProducts, { product: prod, quantity: 1 }]);
    }
    setOpsProductSearchQuery('');
    fireToast(lang === 'ar' ? 'تم إضافة المنتج للعملية الحالية!' : 'Accessory appended to operational flow!', 'success');
  };

  const handleRemoveProductFromOperation = (prodId: string) => {
    const filtered = editSelectedProducts.filter(item => item.product?.id !== prodId);
    setEditSelectedProducts(filtered);
    fireToast(lang === 'ar' ? 'تمت إزالة المنتج من الفاتورة!' : 'Target product decoupled from lead!', 'success');
  };

  const handleUpdateProductQty = (prodId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveProductFromOperation(prodId);
    } else {
      const updated = editSelectedProducts.map(item => {
        if (item.product?.id === prodId) {
          return { ...item, quantity: newQty };
        }
        return item;
      });
      setEditSelectedProducts(updated);
    }
  };

  const compileInvoiceCanvas = async (): Promise<HTMLCanvasElement> => {
    // 1. Check Invoice HTML Target Node Exists
    const element = document.getElementById('elkholy-invoice-document-capture');
    if (!element) {
      throw new Error(
        lang === 'ar' 
          ? 'المعاينة فارغة: لم يتم العثور على العنصر رقم #elkholy-invoice-document-capture' 
          : 'Invoice Capture Node element (#elkholy-invoice-document-capture) is missing from current layout tree'
      );
    }

    // 2. Validate Customer Data
    const cName = (editCustomerName || '').trim();
    const cPhone = (editCustomerPhone || '').trim();
    if (!cName) {
      throw new Error(
        lang === 'ar' 
          ? 'تنبيه المصادقة: يرجى إدخال اسم العميل أولاً لإتمام تصدير الفاتورة المعتمدة.' 
          : 'Dossier Validation Exception: Customer Name cannot be blank under official guidelines.'
      );
    }
    if (!cPhone) {
      throw new Error(
        lang === 'ar' 
          ? 'تنبيه المصادقة: يرجى إدخال هاتف العميل للحصول على الختم الإلكتروني للعملية.' 
          : 'Dossier Validation Exception: Customer Phone Number is required to generate a certifiable signature block.'
      );
    }

    // 3. Validate QR Codes generated
    const qrSvgs = element.querySelectorAll('svg');
    if (qrSvgs.length < 1) {
      throw new Error(
        lang === 'ar' 
          ? 'فشل المكون الفني: لم يتم العثور على رموز الاستجابة السريعة (QR Render Error)' 
          : 'Technical Integrity Exception: QR Code SVGs failed to populate inside signature desk (QR Code missing).'
      );
    }

    // 4. Validate and Wait for all internal images to load or identify broken ones
    const images = Array.from(element.querySelectorAll('img'));
    const brokenImages: string[] = [];
    
    // Create promises for images loading
    const loadPromises = images.map((img) => {
      if (img.complete) {
        if (img.naturalWidth === 0) {
          const brokenLabel = img.alt || img.getAttribute('title') || img.src?.substring(0, 45) || 'unnamed asset';
          brokenImages.push(brokenLabel);
        }
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        let loaded = false;
        const loadHandler = () => {
          if (loaded) return;
          loaded = true;
          img.removeEventListener('load', loadHandler);
          img.removeEventListener('error', errorHandler);
          resolve();
        };
        const errorHandler = () => {
          if (loaded) return;
          loaded = true;
          img.removeEventListener('load', loadHandler);
          img.removeEventListener('error', errorHandler);
          const brokenLabel = img.alt || img.getAttribute('title') || img.src?.substring(0, 45) || 'unnamed asset';
          brokenImages.push(brokenLabel);
          resolve();
        };
        img.addEventListener('load', loadHandler);
        img.addEventListener('error', errorHandler);
        
        // Safety timeout per image if somehow stuck
        setTimeout(loadHandler, 3500);
      });
    });

    if (images.length > 0) {
      await Promise.all(loadPromises);
    }

    if (brokenImages.length > 0) {
      throw new Error(
        lang === 'ar' 
          ? `مرفقات تالفة: تعذر تحميل صور الفواتير التالية [${brokenImages.join(', ')}]` 
          : `Asset Integrity Exception: Missing or broken visual attachment: [${brokenImages.join(', ')}]`
      );
    }

    // 5. High-DPI canvas capture with secure OKLCH/OKLAB text replaces
    const originalGetComputedStyle = window.getComputedStyle;

    try {
      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle.call(this, elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop, receiver) {
            if (typeof prop === 'string') {
              const val = target[prop as keyof CSSStyleDeclaration];
              if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                return sanitizeColorValue(val);
              }
              if (prop === 'getPropertyValue') {
                return function (propertyName: string) {
                  const rawVal = target.getPropertyValue(propertyName);
                  if (typeof rawVal === 'string' && (rawVal.includes('oklch') || rawVal.includes('oklab'))) {
                    return sanitizeColorValue(rawVal);
                  }
                  return rawVal;
                };
              }
            }
            return Reflect.get(target, prop, receiver);
          }
        }) as any as CSSStyleDeclaration;
      };

      const canvas = await html2canvas(element, {
        backgroundColor: '#070A12',
        useCORS: true,
        scale: 3, // Premium 3x scaling for ultimate sharpness & print clarity
        logging: false,
        onclone: (clonedDoc) => {
          // Replace oklch/oklab styles inside cloned stylesheet definitions
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach((style: any) => {
            if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab'))) {
              style.textContent = style.textContent.replace(/(oklch|oklab)\([^)]+\)/g, (match: string) => {
                return resolveColorToRgb(match);
              });
            }
          });
        }
      });

      return canvas;
    } catch (canvasErr: any) {
      throw new Error(`Canvas Rendering Error: ${canvasErr?.message || canvasErr || 'Failed to capture browser layout state as image canvas.'}`);
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
    }
  };

  const handlePrintInvoice = () => {
    const original = document.getElementById('elkholy-printable-invoice');
    if (!original) {
      fireToast(
        lang === 'ar' 
          ? '⚠️ لم يتم العثور على وثيقة الطباعة A4 المخصصة' 
          : '⚠️ Printer layout mapping error: #elkholy-printable-invoice element is missing', 
        'error'
      );
      return;
    }

    // Clone element to document.body to avoid parent modal bounds clipping or hidden wrappers
    const clone = original.cloneNode(true) as HTMLElement;
    clone.id = 'elkholy-printable-invoice-clone';
    // Remove "hidden print:block" classes to enable correct styles mapping
    clone.className = 'text-black bg-white p-10 font-sans leading-relaxed text-[12.5px] text-right';

    // Inject dedicated printing stylesheet
    const printStyle = document.createElement('style');
    printStyle.id = 'print-a4-temp-style';
    printStyle.textContent = `
      @media print {
        body * {
          display: none !important;
        }
        #elkholy-printable-invoice-clone, #elkholy-printable-invoice-clone * {
          display: block !important;
          visibility: visible !important;
        }
        #elkholy-printable-invoice-clone {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 210mm !important;
          min-height: 297mm !important;
          background: white !important;
          color: black !important;
          padding: 20mm 15mm !important;
          box-sizing: border-box !important;
          direction: ${dir} !important;
          font-family: system-ui, -apple-system, sans-serif !important;
        }
        @page {
          size: A4;
          margin: 0;
        }
      }
    `;

    document.head.appendChild(printStyle);
    document.body.appendChild(clone);

    // Open System print dialog
    window.print();

    // Clean up temporary elements to prevent DOM bloat
    setTimeout(() => {
      clone.remove();
      printStyle.remove();
    }, 1500);
  };

  const handleDownloadPDF = async () => {
    try {
      fireToast(
        lang === 'ar' 
          ? '⏳ يتم التحقق وتوليد ملف PDF في صفحة A4 واحدة...' 
          : '⏳ Initiating validation desk & rendering high-fidelity PDF...', 
        'info'
      );
      
      const canvas = await compileInvoiceCanvas();
      
      // Compress canvas output to a high-density JPEG representation
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297

      // Compute visual dimensions keeping aspect ratio intact
      const ratio = canvas.width / canvas.height;
      let printWidth = pdfWidth;
      let printHeight = pdfWidth / ratio;

      // Fit gracefully onto a single premium A4 leaf sheet
      if (printHeight > pdfHeight) {
        printHeight = pdfHeight;
        printWidth = pdfHeight * ratio;
      }

      const xOffset = (pdfWidth - printWidth) / 2;
      const yOffset = (pdfHeight - printHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, printWidth, printHeight);
      pdf.save(`Invoice_${editInvoiceNumber || selectedOperation?.id || 'Pre'}.pdf`);

      fireToast(
        lang === 'ar' 
          ? '✅ تم تحميل وثيقة المبيعات (PDF) المعتمدة بنجاح!' 
          : '✅ Certified PDF Invoice downloaded successfully!', 
        'success'
      );
    } catch (err: any) {
      console.error('PDF Generation Crash Report:', err);
      fireToast(
        lang === 'ar' 
          ? `❌ فشل إنشاء ملف الـ PDF: ${err.message || 'خطأ فني'}` 
          : `❌ PDF Generation Error: ${err.message || 'Unknown processing error'}`, 
        'error'
      );
    }
  };

  const handleDownloadPNG = async () => {
    try {
      fireToast(
        lang === 'ar' 
          ? '⏳ يتم التحقق وتوليد صورة الفاتورة فائقة الدقة...' 
          : '⏳ Initiating validation desk & compiling ultra-sharp PNG...', 
        'info'
      );
      
      const canvas = await compileInvoiceCanvas();
      
      const link = document.createElement('a');
      link.download = `Invoice_${editInvoiceNumber || selectedOperation?.id || 'Pre'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      fireToast(
        lang === 'ar' 
          ? '✅ تم تحميل الفاتورة كـ PNG بنجاح!' 
          : '✅ Certified high-DPI PNG Invoice downloaded successfully!', 
        'success'
      );
    } catch (err: any) {
      console.error('PNG Capture Crash Report:', err);
      fireToast(
        lang === 'ar' 
          ? `❌ فشل التصدير لـ PNG: ${err.message || 'خطأ فني'}` 
          : `❌ PNG Generation Error: ${err.message || 'Unknown processing error'}`, 
        'error'
      );
    }
  };

  const handleSendInvoice = (method: 'whatsapp' | 'email' | 'both') => {
    if (sessionUser?.role === 'Staff') {
      fireToast(
        lang === 'ar' 
          ? '❌ خطأ في الصلاحيات: لا يُسمح للموظفين بإرسال الفواتير للعملاء!' 
          : '❌ Permission Error: Staff roles are restricted from sending invoices directly!',
        'error'
      );
      return;
    }
    setDeliveryMethod(method);
    setIsDeliveryModalOpen(true);
  };

  const handleConfirmSendInvoice = async () => {
    if (!selectedOperation) return;
    setIsSending(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const nowLocalDate = new Date().toISOString().split('T')[0];
    const nowLocalTime = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);
    const methodDesc = deliveryMethod === 'both' ? 'WhatsApp & Email' : deliveryMethod.toUpperCase();
    
    const newLogEntry = {
      employee: sessionUser?.username || 'Staff',
      role: sessionUser?.role || 'Staff',
      action: `Sent official sales invoice #${editInvoiceNumber || selectedOperation.id.substring(0,8).toUpperCase()} to customer ${editCustomerName} via ${methodDesc}`,
      date: nowLocalDate,
      time: nowLocalTime
    };

    const updatedLogs = [...editActivityLog, newLogEntry];
    setEditActivityLog(updatedLogs);

    const updatedBooking = {
      ...selectedOperation,
      activityLog: updatedLogs
    };
    
    const newBookingsList = bookings.map(b => b.id === selectedOperation.id ? updatedBooking : b);
    setBookings(newBookingsList);
    localStorage.setItem('elkholy_bookings', JSON.stringify(newBookingsList));

    try {
      await setDoc(doc(db, 'bookings', selectedOperation.id), updatedBooking, { merge: true });
    } catch (err) {
      console.warn("Unable to sync booking update in Firestore:", err);
    }

    setIsSending(false);
    setIsDeliveryModalOpen(false);
    
    fireToast(
      lang === 'ar' 
        ? `✅ تم إرسال الفاتورة بنجاح عبر ${methodDesc} إلى ${editCustomerName}!`
        : `✅ Invoice successfully transmitted via ${methodDesc} to ${editCustomerName}!`,
      'success'
    );
  };

  const handleExportSingleOperationExcel = () => {
    if (!selectedOperation) return;
    const worksheetData = [
      ["EXPRESS SALES & RECEPTION CENTER - INVOICE"],
      [],
      ["Invoice Number", editInvoiceNumber],
      ["Operation ID", selectedOperation.id],
      ["Order Date", editOrderDate],
      ["Order Time", editOrderTime],
      ["Employee in Charge", editEmployeeAssigned],
      ["Order Status", editOrderStatus],
      [],
      ["CUSTOMER PROFILE"],
      ["Name", editCustomerName],
      ["Phone", editCustomerPhone],
      ["Email", editCustomerEmail],
      ["Governorate", editCustomerGov],
      ["Address", editCustomerAddress],
      [],
      ["ITEMS OVERVIEW"],
      ["Type", "Code/SKU", "Item Description", "Qty", "Unit Price (EGP)", "Total (EGP)"]
    ];

    if (selectedOperation.motorcycleId) {
      const bike = motorcycles.find(m => m.id === selectedOperation.motorcycleId);
      worksheetData.push([
        "Motorcycle",
        selectedOperation.motorcycleId,
        bike ? bike.name : (selectedOperation.motorcycleName || "Fleet Motorcycle"),
        "1",
        bike ? String(bike.price) : "Showroom Standard",
        bike ? String(bike.price) : "Showroom Standard"
      ]);
    }

    editSelectedProducts.forEach(op => {
      worksheetData.push([
        "Accessory",
        op.product?.id || "N/A",
        lang === 'ar' ? (op.product?.nameAr || op.product?.name) : (op.product?.name || "Accessory"),
        String(op.quantity || 1),
        String(op.product?.price || 0),
        String((op.product?.price || 0) * (op.quantity || 1))
      ]);
    });

    const associatedBike = motorcycles.find(m => m.id === selectedOperation.motorcycleId);
    const bikeCost = associatedBike ? parseFloat(String(associatedBike.price).replace(/[^0-9]/g, '')) || 0 : 0;
    const prodsCost = editSelectedProducts.reduce((sum, item) => sum + (parseFloat(String(item.product?.price).replace(/[^0-9]/g, '')) || 0) * (item.quantity || 1), 0);
    const orderPriceTotal = bikeCost + prodsCost;
    const calculatedTax = (orderPriceTotal - editDiscountAmount) * editTaxRate / 100;
    const grandOrderFinalTotal = (orderPriceTotal - editDiscountAmount) + calculatedTax;

    worksheetData.push([]);
    worksheetData.push(["FINANCIAL ANALYSIS"]);
    worksheetData.push(["Subtotal", `${orderPriceTotal.toLocaleString()} EGP`]);
    worksheetData.push(["Discount", `${editDiscountAmount.toLocaleString()} EGP`]);
    worksheetData.push(["Tax / VAT", `${calculatedTax.toLocaleString()} EGP`]);
    worksheetData.push(["Grand Total", `${grandOrderFinalTotal.toLocaleString()} EGP`]);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice File");
    XLSX.writeFile(wb, `ElKholy_Invoice_${editInvoiceNumber}.xlsx`);
    fireToast(lang === 'ar' ? 'تم التصدير لملف إكسل بنجاح!' : 'Single operational invoice exported to Excel!', 'success');
  };

  const handleAddCustomLog = () => {
    if (!opsCustomLogInput.trim()) return;
    const nowLocalDate = new Date().toISOString().split('T')[0];
    const nowLocalTime = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);
    const newLog = {
      employee: sessionUser?.username || 'Staff',
      role: sessionUser?.role || 'Staff',
      action: opsCustomLogInput.trim(),
      date: nowLocalDate,
      time: nowLocalTime
    };
    setEditActivityLog([...editActivityLog, newLog]);
    setOpsCustomLogInput('');
    fireToast(lang === 'ar' ? 'تم تسجيل الملاحظة في سجل التدقيق أمنياً!' : 'Custom transaction event recorded in security audit!', 'success');
  };

  const handleSaveOperationDetails = async () => {
    if (!selectedOperation) return;

    // 1. Compile updated booking
    const prevStatus = selectedOperation.status || 'new';
    const statusLower = editOrderStatus.toLowerCase().replace(/ /g, '_');

    // Create a new activity log entry for the action with roles
    const nowLocalDate = new Date().toISOString().split('T')[0];
    const nowLocalTime = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);
    const logRole = sessionUser?.role || 'Staff';
    const logUser = sessionUser?.username || 'Staff';
    
    const newLogs = [...editActivityLog];
    let changeDetected = false;

    // 1. Who changed status
    if (prevStatus !== statusLower) {
      newLogs.push({
        employee: logUser,
        role: logRole,
        action: `Changed status from ${prevStatus} to ${statusLower}`,
        date: nowLocalDate,
        time: nowLocalTime
      });
      changeDetected = true;
    }

    // 2. Who edited customer records or identity
    const customerChanged = 
      (selectedOperation.name || '') !== editCustomerName ||
      (selectedOperation.phone || selectedOperation.customerPhone || '') !== editCustomerPhone ||
      (selectedOperation.email || selectedOperation.customerEmail || '') !== editCustomerEmail ||
      (selectedOperation.customerGov || '') !== editCustomerGov ||
      (selectedOperation.customerAddress || '') !== editCustomerAddress ||
      (selectedOperation.customerId || '') !== editCustomerId ||
      (selectedOperation.customerVerification || '') !== editCustomerVerification ||
      (selectedOperation.identityStatus || '') !== editIdentityStatus;

    if (customerChanged) {
      newLogs.push({
        employee: logUser,
        role: logRole,
        action: `Edited customer records or identity information`,
        date: nowLocalDate,
        time: nowLocalTime
      });
      changeDetected = true;
    }

    // 3. Who edited invoice
    const invoiceEdited = (selectedOperation.invoiceNumber || '') !== editInvoiceNumber;
    if (invoiceEdited) {
      newLogs.push({
        employee: logUser,
        role: logRole,
        action: `Edited invoice designation ID to: ${editInvoiceNumber}`,
        date: nowLocalDate,
        time: nowLocalTime
      });
      changeDetected = true;
    }

    // 4. Who modified inventory / products list
    const prevProds = selectedOperation.orderedProducts || [];
    const inventoryChanged = prevProds.length !== editSelectedProducts.length ||
      editSelectedProducts.some((item, index) => {
        const prevItem = prevProds[index];
        return !prevItem || prevItem.product?.id !== item.product?.id || prevItem.quantity !== item.quantity;
      });

    if (inventoryChanged) {
      newLogs.push({
        employee: logUser,
        role: logRole,
        action: `Modified product/accessories inventory selections on invoice`,
        date: nowLocalDate,
        time: nowLocalTime
      });
      changeDetected = true;
    }

    // 5. Who modified financial records / prices (discount, tax, paymentStatus, financial verification status)
    const financialsChanged = 
      (selectedOperation.discountAmount || 0) !== editDiscountAmount ||
      (selectedOperation.taxRate !== undefined ? selectedOperation.taxRate : 14) !== editTaxRate ||
      (selectedOperation.paymentStatus || 'Unpaid') !== editPaymentStatus ||
      (selectedOperation.invoiceConfirmation || 'Pending') !== editInvoiceConfirmation ||
      (selectedOperation.accountingNotes || '') !== editAccountingNotes;

    if (financialsChanged) {
      newLogs.push({
        employee: logUser,
        role: logRole,
        action: `Modified financial ledger parameters (discounts, taxes or financial verification)`,
        date: nowLocalDate,
        time: nowLocalTime
      });
      changeDetected = true;
    }

    // Default if saved without specific parameter matches
    if (!changeDetected) {
      newLogs.push({
        employee: logUser,
        role: logRole,
        action: 'Updated general operation details',
        date: nowLocalDate,
        time: nowLocalTime
      });
    }

    // Update timeline based on transition state
    const cleanStatusKey = statusLower.replace(/_/g, '').toLowerCase();

    // 2. Prepare the updated booking object
    const updatedBooking = {
      ...selectedOperation,
      name: editCustomerName,
      phone: editCustomerPhone,
      email: editCustomerEmail,
      customerGov: editCustomerGov,
      customerAddress: editCustomerAddress,
      customerRegDate: editCustomerRegDate,
      customerPrevOrders: editPrevOrders,
      customerTotalPurchases: editTotalPurchases,
      
      invoiceNumber: editInvoiceNumber,
      orderType: editOrderType,
      status: statusLower,
      date: editOrderDate,
      orderTime: editOrderTime,
      employeeAssigned: editEmployeeAssigned,
      
      discountAmount: editDiscountAmount,
      taxRate: editTaxRate,
      employeeNotes: editEmployeeNotes,
      reservationExpiry: statusLower === 'reserved' ? editReservationExpiry : '',
      inventoryUpdateOpt: editInventoryUpdateOpt,
      
      // Protected fields serialization
      executiveNotes: editExecutiveNotes,
      customerId: editCustomerId,
      customerVerification: editCustomerVerification,
      identityStatus: editIdentityStatus,
      paymentStatus: editPaymentStatus,
      invoiceConfirmation: editInvoiceConfirmation,
      accountingNotes: editAccountingNotes,
      productVisibility: editProductVisibility,
      hideShowMotorcycle: editHideShowMotorcycle,
      
      orderedProducts: editSelectedProducts,
      activityLog: newLogs,
      timeline: editTimeline.map(stage => {
        const cleanStage = stage.stage.toLowerCase().replace(/ /g, '');
        if (cleanStage === cleanStatusKey || (cleanStatusKey === 'pending_review' && cleanStage === 'pendingreview')) {
          return { ...stage, active: true, date: nowLocalDate, time: nowLocalTime };
        }
        return stage;
      })
    };

    // 3. Update bookings state and localStore
    const newBookingsList = bookings.map(b => b.id === selectedOperation.id ? updatedBooking : b);
    setBookings(newBookingsList);
    localStorage.setItem('elkholy_bookings', JSON.stringify(newBookingsList));

    // Sync booking update to Firestore
    try {
      await setDoc(doc(db, 'bookings', selectedOperation.id), updatedBooking, { merge: true });
    } catch (err) {
      console.warn("Unable to sync booking update in Firestore:", err);
    }

    // 4. Update motorcycle characteristics if there is an associated bike
    if (selectedOperation.motorcycleId) {
      const bikeId = selectedOperation.motorcycleId;
      const associatedBike = motorcycles.find(m => m.id === bikeId);
      if (associatedBike) {
        let bikeUpdated = { ...associatedBike };
        if (statusLower === 'reserved') {
          bikeUpdated.isReserved = true;
          bikeUpdated.reservationExpiry = editReservationExpiry;
          bikeUpdated.isSold = false;
        } else if (statusLower === 'sold') {
          bikeUpdated.isSold = true;
          bikeUpdated.isReserved = false;
          bikeUpdated.reservationExpiry = '';
        } else {
          // Restore items
          bikeUpdated.isSold = false;
          bikeUpdated.isReserved = false;
          bikeUpdated.reservationExpiry = '';
        }

        // Apply list
        const updatedBikesList = motorcycles.map(m => m.id === bikeId ? bikeUpdated : m);
        onUpdateMotorcycles(updatedBikesList);
        // Sync to localStorage
        localStorage.setItem('elkholy_motorcycles', JSON.stringify(updatedBikesList));
        // Sync to cloud
        try {
          await setDoc(doc(db, 'motorcycles', bikeId), bikeUpdated, { merge: true });
        } catch (err) {
          console.warn("Unable to sync motorcycle status to cloud database:", err);
        }
      }
    }

    // 5. Inventory update for products if any
    if (editSelectedProducts.length > 0 && onUpdateStoreProducts) {
      let updatedStoreProductsList = [...storeProducts];
      let didChange = false;

      if (editInventoryUpdateOpt === 'auto' && (statusLower === 'sold' || statusLower === 'delivered')) {
        editSelectedProducts.forEach(op => {
          const targetProd = updatedStoreProductsList.find(p => p.id === op.product.id);
          if (targetProd) {
            didChange = true;
            // Subtract stock and count sold values
            const qty = op.quantity || 1;
            const originalStock = targetProd.stockCount || 0;
            const newStock = Math.max(0, originalStock - qty);
            targetProd.stockCount = newStock;
            targetProd.soldCount = (targetProd.soldCount || 0) + qty;
          }
        });
      }

      if (didChange) {
        onUpdateStoreProducts(updatedStoreProductsList);
        localStorage.setItem('elkholy_store_products', JSON.stringify(updatedStoreProductsList));
        // Sync modified products to database list
        for (const item of updatedStoreProductsList) {
          try {
            await setDoc(doc(db, 'products', item.id), item, { merge: true });
          } catch (err) {
            console.warn(`Unable to sync product ${item.id} inventory status to database:`, err);
          }
        }
      }
    }

    fireToast(lang === 'ar' ? 'تم حفظ التعديلات وتحديث المخزون بنجاح ⚡' : 'Operation audit saved, inventory and database synchronized.', 'success');
    setSelectedOperation(null);
  };

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Status filter
    if (opsStatusFilter !== 'ALL') {
      result = result.filter(b => {
        const s = (b.status || 'new').toLowerCase().replace(/ /g, '_');
        if (opsStatusFilter === 'pending') {
          return s === 'pending' || s === 'pending_review' || s === 'contacted';
        }
        return s === opsStatusFilter;
      });
    }

    // Search query
    if (opsSearchQuery.trim()) {
      const q = opsSearchQuery.toLowerCase().trim();
      result = result.filter(b => {
        const id = (b.id || '').toLowerCase();
        const name = (b.name || '').toLowerCase();
        const phone = (b.phone || '').toLowerCase();
        const motorcycleName = (b.motorcycleName || '').toLowerCase();
        const motorcycleId = (b.motorcycleId || '').toLowerCase();
        const invoiceNumber = (b.invoiceNumber || `INV-${b.id.slice(-6).toUpperCase()}`).toLowerCase();
        
        // Products check
        const prods = (b.orderedProducts || []).map((p: any) => p.product.name.toLowerCase()).join(' ');

        return id.includes(q) || 
               name.includes(q) || 
               phone.includes(q) || 
               motorcycleName.includes(q) || 
               motorcycleId.includes(q) || 
               invoiceNumber.includes(q) ||
               prods.includes(q);
      });
    }

    return result;
  }, [bookings, opsSearchQuery, opsStatusFilter]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | 'ALL'>('ALL');

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
    const uniqueId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastMessage = { id: uniqueId, text, type };
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

  // Load bookings and users from Firestore on admin authorization
  useEffect(() => {
    async function loadCloudData() {
      if (!sessionUser) return;
      try {
        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        if (!bookingsSnap.empty) {
          const list: any[] = [];
          bookingsSnap.forEach((doc) => {
            const data = doc.data();
            list.push({
              id: doc.id,
              motorcycleId: data.motorcycleId,
              motorcycleName: data.motorcycleName,
              category: data.category || 'A',
              price: data.totalPrice ? `${data.totalPrice.toLocaleString()} EGP` : (data.price || '0 EGP'),
              name: data.customerName || data.name || 'Anonymous User',
              phone: data.customerPhone || data.phone || '000000000',
              email: data.customerEmail || data.email || 'Guest (Cloud)',
              date: data.date || new Date().toISOString().split('T')[0],
              timestamp: data.timestamp || new Date().toISOString(),
              status: data.status || 'sold'
            });
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setBookings(list);
          localStorage.setItem('elkholy_bookings', JSON.stringify(list));
        }
      } catch (err) {
        console.warn("Unable to fetch bookings from Firestore:", err);
      }

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (!usersSnap.empty) {
          const list: UserAccount[] = [];
          usersSnap.forEach((doc) => {
            list.push(doc.data() as UserAccount);
          });
          setUsers(list);
          localStorage.setItem('elkholy_users', JSON.stringify(list));
        } else {
          // Sync existing defaults to Firestore
          for (const user of DEFAULT_USERS) {
            await setDoc(doc(db, 'users', user.username), user);
          }
        }
      } catch (err) {
        console.warn("Unable to fetch users from Firestore:", err);
      }
    }
    loadCloudData();
  }, [sessionUser]);

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
    let filtered = motorcycles;
    if (dashCategoryFilter !== 'All') {
      filtered = filtered.filter(b => b.category === dashCategoryFilter);
    }
    if (bikeSearchTerm.trim()) {
      const query = bikeSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(query) || 
        (b.id && b.id.toLowerCase().includes(query)) ||
        (b.serialCode && b.serialCode.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [motorcycles, dashCategoryFilter, bikeSearchTerm]);

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
      serialCode: bike.serialCode || '',
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
      serialCode: 'MOTO-' + Date.now(),
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

  const handleDownloadAndCopyQRCode = (bike: Motorcycle) => {
    const qrCodeText = bike.serialCode || bike.id;
    
    // 1. Copy to clipboard
    navigator.clipboard.writeText(qrCodeText).then(() => {
      fireToast(
        lang === 'ar' 
          ? `تم نسخ الكود بنجاح: ${qrCodeText}` 
          : `Code copied successfully: ${qrCodeText}`, 
        'success'
      );
    }).catch((err) => {
      console.warn("Failed to copy", err);
    });

    // 2. Locate SVG and initiate image download
    const svgElement = document.getElementById(`qr-${bike.id}`);
    if (!svgElement) {
      console.warn(`SVG element qr-${bike.id} not found`);
      return;
    }

    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = window.URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        if (context) {
          // Fill background white
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, 256, 256);
          // Draw QR on top
          context.drawImage(image, 16, 16, 224, 224);
          
          const pngURL = canvas.toDataURL('image/png');
          const dlLink = document.createElement('a');
          dlLink.href = pngURL;
          dlLink.download = `QR_${bike.name.replace(/\s+/g, '_')}_${qrCodeText}.png`;
          document.body.appendChild(dlLink);
          dlLink.click();
          document.body.removeChild(dlLink);
          
          window.URL.revokeObjectURL(blobURL);
        }
      };
      image.onerror = () => {
        // Fallback to SVG download in case image drawing is blocked by sandbox constraints
        const dlLink = document.createElement('a');
        dlLink.href = blobURL;
        dlLink.download = `QR_${bike.name.replace(/\s+/g, '_')}_${qrCodeText}.svg`;
        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
      };
      image.src = blobURL;
    } catch (err) {
      console.error("Failed to generate download:", err);
    }
  };

  // User Actions (Core Admin Only)
  const handleAddUserSubmit = async (e: React.FormEvent) => {
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
    try {
      await setDoc(doc(db, 'users', cleanUsername), newUser);
    } catch (err) {
      console.warn("Unable to sync new user to Firestore:", err);
    }
    fireToast(lang === 'ar' ? 'تم تفويض المشغل الجديد بنجاح!' : `Operator node delegated: ${cleanUsername} [${newRole}]`, 'success');
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
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
    try {
      await deleteDoc(doc(db, 'users', usernameToDelete));
    } catch (err) {
      console.warn("Unable to sync deleted user from Firestore:", err);
    }
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
  const handleClearBookings = async () => {
    if (sessionUser?.role !== 'Admin') {
      fireToast(lang === 'ar' ? 'الوصول مرفوض: الإداريون فقط يحق لهم الحذف' : 'Privilege Breach: Only admins can clean logs', 'error');
      return;
    }
    localStorage.removeItem('elkholy_bookings');
    setBookings([]);
    try {
      const qSnap = await getDocs(collection(db, 'bookings'));
      for (const d of qSnap.docs) {
        await deleteDoc(doc(db, 'bookings', d.id));
      }
    } catch (err) {
      console.warn("Unable to clear bookings from Firestore:", err);
    }
    fireToast(lang === 'ar' ? 'تم تفريغ طابور الحجوزات نهائياً' : 'Holographic lead queue purged successfully', 'info');
  };

  // Toggle booking's status between sold and pending
  const handleToggleBookingStatus = async (bookingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'sold' ? 'pending' : 'sold';
    
    // update state
    const updated = bookings.map(b => b.id === bookingId ? { ...b, status: nextStatus } : b);
    setBookings(updated);
    localStorage.setItem('elkholy_bookings', JSON.stringify(updated));
    
    try {
      await setDoc(doc(db, 'bookings', bookingId), {
        status: nextStatus
      }, { merge: true });
      fireToast(
        lang === 'ar' ? 'تم تحديث حالة البيع للدراجة بنجاح' : 'Motorcycle status updated successfully',
        'success'
      );
    } catch (err) {
      console.warn("Unable to sync booking status in cloud:", err);
    }
  };

  // Score stats values
  const fleetValue = useMemo(() => {
    return motorcycles.reduce((acc, current) => acc + (current.priceNum || 45000), 0);
  }, [motorcycles]);

  const catA_Count = useMemo(() => motorcycles.filter(b => b.category === 'A').length, [motorcycles]);
  const catB_Count = useMemo(() => motorcycles.filter(b => b.category === 'B').length, [motorcycles]);
  const catC_Count = useMemo(() => motorcycles.filter(b => b.category === 'C').length, [motorcycles]);
  const catS_Count = useMemo(() => motorcycles.filter(b => b.category === 'S').length, [motorcycles]);

  // Motorcycle sales and sold count calculation (Based on bookings having status !== 'pending')
  const motorsTotalSalesValue = useMemo(() => {
    return bookings.reduce((acc, b) => {
      const status = b.status || 'sold';
      if (status !== 'sold') return acc;
      
      let numericPrice = 45000; // default
      if (b.price) {
        const cleaned = b.price.replace(/[^0-9]/g, '');
        if (cleaned) {
          numericPrice = Number(cleaned);
        }
      }
      return acc + numericPrice;
    }, 0);
  }, [bookings]);

  const motorsTotalSoldCount = useMemo(() => {
    return bookings.filter(b => (b.status || 'sold') === 'sold').length;
  }, [bookings]);

  // E-commerce Store statistics calculations
  const storeTotalRevenue = useMemo(() => {
    return (storeProducts || []).reduce((acc, p) => acc + ((p.price || 0) * (p.soldCount || 0)), 0);
  }, [storeProducts]);

  const storeTotalItemsSold = useMemo(() => {
    return (storeProducts || []).reduce((acc, p) => acc + (p.soldCount || 0), 0);
  }, [storeProducts]);

  // Generate deterministic simulated transactions for store products to calculate date-filtered statistics
  const storeTransactions = useMemo(() => {
    const list: { id: string; productId: string; name: string; nameAr: string; category: StoreCategory; price: number; timestamp: Date }[] = [];
    const now = new Date(); // Use actual current date for real operations
    
    let txIdCounter = 1;
    (storeProducts || []).forEach((p) => {
      // Use strictly real product statistics
      const totalSold = p.soldCount || 0;
      
      for (let i = 0; i < totalSold; i++) {
        // Distribute sales across the last 30 days deterministically for real counts
        const seed = p.id.charCodeAt(0) + p.id.charCodeAt(p.id.length - 1) + i;
        const daysAgo = seed % 30; // 0 to 29 days ago
        const hoursAgo = (seed * 11) % 24;
        const minutesAgo = (seed * 7) % 60;
        
        const txDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
        
        list.push({
          id: `STX-${p.id}-${txIdCounter++}`,
          productId: p.id,
          name: p.name,
          nameAr: p.nameAr,
          category: p.category,
          price: p.price || 500,
          timestamp: txDate
        });
      }
    });
    return list;
  }, [storeProducts]);

  // Filter store transactions based on the selected period
  const filteredStoreTransactions = useMemo(() => {
    const now = new Date(); // Use actual current date
    
    return storeTransactions.filter((tx) => {
      const txDate = tx.timestamp;
      const diffTime = now.getTime() - txDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (storeFilterPeriod === 'today') {
        return txDate.toDateString() === now.toDateString();
      }
      if (storeFilterPeriod === 'week') {
        return diffDays >= 0 && diffDays <= 7;
      }
      if (storeFilterPeriod === 'month') {
        return diffDays >= 0 && diffDays <= 30;
      }
      if (storeFilterPeriod === '3months') {
        return diffDays >= 0 && diffDays <= 90;
      }
      if (storeFilterPeriod === 'custom') {
        const start = new Date(storeStartDate).getTime();
        const end = new Date(storeEndDate).getTime();
        const txTime = txDate.getTime();
        return txTime >= start && txTime <= end;
      }
      return true;
    });
  }, [storeTransactions, storeFilterPeriod, storeStartDate, storeEndDate]);

  // Calculate stats for each StoreCategory
  const storeCategoryStats = useMemo(() => {
    const categories: StoreCategory[] = ['Oils', 'Safety', 'Smart', 'Parts', 'Lifestyle'];
    
    // Totals
    const totalRevenue = filteredStoreTransactions.reduce((acc, tx) => acc + tx.price, 0);
    const totalUnitsSold = filteredStoreTransactions.length;
    
    const breakdown = categories.map((cat) => {
      const catTx = filteredStoreTransactions.filter((tx) => tx.category === cat);
      const rev = catTx.reduce((acc, tx) => acc + tx.price, 0);
      const units = catTx.length;
      
      let nameEn = '';
      let nameAr = '';
      if (cat === 'Oils') { nameEn = 'Oils & Lubricants'; nameAr = 'زيوت ومحروقات'; }
      else if (cat === 'Safety') { nameEn = 'Safety Equipment'; nameAr = 'معدات أمان'; }
      else if (cat === 'Smart') { nameEn = 'Smart Accessories'; nameAr = 'إكسسوارات ذكية'; }
      else if (cat === 'Parts') { nameEn = 'Spare Parts'; nameAr = 'قطع غيار'; }
      else if (cat === 'Lifestyle') { nameEn = 'Lifestyle Products'; nameAr = 'منتجات لايف ستايل'; }
      
      return {
        category: cat,
        nameEn,
        nameAr,
        revenue: rev,
        units,
        revenuePercentage: totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0,
        unitsPercentage: totalUnitsSold > 0 ? (units / totalUnitsSold) * 100 : 0
      };
    });
    
    return {
      breakdown,
      totalRevenue,
      totalUnitsSold
    };
  }, [filteredStoreTransactions]);

  // Generate deterministic/real transaction list for motorcycles so date-filtering works beautifully
  const motorcycleTransactions = useMemo(() => {
    const list: { id: string; motorcycleId: string; name: string; category: 'A' | 'B' | 'C' | 'S'; priceNum: number; timestamp: Date }[] = [];
    
    // 1. Gather actual bookings that are 'sold'
    bookings.forEach((b) => {
      if ((b.status || 'sold') !== 'sold') return;
      
      let numericPrice = 45000;
      if (b.price) {
        const cleaned = b.price.replace(/[^0-9]/g, '');
        if (cleaned) {
          numericPrice = Number(cleaned);
        }
      }
      
      list.push({
        id: b.id || `real-${Math.random()}`,
        motorcycleId: b.motorcycleId || 'default',
        name: b.motorcycleName || 'Motorcycle',
        category: (b.category || 'A') as 'A' | 'B' | 'C' | 'S',
        priceNum: numericPrice,
        timestamp: b.timestamp ? new Date(b.timestamp) : new Date()
      });
    });
    
    return list;
  }, [bookings]);

  // Filter vehicle transactions based on the selected period
  const filteredVehicleTransactions = useMemo(() => {
    const now = new Date(); // Use actual current date
    
    return motorcycleTransactions.filter((tx) => {
      const txDate = tx.timestamp;
      const diffTime = now.getTime() - txDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (vehicleFilterPeriod === 'today') {
        return txDate.toDateString() === now.toDateString();
      }
      if (vehicleFilterPeriod === 'week') {
        return diffDays >= 0 && diffDays <= 7;
      }
      if (vehicleFilterPeriod === 'month') {
        return diffDays >= 0 && diffDays <= 30;
      }
      if (vehicleFilterPeriod === '3months') {
        return diffDays >= 0 && diffDays <= 90;
      }
      if (vehicleFilterPeriod === 'custom') {
        const start = new Date(vehicleStartDate).getTime();
        const end = new Date(vehicleEndDate).getTime();
        const txTime = txDate.getTime();
        return txTime >= start && txTime <= end;
      }
      return true;
    });
  }, [motorcycleTransactions, vehicleFilterPeriod, vehicleStartDate, vehicleEndDate]);

  // Calculate stats for each Vehicle Class
  const vehicleCategoryStats = useMemo(() => {
    const categories: ('A' | 'B' | 'C' | 'S')[] = ['A', 'B', 'C', 'S'];
    const totalRevenue = filteredVehicleTransactions.reduce((acc, tx) => acc + tx.priceNum, 0);
    const totalUnitsSold = filteredVehicleTransactions.length;
    
    const breakdown = categories.map((cat) => {
      const catTx = filteredVehicleTransactions.filter((tx) => tx.category === cat);
      const rev = catTx.reduce((acc, tx) => acc + tx.priceNum, 0);
      const units = catTx.length;
      
      let nameEn = '';
      let nameAr = '';
      if (cat === 'A') { nameEn = 'Sport Class A'; nameAr = 'فئة رياضية A'; }
      else if (cat === 'B') { nameEn = 'Cruiser Class B'; nameAr = 'كروزر فئة B'; }
      else if (cat === 'C') { nameEn = 'Adventure Class C'; nameAr = 'مغامرات فئة C'; }
      else if (cat === 'S') { nameEn = 'Scooter Class S'; nameAr = 'سكوتر فئة S'; }
      
      return {
        category: cat,
        nameEn,
        nameAr,
        revenue: rev,
        units,
        revenuePercentage: totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0,
        unitsPercentage: totalUnitsSold > 0 ? (units / totalUnitsSold) * 100 : 0
      };
    });
    
    return {
      breakdown,
      totalRevenue,
      totalUnitsSold
    };
  }, [filteredVehicleTransactions]);

  // --- Excel Export & Sales Reports Processing States ---
  const [exportRangeType, setExportRangeType] = useState<'today' | 'week' | 'month' | '3months' | '6months' | 'year' | 'custom'>('month');
  const [exportStartDate, setExportStartDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [exportEndDate, setExportEndDate] = useState<string>(new Date().toISOString().slice(0, 16));

  const handleExportExcel = () => {
    // 1. Gather all data sources
    // Real bookings
    const parsedRealBookings = bookings.map((b) => {
      // safe numeric price parsing
      let numericPrice = 45000; // default
      if (b.price) {
        const cleaned = b.price.replace(/[^0-9]/g, '');
        if (cleaned) {
          numericPrice = Number(cleaned);
        }
      }
      
      let dateStr = b.date || new Date().toISOString().split('T')[0];
      if (b.timestamp) {
        try {
          dateStr = b.timestamp.split('T')[0];
        } catch(e){}
      }
      
      return {
        id: b.id,
        code: b.motorcycleId || 'MOTO-GEN',
        name: b.motorcycleName,
        type: lang === 'ar' ? 'دراجة نارية' : 'Motorcycle',
        customerName: b.name || 'Anonymous',
        customerPhone: b.phone || '-',
        quantity: 1,
        unitPrice: numericPrice,
        totalPrice: numericPrice,
        date: dateStr
      };
    });
    
    // Merge real bookings and mock historical transactions
    const allSales = [...parsedRealBookings];
    
    // Filter by chosen timeframe/period (Current present Date)
    const now = new Date();
    
    const filteredSales = allSales.filter((sale) => {
      const saleDate = new Date(sale.date);
      if (isNaN(saleDate.getTime())) return true;
      
      const diffTime = now.getTime() - saleDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (exportRangeType === 'today') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (exportRangeType === 'week') {
        return diffDays >= 0 && diffDays <= 7;
      }
      if (exportRangeType === 'month') {
        return diffDays >= 0 && diffDays <= 30;
      }
      if (exportRangeType === '3months') {
        return diffDays >= 0 && diffDays <= 90;
      }
      if (exportRangeType === '6months') {
        return diffDays >= 0 && diffDays <= 180;
      }
      if (exportRangeType === 'year') {
        return diffDays >= 0 && diffDays <= 365;
      }
      if (exportRangeType === 'custom') {
        const start = new Date(exportStartDate).getTime();
        const end = new Date(exportEndDate).getTime();
        const saleTime = saleDate.getTime();
        return saleTime >= start && saleTime <= end;
      }
      return true;
    });

    if (filteredSales.length === 0) {
      fireToast(
        lang === 'ar' 
          ? 'لا توجد مبيعات أو حجوزات متوفرة في النطاق المحدد!' 
          : 'No sales or booking entries exist in this duration', 
        'error'
      );
      return;
    }

    // Translate items to beautiful Arabic/English excel headers
    const xlsData = filteredSales.map((sale, index) => {
      if (lang === 'ar') {
        return {
          'م': index + 1,
          'كود السلعة/الخدمة': sale.code,
          'الاسم / الموديل': sale.name,
          'التصنيف': sale.type,
          'اسم العميل': sale.customerName,
          'رقم الهاتف': sale.customerPhone,
          'الكمية المباعة': sale.quantity,
          'سعر الوحدة (ج.م)': sale.unitPrice,
          'الإجمالي كلي (ج.م)': sale.totalPrice,
          'تاريخ الاستحقاق/تاريخ البيع': sale.date
        };
      } else {
        return {
          'No': index + 1,
          'Item Code': sale.code,
          'Name / Model': sale.name,
          'Category Type': sale.type,
          'Customer Name': sale.customerName,
          'Phone Reference': sale.customerPhone,
          'Quantity': sale.quantity,
          'Unit Price (EGP)': sale.unitPrice,
          'Aggregate Total (EGP)': sale.totalPrice,
          'Transaction Date': sale.date
        };
      }
    });

    // Generate Spreadsheet worksheet
    const worksheet = XLSX.utils.json_to_sheet(xlsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, lang === 'ar' ? 'سجل الأرباح والمبيعات' : 'Sales Journal');
    
    XLSX.writeFile(workbook, `ElKholy_Motors_Sales_Report_2026.xlsx`);
    
    fireToast(
      lang === 'ar' 
        ? `تم تجميع وتصدير التقرير بنجاح! (${filteredSales.length} حركة بيع/حجز)` 
        : `Successfully exported report containing ${filteredSales.length} transactions.`, 
      'success'
    );
  };

  const handleExportVehicleStatsExcel = () => {
    const xlsData = vehicleCategoryStats.breakdown.map((item, index) => {
      if (lang === 'ar') {
        return {
          'م': index + 1,
          'فئة المركبة الكود': item.category,
          'اسم الفئة (إنجليزي)': item.nameEn,
          'اسم الفئة (عربي)': item.nameAr,
          'الوحدات المباعة': item.units,
          'إجمالي الإيرادات (ج.م)': item.revenue,
          'نسبة الأرباح (%)': Math.round(item.revenuePercentage)
        };
      } else {
        return {
          'No': index + 1,
          'Class Code': item.category,
          'Class Name (EN)': item.nameEn,
          'Class Name (AR)': item.nameAr,
          'Units Sold': item.units,
          'Total Revenue (EGP)': item.revenue,
          'Revenue Share (%)': Math.round(item.revenuePercentage)
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(xlsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, lang === 'ar' ? 'إحصائيات فئات المركبات' : 'Vehicle Class Stats');
    
    XLSX.writeFile(workbook, `ElKholy_Vehicle_Class_Stats_${vehicleFilterPeriod}.xlsx`);
    
    fireToast(
      lang === 'ar' 
        ? 'تم تحميل تقرير مبيعات الفئات بنجاح!' 
        : 'Category sales report downloaded successfully!', 
      'success'
    );
  };

  const handleExportStoreStatsExcel = () => {
    const xlsData = storeCategoryStats.breakdown.map((item, index) => {
      if (lang === 'ar') {
        return {
          'م': index + 1,
          'قسم المتجر': item.category,
          'اسم القسم (إنجليزي)': item.nameEn,
          'اسم القسم (عربي)': item.nameAr,
          'الوحدات المباعة': item.units,
          'إجمالي الإيرادات (ج.م)': item.revenue,
          'نسبة الأرباح (%)': Math.round(item.revenuePercentage)
        };
      } else {
        return {
          'No': index + 1,
          'Store Department': item.category,
          'Department (EN)': item.nameEn,
          'Department (AR)': item.nameAr,
          'Units Sold': item.units,
          'Total Revenue (EGP)': item.revenue,
          'Revenue Share (%)': Math.round(item.revenuePercentage)
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(xlsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, lang === 'ar' ? 'إحصائيات أقسام المتجر' : 'Store Category Stats');
    
    XLSX.writeFile(workbook, `ElKholy_Store_Category_Stats_${storeFilterPeriod}.xlsx`);
    
    fireToast(
      lang === 'ar' 
        ? 'تم تحميل تقرير مبيعات أقسام المتجر بنجاح!' 
        : 'Store department sales report downloaded successfully!', 
      'success'
    );
  };

  const handleExportVehicleStatsWord = async () => {
    const doc = new Docx.Document({
      sections: [{
        children: [
          new Docx.Paragraph({ text: lang === 'ar' ? 'تقرير مبيعات فئات المركبات' : 'Vehicle Class Sales Report', heading: Docx.HeadingLevel.HEADING_1 }),
          new Docx.Paragraph({ text: ' ' }),
          new Docx.Table({
            width: { size: 100, type: Docx.WidthType.PERCENTAGE },
            rows: [
              new Docx.TableRow({
                children: [
                  new Docx.TableCell({ children: [new Docx.Paragraph({ children: [new Docx.TextRun({ text: lang === 'ar' ? 'الفئة' : 'Category', bold: true })] })] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph({ children: [new Docx.TextRun({ text: lang === 'ar' ? 'الوحدات' : 'Units', bold: true })] })] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph({ children: [new Docx.TextRun({ text: lang === 'ar' ? 'الإيرادات' : 'Revenue', bold: true })] })] }),
                ]
              }),
              ...vehicleCategoryStats.breakdown.map(item => new Docx.TableRow({
                children: [
                  new Docx.TableCell({ children: [new Docx.Paragraph(lang === 'ar' ? item.nameAr : item.nameEn)] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph(item.units.toString())] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph(item.revenue.toString())] }),
                ]
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Docx.Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ElKholy_Vehicle_Stats_${vehicleFilterPeriod}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
    fireToast(lang === 'ar' ? 'تم تحميل تقرير مبيعات الفئات (Word) بنجاح!' : 'Category sales report (Word) downloaded successfully!', 'success');
  };

  const handleExportStoreStatsWord = async () => {
    const doc = new Docx.Document({
      sections: [{
        children: [
          new Docx.Paragraph({ text: lang === 'ar' ? 'تقرير مبيعات أقسام المتجر' : 'Store Department Sales Report', heading: Docx.HeadingLevel.HEADING_1 }),
          new Docx.Paragraph({ text: ' ' }),
          new Docx.Table({
            width: { size: 100, type: Docx.WidthType.PERCENTAGE },
            rows: [
              new Docx.TableRow({
                children: [
                  new Docx.TableCell({ children: [new Docx.Paragraph({ children: [new Docx.TextRun({ text: lang === 'ar' ? 'القسم' : 'Department', bold: true })] })] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph({ children: [new Docx.TextRun({ text: lang === 'ar' ? 'الوحدات' : 'Units', bold: true })] })] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph({ children: [new Docx.TextRun({ text: lang === 'ar' ? 'الإيرادات' : 'Revenue', bold: true })] })] }),
                ]
              }),
              ...storeCategoryStats.breakdown.map(item => new Docx.TableRow({
                children: [
                  new Docx.TableCell({ children: [new Docx.Paragraph(lang === 'ar' ? item.nameAr : item.nameEn)] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph(item.units.toString())] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph(item.revenue.toString())] }),
                ]
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Docx.Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ElKholy_Store_Stats_${storeFilterPeriod}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
    fireToast(lang === 'ar' ? 'تم تحميل تقرير مبيعات الأقسام (Word) بنجاح!' : 'Store department sales report (Word) downloaded successfully!', 'success');
  };

  const handleExportBookingsExcel = () => {
    const xlsData = bookings.map((b, index) => {
      if (lang === 'ar') {
        return {
          'م': index + 1,
          'العميل': b.name,
          'الماكينة': b.motorcycleName,
          'الهاتف': b.phone,
          'تاريخ الحجز': b.date,
          'الحالة': b.status
        };
      } else {
        return {
          'No': index + 1,
          'Client': b.name,
          'Machine': b.motorcycleName,
          'Phone': b.phone,
          'Reserve Date': b.date,
          'Status': b.status
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(xlsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, lang === 'ar' ? 'سجل الحجوزات' : 'Bookings Journal');
    
    XLSX.writeFile(workbook, `ElKholy_Bookings_Report.xlsx`);
    
    fireToast(
      lang === 'ar' ? 'تم تحميل تقرير الحجوزات بنجاح!' : 'Bookings report downloaded successfully!', 
      'success'
    );
  };

  const handleExportBookingsWord = async () => {
    const doc = new Docx.Document({
      sections: [{
        children: [
          new Docx.Paragraph({ text: lang === 'ar' ? 'تقرير سجل الحجوزات' : 'Bookings Journal Report', heading: Docx.HeadingLevel.HEADING_1 }),
          new Docx.Paragraph({ text: ' ' }),
          new Docx.Table({
            width: { size: 100, type: Docx.WidthType.PERCENTAGE },
            rows: [
              new Docx.TableRow({
                children: [
                  new Docx.TableCell({ children: [new Docx.Paragraph({ children: [new Docx.TextRun({ text: lang === 'ar' ? 'العميل' : 'Client', bold: true })] })] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph({ children: [new Docx.TextRun({ text: lang === 'ar' ? 'الماكينة' : 'Machine', bold: true })] })] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph({ children: [new Docx.TextRun({ text: lang === 'ar' ? 'تاريخ الحجز' : 'Date', bold: true })] })] }),
                ]
              }),
              ...bookings.map(b => new Docx.TableRow({
                children: [
                  new Docx.TableCell({ children: [new Docx.Paragraph(b.name)] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph(b.motorcycleName)] }),
                  new Docx.TableCell({ children: [new Docx.Paragraph(b.date)] })
                ]
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Docx.Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ElKholy_Bookings_Report.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
    fireToast(lang === 'ar' ? 'تم تحميل تقرير الحجوزات (Word) بنجاح!' : 'Bookings journal (Word) downloaded successfully!', 'success');
  };


  const handleDownloadBackup = async () => {
    try {
      const zip = new JSZip();
      
      // 1. Motorcycles
      zip.file("motorcycles_backup.json", JSON.stringify(motorcycles, null, 2));
      
      // 2. Store Products
      zip.file("store_products_backup.json", JSON.stringify(storeProducts || [], null, 2));
      
      // 3. Custom Text
      zip.file("custom_text_backup.json", JSON.stringify(customText || {}, null, 2));
      
      // 4. Homepage Config
      zip.file("homepage_config_backup.json", JSON.stringify(builderConfig || DEFAULT_HOMEPAGE_CONFIG, null, 2));
      
      // 5. Bookings
      zip.file("bookings_backup.json", JSON.stringify(bookings || [], null, 2));
      
      // 6. Users
      zip.file("users_backup.json", JSON.stringify(users || [], null, 2));
      
      // Metadata/Readme
      zip.file("README_BACKUP.txt", `ELKHOLY MOTORS COMPLETE SYSTEM BACKUP
Generated: ${new Date().toLocaleString()}
Timestamp: ${new Date().toISOString()}

This ZIP file contains complete system files and database configurations (Motorcycles, Store products, Customize layouts, reservations, and admin accounts). 
Do NOT edit or rename the json files inside this archive to ensure flawless synchronization when restoring in the future.`);

      const content = await zip.generateAsync({ type: "blob" });
      const dlURL = window.URL.createObjectURL(content);
      const tempLink = document.createElement("a");
      tempLink.href = dlURL;
      tempLink.download = `elkholy_site_backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(dlURL);

      fireToast(
        lang === 'ar'
          ? 'تم إنشاء نسخة احتياطية كاملة للموقع وتحميلها كملف مضغوط بنجاح! 📦'
          : 'Complete site backup generated and downloaded successfully! 📦',
        'success'
      );
    } catch (err) {
      console.error("Backup generation failed:", err);
      fireToast(
        lang === 'ar' ? 'فشل إنشاء ملف النسخة الاحتياطية!' : 'Failed to generate archive backup!',
        'error'
      );
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (sessionUser?.role !== 'Admin') {
      fireToast(
        lang === 'ar' ? 'عذراً! الصلاحية غير كافية لعمل استعادة للموقع.' : 'Privilege Breach: Only Master Administrators can restore backup archives',
        'error'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const zip = await JSZip.loadAsync(buffer);

        // Track what we recovered
        let restoredCount = 0;

        // 1. Motorcycles
        const bikesFile = zip.file("motorcycles_backup.json");
        if (bikesFile) {
          const content = await bikesFile.async("string");
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            onUpdateMotorcycles(parsed);
            restoredCount++;
          }
        }

        // 2. Store products
        const productsFile = zip.file("store_products_backup.json");
        if (productsFile && onUpdateStoreProducts) {
          const content = await productsFile.async("string");
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            onUpdateStoreProducts(parsed);
            restoredCount++;
          }
        }

        // 3. Custom translation settings
        const textFile = zip.file("custom_text_backup.json");
        if (textFile) {
          const content = await textFile.async("string");
          const parsed = JSON.parse(content);
          onUpdateCustomText(parsed);
          restoredCount++;
        }

        // 4. Homepage config
        const configFile = zip.file("homepage_config_backup.json");
        if (configFile) {
          const content = await configFile.async("string");
          const parsed = JSON.parse(content);
          setBuilderConfig(parsed);
          onUpdateHomepageConfig(parsed);
          restoredCount++;
        }

        // 5. Bookings
        const bookingsFile = zip.file("bookings_backup.json");
        if (bookingsFile) {
          const content = await bookingsFile.async("string");
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setBookings(parsed);
            localStorage.setItem('elkholy_bookings', JSON.stringify(parsed));
            restoredCount++;

            // Cloud Firestore Sync (optional/graceful)
            try {
              for (const b of parsed) {
                await setDoc(doc(db, 'bookings', b.id), b);
              }
            } catch(e) {
              console.warn("Unable to sync restored bookings to Firestore:", e);
            }
          }
        }

        // 6. Users accounts
        const usersFile = zip.file("users_backup.json");
        if (usersFile) {
          const content = await usersFile.async("string");
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setUsers(parsed);
            localStorage.setItem('elkholy_users', JSON.stringify(parsed));
            restoredCount++;
          }
        }

        if (restoredCount > 0) {
          fireToast(
            lang === 'ar'
              ? 'تمت استعادة النسخة الاحتياطية وتطبيقها على خوادم الموقع بنجاح! 🚀🔄'
              : 'Restore sequence successful! All databases updated in real-time. 🚀🔄',
            'success'
          );
        } else {
          fireToast(
            lang === 'ar'
              ? 'لم يتم العثور على ملفات احتياطية صالحة داخل الأرشيف المضغوط!'
              : 'Selected ZIP does not contain compliant ElKholy JSON database backups!',
            'error'
          );
        }

        // Reset input element
        e.target.value = '';
      } catch (err) {
        console.error("Restore failed:", err);
        fireToast(
          lang === 'ar'
            ? 'خطأ غير متوقع أثناء استخراج النسخة الاحتياطية!'
            : 'Unrecognized structure! Unzip operation terminated unexpectedly.',
          'error'
        );
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const generateUnifiedBackupData = () => {
    return {
      type: "elkholy_backup_json",
      version: "1.0",
      timestamp: new Date().toISOString(),
      motorcycles: motorcycles || [],
      storeProducts: storeProducts || [],
      customText: customText || {},
      homepageConfig: builderConfig || DEFAULT_HOMEPAGE_CONFIG,
      bookings: bookings || [],
      users: users || []
    };
  };

  const applyUnifiedBackupData = (data: any) => {
    if (!data || data.type !== "elkholy_backup_json") {
      throw new Error("Invalid backup format");
    }

    let restoredCount = 0;

    // 1. Motorcycles
    if (Array.isArray(data.motorcycles)) {
      onUpdateMotorcycles(data.motorcycles);
      restoredCount++;
    }

    // 2. Store Products
    if (Array.isArray(data.storeProducts) && onUpdateStoreProducts) {
      onUpdateStoreProducts(data.storeProducts);
      restoredCount++;
    }

    // 3. Custom Text
    if (data.customText) {
      onUpdateCustomText(data.customText);
      restoredCount++;
    }

    // 4. Homepage Config
    if (data.homepageConfig) {
      setBuilderConfig(data.homepageConfig);
      onUpdateHomepageConfig(data.homepageConfig);
      restoredCount++;
    }

    // 5. Bookings
    if (Array.isArray(data.bookings)) {
      setBookings(data.bookings);
      localStorage.setItem('elkholy_bookings', JSON.stringify(data.bookings));
      restoredCount++;
      // Sync to firestore gently
      try {
        data.bookings.forEach((b: any) => {
          setDoc(doc(db, 'bookings', b.id), b).catch(err => console.warn("Sync failed for booking", b.id));
        });
      } catch (err) {
        console.warn("Unable to sync restored bookings to Firestore:", err);
      }
    }

    // 6. Users
    if (Array.isArray(data.users)) {
      setUsers(data.users);
      localStorage.setItem('elkholy_users', JSON.stringify(data.users));
      restoredCount++;
    }

    return restoredCount;
  };

  const handleExportToGitHub = async () => {
    if (!githubToken.trim()) {
      fireToast(
        lang === 'ar' ? 'يرجى إدخال رمز الوصول الشخصي (Token) لحساب GitHub' : 'Please provide a GitHub Personal Access Token',
        'error'
      );
      return;
    }
    if (!githubRepo.trim() || !githubRepo.includes('/')) {
      fireToast(
        lang === 'ar' ? 'يرجى إدخال مسار المستودع بالشكل الصحيح (username/repo)' : 'Invalid repository path. Use format: username/repo-name',
        'error'
      );
      return;
    }

    setIsGithubExporting(true);

    try {
      const backupData = generateUnifiedBackupData();
      const contentString = JSON.stringify(backupData, null, 2);
      
      // We must encode the content to UTF-8 Base64.
      // btoa with unescape handles multi-byte (Arabic) characters correctly!
      const contentBase64 = btoa(unescape(encodeURIComponent(contentString)));

      const cleanRepo = githubRepo.trim();
      const cleanBranch = githubBranch.trim() || 'main';
      const cleanPath = githubPath.trim() || 'elkholy_backup.json';

      // 1. Check if the file already exists to get its SHA
      let fileSha: string | null = null;
      try {
        const checkRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/contents/${cleanPath}?ref=${cleanBranch}`,
          {
            headers: {
              'Authorization': `token ${githubToken.trim()}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          fileSha = checkData.sha;
        }
      } catch (err) {
        console.log("File does not exist yet or error getting SHA, proceeding without SHA:", err);
      }

      // 2. Perform the PUT request
      const putBody: any = {
        message: `ElKholy Motors automatic system backup - ${new Date().toISOString()}`,
        content: contentBase64,
        branch: cleanBranch
      };
      if (fileSha) {
        putBody.sha = fileSha;
      }

      const putRes = await fetch(
        `https://api.github.com/repos/${cleanRepo}/contents/${cleanPath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken.trim()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(putBody)
        }
      );

      if (putRes.ok) {
        // Save config in localStorage
        localStorage.setItem('elkholy_github_token', githubToken.trim());
        localStorage.setItem('elkholy_github_repo', cleanRepo);
        localStorage.setItem('elkholy_github_branch', cleanBranch);
        localStorage.setItem('elkholy_github_path', cleanPath);

        fireToast(
          lang === 'ar'
            ? 'تم تصدير النسخة الاحتياطية بنجاح إلى مستودع GitHub! 🚀📂'
            : 'Operational catalog data pushed successfully to GitHub repository! 🚀📂',
          'success'
        );
      } else {
        const errJson = await putRes.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errJson.message || `HTTP ${putRes.status}`);
      }
    } catch (err: any) {
      console.error("GitHub Export Failed:", err);
      fireToast(
        lang === 'ar'
          ? `عذراً، فشل التصدير لـ GitHub: ${err.message || 'تأكد من الرمز وصحة المستودع'}`
          : `GitHub connection termination: ${err.message || 'Invalid PAT/Repo Permissions'}`,
        'error'
      );
    } finally {
      setIsGithubExporting(false);
    }
  };

  const handleImportByUrl = async () => {
    if (!githubImportUrl.trim()) {
      fireToast(
        lang === 'ar' ? 'يرجى إدخال رابط ملف النسخة الاحتياطية المباشر' : 'Please provide a valid direct backup URL',
        'error'
      );
      return;
    }

    if (sessionUser?.role !== 'Admin') {
      fireToast(
        lang === 'ar' ? 'عذراً! الصلاحية غير كافية لعمل استعادة للموقع.' : 'Privilege Breach: Only Master Administrators can restore backup archives',
        'error'
      );
      return;
    }

    setIsGithubImporting(true);

    try {
      // Direct raw link resolver: if github.com is provided but not raw.githubusercontent.com, try to friendly convert it!
      let resolvedUrl = githubImportUrl.trim();
      if (resolvedUrl.includes('github.com') && !resolvedUrl.includes('raw.githubusercontent.com') && resolvedUrl.includes('/blob/')) {
        resolvedUrl = resolvedUrl
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/blob/', '/');
      }

      const res = await fetch(resolvedUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch file (HTTP ${res.status})`);
      }

      const backupData = await res.json();
      const count = applyUnifiedBackupData(backupData);

      if (count > 0) {
        fireToast(
          lang === 'ar'
            ? 'تم جلب واستعادة البيانات من الرابط بنجاح! 🚀🔄'
            : 'Data imported and system modules synchronized from remote URL! 🚀🔄',
          'success'
        );
        setGithubImportUrl('');
      } else {
        throw new Error("No compatible tables restored");
      }
    } catch (err: any) {
      console.error("Remote Import Failed:", err);
      fireToast(
        lang === 'ar'
          ? `عذراً، فشل جلب البيانات: ${err.message || 'تأكد من صلاحية الرابط وملف الـ JSON'}`
          : `Import failed: ${err.message || 'Ensure URL points to a public, valid backup JSON'}`,
        'error'
      );
    } finally {
      setIsGithubImporting(false);
    }
  };

  const handlePushEntireProjectToGitHub = async () => {
    if (!githubToken.trim()) {
      fireToast(
        lang === 'ar' ? 'يرجى إدخال رمز الوصول الشخصي (Token) لحساب GitHub' : 'Please provide a GitHub Personal Access Token',
        'error'
      );
      return;
    }
    if (!githubRepo.trim() || !githubRepo.includes('/')) {
      fireToast(
        lang === 'ar' ? 'يرجى إدخال مسار المستودع بالشكل الصحيح (username/repo)' : 'Invalid repository path. Use format: username/repo-name',
        'error'
      );
      return;
    }

    setIsPushingProject(true);
    setProjectPushStep(lang === 'ar' ? 'البدء وتجهيز الحزم...' : 'Initializing package data...');

    const headers = {
      'Authorization': `token ${githubToken.trim()}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    const cleanRepo = githubRepo.trim();
    const cleanBranch = githubBranch.trim() || 'main';

    // Offline definitions to prevent Vite FS allowlist warning noise on config files
    const staticConfigs: Record<string, string> = {
      'package.json': `{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "firebase": "^12.14.0",
    "jszip": "^3.10.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "qrcode": "^1.5.4",
    "qrcode.react": "^4.2.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^6.2.3",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jszip": "^3.4.0",
    "@types/node": "^22.14.0",
    "@types/qrcode": "^1.5.6",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3"
  }
}`,
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}`,
      'vite.config.ts': `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});`,
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Google AI Studio App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      '.gitignore': `node_modules/
build/
dist/
coverage/
.DS_Store
*.log
.env*
!.env.example`,
      '.env.example': `# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="MY_APP_URL"`
    };

    try {
      // 1. Get reference to target branch
      setProjectPushStep(lang === 'ar' ? 'جاري الاتصال بـ GitHub وجلب آخر التزام...' : 'Connecting to GitHub & fetching target ref...');
      const refRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/ref/heads/${cleanBranch}`, { headers });
      
      let parentCommitSha = '';
      let baseTreeSha = '';
      let hasExistingBranch = refRes.ok;

      if (hasExistingBranch) {
        const refData = await refRes.json();
        parentCommitSha = refData.object.sha;

        // Get commit details to resolve its tree SHA
        const commitRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/commits/${parentCommitSha}`, { headers });
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          baseTreeSha = commitData.tree.sha;
        }
      }

      // 2. Prepare files compilation
      const filesToUpload = [
        'package.json',
        'tsconfig.json',
        'vite.config.ts',
        'index.html',
        '.gitignore',
        '.env.example',
        'src/main.tsx',
        'src/App.tsx',
        'src/index.css',
        'src/types.ts',
        'src/translations.ts',
        'src/data.ts',
        'src/dataStoreMock.ts',
        'src/vite-env.d.ts',
        'src/context/LanguageContext.tsx',
        'src/lib/firebase.ts',
        'src/components/AdminPanel.tsx',
        'src/components/BookingModal.tsx',
        'src/components/CartDrawer.tsx',
        'src/components/ContactFooter.tsx',
        'src/components/FilterSection.tsx',
        'src/components/HomepagePageBuilder.tsx',
        'src/components/MotorcycleCard.tsx',
        'src/components/Navbar.tsx',
        'src/components/PdfModal.tsx',
        'src/components/StoreAdminPanel.tsx',
        'src/components/StoreProductCard.tsx',
        'src/components/StoreView.tsx',
        'firebase-applet-config.json'
      ];

      const binaryImages = [
        'src/assets/images/elkholy_adventure_bike_1780394016498.png',
        'src/assets/images/elkholy_cruiser_bike_1780393998079.png',
        'src/assets/images/elkholy_hero_banner_1780393961041.png',
        'src/assets/images/elkholy_scooter_1780394036022.png',
        'src/assets/images/elkholy_sport_bike_1780393979815.png'
      ];

      const treeItems: any[] = [];

      // A. Load and load text files (with static lookup fallback to prevent Vite serving allowlist warnings)
      for (let i = 0; i < filesToUpload.length; i++) {
        const path = filesToUpload[i];
        setProjectPushStep(
          lang === 'ar' 
            ? `جاري تحضير الملف النصي (${i + 1}/${filesToUpload.length}): ${path}`
            : `Preparing source file (${i + 1}/${filesToUpload.length}): ${path}`
        );
        try {
          let content = '';
          if (staticConfigs[path] !== undefined) {
            content = staticConfigs[path];
          } else {
            const fileRes = await fetch(`/api/raw-file?path=${path}`);
            if (!fileRes.ok) throw new Error(`Could not fetch ${path}`);
            content = await fileRes.text();
          }
          treeItems.push({
            path: path,
            mode: '100644',
            type: 'blob',
            content: content
          });
        } catch (err) {
          console.warn(`File fallback active or failed to load: ${path}`, err);
        }
      }

      // B. Load and upload binary files
      for (let i = 0; i < binaryImages.length; i++) {
        const imgPath = binaryImages[i];
        setProjectPushStep(
          lang === 'ar'
            ? `جاري رفع صورة المعرض الثنائية (${i + 1}/${binaryImages.length}): ${imgPath.split('/').pop()}`
            : `Uploading assets node (${i + 1}/${binaryImages.length}): ${imgPath.split('/').pop()}`
        );
        try {
          const imgRes = await fetch('/' + imgPath);
          if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgPath}`);
          const blob = await imgRes.blob();

          // Read blob as base64
          const sha = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64str = (reader.result as string).split(',')[1];
              try {
                const blobRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/blobs`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    content: base64str,
                    encoding: 'base64'
                  })
                });
                if (!blobRes.ok) {
                  const errorText = await blobRes.text();
                  throw new Error(`Blob creation failed: ${errorText}`);
                }
                const blobData = await blobRes.json();
                resolve(blobData.sha);
              } catch (e) {
                reject(e);
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          treeItems.push({
            path: imgPath,
            mode: '100644',
            type: 'blob',
            sha: sha
          });
        } catch (err) {
          console.warn(`Binary upload failed or skipped for: ${imgPath}`, err);
        }
      }

      // 3. Create Git Tree on GitHub
      setProjectPushStep(lang === 'ar' ? 'جاري بناء خريطة مستودع GitHub...' : 'Deploying new files tree map on GitHub...');
      const treeBody: any = {
        tree: treeItems
      };
      if (baseTreeSha) {
        treeBody.base_tree = baseTreeSha;
      }

      const treePostRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify(treeBody)
      });

      if (!treePostRes.ok) {
        const errJson = await treePostRes.json().catch(() => ({ message: 'Tree creation failed' }));
        throw new Error(errJson.message || 'Failed to craft repository map tree');
      }
      const treePostData = await treePostRes.json();
      const newTreeSha = treePostData.sha;

      // 4. Create Commit on GitHub
      setProjectPushStep(lang === 'ar' ? 'جاري تسجيل التزام الكود (Commit)...' : 'Committing codebase modifications...');
      const commitBody: any = {
        message: `Automatic live backup deploy - Vercel compatible - ${new Date().toLocaleString()}`,
        tree: newTreeSha
      };
      if (parentCommitSha) {
        commitBody.parents = [parentCommitSha];
      }

      const commitPostRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commitBody)
      });

      if (!commitPostRes.ok) {
        const errJson = await commitPostRes.json().catch(() => ({ message: 'Commit creation failed' }));
        throw new Error(errJson.message || 'Failed to create Git commit node');
      }
      const commitPostData = await commitPostRes.json();
      const newCommitSha = commitPostData.sha;

      // 5. Update or Create reference
      setProjectPushStep(lang === 'ar' ? 'جاري تحديث فرع المستودع الرئيسي...' : 'Updating GitHub branch reference HEAD...');
      let refUpdateRes;
      if (hasExistingBranch) {
        refUpdateRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/refs/heads/${cleanBranch}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            sha: newCommitSha,
            force: true
          })
        });
      } else {
        refUpdateRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/refs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ref: `refs/heads/${cleanBranch}`,
            sha: newCommitSha
          })
        });
      }

      if (refUpdateRes.ok) {
        // Save config in localStorage
        localStorage.setItem('elkholy_github_token', githubToken.trim());
        localStorage.setItem('elkholy_github_repo', cleanRepo);
        localStorage.setItem('elkholy_github_branch', cleanBranch);

        fireToast(
          lang === 'ar'
            ? 'تم رفع كامل كود المصدر والمشروع إلى GitHub بنجاح! جاهز للربط في Vercel 🚀💻'
            : 'Fabulous! Entire React project uploaded to GitHub. Ready for instant Vercel link! 🚀💻',
          'success'
        );
      } else {
        const errJson = await refUpdateRes.json().catch(() => ({ message: 'Reference update failed' }));
        throw new Error(errJson.message || 'Failed to update branch reference HEAD');
      }
    } catch (err: any) {
      console.error("Codebase Push Failed:", err);
      fireToast(
        lang === 'ar'
          ? `عذراً، فشل رفع الكود لـ GitHub: ${err.message || 'يرجى مراجعة الرمز وصلاحيات التوكين'}`
          : `Project push ended with error: ${err.message || 'Check PAT permissions / Repository format'}`,
        'error'
      );
    } finally {
      setIsPushingProject(false);
      setProjectPushStep('');
    }
  };

  function scoreRoleLabel(role: UserRole) {
    if (lang === 'ar') {
      if (role === 'Admin') return 'مشرف رئيسي';
      if (role === 'Manager') return 'مدير أسطول';
      return 'فريق عمل منسق';
    }
    return role;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md overflow-hidden admin-panel-root">
      
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
                {canAccess('dashboard') && (
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
                )}

                {/* Tab: Fleet Manager */}
                {canAccess('motorcycles') && (
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
                )}

                {/* Tab: Store Manager */}
                {canAccess('store') && (
                  <button
                    onClick={() => setActiveTab('store')}
                    className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-2 rounded-xl font-mono text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                      activeTab === 'store'
                        ? 'bg-gradient-to-r from-brand-primary/15 to-transparent border border-brand-primary/35 text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.01]'
                    }`}
                  >
                    <Database className="w-4 h-4 text-green-400" />
                    <span>{lang === 'ar' ? 'المتجر الإلكتروني' : 'STORE'}</span>
                  </button>
                )}

                {/* Tab: Sales & Bookings Center */}
                {canAccess('bookings') && (
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-2 rounded-xl font-mono text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                      activeTab === 'bookings'
                        ? 'bg-gradient-to-r from-brand-primary/15 to-transparent border border-brand-primary/35 text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.01]'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-brand-accent" />
                    <span>{lang === 'ar' ? '📋 مركز إدارة المبيعات والحجوزات' : '📋 SALES & BOOKINGS CENTER'}</span>
                  </button>
                )}

                {/* Tab: Operators Node Settings */}
                {canAccess('users') && (
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
                )}

                {/* Tab: Application Customization */}
                {canAccess('settings') && (
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
                )}
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-3.5">
                      {/* Metric A: Val */}
                      <div className="p-4 rounded-xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-brand-accent/20 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'قيمة الأسطول' : 'BRAND ASSETS'}</span>
                          <Coins className="w-4 h-4 text-brand-accent" />
                        </div>
                        <div className="mt-2">
                          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">${fleetValue.toLocaleString()}</span>
                          <span className="block text-[8px] mt-0.5 text-green-400 font-sans tracking-widest leading-none">⚡ MILLION VALUE</span>
                        </div>
                      </div>

                      {/* Metric B: Cycle nodes */}
                      <div className="p-4 rounded-xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-brand-primary/20 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'مركبات المعرض' : 'FLEET MACHINES'}</span>
                          <Database className="w-4 h-4 text-brand-primary" />
                        </div>
                        <div className="mt-2">
                          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">{motorcycles.length}</span>
                          <span className="block text-[8px] mt-0.5 text-brand-accent font-sans tracking-widest leading-none">● ACTIVE BIKES</span>
                        </div>
                      </div>

                      {/* Metric C: Operator Nodes */}
                      <div className="p-4 rounded-xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-brand-secondary/20 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'المشرفون' : 'CURATORS'}</span>
                          <Users className="w-4 h-4 text-brand-secondary" />
                        </div>
                        <div className="mt-2">
                          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">{users.length}</span>
                          <span className="block text-[8px] mt-0.5 text-gray-400 font-sans tracking-widest leading-none">👤 CODES/KEYS</span>
                        </div>
                      </div>

                      {/* Metric D: Bookings Leads */}
                      <div className="p-4 rounded-xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-white/10 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'الحجوزات المعلقة' : 'RESERVATIONS'}</span>
                          <MessageSquare className="w-4 h-4 text-red-500 animate-pulse" />
                        </div>
                        <div className="mt-2">
                          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">{bookings.length}</span>
                          <span className="block text-[8px] mt-0.5 text-red-400 font-mono tracking-widest leading-none">📱 WHATSAPP</span>
                        </div>
                      </div>

                      {/* NEW Metric: Motorcycle Sales Value */}
                      <div className="p-4 rounded-xl bg-[#111827]/60 border border-indigo-500/15 flex flex-col justify-between hover:border-indigo-400/20 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'مبيعات الموتوسيكلات' : 'MOTORS REVENUE'}</span>
                          <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="mt-2">
                          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">{motorsTotalSalesValue.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                          <span className="block text-[8px] mt-0.5 text-indigo-400 font-mono tracking-widest leading-none">🏍️ SALES VALUE</span>
                        </div>
                      </div>

                      {/* NEW Metric: Motorcycles Sold Count */}
                      <div className="p-4 rounded-xl bg-[#111827]/60 border border-indigo-500/15 flex flex-col justify-between hover:border-indigo-400/25 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'الدراجات المباعة' : 'BIKES SOLD'}</span>
                          <CheckCircle2 className="w-4 h-4 text-indigo-300" />
                        </div>
                        <div className="mt-2">
                          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">{motorsTotalSoldCount}</span>
                          <span className="block text-[8px] mt-0.5 text-indigo-300 font-mono tracking-widest leading-none">🏁 SOLD UNITS</span>
                        </div>
                      </div>

                      {/* Metric E: Store Revenue */}
                      <div className="p-4 rounded-xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-emerald-500/20 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'مبيعات المتجر' : 'STORE SALES'}</span>
                          <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="mt-2">
                          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">{storeTotalRevenue.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                          <span className="block text-[8px] mt-0.5 text-emerald-400 font-mono tracking-widest leading-none">🛒 REVENUE</span>
                        </div>
                      </div>

                      {/* Metric F: Items Sold */}
                      <div className="p-4 rounded-xl bg-[#111827]/60 border border-white/[0.04] flex flex-col justify-between hover:border-cyan-500/20 transition-all flex-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{lang === 'ar' ? 'القطع المباعة' : 'ITEMS SOLD'}</span>
                          <Package className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="mt-2">
                          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">{storeTotalItemsSold.toLocaleString()}</span>
                          <span className="block text-[8px] mt-0.5 text-cyan-400 font-mono tracking-widest leading-none">📦 PIECES</span>
                        </div>
                      </div>
                    </div>

                    {/* Visual breakdown grid of both Fleet Vehicles & Store Categories */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Original Category Breakdown & Allocation Visualizer */}
                      <div className="p-4.5 rounded-2xl bg-[#0F1422]/70 border border-indigo-500/10 space-y-3.5 flex flex-col justify-between" dir={dir}>
                        <div>
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-xs font-mono font-bold tracking-wider text-indigo-400">
                              {lang === 'ar' ? 'تحليل مبيعات المركبات عبر الفئات' : 'VEHICLE CLASS SALES DISTRIBUTION'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-indigo-400 font-mono hidden sm:inline">DYNAMIC STATS ENGINE</span>
                              <button
                                type="button"
                                onClick={handleExportVehicleStatsExcel}
                                className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 flex items-center gap-1 transition-all cursor-pointer text-[9px] font-mono font-bold font-sans"                
                              >
                                {lang === 'ar' ? 'إكسل' : 'EXCEL'}
                              </button>
                              <button
                                type="button"
                                onClick={handleExportVehicleStatsWord}
                                className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 flex items-center gap-1 transition-all cursor-pointer text-[9px] font-mono font-bold font-sans"
                              >
                                {lang === 'ar' ? 'وورد' : 'WORD'}
                              </button>
                            </div>
                          </div>

                          {/* Chart */}
                          <div className="h-40 w-full mb-4">
                            <Recharts.ResponsiveContainer>
                              <Recharts.PieChart>
                                <Recharts.Pie
                                  data={vehicleCategoryStats.breakdown}
                                  dataKey="revenue"
                                  nameKey={lang === 'ar' ? 'nameAr' : 'nameEn'}
                                  cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                                >
                                  {vehicleCategoryStats.breakdown.map((_, index) => (
                                    <Recharts.Cell key={`cell-${index}`} fill={['#6366f1', '#a855f7', '#06b6d4', '#10b981'][index % 4]} />
                                  ))}
                                </Recharts.Pie>
                                <Recharts.Tooltip />
                              </Recharts.PieChart>
                            </Recharts.ResponsiveContainer>
                          </div>

                          {/* Product Category Lists Progress Bars */}
                          <div className="space-y-3 mt-3.5">
                            {(['today', 'week', 'month', '3months', 'custom'] as const).map((period) => {
                              let labelAr = '';
                              let labelEn = '';
                              if (period === 'today') { labelAr = 'اليوم'; labelEn = 'Today'; }
                              else if (period === 'week') { labelAr = 'أسبوع'; labelEn = 'Week'; }
                              else if (period === 'month') { labelAr = 'شهر'; labelEn = 'Month'; }
                              else if (period === '3months') { labelAr = '٣ أشهر'; labelEn = '3 Months'; }
                              else if (period === 'custom') { labelAr = 'يدوي 📅'; labelEn = 'Manual 📅'; }
                              
                              const isActive = vehicleFilterPeriod === period;
                              return (
                                <button
                                  key={period}
                                  type="button"
                                  onClick={() => setVehicleFilterPeriod(period)}
                                  className={`px-2.5 py-1 text-[9px] font-bold font-mono rounded transition-all cursor-pointer border ${
                                    isActive
                                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-sm'
                                      : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.02]'
                                  }`}
                                >
                                  {lang === 'ar' ? labelAr : labelEn}
                                </button>
                              );
                            })}
                          </div>

                          {/* Conditional Datepicker inputs if "custom" */}
                          {vehicleFilterPeriod === 'custom' && (
                            <div className="grid grid-cols-2 gap-2 mt-2.5 bg-black/30 p-2 rounded-xl border border-indigo-500/10 text-left">
                              <div className="space-y-1">
                                <span className="block text-[8px] text-gray-400 font-mono">{lang === 'ar' ? 'من تاريخ:' : 'FROM:'}</span>
                                <input
                                  type="datetime-local"
                                  value={vehicleStartDate}
                                  onChange={(e) => setVehicleStartDate(e.target.value)}
                                  className="w-full px-2 py-0.5 bg-[#090D16] text-white border border-white/5 rounded font-mono text-[9px] focus:outline-none focus:ring-1 focus:ring-indigo-500 [&::-webkit-calendar-picker-indicator]:invert"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[8px] text-gray-400 font-mono">{lang === 'ar' ? 'إلى تاريخ:' : 'TO:'}</span>
                                <input
                                  type="datetime-local"
                                  value={vehicleEndDate}
                                  onChange={(e) => setVehicleEndDate(e.target.value)}
                                  className="w-full px-2 py-0.5 bg-[#090D16] text-white border border-white/5 rounded font-mono text-[9px] focus:outline-none focus:ring-1 focus:ring-indigo-500 [&::-webkit-calendar-picker-indicator]:invert"
                                />
                              </div>
                            </div>
                          )}

                          {/* Sales Overview Metrics for current selection */}
                          <div className="grid grid-cols-2 gap-2 mt-3 bg-white/[0.015] border border-white/[0.02] p-2 rounded-xl text-center">
                            <div>
                              <span className="block text-[8px] text-gray-500 font-mono uppercase">{lang === 'ar' ? 'إيرادات الفترة' : 'PERIOD REVENUE'}</span>
                              <span className="text-xs sm:text-sm font-black text-indigo-400 font-mono tracking-tight">
                                {vehicleCategoryStats.totalRevenue.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}
                              </span>
                            </div>
                            <div className="border-l border-white/5 rtl:border-l-0 rtl:border-r">
                              <span className="block text-[8px] text-gray-500 font-mono uppercase">{lang === 'ar' ? 'الوحدات المباعة' : 'UNITS SOLD'}</span>
                              <span className="text-xs sm:text-sm font-black text-white font-mono tracking-tight">
                                {vehicleCategoryStats.totalUnitsSold.toLocaleString()} {lang === 'ar' ? 'قطعة' : 'pcs'}
                              </span>
                            </div>
                          </div>

                          {/* Product Category Lists Progress Bars */}
                          <div className="space-y-3 mt-3.5">
                            {vehicleCategoryStats.breakdown.map((item) => {
                              const percentage = item.revenuePercentage;
                              const title = lang === 'ar' ? item.nameAr : item.nameEn;
                              
                              let progressGradient = 'from-indigo-500 to-indigo-400';
                              if (item.category === 'B') progressGradient = 'from-brand-secondary to-[#A855F7]';
                              if (item.category === 'C') progressGradient = 'from-brand-accent to-[#06B6D4]';
                              if (item.category === 'S') progressGradient = 'from-emerald-500 to-emerald-400';
                              
                              let percentageLabelColor = 'text-indigo-300';
                              if (item.category === 'B') percentageLabelColor = 'text-purple-300';
                              if (item.category === 'C') percentageLabelColor = 'text-cyan-300';
                              if (item.category === 'S') percentageLabelColor = 'text-emerald-300';

                              return (
                                <div key={item.category}>
                                  <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1 leading-none">
                                    <span className="uppercase">{title}</span>
                                    <span className={`font-bold ${percentageLabelColor}`}>
                                      {item.revenue.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'} ({Math.round(percentage)}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }} 
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                      className={`h-full rounded-full bg-gradient-to-r ${progressGradient}`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Store Category Breakdown & Allocation Visualizer */}
                      <div className="p-4.5 rounded-2xl bg-[#0F1422]/70 border border-emerald-500/15 space-y-3.5 flex flex-col justify-between" dir={dir}>
                        <div>
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400">
                              {lang === 'ar' ? 'تحليل مبيعات أقسام المتجر الإلكتروني' : 'STORE CATEGORY SALES DISTRIBUTION'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-emerald-500 font-mono hidden sm:inline">STABLE STATS ENGINE</span>
                              <button
                                type="button"
                                onClick={handleExportStoreStatsExcel}
                                className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 transition-all cursor-pointer text-[9px] font-mono font-bold font-sans"
                              >
                                {lang === 'ar' ? 'إكسل' : 'EXCEL'}
                              </button>
                              <button
                                type="button"
                                onClick={handleExportStoreStatsWord}
                                className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 transition-all cursor-pointer text-[9px] font-mono font-bold font-sans"
                              >
                                {lang === 'ar' ? 'وورد' : 'WORD'}
                              </button>
                            </div>
                          </div>

                          {/* Chart */}
                          <div className="h-40 w-full mb-4">
                            <Recharts.ResponsiveContainer>
                              <Recharts.PieChart>
                                <Recharts.Pie
                                  data={storeCategoryStats.breakdown}
                                  dataKey="revenue"
                                  nameKey={lang === 'ar' ? 'nameAr' : 'nameEn'}
                                  cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                                >
                                  {storeCategoryStats.breakdown.map((_, index) => (
                                    <Recharts.Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#8b5cf6'][index % 5]} />
                                  ))}
                                </Recharts.Pie>
                                <Recharts.Tooltip />
                              </Recharts.PieChart>
                            </Recharts.ResponsiveContainer>
                          </div>

                          {/* Product Category Lists Progress Bars */}
                          <div className="space-y-3 mt-3.5">
                            {(['today', 'week', 'month', '3months', 'custom'] as const).map((period) => {
                              let labelAr = '';
                              let labelEn = '';
                              if (period === 'today') { labelAr = 'اليوم'; labelEn = 'Today'; }
                              else if (period === 'week') { labelAr = 'أسبوع'; labelEn = 'Week'; }
                              else if (period === 'month') { labelAr = 'شهر'; labelEn = 'Month'; }
                              else if (period === '3months') { labelAr = '٣ أشهر'; labelEn = '3 Months'; }
                              else if (period === 'custom') { labelAr = 'يدوي 📅'; labelEn = 'Manual 📅'; }
                              
                              const isActive = storeFilterPeriod === period;
                              return (
                                <button
                                  key={period}
                                  type="button"
                                  onClick={() => setStoreFilterPeriod(period)}
                                  className={`px-2.5 py-1 text-[9px] font-bold font-mono rounded transition-all cursor-pointer border ${
                                    isActive
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                                      : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.02]'
                                  }`}
                                >
                                  {lang === 'ar' ? labelAr : labelEn}
                                </button>
                              );
                            })}
                          </div>

                          {/* Conditional Datepicker inputs if "custom" */}
                          {storeFilterPeriod === 'custom' && (
                            <div className="grid grid-cols-2 gap-2 mt-2.5 bg-black/30 p-2 rounded-xl border border-emerald-500/10 text-left">
                              <div className="space-y-1">
                                <span className="block text-[8px] text-gray-400 font-mono">{lang === 'ar' ? 'من تاريخ:' : 'FROM:'}</span>
                                <input
                                  type="datetime-local"
                                  value={storeStartDate}
                                  onChange={(e) => setStoreStartDate(e.target.value)}
                                  className="w-full px-2 py-0.5 bg-[#090D16] text-white border border-white/5 rounded font-mono text-[9px] focus:outline-none focus:ring-1 focus:ring-emerald-500 [&::-webkit-calendar-picker-indicator]:invert"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[8px] text-gray-400 font-mono">{lang === 'ar' ? 'إلى تاريخ:' : 'TO:'}</span>
                                <input
                                  type="datetime-local"
                                  value={storeEndDate}
                                  onChange={(e) => setStoreEndDate(e.target.value)}
                                  className="w-full px-2 py-0.5 bg-[#090D16] text-white border border-white/5 rounded font-mono text-[9px] focus:outline-none focus:ring-1 focus:ring-emerald-500 [&::-webkit-calendar-picker-indicator]:invert"
                                />
                              </div>
                            </div>
                          )}

                          {/* Sales Overview Metrics for current selection */}
                          <div className="grid grid-cols-2 gap-2 mt-3 bg-white/[0.015] border border-white/[0.02] p-2 rounded-xl text-center">
                            <div>
                              <span className="block text-[8px] text-gray-500 font-mono uppercase">{lang === 'ar' ? 'إيرادات الفترة' : 'PERIOD REVENUE'}</span>
                              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono tracking-tight">
                                {storeCategoryStats.totalRevenue.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}
                              </span>
                            </div>
                            <div className="border-l border-white/5 rtl:border-l-0 rtl:border-r">
                              <span className="block text-[8px] text-gray-500 font-mono uppercase">{lang === 'ar' ? 'الوحدات المباعة' : 'UNITS SOLD'}</span>
                              <span className="text-xs sm:text-sm font-black text-white font-mono tracking-tight">
                                {storeCategoryStats.totalUnitsSold.toLocaleString()} {lang === 'ar' ? 'قطعة' : 'pcs'}
                              </span>
                            </div>
                          </div>

                          {/* Product Category Lists Progress Bars */}
                          <div className="space-y-3 mt-3.5">
                            {storeCategoryStats.breakdown.map((item) => {
                              const percentage = item.revenuePercentage;
                              const title = lang === 'ar' ? item.nameAr : item.nameEn;
                              
                              return (
                                <div key={item.category}>
                                  <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1 leading-none">
                                    <span className="uppercase">{title}</span>
                                    <span className="font-bold text-emerald-300">
                                      {item.revenue.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'} ({Math.round(percentage)}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }} 
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                    />
                                  </div>
                                </div>
                              );
                            })}
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
                          <div className="flex gap-2">
                             <button
                                onClick={handleExportBookingsExcel}
                                className="px-2 py-1 bg-indigo-600/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded border border-indigo-500/20 transition-all font-mono text-[9px] cursor-pointer"
                              >
                                {lang === 'ar' ? 'تصدير إكسل' : 'EXPORT EXCEL'}
                              </button>
                             <button
                                onClick={handleExportBookingsWord}
                                className="px-2 py-1 bg-indigo-600/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded border border-indigo-500/20 transition-all font-mono text-[9px] cursor-pointer"
                              >
                                {lang === 'ar' ? 'تصدير وورد' : 'EXPORT WORD'}
                              </button>
                             <button
                                onClick={handleClearBookings}
                                className="px-2 py-1 bg-red-600/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-500/20 transition-all font-mono text-[9px] cursor-pointer"
                              >
                                {lang === 'ar' ? 'تفريغ السجل' : 'PURGE LEADS'}
                              </button>
                          </div>
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
                                <th className="pb-2 text-right">{lang === 'ar' ? 'المبيعات / الحالة' : 'STATUS / SALE'}</th>
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
                                  <td className="py-2.5 text-right font-sans">
                                    <div className="flex items-center justify-end gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                                        (b.status || 'sold') === 'sold'
                                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                      }`}>
                                        {(b.status || 'sold') === 'sold'
                                          ? (lang === 'ar' ? 'تم البيع' : 'SOLD')
                                          : (lang === 'ar' ? 'انتظار' : 'PENDING')
                                        }
                                      </span>
                                      <button 
                                        onClick={() => handleToggleBookingStatus(b.id, b.status || 'sold')}
                                        className="px-1.5 py-0.5 rounded bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/20 transition-all text-[8px] font-bold cursor-pointer font-mono"
                                      >
                                        {lang === 'ar' ? 'تعديل' : 'TOGGLE'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Excel Export Controller Panel */}
                    <div className="p-4.5 rounded-2xl bg-[#090D16] border border-green-500/10 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400">
                            <Download className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold font-sans tracking-wide text-white">
                              {lang === 'ar' ? 'مستخرج التقارير المحاسبية (Excel)' : 'COMPREHENSIVE EXCEL EXPORT TERMINAL'}
                            </h4>
                            <p className="text-[10px] text-gray-500 leading-normal font-mono normal-case">
                              {lang === 'ar' ? 'تصدير كامل تفاصيل مبيعات المتجر والحجوزات والمبالغ.' : 'Compile, filter, and stream ledger accounts for all products and heavy showroom vehicles.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                        {/* Duration Selector Dropdown */}
                        <div className="space-y-1.5 text-left" dir={dir}>
                          <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                            {lang === 'ar' ? 'نطاق استخراج البيانات:' : 'SELECT EXPORT PERIOD:'}
                          </label>
                          <select
                            value={exportRangeType}
                            onChange={(e: any) => setExportRangeType(e.target.value)}
                            className="w-full px-3.5 py-2 sm:py-2.5 bg-[#0B0F19] text-white border border-white/5 hover:border-white/10 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-green-500 tracking-wide cursor-pointer"
                          >
                            <option value="today">{lang === 'ar' ? 'بيانات اليوم' : 'Today (Real-time)'}</option>
                            <option value="week">{lang === 'ar' ? 'آخر أسبوع' : 'Last Week'}</option>
                            <option value="month">{lang === 'ar' ? 'آخر شهر' : 'Last Month'}</option>
                            <option value="3months">{lang === 'ar' ? 'آخر ٣ أشهر' : 'Last 3 Months'}</option>
                            <option value="6months">{lang === 'ar' ? 'آخر ٦ أشهر' : 'Last 6 Months'}</option>
                            <option value="year">{lang === 'ar' ? 'آخر سنة كاملة' : 'Last 12 Months'}</option>
                            <option value="custom">{lang === 'ar' ? 'تحديد فترة زمينة مخصصة' : 'Custom Date Range'}</option>
                          </select>
                        </div>

                        {/* Custom Range select inputs */}
                        {exportRangeType === 'custom' && (
                          <>
                            <div className="space-y-1.5 text-left" dir={dir}>
                              <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                <span>{lang === 'ar' ? 'من تاريخ:' : 'START DATE/TIME:'}</span>
                              </label>
                              <div className="relative">
                                <input 
                                  type="datetime-local"
                                  value={exportStartDate}
                                  onChange={(e) => setExportStartDate(e.target.value)}
                                  className="w-full pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-2 sm:py-2.5 bg-[#0B0F19] text-white border border-blue-500/25 hover:border-blue-500/40 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:invert-[44%] [&::-webkit-calendar-picker-indicator]:sepia-[95%] [&::-webkit-calendar-picker-indicator]:saturate-[1800%] [&::-webkit-calendar-picker-indicator]:hue-rotate-[195deg]"
                                />
                                <Calendar className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                              </div>
                            </div>

                            <div className="space-y-1.5 text-left" dir={dir}>
                              <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                <span>{lang === 'ar' ? 'إلى تاريخ:' : 'END DATE/TIME:'}</span>
                              </label>
                              <div className="relative">
                                <input 
                                  type="datetime-local"
                                  value={exportEndDate}
                                  onChange={(e) => setExportEndDate(e.target.value)}
                                  className="w-full pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-2 sm:py-2.5 bg-[#0B0F19] text-white border border-blue-500/25 hover:border-blue-500/40 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:invert-[44%] [&::-webkit-calendar-picker-indicator]:sepia-[95%] [&::-webkit-calendar-picker-indicator]:saturate-[1800%] [&::-webkit-calendar-picker-indicator]:hue-rotate-[195deg]"
                                />
                                <Calendar className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Submitting trigger button */}
                        <div className={`sm:col-span-1 ${exportRangeType !== 'custom' ? 'lg:col-span-3' : ''}`}>
                          <button
                            onClick={handleExportExcel}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500/85 to-emerald-600/95 hover:from-green-500 hover:to-emerald-600 text-white font-mono font-bold text-[10.5px] uppercase tracking-widest rounded-xl cursor-pointer transition-all border border-green-500/20 active:scale-98 shadow-md hover:shadow-green-500/10"
                          >
                            <FileText className="w-4 h-4 text-emerald-100" />
                            <span>{lang === 'ar' ? 'تحميل البيانات بصيغة اكسل 📊' : 'Compile & Export Spreadsheet 📊'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================== TAB: BUSINESS SALES & RESERVATIONS OPERATIONS ================================== */}
                {activeTab === 'bookings' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="border-[#6366F1]/15 border-b pb-3">
                      <h3 className="text-base font-bold tracking-widest font-mono text-brand-accent">
                        {lang === 'ar' ? '📋 مركز إدارة المبيعات والحجوزات والعمليات' : '📋 SALES & BOOKINGS OPERATIONS'}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-sans mt-1">
                        {lang === 'ar' 
                          ? 'إدارة الحجوزات، تغيير حالة المبيعات، ومراقبة اتصالات العملاء المباشرة مع مستخرج التقارير المحاسبية المبرمج بصيغة Excel.' 
                          : 'Administer showroom leads, update transaction status, access CSV/Excel exports, and review client communication nodes.'}
                      </p>
                    </div>

                    {/* Operational Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="block text-[10px] text-gray-400 font-mono tracking-wider">{lang === 'ar' ? 'إجمالي الحجوزات' : 'TOTAL RESERVATIONS'}</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black font-sans text-white">{bookings.length}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{lang === 'ar' ? 'عملية مسجلة' : 'records spooled'}</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="block text-[10px] text-green-400 font-mono tracking-wider">{lang === 'ar' ? 'الماكينات المباعة' : 'VEHICLES SOLD'}</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black font-sans text-green-400">
                            {bookings.filter(b => (b.status || 'sold') === 'sold').length}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">{(bookings.filter(b => (b.status || 'sold') === 'sold').length / (bookings.length || 1) * 100).toFixed(0)}% {lang === 'ar' ? 'معدل إغلاق' : 'conversion'}</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="block text-[10px] text-yellow-500 font-mono tracking-wider">{lang === 'ar' ? 'حجوزات قيد الانتظار' : 'PENDING LEADS'}</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black font-sans text-yellow-500">
                            {bookings.filter(b => b.status === 'pending').length}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">{lang === 'ar' ? 'في انتظار المتابعة' : 'pending sales contact'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Upgrade: Advanced Operations Management & Search Center */}
                    <div className="p-4.5 rounded-2xl bg-[#0B0F1A]/85 border border-[#6366F1]/15 space-y-4">
                      
                      {/* Search Bar & Direct Filters Grid */}
                      <div className="flex flex-col gap-3.5 border-b border-white/5 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4.5 h-4.5 text-indigo-400 shrink-0 animate-pulse" />
                            <span className="text-xs font-mono font-bold tracking-wider">{lang === 'ar' ? 'طابور رصد اتصالات الحجز والعمليات المتقدمة' : 'ACTIVE OPERATIONS QUEUE & LEDGER'}</span>
                          </div>
                          
                          {sessionUser.role === 'Admin' && bookings.length > 0 && (
                            <div className="flex gap-2">
                              <button
                                onClick={handleExportBookingsExcel}
                                className="px-2 py-1 bg-indigo-600/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded border border-indigo-500/20 transition-all font-mono text-[9px] cursor-pointer"
                              >
                                {lang === 'ar' ? 'تصدير إكسل' : 'EXPORT EXCEL'}
                              </button>
                              <button
                                onClick={handleExportBookingsWord}
                                className="px-2 py-1 bg-indigo-600/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded border border-indigo-500/20 transition-all font-mono text-[9px] cursor-pointer"
                              >
                                {lang === 'ar' ? 'تصدير وورد' : 'EXPORT WORD'}
                              </button>
                              <button
                                onClick={handleClearBookings}
                                className="px-2 py-1 bg-red-600/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-500/20 transition-all font-mono text-[9px] cursor-pointer"
                              >
                                {lang === 'ar' ? 'تفريغ السجل' : 'PURGE LEADS'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* ADVANCED SEARCH ENGINE (Operation ID, Customer details, Product code) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
                          <div className="lg:col-span-5 relative">
                            <input 
                              type="text"
                              placeholder={lang === 'ar' ? 'البحث بكود العملية، الهاتف، العميل، الهيكل...' : 'Search ID, customer, phone, serial, product...'}
                              value={opsSearchQuery}
                              onChange={(e) => setOpsSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 bg-[#060913] text-white border border-[#312E81]/45 focus:border-[#6366F1]/70 rounded-xl text-xs font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/35 transition-all text-right"
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
                            {opsSearchQuery && (
                              <button 
                                onClick={() => setOpsSearchQuery('')}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          
                          {/* Live Status Filters Pills */}
                          <div className="lg:col-span-7 flex flex-wrap gap-1.5 items-center justify-start lg:justify-end">
                            {[
                              { id: 'ALL', labelAr: 'الكل', labelEn: 'All', color: 'border-white/5 text-gray-400 bg-white/[0.01]', count: bookings.length },
                              { id: 'new', labelAr: 'جديد 🆕', labelEn: 'New', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5', count: bookings.filter(b => !b.status || b.status === 'new').length },
                              { id: 'pending', labelAr: 'متابعة ⏳', labelEn: 'Pending', color: 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5', count: bookings.filter(b => b.status === 'pending' || b.status === 'pending_review' || b.status === 'contacted').length },
                              { id: 'reserved', labelAr: 'محجوز 🔒', labelEn: 'Reserved', color: 'border-amber-500/20 text-amber-500 bg-amber-500/5', count: bookings.filter(b => b.status === 'reserved').length },
                              { id: 'confirmed', labelAr: 'مؤكد 🛒', labelEn: 'Confirmed', color: 'border-purple-500/20 text-purple-400 bg-purple-500/5', count: bookings.filter(b => b.status === 'confirmed').length },
                              { id: 'sold', labelAr: 'مباع 🟢', labelEn: 'Sold', color: 'border-green-500/20 text-green-400 bg-green-500/5', count: bookings.filter(b => b.status === 'sold').length },
                              { id: 'cancelled', labelAr: 'ملغي ❌', labelEn: 'Cancelled', color: 'border-red-500/20 text-red-500 bg-red-500/5', count: bookings.filter(b => b.status === 'cancelled').length }
                            ].map(pill => (
                              <button
                                key={pill.id}
                                onClick={() => setOpsStatusFilter(pill.id as any)}
                                className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                                  opsStatusFilter === pill.id 
                                    ? 'border-indigo-600 bg-indigo-600/10 text-white shadow-lg' 
                                    : pill.color + ' hover:border-indigo-500/40 hover:text-white'
                                }`}
                              >
                                <span>{lang === 'ar' ? pill.labelAr : pill.labelEn}</span>
                                <span className="px-1 py-0.2 rounded-md bg-white/[0.05] text-[8.5px] font-bold text-gray-500">{pill.count}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Matching Results Operations Queue */}
                      {filteredBookings.length === 0 ? (
                        <div className="text-center py-10 text-gray-600 font-mono text-[10px] space-y-1.5 select-none text-transform: lowercase">
                          <MessageSquare className="w-8 h-8 text-gray-700 mx-auto opacity-35" />
                          <p className="tracking-widest uppercase text-gray-500">{lang === 'ar' ? 'لا توجد نتائج مطابقة لفلترة البحث الحالية' : 'NO MATCHING OPERATIONS FOUND'}</p>
                          <p className="text-[9px] text-gray-400 normal-case font-sans">Modify your query keyword or reset filters to explore active sales leads.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-[450px] scrollbar-thin">
                          <table className="w-full text-right border-collapse font-mono text-[10px] sm:text-[11px]" dir={dir}>
                            <thead>
                              <tr className="border-b border-white/5 text-gray-500 text-[9px] tracking-widest">
                                <th className="pb-2 text-right">{lang === 'ar' ? 'الرمز / العملية' : 'OPERATION INDEX'}</th>
                                <th className="pb-2 text-right">{lang === 'ar' ? 'العميل' : 'CLIENT MODULE'}</th>
                                <th className="pb-2 text-right">{lang === 'ar' ? 'المنتجات / الماكينات والمقترنات' : 'SPECIFICATION'}</th>
                                <th className="pb-2 text-right">{lang === 'ar' ? 'الهاتف' : 'PHONE NODE'}</th>
                                <th className="pb-2 text-right">{lang === 'ar' ? 'تاريخ الحجز' : 'TRANSACT DATE'}</th>
                                <th className="pb-2 text-left">{lang === 'ar' ? 'التحكم بالعملية' : 'STATUS & CONTROL'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredBookings.map((b) => {
                                const standardizedStatus = b.status || 'new';
                                return (
                                  <tr key={b.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] text-gray-300">
                                    <td className="py-2 text-right font-mono">
                                      <span className="text-gray-500">#</span>{b.id.slice(-6).toUpperCase()}
                                      <span className="block text-[8px] font-bold text-brand-accent uppercase">{b.invoiceNumber || `INV-${b.id.slice(-6).toUpperCase()}`}</span>
                                    </td>
                                    <td className="py-2 text-right font-sans font-bold text-white transition-colors">
                                      {b.name}
                                      <span className="block text-[8.5px] font-mono text-gray-500 font-normal lowercase">{b.email || 'customer@elkholy.com'}</span>
                                    </td>
                                    <td className="py-2 text-right text-indigo-400 font-sans">
                                      {b.motorcycleName || b.bikeName || (lang === 'ar' ? 'طلب متجر' : 'Store Combined Order')}
                                      {b.orderedProducts && b.orderedProducts.length > 0 && (
                                        <span className="block text-[8px] font-mono text-[#22D3EE] font-bold">{lang === 'ar' ? `+ ${b.orderedProducts.length} إضافات/منتجات` : `+ ${b.orderedProducts.length} accessories`}</span>
                                      )}
                                    </td>
                                    <td className="py-2 text-right font-bold text-brand-accent">
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
                                    <td className="py-2 text-right font-sans text-gray-400">{b.date} <span className="text-[9px] text-gray-600 font-mono block">{b.orderTime || '09:00'}</span></td>
                                    <td className="py-2 text-left font-sans">
                                      <div className="flex items-center justify-start gap-2">
                                        <div className="flex gap-1.5 items-center">
                                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                            standardizedStatus === 'sold'
                                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                              : standardizedStatus === 'reserved'
                                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                : standardizedStatus === 'cancelled'
                                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                          }`}>
                                            {standardizedStatus === 'sold' ? (lang === 'ar' ? 'مباع' : 'SOLD') :
                                             standardizedStatus === 'reserved' ? (lang === 'ar' ? 'محجوز' : 'RESERVED') :
                                             standardizedStatus === 'cancelled' ? (lang === 'ar' ? 'ملغي' : 'CANCELLED') :
                                             standardizedStatus === 'delivered' ? (lang === 'ar' ? 'مستلم' : 'DELIVERED') :
                                             (lang === 'ar' ? 'حالة جديدة' : 'NEW')}
                                          </span>
                                          
                                          {/* Direct details triggers */}
                                          <button 
                                            onClick={() => handleOpenOperationDetails(b)}
                                            className="px-2.5 py-1 rounded bg-[#6366F1]/15 hover:bg-[#6366F1] text-[#6366F1] hover:text-white border border-[#6366F1]/30 transition-all text-[8.5px] font-bold cursor-pointer font-mono"
                                          >
                                            {lang === 'ar' ? '⚙️ تفاصيل ومعالجة' : '⚙️ PROCESS'}
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Excel Export Controller Panel */}
                    <div className="p-4.5 rounded-2xl bg-[#090D16] border border-green-500/10 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400">
                            <Download className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold font-sans tracking-wide text-white">
                              {lang === 'ar' ? 'مستخرج التقارير المحاسبية (Excel)' : 'COMPREHENSIVE EXCEL EXPORT TERMINAL'}
                            </h4>
                            <p className="text-[10px] text-gray-500 leading-normal font-mono normal-case">
                              {lang === 'ar' ? 'تصدير كامل تفاصيل مبيعات المتجر والحجوزات والمبالغ.' : 'Compile, filter, and stream ledger accounts for all products and heavy showroom vehicles.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                        {/* Duration Selector Dropdown */}
                        <div className="space-y-1.5 text-left" dir={dir}>
                          <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                            {lang === 'ar' ? 'نطاق استخراج البيانات:' : 'SELECT EXPORT PERIOD:'}
                          </label>
                          <select
                            value={exportRangeType}
                            onChange={(e: any) => setExportRangeType(e.target.value)}
                            className="w-full px-3.5 py-2 sm:py-2.5 bg-[#0B0F19] text-white border border-white/5 hover:border-white/10 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-green-500 tracking-wide cursor-pointer"
                          >
                            <option value="today">{lang === 'ar' ? 'بيانات اليوم' : 'Today (Real-time)'}</option>
                            <option value="week">{lang === 'ar' ? 'آخر أسبوع' : 'Last Week'}</option>
                            <option value="month">{lang === 'ar' ? 'آخر شهر' : 'Last Month'}</option>
                            <option value="3months">{lang === 'ar' ? 'آخر ٣ أشهر' : 'Last 3 Months'}</option>
                            <option value="6months">{lang === 'ar' ? 'آخر ٦ أشهر' : 'Last 6 Months'}</option>
                            <option value="year">{lang === 'ar' ? 'آخر سنة كاملة' : 'Last 12 Months'}</option>
                            <option value="custom">{lang === 'ar' ? 'تحديد فترة زمينة مخصصة' : 'Custom Date Range'}</option>
                          </select>
                        </div>

                        {/* Custom Range select inputs */}
                        {exportRangeType === 'custom' && (
                          <>
                            <div className="space-y-1.5 text-left" dir={dir}>
                              <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                <span>{lang === 'ar' ? 'من تاريخ:' : 'START DATE/TIME:'}</span>
                              </label>
                              <div className="relative">
                                <input 
                                  type="datetime-local"
                                  value={exportStartDate}
                                  onChange={(e) => setExportStartDate(e.target.value)}
                                  className="w-full pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-2 sm:py-2.5 bg-[#0B0F19] text-white border border-blue-500/25 hover:border-blue-500/40 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:invert-[44%] [&::-webkit-calendar-picker-indicator]:sepia-[95%] [&::-webkit-calendar-picker-indicator]:saturate-[1800%] [&::-webkit-calendar-picker-indicator]:hue-rotate-[195deg]"
                                />
                                <Calendar className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                              </div>
                            </div>

                            <div className="space-y-1.5 text-left" dir={dir}>
                              <label className="block text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                <span>{lang === 'ar' ? 'إلى تاريخ:' : 'END DATE/TIME:'}</span>
                              </label>
                              <div className="relative">
                                <input 
                                  type="datetime-local"
                                  value={exportEndDate}
                                  onChange={(e) => setExportEndDate(e.target.value)}
                                  className="w-full pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-2 sm:py-2.5 bg-[#0B0F19] text-white border border-blue-500/25 hover:border-blue-500/40 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:invert-[44%] [&::-webkit-calendar-picker-indicator]:sepia-[95%] [&::-webkit-calendar-picker-indicator]:saturate-[1800%] [&::-webkit-calendar-picker-indicator]:hue-rotate-[195deg]"
                                />
                                <Calendar className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Submitting trigger button */}
                        <div className={`sm:col-span-1 ${exportRangeType !== 'custom' ? 'lg:col-span-3' : ''}`}>
                          <button
                            onClick={handleExportExcel}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500/85 to-emerald-600/95 hover:from-green-500 hover:to-emerald-600 text-white font-mono font-bold text-[10.5px] uppercase tracking-widest rounded-xl cursor-pointer transition-all border border-green-500/20 active:scale-98 shadow-md hover:shadow-green-500/10"
                          >
                            <FileText className="w-4 h-4 text-emerald-100" />
                            <span>{lang === 'ar' ? 'تحميل البيانات بصيغة اكسل 📊' : 'Compile & Export Spreadsheet 📊'}</span>
                          </button>
                        </div>
                      </div>
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

                        {/* Filters and Search Bar Row */}
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-[#0E1322]/80 p-3 rounded-2xl border border-white/[0.04]">
                          {/* Interactive Category Filter Tabs */}
                          <div className="flex border border-white/5 bg-black/40 p-1 rounded-xl w-fit max-w-full overflow-x-auto gap-1 select-none font-mono text-[10px]">
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
                                  className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
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

                          {/* Beautiful Interactive Search input */}
                          <div className="relative flex-1 md:max-w-xs xl:max-w-md">
                            <input
                              type="text"
                              value={bikeSearchTerm}
                              onChange={(e) => setBikeSearchTerm(e.target.value)}
                              placeholder={lang === 'ar' ? 'البحث بالاسم أو كود الموتوسيكل...' : 'Search by name or bike code...'}
                              className="w-full bg-[#070A11] border border-white/10 rounded-xl pl-9 pr-8 rtl:pr-9 rtl:pl-8 py-2 text-xs text-white focus:border-brand-accent outline-none placeholder:text-gray-500 transition-all font-mono"
                            />
                            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            {bikeSearchTerm && (
                              <button
                                onClick={() => setBikeSearchTerm('')}
                                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-[10px] cursor-pointer font-bold font-mono transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
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

                              <div className="flex flex-col gap-1.5 shrink-0 select-none items-center">
                                <div 
                                  onClick={() => handleDownloadAndCopyQRCode(bike)}
                                  className="bg-white p-1 rounded-md mb-1 cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-md shadow-black/45"
                                  title={lang === 'ar' ? 'انقر لنسخ الكود وتحميل الرمز' : 'Click to copy code & download QR'}
                                >
                                    <QRCodeSVG id={`qr-${bike.id}`} value={bike.serialCode || bike.id} size={40} />
                                </div>
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
                            className={`pb-1.5 px-1.5 border-b-2 font-bold uppercase transition-all tracking-wider cursor-pointer whitespace-nowrap ${
                              formSubTab === 'addons'
                                ? 'border-brand-accent text-brand-accent'
                                : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                          >
                            🛠️ {lang === 'ar' ? 'الإضافات' : 'Add-ons'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormSubTab('related')}
                            className={`pb-1.5 px-1.5 border-b-2 font-bold uppercase transition-all tracking-wider cursor-pointer whitespace-nowrap ${
                              formSubTab === 'related'
                                ? 'border-brand-accent text-brand-accent'
                                : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                          >
                            🔗 {lang === 'ar' ? 'منتجات المتجر' : 'Store Related'}
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
                                <label className="text-gray-400 text-[10px] tracking-wider">{lang === 'ar' ? 'السيريال/الكود المميز' : 'UNIQUE SERIAL/CODE'}:</label>
                                <input
                                  type="text"
                                  required
                                  value={bikeForm.serialCode}
                                  onChange={(e) => setBikeForm({ ...bikeForm, serialCode: e.target.value })}
                                  className="w-full bg-[#111827]/75 border border-white/[0.08] focus:border-brand-accent text-white rounded-xl px-4 py-2.5 focus:outline-none"
                                />
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

                          {/* TAB E: RELATED STORE PRODUCTS */}
                          {formSubTab === 'related' && (
                            <div className="space-y-4 text-left font-mono animate-fade-in" dir={dir}>
                              <div className="p-4 bg-black/50 border border-white/[0.04] rounded-2xl space-y-4">
                                <h4 className="text-[10px] font-black text-brand-secondary tracking-widest uppercase mb-2">
                                  {lang === 'ar' ? 'حدد المنتجات ذات الصلة بالموديل' : 'Attach Related Store Products'}
                                </h4>
                                
                                <div className="flex gap-2 mb-4">
                                  <input
                                    type="text"
                                    placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
                                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                  />
                                  <select
                                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-xs"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value as StoreCategory | 'ALL')}
                                  >
                                    <option value="ALL">{lang === 'ar' ? 'الكل' : 'All'}</option>
                                    {['Oils', 'Safety', 'Smart', 'Parts', 'Lifestyle'].map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                  {storeProducts?.filter(product =>
                                    (selectedCategory === 'ALL' || product.category === selectedCategory) &&
                                    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.nameAr.includes(searchTerm) || product.id.toLowerCase().includes(searchTerm.toLowerCase()))
                                  ).map((product) => {
                                    const isSelected = (bikeForm.relatedProductIds || []).includes(product.id);
                                    return (
                                      <div key={product.id} className="flex items-center gap-3 p-2 border border-white/5 bg-white/5 rounded-xl">
                                        <input 
                                          type="checkbox" 
                                          className="cursor-pointer text-brand-primary bg-black border-white/20 rounded"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const current = bikeForm.relatedProductIds || [];
                                            let newRelated = current;
                                            let newAddOns = [...(bikeForm.addOns || [])];
                                            
                                            if (e.target.checked) {
                                              newRelated = [...current, product.id];
                                              const newAddon: AddOn = {
                                                id: `addon-${product.id}`,
                                                name: product.name,
                                                nameAr: product.nameAr,
                                                price: parseInt(String(product.price).replace(/[^0-9]/g, ''), 10) || 0,
                                                image: product.image,
                                                description: product.description || '',
                                                descAr: product.descriptionAr || ''
                                              };
                                              newAddOns.push(newAddon);
                                            } else {
                                              newRelated = current.filter(id => id !== product.id);
                                              newAddOns = newAddOns.filter(a => a.id !== `addon-${product.id}`);
                                            }
                                            setBikeForm({ ...bikeForm, relatedProductIds: newRelated, addOns: newAddOns });
                                          }}
                                        />
                                        <img src={product.image} className="w-8 h-8 rounded bg-black/50 object-contain p-1" />
                                        <div className="flex-1 min-w-0 pr-2">
                                           <div className="text-xs font-bold text-white truncate">{lang === 'ar' ? product.nameAr : product.name}</div>
                                           <div className="text-[9px] text-gray-400 font-mono tracking-widest">{product.id} • {product.price} EGP</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {(!storeProducts || storeProducts.length === 0) && (
                                    <div className="text-xs text-gray-500 italic p-4 text-center">No products in store to link.</div>
                                  )}
                                </div>
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

                {/* ================================== TAB: STORE MANAGEMENT ================================== */}
                {activeTab === 'store' && (
                  <div className="animate-fade-in text-left min-h-[600px]">
                     <StoreAdminPanel 
                       storeProducts={storeProducts} 
                       onUpdateStoreProducts={onUpdateStoreProducts!} 
                     />
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
                                <option value="Admin">{lang === 'ar' ? 'مشرف رئيسي (Admin)' : 'CORE ADMIN (Full Writes + Users)'}</option>
                                <option value="Manager">{lang === 'ar' ? 'مدير أسطول (Manager)' : 'MANAGER NODE (Add & Edit Fleet only)'}</option>
                                <option value="Staff">{lang === 'ar' ? 'فريق عمل/مشغل (Staff Operator)' : 'Staff Operator (Only Add Motorcycles)'}</option>
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
                  <div className="p-1 animate-fade-in text-left space-y-6">
                    <HomepagePageBuilder
                      homepageConfig={homepageConfig}
                      onUpdateHomepageConfig={onUpdateHomepageConfig || (() => {})}
                      lang={lang}
                      dir={dir}
                      customText={customText}
                      onUpdateCustomText={onUpdateCustomText}
                      fireToast={(msg, type) => fireToast(msg, type)}
                    />

                    {/* System Backup and Restore Panel */}
                    <div className="p-4.5 rounded-2xl bg-[#090D16] border border-blue-500/10 space-y-2 mt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 font-bold shrink-0">
                            <Database className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold font-sans tracking-wide text-white">
                              {lang === 'ar' ? 'مركز إدارة النسخ الاحتياطي (ZIP)' : 'ZIP ARCHIVE BACKUP & RESTORE CONSOLE'}
                            </h4>
                            <p className="text-[10px] text-gray-400 leading-normal font-mono normal-case">
                              {lang === 'ar' 
                                ? 'تحميل كامل قاعدة بيانات وملفات وعناصر الموقع كملف مضغوط وتنزيله لحمايته قبل القيام بأي تعديلات.' 
                                : 'Compile, archive, and download entire system databases and templates as a ZIP file to local storage.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        {/* Download backup file button */}
                        <div className="p-3.5 bg-[#0B0F1A] border border-white/[0.03] hover:border-blue-500/20 rounded-xl transition-all space-y-3 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest block mb-1">
                              {lang === 'ar' ? 'تنزيل نسخة احتياطية' : 'GENERATE BACKUP'}
                            </span>
                            <p className="text-[10.5px] text-gray-500 leading-relaxed font-sans">
                              {lang === 'ar'
                                ? 'يقوم هذا الخيار بضغط وحفظ جميع منتجات المتجر، الدراجات، إعدادات المعاينة، الترجمات، والحجوزات الحالية في ملف ZIP مشفر وآمن.'
                                : 'Package all active fleet cycles, shop products, visual custom texts, and user accounts inside a secured ZIP backup archive.'}
                            </p>
                          </div>
                          <button
                            onClick={handleDownloadBackup}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500/85 to-indigo-600/95 hover:from-blue-500 hover:to-indigo-600 text-white font-mono font-bold text-[10.5px] uppercase tracking-widest rounded-xl cursor-pointer transition-all border border-blue-500/20 active:scale-98 shadow-md hover:shadow-blue-500/10"
                          >
                            <Download className="w-4 h-4 text-blue-100" />
                            <span>{lang === 'ar' ? 'تحميل النسخة الاحتياطية (ZIP) 📦' : 'Generate & Download ZIP 📦'}</span>
                          </button>
                        </div>

                        {/* Upload / Restore backup file button */}
                        <div className="p-3.5 bg-[#0B0F1A] border border-white/[0.03] hover:border-blue-500/20 rounded-xl transition-all space-y-3 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest block mb-1">
                              {lang === 'ar' ? 'استعادة نسخة سابقة' : 'RESTORE BACKUP'}
                            </span>
                            <p className="text-[10.5px] text-gray-500 leading-relaxed font-sans">
                              {lang === 'ar'
                                ? 'قم برفع ملف الـ ZIP المضغوط الذي قمت بتنزيله مسبقاً لاسترجاع كامل بيانات الموقع السابقة بلمسة واحدة.'
                                : 'Upload a previously generated system ZIP backup file. Restores and overwrites state variables immediately.'}
                            </p>
                          </div>
                          
                          <div className="relative">
                            <input
                              type="file"
                              accept=".zip"
                              onChange={handleRestoreBackup}
                              id="restore-zip-setting-input"
                              className="hidden"
                              disabled={sessionUser?.role !== 'Admin'}
                            />
                            <label
                              htmlFor="restore-zip-setting-input"
                              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono font-bold text-[10.5px] uppercase tracking-widest transition-all border shadow-md ${
                                sessionUser?.role === 'Admin'
                                  ? 'bg-[#0B0F19] hover:bg-indigo-950/15 border-indigo-500/40 hover:border-indigo-500 text-indigo-300 cursor-pointer'
                                  : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <Upload className="w-4 h-4 text-indigo-400" />
                              <span>{lang === 'ar' ? 'رفع واستعادة ملف احتياطي 🔄' : 'Upload & Restore ZIP 🔄'}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GitHub Integration Panel */}
                    <div className="p-4.5 rounded-2xl bg-[#090D16] border border-white/5 space-y-4 mt-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white/5 rounded-lg text-white shrink-0">
                            <Github className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold font-sans tracking-wide text-white uppercase">
                              {lang === 'ar' ? 'بوابة المزامنة ومستودعات GitHub' : 'GITHUB CLOUD SYNCHRONIZATION GATE'}
                            </h4>
                            <p className="text-[10px] text-gray-400 leading-normal font-mono normal-case">
                              {lang === 'ar' 
                                ? 'مزامنة وتصدير ملفات وبيانات المعرض مباشرةً لحساب GitHub الخاص بك، أو استعادتها بلمسة واحدة من خلال رابط مباشر.' 
                                : 'Establish direct link with your GitHub repos to commit complete backups, or load snapshot states by link resolved.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Column 1: Export to GitHub Settings */}
                        <div className="space-y-3 p-4 bg-[#0B0F1A] border border-white/[0.03] hover:border-white/10 rounded-xl transition-all">
                          <h5 className="text-[10.5px] uppercase font-bold text-gray-300 font-mono tracking-wider flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                            {lang === 'ar' ? 'تصدير وحفظ المستودع (GitHub Export)' : 'PUSH DATA TO GITHUB'}
                          </h5>
                          
                          <div className="space-y-2 text-xs">
                            {/* Token input */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] text-gray-400 block font-mono uppercase font-semibold">
                                  {lang === 'ar' ? 'رمز الوصول الشخصي (GitHub PAT)' : 'GitHub Personal Access Token'}
                                </label>
                                <a 
                                  href="https://github.com/settings/tokens/new?description=ElKholy%20Motors%20Backup%20Key&scopes=repo"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-400 hover:underline hover:text-blue-350 cursor-pointer font-bold transition-all flex items-center gap-1 font-mono"
                                >
                                  🔑 {lang === 'ar' ? 'إنشاء الرمز تلقائياً' : 'Generate Token Automatically'}
                                </a>
                              </div>
                              <input
                                type="password"
                                value={githubToken}
                                onChange={(e) => {
                                  setGithubToken(e.target.value);
                                  localStorage.setItem('elkholy_github_token', e.target.value);
                                }}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full bg-[#070A11] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-650 focus:border-blue-500 outline-none font-mono"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {/* Repo path */}
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[10px] text-gray-400 block font-mono uppercase font-semibold">
                                    {lang === 'ar' ? 'مستودع GitHub' : 'Repository (owner/repo)'}
                                  </label>
                                  <a 
                                    href="https://github.com/new"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-emerald-400 hover:underline hover:text-emerald-350 cursor-pointer font-bold transition-all flex items-center gap-1 font-mono"
                                  >
                                    📁 {lang === 'ar' ? 'إنشاء مستودع جديد' : 'Create New Repo'}
                                  </a>
                                </div>
                                <input
                                  type="text"
                                  value={githubRepo}
                                  onChange={(e) => {
                                    setGithubRepo(e.target.value);
                                    localStorage.setItem('elkholy_github_repo', e.target.value);
                                  }}
                                  placeholder="username/my-repo"
                                  className="w-full bg-[#070A11] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-650 focus:border-blue-500 outline-none font-mono"
                                />
                              </div>

                              {/* Path file name */}
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase font-semibold">
                                  {lang === 'ar' ? 'اسم الملف' : 'File Name/Path'}
                                </label>
                                <input
                                  type="text"
                                  value={githubPath}
                                  onChange={(e) => {
                                    setGithubPath(e.target.value);
                                    localStorage.setItem('elkholy_github_path', e.target.value);
                                  }}
                                  placeholder="elkholy_backup.json"
                                  className="w-full bg-[#070A11] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                                />
                              </div>
                            </div>

                            {/* Branch input */}
                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase font-semibold">
                                {lang === 'ar' ? 'الفرع المستهدف' : 'Target Branch'}
                              </label>
                              <input
                                type="text"
                                value={githubBranch}
                                onChange={(e) => {
                                  setGithubBranch(e.target.value);
                                  localStorage.setItem('elkholy_github_branch', e.target.value);
                                }}
                                placeholder="main"
                                className="w-full bg-[#070A11] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleExportToGitHub}
                            disabled={isGithubExporting}
                            className={`w-full mt-2 py-2 flex items-center justify-center gap-2 rounded-xl text-[10px] font-mono tracking-widest font-bold uppercase transition-all ${
                              isGithubExporting
                                ? 'bg-white/5 text-gray-550 cursor-not-allowed border border-white/5'
                                : 'bg-white text-black hover:bg-gray-100 cursor-pointer active:scale-98 shadow-md hover:shadow-white/5'
                            }`}
                          >
                            <Github className="w-4 h-4 text-black" />
                            {isGithubExporting
                              ? (lang === 'ar' ? 'جاري الفحص والرفع... ⏳' : 'COMMITTING SNAPSHOT... ⏳')
                              : (lang === 'ar' ? 'حفظ وتصدير إلى GitHub 🚀' : 'PUSH TO GITHUB REPO 🚀')}
                          </button>
                        </div>

                        {/* Column 2: Restore from URL/GitHub Raw */}
                        <div className="space-y-3 p-4 bg-[#0B0F1A] border border-white/[0.03] hover:border-white/10 rounded-xl transition-all flex flex-col justify-between">
                          <div className="space-y-3">
                            <h5 className="text-[10.5px] uppercase font-bold text-gray-300 font-mono tracking-wider flex items-center gap-1.5">
                              <Link className="w-3.5 h-3.5 text-emerald-400" />
                              {lang === 'ar' ? 'استيراد فوري من رابط ملف خارجي / Gist' : 'IMPORT DIRECTLY FROM URL / GIST'}
                            </h5>

                            <p className="text-[10.5px] text-gray-500 leading-relaxed font-sans mt-1">
                              {lang === 'ar'
                                ? 'يقوم هذا الخيار بجلب وتنزيل ملف نسخة احتياطية من أي رابط مباشر (رابط خام من GitHub أو Gist أو أي خادم خارجي) وتطبيقه كلحظة استعادة فورية للموقع.'
                                : 'Restore complete status variables by inputting raw URL pointing to JSON catalog structure (e.g. raw.githubusercontent or raw Gist).'}
                            </p>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-gray-400 block font-mono uppercase font-semibold">
                                {lang === 'ar' ? 'رابط ملف الـ JSON المباشر' : 'Direct JSON Backup URL'}
                              </label>
                              <input
                                type="text"
                                value={githubImportUrl}
                                onChange={(e) => setGithubImportUrl(e.target.value)}
                                placeholder="https://raw.githubusercontent.com/owner/repo/main/elkholy_backup.json"
                                className="w-full bg-[#070A11] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:border-emerald-500 outline-none font-mono"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleImportByUrl}
                            disabled={isGithubImporting || sessionUser?.role !== 'Admin'}
                            className={`w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-[10px] font-mono tracking-widest font-bold uppercase transition-all ${
                              isGithubImporting || sessionUser?.role !== 'Admin'
                                ? 'bg-white/5 text-gray-550 cursor-not-allowed border border-white/5'
                                : 'bg-[#0E1524] hover:bg-[#121c32] border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 cursor-pointer active:scale-98 shadow-md'
                            }`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isGithubImporting ? 'animate-spin' : ''}`} />
                            {isGithubImporting
                              ? (lang === 'ar' ? 'جاري الاتصال والتحميل... ⏳' : 'FETCHING DATA NODES... ⏳')
                              : (lang === 'ar' ? 'استيراد ومزامنة البيانات 🔄' : 'FETCH & INTEGRATE DATA 🔄')}
                          </button>
                        </div>
                      </div>

                      {/* Full Codebase Deployment to GitHub (Vercel Integration) */}
                      <div className="p-4.5 bg-[#0B0F1A] border border-white/[0.03] hover:border-white/10 rounded-2xl transition-all space-y-3.5 mt-4 text-left">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <div className="p-1 px-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
                            <Code className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h5 className="text-[11px] uppercase font-bold text-gray-200 font-mono tracking-wider">
                              {lang === 'ar' ? 'رفع كود المصدر والمشروع بالكامل للربط بـ Vercel' : 'PUSH ENTIRE REACT CODEBASE FOR VERCEL DEPLOYMENT'}
                            </h5>
                            <p className="text-[9px] text-gray-550 font-mono italic">
                              {lang === 'ar' ? 'قم برفع جميع ملفات التطبيق والمشاريع للاتصال بفركل مباشرة' : 'Push complete workspace structure to deploy on Vercel or Netlify dynamically'}
                            </p>
                          </div>
                        </div>

                        <p className="text-[10.5px] text-gray-400 leading-relaxed font-sans">
                          {lang === 'ar'
                            ? 'هذا القسم يتيح لك تصدير "كامل الكود البرمجي للموقع" مع جميع الإعدادات ولحظات المعرض والصور الثنائية مباشرة إلى مستودع GitHub الخاص بك. بعد إتمام الرفع، يمكنك الدخول لحساب Vercel وربط المستودع، وسيتم إطلاق موقعك الخاص فوراً وبشكل مستقل تماماً ودائم مجاناً!'
                            : 'This module fetches every single active component, translation layout, package module, assets folder, and binary picture, then processes them as a single tree commit on GitHub. Easily hook this repository into Vercel or Netlify to compile and deliver your custom storefront instantly!'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#070A11] rounded-xl border border-white/5 font-mono">
                          <div className="flex justify-between items-center text-[10px] text-gray-400">
                            <span>{lang === 'ar' ? 'المستودع الهدف:' : 'TARGET REPOSITORY:'}</span>
                            <span className="text-white font-bold tracking-wide">{githubRepo || (lang === 'ar' ? 'لم يحدد' : 'Not specified')}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-400">
                            <span>{lang === 'ar' ? 'الفرع المستهدف:' : 'TARGET BRANCH:'}</span>
                            <span className="text-blue-400 font-bold tracking-wide">{githubBranch || 'main'}</span>
                          </div>
                        </div>

                        {isPushingProject && (
                          <div className="p-3 bg-indigo-950/20 border border-indigo-500/15 rounded-xl space-y-2 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                              <span className="text-[10.5px] font-mono text-indigo-300 font-bold uppercase tracking-widest">
                                {lang === 'ar' ? 'جاري تجهيز وتصدير المشروع... ⏳' : 'PUSHING SYSTEM FILES... ⏳'}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                              {projectPushStep}
                            </p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handlePushEntireProjectToGitHub}
                          disabled={isPushingProject || !githubRepo.trim() || !githubToken.trim()}
                          className={`w-full py-3 flex items-center justify-center gap-2 rounded-xl text-[10.5px] font-mono tracking-widest font-extrabold uppercase transition-all ${
                            isPushingProject || !githubRepo.trim() || !githubToken.trim()
                              ? 'bg-white/5 text-gray-550 border border-white/5 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-550 hover:to-indigo-550 text-white cursor-pointer active:scale-98 shadow-md hover:shadow-indigo-500/10'
                          }`}
                        >
                          <Github className="w-4 h-4 text-white" />
                          {isPushingProject
                            ? (lang === 'ar' ? 'جاري الرفع... 🚀' : 'EXECUTING ATOMIC COMMIT... 🚀')
                            : (lang === 'ar' ? 'إطلاق ورفع كود الموقع بالكامل إلى GitHub 🚀💻' : 'PUSH FULL REACTION ENGINE TO GITHUB 🚀💻')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ================================== CHRONOS ADVANCED OPERATION DETAILS & CURATION PANEL ================================== */}
          <AnimatePresence>
            {selectedOperation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-3 sm:p-5 overflow-y-auto"
                dir={dir}
              >
                {/* Print watermark/iframe template for printing invoices cleanly on A4 white sheets */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    body * {
                      visibility: hidden !important;
                    }
                    #elkholy-printable-invoice, #elkholy-printable-invoice * {
                      visibility: visible !important;
                    }
                    #elkholy-printable-invoice {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      background: white !important;
                      color: black !important;
                      padding: 2.5rem !important;
                      box-sizing: border-box !important;
                    }
                    .print-hidden {
                      display: none !important;
                    }
                  }
                `}} />

                {/* Main Modal container */}
                <div className="w-full max-w-6xl max-h-[92vh] bg-[#090D18]/95 border border-[#6366F1]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white font-sans print-hidden">
                  
                  {/* Modal Header */}
                  <div className="px-5 py-4 border-b border-white/5 bg-[#0B1020] flex items-center justify-between">
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#22D3EE] shrink-0" />
                        <h3 className="text-sm sm:text-base font-black font-mono tracking-widest uppercase text-white">
                          {lang === 'ar' ? 'ملف العمليات المتقدم ودفتر الحسابات' : 'ADVANCED OPERATION LEDGER & PROCESSING DESK'}
                        </h3>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-505/20 font-bold">
                          {lang === 'ar' ? 'نمط الأمان النشط' : 'SYSTEM LOCK'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono lowercase normal-case">
                        {lang === 'ar' ? 'مستعرض العمليات الفوري #' : 'telemetry routing system #'} {selectedOperation.id}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Copy link to clipboard button */}
                      <button
                        onClick={() => {
                          const shrUrl = `https://elkholy.com/order/${selectedOperation.id}`;
                          navigator.clipboard.writeText(shrUrl);
                          fireToast(lang === 'ar' ? 'تم نسخ رابط تتبع الطلب!' : 'Order tracking link copied!', 'success');
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#22D3EE] border border-white/5 transition-all text-xs cursor-pointer flex items-center gap-1.5 font-mono"
                        title={lang === 'ar' ? 'نسخ الرابط للمشاركة' : 'Copy link to share'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[9px] font-bold">LINK</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedOperation(null);
                          setOpsProductSearchQuery('');
                          setOpsCustomLogInput('');
                        }}
                        className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/10 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Scrollable Core Area - Dual-Pane Layout */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-[#060912]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5.5">
                      
                      {/* ================= PANE A: DETAILS & BILLING (SPAN 7) ================= */}
                      <div className="lg:col-span-7 space-y-5">
                        
                        {/* 1. Profile information */}
                        <div className="p-4 rounded-xl border border-white/5 bg-[#0B101E]/85 space-y-3.5 text-right">
                          <h4 className="text-xs font-black font-mono tracking-wider border-b border-white/5 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-[#22D3EE]">
                            <span>{lang === 'ar' ? 'بيانات العميل والاتصال العامة' : 'CLIENT CONTACT RECORD STATE'}</span>
                            <User className="w-4 h-4 text-[#22D3EE]" />
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-right">
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono tracking-wider block">
                                {lang === 'ar' ? 'اسم العميل المعتمد:' : 'CUSTOMER REGISTERED NAME:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[9px] text-red-400 mr-1">*</span>}
                              </label>
                              <input 
                                type="text"
                                value={editCustomerName}
                                onChange={(e) => setEditCustomerName(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-right font-bold disabled:opacity-75 disabled:text-gray-400"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono tracking-wider block">
                                {lang === 'ar' ? 'هاتف تواصل العمليات:' : 'OPERATIONAL PHONE:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[9px] text-red-400 mr-1">*</span>}
                              </label>
                              <input 
                                type="text"
                                value={editCustomerPhone}
                                onChange={(e) => setEditCustomerPhone(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-right font-mono disabled:opacity-75 disabled:text-gray-400"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono tracking-wider block">
                                {lang === 'ar' ? 'البريد الإلكتروني:' : 'EMAIL NODE:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[9px] text-red-400 mr-1">*</span>}
                              </label>
                              <input 
                                type="email"
                                value={editCustomerEmail}
                                onChange={(e) => setEditCustomerEmail(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-right font-mono disabled:opacity-75 disabled:text-gray-400"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono tracking-wider block">
                                {lang === 'ar' ? 'المحافظة الحالية:' : 'GOVERNORATE NODE:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[9px] text-red-400 mr-1">*</span>}
                              </label>
                              <input 
                                type="text"
                                value={editCustomerGov}
                                onChange={(e) => setEditCustomerGov(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-right disabled:opacity-75 disabled:text-gray-400"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono tracking-wider block">
                                {lang === 'ar' ? 'عنوان التسليم بالتفصيل:' : 'DETAILED DISPATCH ADDRESS:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[9px] text-red-400 mr-1">*</span>}
                              </label>
                              <input 
                                type="text"
                                value={editCustomerAddress}
                                onChange={(e) => setEditCustomerAddress(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                placeholder={lang === 'ar' ? 'رقم الشارع، المبنى، الشقة...' : 'Street, building, apartment...'}
                                className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-right disabled:opacity-75 disabled:text-gray-400"
                              />
                            </div>
                          </div>

                          {/* Historical records metadata */}
                          <div className="pt-2 grid grid-cols-3 gap-2 text-center text-[10px] font-mono border-t border-white/5">
                            <div className="p-1 px-1.5 bg-[#070A12] border border-white/5 rounded-lg space-y-0.5">
                              <span className="text-gray-500 block uppercase text-[8px]">{lang === 'ar' ? 'سجل تتبع العميل' : 'TRACK REGDATE'}</span>
                              <span className="text-indigo-300 font-semibold">{editCustomerRegDate}</span>
                            </div>
                            <div className="p-1 px-1.5 bg-[#070A12] border border-white/5 rounded-lg space-y-0.5">
                              <span className="text-gray-500 block uppercase text-[8px]">{lang === 'ar' ? 'عمليات سابقة' : 'PAST ORDERS'}</span>
                              <span className="text-[#22D3EE] font-bold">{editPrevOrders} {lang === 'ar' ? 'طلبات' : 'tx'}</span>
                            </div>
                            <div className="p-1 px-1.5 bg-[#070A12] border border-white/5 rounded-lg space-y-0.5">
                              <span className="text-gray-500 block uppercase text-[8px]">{lang === 'ar' ? 'مشتريات العميل' : 'GROSS CAPITAL'}</span>
                              <span className="text-green-400 font-extrabold">{editTotalPurchases} EGP</span>
                            </div>
                          </div>
                        </div>

                        {/* Protected section: Customer Identity & Authenticity */}
                        <div className="p-4 rounded-xl border border-purple-500/20 bg-[#0B101E]/85 space-y-3.5 text-right">
                          <h4 className="text-xs font-black font-mono tracking-wider border-b border-purple-500/20 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-purple-400">
                            <span>{lang === 'ar' ? '👤 أصالة وهوية العميل وتدقيق البيانات' : '👤 CUSTOMER IDENTITY & AUTHENTICITY'}</span>
                            <Shield className="w-4 h-4 text-purple-400" />
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 gap-y-3.5 text-right">
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono block">
                                {lang === 'ar' ? 'رقم الهوية / الرقم الفريد:' : 'IDENTITY ID SKU:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[8px] text-gray-550 block select-none">({lang === 'ar' ? 'عرض فقط' : 'View Only'})</span>}
                              </label>
                              <input 
                                type="text"
                                value={editCustomerId}
                                onChange={(e) => setEditCustomerId(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-purple-500 text-purple-300 rounded-lg text-xs focus:outline-none text-right font-mono disabled:opacity-75 disabled:text-gray-400"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono block">
                                {lang === 'ar' ? 'جهة وتوثيق التفعيل:' : 'VERIFICATION CODE:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[8px] text-gray-550 block select-none">({lang === 'ar' ? 'عرض فقط' : 'View Only'})</span>}
                              </label>
                              <input 
                                type="text"
                                value={editCustomerVerification}
                                onChange={(e) => setEditCustomerVerification(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-purple-500 text-purple-300 rounded-lg text-xs focus:outline-none text-right font-mono disabled:opacity-75 disabled:text-gray-400"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono block">
                                {lang === 'ar' ? 'موقف الهوية وحق الدخول:' : 'IDENTITY VERDICT:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[8px] text-gray-550 block select-none">({lang === 'ar' ? 'عرض فقط' : 'View Only'})</span>}
                              </label>
                              <select 
                                value={editIdentityStatus}
                                onChange={(e) => setEditIdentityStatus(e.target.value as any)}
                                disabled={sessionUser?.role === 'Staff'}
                                className="w-full px-3 py-1.5. bg-black/60 border border-white/[0.08] text-purple-300 focus:border-purple-500 rounded-lg text-xs focus:outline-none text-right disabled:opacity-75 disabled:text-gray-400 h-[34px]"
                              >
                                <option value="Pending">{lang === 'ar' ? '⏳ قيد الفحص الميداني' : 'Pending Verification'}</option>
                                <option value="Verified">{lang === 'ar' ? '✅ موثق ومطابق الكود' : 'Identity Verified'}</option>
                                <option value="Rejected">{lang === 'ar' ? '❌ مرفوض وغير مطابق' : 'Verification Rejected'}</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 2. Associated Vehicle (if exists) */}
                        {(() => {
                          const associatedBike = motorcycles.find(m => m.id === selectedOperation.motorcycleId);
                          if (!selectedOperation.motorcycleId && !associatedBike) return null;
                          return (
                            <div className="p-4 rounded-xl border border-white/5 bg-[#0B101E]/85 space-y-3 text-right">
                              <h4 className="text-xs font-black font-mono tracking-wider border-b border-white/5 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-[#22D3EE]">
                                <span>{lang === 'ar' ? 'الماكينة الراكبة ومتحكمات الحجز' : 'LINKED POWER UNIT & BOOKING NODE'}</span>
                                <ShoppingBag className="w-4 h-4 text-[#22D3EE]" />
                              </h4>

                              <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#070A12] p-3 rounded-lg border border-white/5">
                                {/* QRCode visual tracker using real qrcode SVG */}
                                <div className="p-1.5 bg-[#090D18] rounded-xl border border-white/10 flex flex-col items-center gap-1.5 shrink-0">
                                  <QRCodeSVG 
                                    value={`https://elkholy.com/bike/${selectedOperation.motorcycleId}`} 
                                    size={78} 
                                    bgColor="#070a11" 
                                    fgColor="#22D3EE"
                                  />
                                  <span className="text-[7.5px] font-mono font-bold tracking-widest text-[#22D3EE]">VEHICLE_QR_SCAN</span>
                                </div>

                                <img 
                                  src={associatedBike?.image || selectedOperation.motorcycleImage || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=85&w=210'} 
                                  className="w-20 h-20 rounded-lg object-cover bg-black p-1 shrink-0 border border-white/5" 
                                />

                                <div className="flex-1 min-w-0 text-right space-y-1">
                                  <span className="text-[8px] uppercase tracking-wider font-mono px-1.5 py-0.5 bg-brand-primary/10 text-brand-secondary rounded font-bold">
                                    {associatedBike?.category?.toUpperCase() || 'SPORTS FLIGHT'}
                                  </span>
                                  <div className="text-sm font-black text-white max-w-sm truncate">{associatedBike?.name || selectedOperation.motorcycleName}</div>
                                  <div className="text-[10px] text-gray-400 font-mono tracking-widest">
                                    CODE: {associatedBike?.id || selectedOperation.motorcycleId} 
                                    <span className="mx-2 text-indigo-500">•</span> 
                                    PRICE: {associatedBike?.price ? associatedBike.price.toLocaleString() : 'Negotiable'} EGP
                                  </div>

                                  <div className="pt-1 flex gap-1.5 flex-wrap justify-end">
                                    {associatedBike?.isReserved && (
                                      <span className="px-1.5 py-0.2 select-none text-[8.5px] font-mono font-bold bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20 uppercase animate-pulse">
                                        🔒 {lang === 'ar' ? 'محجوزة بالمخازن' : 'RESERVED IN STOCK'}
                                      </span>
                                    )}
                                    {associatedBike?.isSold && (
                                      <span className="px-1.5 py-0.2 select-none text-[8.5px] font-mono font-bold bg-red-500/10 text-red-400 rounded-md border border-red-500/20 uppercase">
                                        🟢 {lang === 'ar' ? 'تم البيع والشرط ملغي' : 'CONFIRMED SOLD'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 3. Associated Store Products Module (Shopping Cart Accessory Bundle) */}
                        <div className="p-4 rounded-xl border border-white/5 bg-[#0B101E]/85 space-y-3.5 text-right">
                          <h4 className="text-xs font-black font-mono tracking-wider border-b border-white/5 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-emerald-400">
                            <span>{lang === 'ar' ? 'المنتجات والإكسسوارات المرفقة بالعملية' : 'ASSOCIATED SHOP PRODUCT PIPELINES'}</span>
                            <Package className="w-4 h-4 text-emerald-400" />
                          </h4>

                          {/* Interactive Product Search Injector - Only for non-Staff */}
                          {sessionUser?.role !== 'Staff' ? (
                            <div className="relative" dir={dir}>
                              <input 
                                type="text"
                                value={opsProductSearchQuery}
                                onChange={(e) => setOpsProductSearchQuery(e.target.value)}
                                placeholder={lang === 'ar' ? 'البحث عن منتج بالاسم أو الكود لإضافته فوراً للعملية...' : 'Search shop products by SKU or name to append...'}
                                className="w-full pl-9 pr-3.5 py-2 bg-black/60 text-white border border-[#312E81]/30 focus:border-indigo-500 rounded-xl text-xs font-sans text-right placeholder-gray-550 focus:outline-none"
                              />
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                              {opsProductSearchQuery && (
                                <button 
                                  onClick={() => setOpsProductSearchQuery('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors animate-fade-in"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Dropdown matched search results */}
                              {opsProductSearchQuery.trim() && (
                                <div className="absolute z-30 left-0 right-0 top-full mt-1.5 max-h-[160px] overflow-y-auto bg-[#070A12] border border-white/10 rounded-xl p-1.5 space-y-1.5 shadow-xl custom-scrollbar" dir={dir}>
                                  {storeProducts?.filter(p => 
                                    p.name.toLowerCase().includes(opsProductSearchQuery.toLowerCase()) || 
                                    p.nameAr.includes(opsProductSearchQuery) || 
                                    p.id.toLowerCase().includes(opsProductSearchQuery.toLowerCase())
                                  ).map((prod) => (
                                    <button
                                      key={prod.id}
                                      onClick={() => handleAddProductToOperation(prod)}
                                      type="button"
                                      className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 text-right transition-all cursor-pointer font-sans"
                                    >
                                      <div className="text-[10.5px] font-bold text-emerald-400 font-mono">{prod.id} • {prod.price} EGP</div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-right">
                                          <div className="text-xs font-bold text-white leading-tight">{lang === 'ar' ? prod.nameAr : prod.name}</div>
                                          <div className="text-[9px] text-gray-500 font-mono">{lang === 'ar' ? `المخزون الحالي: ${prod.stockCount || 0}` : `Stock remaining: ${prod.stockCount || 0}`}</div>
                                        </div>
                                        <img src={prod.image} className="w-7 h-7 rounded bg-black/40 object-contain p-0.5 shrink-0" />
                                      </div>
                                    </button>
                                  ))}
                                  {(!storeProducts || storeProducts.filter(p => 
                                    p.name.toLowerCase().includes(opsProductSearchQuery.toLowerCase()) || 
                                    p.nameAr.includes(opsProductSearchQuery) || 
                                    p.id.toLowerCase().includes(opsProductSearchQuery.toLowerCase())
                                  ).length === 0) && (
                                    <div className="text-[10.5px] text-gray-500 text-center py-3 font-mono">
                                      {lang === 'ar' ? 'لا توجود عناصر مطابقة لكلمة البحث!' : 'No match product found.'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center text-[10px] font-mono text-gray-400" dir={dir}>
                              {lang === 'ar' ? '🔒 تعديل مقترنات المتجر متاح فقط للمدراء والمشرفين.' : '🔒 Modification of product bundles is restricted to management.'}
                            </div>
                          )}

                          {/* Render Added Products list */}
                          {editSelectedProducts.length === 0 ? (
                            <div className="text-center py-6 text-gray-600 font-sans text-[11px] bg-white/[0.01] rounded-xl border border-dashed border-white/5">
                              {lang === 'ar' ? 'يرجى البحث والإدارج لمقترنات المتجر لضمها للفاتورة.' : 'No accessories bundling this sales lead yet.'}
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                              {editSelectedProducts.map((op, index) => {
                                const prodTotal = (op.product.price || 0) * (op.quantity || 1);
                                return (
                                  <div key={`${op.product.id}-${index}`} className="flex items-center justify-between p-2.5 bg-[#070A12] border border-white/5 rounded-xl text-right">
                                    <div className="flex items-center gap-2 font-mono">
                                      {sessionUser?.role !== 'Staff' ? (
                                        <>
                                          <button 
                                            type="button"
                                            onClick={() => handleRemoveProductFromOperation(op.product.id)}
                                            className="text-[10px] bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 p-1 rounded-lg transition-all cursor-pointer"
                                            title={lang === 'ar' ? 'إزالة نهائياً' : 'Remove Item'}
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </button>
                                          
                                          {/* Quantity managers */}
                                          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 select-none">
                                            <button 
                                              type="button"
                                              onClick={() => handleUpdateProductQty(op.product.id, (op.quantity || 1) - 1)}
                                              className="text-[11px] font-bold text-gray-400 hover:text-white cursor-pointer"
                                            >
                                              -
                                            </button>
                                            <span className="text-[10.5px] font-bold text-brand-accent px-1.5 min-w-[12px] text-center">{op.quantity || 1}</span>
                                            <button 
                                              type="button"
                                              onClick={() => handleUpdateProductQty(op.product.id, (op.quantity || 1) + 1)}
                                              className="text-[11px] font-bold text-gray-400 hover:text-white cursor-pointer"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="px-2.5 py-1 rounded bg-[#090D18] text-gray-400 text-[10px] border border-white/5 font-bold">
                                          {lang === 'ar' ? `العدد: ${op.quantity || 1}` : `Qty: ${op.quantity || 1}`}
                                        </div>
                                      )}

                                      <span className="text-green-400 text-xs font-extrabold pr-2">{prodTotal.toLocaleString()} EGP</span>
                                    </div>

                                    <div className="flex items-center gap-2 px-1 min-w-0">
                                      <div className="min-w-0 pr-1 text-right">
                                        <div className="text-xs font-bold text-white truncate max-w-xs">{lang === 'ar' ? op.product.nameAr : op.product.name}</div>
                                        <div className="text-[8px] text-gray-500 font-mono tracking-widest leading-none mt-1">
                                          SKU: {op.product.id} 
                                          <span className="mx-1 text-brand-primary">•</span> 
                                          UNIT: {op.product.price} EGP 
                                        </div>
                                      </div>
                                      <img src={op.product.image} className="w-9 h-9 p-0.5 bg-black/60 rounded-lg object-contain shrink-0 border border-white/5" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 4. Financial Billing Sheet & Calculations */}
                        {(() => {
                          const associatedBike = motorcycles.find(m => m.id === selectedOperation.motorcycleId);
                          const bikeCost = associatedBike ? parseFloat(String(associatedBike.price).replace(/[^0-9]/g, '')) || 0 : 0;
                          const prodsCost = editSelectedProducts.reduce((sum, item) => sum + (parseFloat(String(item.product.price).replace(/[^0-9]/g, '')) || 0) * (item.quantity || 1), 0);
                          const orderPriceTotal = bikeCost + prodsCost;
                          const calculatedTax = (orderPriceTotal - editDiscountAmount) * editTaxRate / 100;
                          const grandOrderFinalTotal = (orderPriceTotal - editDiscountAmount) + calculatedTax;

                          return (
                            <div className="p-4 rounded-xl border border-white/5 bg-[#0B101E]/85 space-y-3.5 text-right">
                              <h4 className="text-xs font-black font-mono tracking-wider border-b border-white/5 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-yellow-500">
                                <span>{lang === 'ar' ? 'الحسابات المالية وتأكيد الفاتورة' : 'FINANCIAL ANALYSIS & INVOICE SHEET'}</span>
                                <Coins className="w-4 h-4 text-yellow-500" />
                              </h4>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 block font-mono">{lang === 'ar' ? 'سعر دراجة الدفع:' : 'BIKE PRICE BASE:'}</label>
                                  <div className="px-3 py-2 bg-[#070A12] border border-white/[0.04] text-gray-300 font-bold rounded-lg text-xs font-mono">
                                    {bikeCost.toLocaleString()} EGP
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 block font-mono">{lang === 'ar' ? 'إجمالي الإكسسوارات:' : 'PRODUCT SUMMBARY:'}</label>
                                  <div className="px-3 py-2 bg-[#070A12] border border-white/[0.04] text-gray-300 font-bold rounded-lg text-xs font-mono">
                                    {prodsCost.toLocaleString()} EGP
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 block font-mono">{lang === 'ar' ? 'الخصم المباشر (EGP):' : 'DIRECT DISCOUNT:'}</label>
                                  <input 
                                    type="number"
                                    min="0"
                                    value={editDiscountAmount}
                                    onChange={(e) => setEditDiscountAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                    disabled={sessionUser?.role === 'Staff'}
                                    className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-yellow-500 text-yellow-400 rounded-lg text-xs text-right font-mono font-bold disabled:opacity-75 disabled:text-gray-400"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 block font-mono">{lang === 'ar' ? 'معدل الضريبة / VAT (%):' : 'VAT / TAX RATE:'}</label>
                                  <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editTaxRate}
                                    onChange={(e) => setEditTaxRate(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                                    disabled={sessionUser?.role === 'Staff'}
                                    className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-yellow-500 text-[#22D3EE] rounded-lg text-xs text-right font-mono font-bold disabled:opacity-75 disabled:text-gray-400"
                                  />
                                </div>
                              </div>

                              {/* Ledger summary banner */}
                              <div className="p-3.5 bg-[#070A12] border border-white/5 rounded-xl space-y-2 font-mono" dir={dir}>
                                <div className="flex justify-between items-center text-[10.5px] text-gray-500">
                                  <span>{lang === 'ar' ? 'المجموع الفرعي الأولي:' : 'BASE REGISTERED SUBTOTAL:'}</span>
                                  <span className="text-white font-bold">{orderPriceTotal.toLocaleString()} EGP</span>
                                </div>
                                <div className="flex justify-between items-center text-[10.5px] text-gray-500">
                                  <span>{lang === 'ar' ? 'الضريبة المحتسبة:' : 'CALCULATED VAT VALUE:'}</span>
                                  <span className="text-[#22D3EE] font-bold">+{calculatedTax.toLocaleString()} EGP</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-white/5 pt-2 text-xs font-bold text-white">
                                  <span>{lang === 'ar' ? 'القيمة الإجمالية النهائية للفاتورة:' : 'TOTAL OUTSTANDING GROSS BALANCE:'}</span>
                                  <span className="text-green-400 font-extrabold text-sm">{grandOrderFinalTotal.toLocaleString()} EGP</span>
                                </div>
                              </div>

                              {/* PRINT & PDF CENTER ACTIONS */}
                              <div className="space-y-2 pt-1 print:hidden">
                                <button
                                  type="button"
                                  onClick={() => setIsInvoicePreviewOpen(true)}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold text-[12px] uppercase tracking-wider border border-indigo-400/20 cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all active:scale-97"
                                >
                                  <Eye className="w-4.5 h-4.5" />
                                  <span>{lang === 'ar' ? '👁 معاينة الفاتورة المعتمدة' : '👁 Preview Invoice'}</span>
                                </button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <button
                                    type="button"
                                    onClick={handlePrintInvoice}
                                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-750 hover:from-white hover:to-white text-gray-200 hover:text-black font-mono font-bold text-[9.5px] sm:text-[10px] uppercase tracking-wider border border-white/10 cursor-pointer shadow-md transition-all active:scale-97"
                                  >
                                    <Printer className="w-4 h-4" />
                                    <span>{lang === 'ar' ? 'طباعة الفاتورة الفورية (A4) 🖨' : 'Print Invoice Receipt 🖨'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleExportSingleOperationExcel}
                                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/15 to-emerald-600/25 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white font-mono font-bold text-[9.5px] sm:text-[10px] uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-97"
                                  >
                                    <FileText className="w-4 h-4 text-emerald-400" />
                                    <span>{lang === 'ar' ? 'تصدير العملية إلى إكسل 📊' : 'Export To Excel Ledger 📊'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Protected section: Financial Verification */}
                        <div className="p-4 rounded-xl border border-yellow-500/20 bg-[#0B101E]/85 space-y-3.5 text-right font-sans">
                          <h4 className="text-xs font-black font-mono tracking-wider border-b border-yellow-550/20 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-yellow-500">
                            <span>{lang === 'ar' ? '💳 التدقيق والتحقق المالي (محمي للمشرفين)' : '💳 FINANCIAL VERIFICATION'}</span>
                            <Shield className="w-4 h-4 text-yellow-500" />
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-right font-sans">
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 block font-mono">
                                {lang === 'ar' ? 'موقف التحصيل والدفع المالي:' : 'PAYMENT STATUS VERDICT:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[8px] text-gray-450 block select-none">({lang === 'ar' ? 'عرض فقط' : 'View Only'})</span>}
                              </label>
                              <select 
                                value={editPaymentStatus}
                                onChange={(e) => setEditPaymentStatus(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                className="w-full px-3 py-1.5 bg-black/60 border border-white/[0.08] text-yellow-300 focus:border-yellow-500 rounded-lg text-xs h-[34px] focus:outline-none text-right disabled:opacity-75 disabled:text-gray-400 font-bold"
                              >
                                <option value="Unpaid">{lang === 'ar' ? '❌ قيد التحصيل (غير مدفوع)' : 'Unpaid'}</option>
                                <option value="Partially Paid">{lang === 'ar' ? '⚠️ مدفوع جزئياً (عربون تحت الحساب)' : 'Partially Paid'}</option>
                                <option value="Paid">{lang === 'ar' ? '✅ تم التحصيل والإقفال المالي' : 'Fully Paid'}</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 block font-mono">
                                {lang === 'ar' ? 'تطابق تأكيد الفاتورة المعتمدة:' : 'APPROVED INVOICE AUDIT:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[8px] text-gray-550 block select-none">({lang === 'ar' ? 'عرض فقط' : 'View Only'})</span>}
                              </label>
                              <select 
                                value={editInvoiceConfirmation}
                                onChange={(e) => setEditInvoiceConfirmation(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                className="w-full px-3 py-1.5 bg-black/60 border border-white/[0.08] text-yellow-300 focus:border-yellow-500 rounded-lg text-xs h-[34px] focus:outline-none text-right disabled:opacity-75 disabled:text-gray-400 font-bold"
                              >
                                <option value="Pending">{lang === 'ar' ? '⏳ معلق للمراجعة والتدقيق' : 'Pending Review'}</option>
                                <option value="Confirmed">{lang === 'ar' ? '✅ مطابق ومقبول جمركياً ودفرياً' : 'Confirmed Balance'}</option>
                                <option value="Audit Failed">{lang === 'ar' ? '❌ فشل المطابقة والخطأ جاري العمل عليه' : 'Audit Revision Failed'}</option>
                              </select>
                            </div>

                            <div className="space-y-1 sm:col-span-2 font-sans">
                              <label className="text-[10px] text-gray-400 block font-mono">
                                {lang === 'ar' ? 'ملاحظات المحاسب والتدقيق الداخلي:' : 'INTERNAL RECONCILIATION NOTES:'}
                                {sessionUser?.role === 'Staff' && <span className="text-[8px] text-gray-550 block select-none">({lang === 'ar' ? 'عرض فقط' : 'View Only'})</span>}
                              </label>
                              <textarea 
                                value={editAccountingNotes}
                                onChange={(e) => setEditAccountingNotes(e.target.value)}
                                disabled={sessionUser?.role === 'Staff'}
                                rows={2}
                                placeholder={lang === 'ar' ? 'أي ملاحظات جمركية أو موازنات تدقيق حيازة الأسطول...' : 'Add ledger notes, tax records, custom serial receipts or clearance details...'}
                                className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-yellow-500 text-yellow-200 rounded-lg text-xs focus:outline-none text-right disabled:opacity-75 disabled:text-gray-400"
                              />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* ================= PANE B: METADATA & CONTROL (SPAN 5) ================= */}
                      <div className="lg:col-span-5 space-y-5">
                        
                        {/* 1. Operation Properties & Assigned (Available for basic metadata views) */}
                        <div className="p-4 rounded-xl border border-white/5 bg-[#0B101E]/85 space-y-3.5 text-right">
                          <h4 className="text-xs font-black font-mono tracking-wider border-b border-white/5 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-brand-secondary">
                            <span>{lang === 'ar' ? 'حالة التفعيل والمسؤولية للمجموعة' : 'OPERATION STATUS & GENERAL LIFE CYCLE'}</span>
                            <Settings className="w-4 h-4 text-brand-secondary" />
                          </h4>

                          <div className="space-y-3 text-right">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1 col-span-2">
                                <label className="text-[10px] text-gray-400 block font-mono">
                                  {lang === 'ar' ? 'المشرف المسؤول (الموظف المكلف):' : 'OFFICER IN CHARGE / ASSIGNED:'}
                                  {sessionUser?.role === 'Staff' && <span className="text-[9px] text-[#22D3EE] font-sans mr-1.5">(* {lang === 'ar' ? 'يعدل فقط من قبل المشرفين' : 'Edits only by Manager/Admin'})</span>}
                                </label>
                                <input 
                                  type="text"
                                  value={editEmployeeAssigned}
                                  onChange={(e) => setEditEmployeeAssigned(e.target.value)}
                                  disabled={sessionUser?.role === 'Staff'}
                                  className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-right font-bold disabled:opacity-75 disabled:text-gray-400"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block font-mono">{lang === 'ar' ? 'تاريخ المعاملة:' : 'REGISTERED DATE:'}</label>
                                <input 
                                  type="date"
                                  value={editOrderDate}
                                  onChange={(e) => setEditOrderDate(e.target.value)}
                                  disabled={sessionUser?.role === 'Staff'}
                                  className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-right font-mono disabled:opacity-70"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block font-mono">{lang === 'ar' ? 'توقيت المطابقة:' : 'TIMING STAMP:'}</label>
                                <input 
                                  type="text"
                                  value={editOrderTime}
                                  onChange={(e) => setEditOrderTime(e.target.value)}
                                  disabled={sessionUser?.role === 'Staff'}
                                  placeholder="14:32"
                                  className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-right font-mono disabled:opacity-70"
                                />
                              </div>
                            </div>

                            {/* Main Dropdown status selector */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 block font-mono font-bold text-brand-accent">{lang === 'ar' ? 'الحالة المعيارية النشطة للعملية:' : 'ACTIVE LIFE STATUS REGIME:'}</label>
                              <select
                                value={editOrderStatus}
                                onChange={(e) => {
                                  const sel = e.target.value;
                                  setEditOrderStatus(sel);
                                  // Update timeline states dynamically for quick previews
                                  const nowLocalDate = new Date().toISOString().split('T')[0];
                                  const nowLocalTime = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);
                                  const stKey = sel.toLowerCase().replace(/ /g, '');
                                  const updatedTimeline = editTimeline.map(stage => {
                                    const clStage = stage.stage.toLowerCase().replace(/ /g, '');
                                    if (clStage === stKey || (stKey === 'pendingreview' && clStage === 'pending_review')) {
                                      return { ...stage, active: true, date: nowLocalDate, time: nowLocalTime };
                                    }
                                    return stage;
                                  });
                                  setEditTimeline(updatedTimeline);
                                }}
                                className="w-full px-3 py-2.5 bg-black text-white border border-[#6366F1]/40 text-brand-secondary focus:border-indigo-500 rounded-xl text-xs text-right font-bold focus:outline-none"
                              >
                                <option value="New">{lang === 'ar' ? '🆕 معاملة جديدة' : 'New Intake Queue'}</option>
                                <option value="Pending Review">{lang === 'ar' ? '⏳ قيد المراجعة الهاتفية' : 'Pending Callback Review'}</option>
                                <option value="Contacted">{lang === 'ar' ? '☎️ تم الاتصال بالعميل' : 'Customer Contacted (Logged)'}</option>
                                <option value="Reserved">{lang === 'ar' ? '🔒 محجوز مع تاريخ انتهاء' : 'Reserved - Lock In Stock'}</option>
                                <option value="Confirmed">{lang === 'ar' ? '🛒 مؤكد ومعلق للتسليم' : 'Confirmed Booking / Holding'}</option>
                                <option value="Sold">{lang === 'ar' ? '🟢 مباع نهائي (خصم أسطول)' : 'Fully Sold & Closed'}</option>
                                <option value="Delivered">{lang === 'ar' ? '📦 تم التسليم النهائي' : 'Delivered & Dispatched'}</option>
                                <option value="Cancelled">{lang === 'ar' ? '❌ ملغي ومفرغ الضرر' : 'Cancelled / Revoked Lead'}</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* ⚙ PROTECTED Operations Parameters Card - HIDDEN entirely from Staff */}
                        {sessionUser?.role !== 'Staff' && (
                          <div className="p-4 rounded-xl border border-indigo-500/20 bg-[#0B101E]/85 space-y-3.5 text-right">
                            <h4 className="text-xs font-black font-mono tracking-wider border-b border-indigo-500/20 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-indigo-400">
                              <span>{lang === 'ar' ? '⚙️ معلمات التحكم في النظام والتشغيل' : '⚙️ OPERATIONS PARAMETERS (PROTECTED)'}</span>
                              <Settings className="w-4 h-4 text-indigo-400" />
                            </h4>

                            <div className="space-y-3 text-right">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1 col-span-2">
                                  <label className="text-[10px] text-gray-400 block font-mono">{lang === 'ar' ? 'رقم الفاتورة المعتمدة ماليًا:' : 'APPROVED INVOICE REGISTER SKU:'}</label>
                                  <input 
                                    type="text"
                                    value={editInvoiceNumber}
                                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                                    className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-right font-mono font-bold"
                                  />
                                </div>
                              </div>

                              {/* Product Visibility & Hide/Show Motorcycle togglers */}
                              <div className="grid grid-cols-2 gap-3 py-1">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 block font-mono">{lang === 'ar' ? 'رؤية الإكسسوارات للعملاء:' : 'PRODUCT BUNDLE VISIBILITY:'}</label>
                                  <select
                                    value={editProductVisibility}
                                    onChange={(e) => setEditProductVisibility(e.target.value as any)}
                                    className="w-full bg-[#070A12] text-xs text-brand-secondary border border-white/10 rounded px-2.5 py-1.5 focus:outline-none text-right font-mono"
                                  >
                                    <option value="show">{lang === 'ar' ? '🔓 مرصود ومتاح بالمتجر' : 'Active (Public)'}</option>
                                    <option value="hide">{lang === 'ar' ? '🔒 مخفي من الخريطة والمتجر' : 'Hidden (Staff Only)'}</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 block font-mono">{lang === 'ar' ? 'عرض دراجة الحجز بالموقع:' : 'MOTORCYCLE DISPLAY REGIME:'}</label>
                                  <select
                                    value={editHideShowMotorcycle}
                                    onChange={(e) => setEditHideShowMotorcycle(e.target.value as any)}
                                    className="w-full bg-[#070A12] text-xs text-brand-secondary border border-white/10 rounded px-2.5 py-1.5 focus:outline-none text-right font-mono"
                                  >
                                    <option value="show">{lang === 'ar' ? '🔓 معروض في الشو-روم' : 'Visible in Showroom'}</option>
                                    <option value="hide">{lang === 'ar' ? '🔒 أرشيف مخفي بالمخزن' : 'Archived & Hidden'}</option>
                                  </select>
                                </div>
                              </div>

                              {/* RESERVATION SUMMARY & Expiry (Reservation Rules) */}
                              {editOrderStatus === 'Reserved' && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-right">
                                  <label className="text-[10px] text-amber-500 block font-mono font-bold select-none">{lang === 'ar' ? 'مقتضيات انتهاء الحجز التلقائي:' : 'RESERVATION AUTOMATED EXPIRY DATE:'}</label>
                                  <input 
                                    type="date"
                                    value={editReservationExpiry}
                                    onChange={(e) => setEditReservationExpiry(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-black/60 border border-amber-500/30 text-white rounded-lg text-xs text-right focus:outline-none"
                                  />
                                  <p className="text-[8px] text-gray-400 font-sans leading-relaxed">
                                    {lang === 'ar' 
                                      ? '* سيتم عرض الآلة كمحجوزة للجمهور وتلغى استمارات الحجز الفوري طيلة هذه الفترة.' 
                                      : '* Labels cycle as RESERVED dynamically and lock reservations until this date.'}
                                  </p>
                                </div>
                              )}

                              {/* INVENTORY CONTROL STRATEGIES */}
                              {(editOrderStatus === 'Sold' || editOrderStatus === 'Delivered') && (
                                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-2 text-right">
                                  <label className="text-[10px] text-indigo-400 block font-mono font-bold">{lang === 'ar' ? 'متحكم الخصم والحركة للمخزن:' : 'INVENTORY AUDITING STRATEGY:'}</label>
                                  <select 
                                    value={editInventoryUpdateOpt}
                                    onChange={(e) => setEditInventoryUpdateOpt(e.target.value as any)}
                                    className="w-full bg-black text-xs text-white border border-white/10 rounded px-2 py-1 focus:outline-none text-right font-mono"
                                  >
                                    <option value="auto">{lang === 'ar' ? 'خصم وتحديث أوتوماتيكي ومزامنة التدقيق' : 'Substract & Sync Autonomously'}</option>
                                    <option value="manual">{lang === 'ar' ? 'تجاوز المخزون يدوياً وإرسال إشعار' : 'Manual stock count override'}</option>
                                    <option value="none">{lang === 'ar' ? 'لا تؤثر على كميات المخازن الحالية' : 'Do Not Audit Stock'}</option>
                                  </select>

                                  {/* Visual Stock Auditor Feedback Preview */}
                                  {editSelectedProducts.length > 0 && (
                                    <div className="pt-2.5 border-t border-white/5 space-y-1.5">
                                      <span className="text-[8.5px] font-mono text-gray-500 tracking-wider block uppercase">{lang === 'ar' ? 'محاكاة حركة المخزون للعملية:' : 'LIVE REALTIME STOCK COUNTERS:'}</span>
                                      {editSelectedProducts.map((op, i) => {
                                        const currentStock = op.product.stockCount || 0;
                                        const chosenQty = op.quantity || 1;
                                        const projectedStock = Math.max(0, currentStock - chosenQty);
                                        const warnColor = projectedStock <= 1 ? 'text-red-400 font-bold' : 'text-emerald-400';
                                        return (
                                          <div key={i} className="flex justify-between items-center text-[9px] font-mono text-gray-300">
                                            <span className="truncate max-w-[120px]">{lang === 'ar' ? op.product.nameAr : op.product.name}</span>
                                            <span>
                                              {currentStock} ➡️ <span className={warnColor}>{projectedStock}</span> ({lang === 'ar' ? 'بقيت' : 'left'})
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Executive Supervisor Notes Tracker - ONLY for Admin and Manager */}
                        {sessionUser?.role !== 'Staff' && (
                          <div className="p-4 rounded-xl border border-indigo-500/20 bg-[#0B101E]/85 space-y-2 text-right">
                            <label className="text-xs font-black font-mono tracking-wider border-b border-indigo-500/20 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-indigo-400">
                              <span>{lang === 'ar' ? '📓 ملاحظات المدير والمشرف العام (سري)' : '📓 EXECUTIVE SUPERVISOR NOTES'}</span>
                              <MessageSquare className="w-4 h-4 text-indigo-400" />
                            </label>
                            <textarea 
                              value={editExecutiveNotes}
                              onChange={(e) => setEditExecutiveNotes(e.target.value)}
                              placeholder={lang === 'ar' ? 'ملاحظات تدقيق المشرف والمدراء فقط. لا يراها طاقم التجهيز...' : 'Special instructions only readable and editable by Admin & Manager...'}
                              rows={3}
                              className="w-full px-3 py-2 bg-black/50 border border-indigo-500/20 text-white focus:border-indigo-500 rounded-lg text-xs text-right placeholder-gray-550 focus:outline-none custom-scrollbar font-medium"
                            />
                          </div>
                        )}

                        {/* 2. Employee Notes Tracker (Available to all) */}
                        <div className="p-4 rounded-xl border border-white/5 bg-[#0B101E]/85 space-y-2 text-right">
                          <label className="text-xs font-black font-mono tracking-wider border-b border-white/5 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-gray-300">
                            <span>{lang === 'ar' ? 'ملاحظات طاقم التجهيز والمعرض العام' : 'STAFF MEMOS & RECEPTION NOTES'}</span>
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                          </label>
                          <textarea 
                            value={editEmployeeNotes}
                            onChange={(e) => setEditEmployeeNotes(e.target.value)}
                            placeholder={lang === 'ar' ? 'اكتب ملاحظات تسليم الموتوسيكل، تأكيد العملاء، متابعة الأوراق والجمارك...' : 'Type dispatch terms, insurance state, custom registration notes here...'}
                            rows={3}
                            className="w-full px-3 py-2 bg-black/50 border border-white/[0.08] text-white focus:border-indigo-500 rounded-lg text-xs text-right placeholder-gray-550 focus:outline-none custom-scrollbar"
                          />
                        </div>

                        {/* 3. Barcodes & Graphics hub */}
                        <div className="p-4 rounded-xl border border-white/5 bg-[#0B101E]/85 space-y-3 text-right">
                          <h4 className="text-xs font-black font-mono tracking-wider border-b border-white/5 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-[#22D3EE]">
                            <span>{lang === 'ar' ? 'بوابة التحقق ورقم التشفير والـ QR' : 'IDENTITY BARCODE & VERIFICATION GRAPHIC'}</span>
                            <Code className="w-4 h-4 text-[#22D3EE]" />
                          </h4>

                          <div className="flex justify-around items-center p-2.5 bg-[#070A12] border border-white/5 rounded-xl">
                            {/* Visual Barcode mockup */}
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-8 flex gap-0.5 items-end justify-center select-none opacity-80">
                                {[1, 3, 2, 4, 1, 3, 2, 2, 4, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2].map((h, index) => (
                                  <div key={index} className="w-[1.5px] bg-[#22D3EE]" style={{ height: `${h * 20}%` }} />
                                ))}
                              </div>
                              <span className="text-[7px] font-mono tracking-widest text-[#22D3EE]">TX_CODE_{selectedOperation.id.substring(0, 8).toUpperCase()}</span>
                            </div>

                            {/* Real QR code using library linking to checkout */}
                            <div className="flex flex-col items-center gap-1 shrink-0 p-1.5 bg-black rounded-lg border border-white/5">
                              <QRCodeSVG 
                                value={`hhttps://elkholy.com/order-receipt/${selectedOperation.id}`} 
                                size={55} 
                                bgColor="#000000" 
                                fgColor="#22D3EE"
                              />
                              <span className="text-[6.5px] font-mono text-gray-500 uppercase">SYS_AUD_QR</span>
                            </div>
                          </div>
                        </div>

                        {/* 4. Chronos Process Timeline */}
                        <div className="p-4 rounded-xl border border-white/5 bg-[#0B101E]/85 space-y-3 text-right">
                          <h4 className="text-xs font-black font-mono tracking-wider border-b border-white/5 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-gray-300">
                            <span>{lang === 'ar' ? 'مسار تقدم العملية والخطوات' : 'TRANSACTION ADVANCEMENT TIMELINE'}</span>
                            <Activity className="w-4 h-4 text-indigo-400" />
                          </h4>

                          <div className="relative pl-1.5 space-y-2 pt-1 font-mono text-[10px]" dir={dir}>
                            {editTimeline.map((stageItem, i) => (
                              <div key={i} className="flex gap-3 text-right items-start relative pb-1">
                                {/* Connecting line */}
                                {i < editTimeline.length - 1 && (
                                  <div className={`absolute top-3.5 bottom-0 right-1.5 w-[1px] ${stageItem.active ? 'bg-indigo-500' : 'bg-white/10'}`} />
                                )}

                                {/* Dot selector */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Make interactive stage toggler
                                    const updated = [...editTimeline];
                                    updated[i].active = !updated[i].active;
                                    if (updated[i].active) {
                                      updated[i].date = new Date().toISOString().split('T')[0];
                                      updated[i].time = new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);
                                    } else {
                                      updated[i].date = '';
                                      updated[i].time = '';
                                    }
                                    setEditTimeline(updated);
                                  }}
                                  className={`w-3 h-3 rounded-full border z-10 shrink-0 transition-all cursor-pointer ${
                                    stageItem.active 
                                      ? 'bg-indigo-500 border-indigo-400 ring-2 ring-indigo-500/30' 
                                      : 'bg-black border-white/20 hover:border-indigo-400'
                                  }`}
                                />

                                <div className="flex-1 text-right min-w-0">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[8px] text-gray-500 font-bold">{stageItem.date ? `${stageItem.date} ${stageItem.time}` : 'PENDING'}</span>
                                    <span className={`font-bold uppercase ${stageItem.active ? 'text-white' : 'text-gray-500'}`}>
                                      {stageItem.stage === 'Order Created' ? (lang === 'ar' ? 'تم إنشاء حجز المعاملة' : 'Order Created') :
                                       stageItem.stage === 'WhatsApp Generated' ? (lang === 'ar' ? 'تجهيز نموذج واتساب 💬' : 'WhatsApp Ready 💬') :
                                       stageItem.stage === 'Customer Contacted' ? (lang === 'ar' ? 'تم الاتصال بالعميل' : 'Customer Contacted') :
                                       stageItem.stage === 'Reserved' ? (lang === 'ar' ? 'حجز دراجة الأسطول' : 'Reserved Bike') :
                                       stageItem.stage === 'Confirmed' ? (lang === 'ar' ? 'تأكيد المعاملة مالياً' : 'Confirmed Deal') :
                                       stageItem.stage === 'Sold' ? (lang === 'ar' ? 'إقفال مباع نهائي' : 'Sold Out Status') :
                                       stageItem.stage === 'Delivered' ? (lang === 'ar' ? 'تسليم الموتوسيكل' : 'Handed Over') :
                                       (lang === 'ar' ? 'تفنيط ملغي' : 'Revoked')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* 5. Master Activity Audit Log List (Historic Logs of specific operations) */}
                    <div className="p-4 rounded-xl border border-white/5 bg-[#0B101E]/85 space-y-3.5 text-right">
                      <h4 className="text-xs font-black font-mono tracking-wider border-b border-white/5 pb-1.5 uppercase flex items-center justify-end gap-1.5 text-gray-300">
                        <span>{lang === 'ar' ? 'سجل تتبع الحركات وجلسات تدقيق الأوردر' : 'CHRONOS INTERNAL SYSTEM AUDIT LEDGER'}</span>
                        <ShieldCheck className="w-4 h-4 text-indigo-400 animate-pulse" />
                      </h4>

                      {/* Add Custom Audit Log Entry Form */}
                      <div className="flex gap-2" dir={dir}>
                        <button
                          type="button"
                          onClick={handleAddCustomLog}
                          className="px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          {lang === 'ar' ? 'تسجيل الحركة ✍️' : 'Write Record ✍️'}
                        </button>
                        <input 
                          type="text"
                          value={opsCustomLogInput}
                          onChange={(e) => setOpsCustomLogInput(e.target.value)}
                          placeholder={lang === 'ar' ? 'كتابة ملاحظة لتسجيلها في سجل التدقيق الأمني للعملية...' : 'Type custom record comment to append into immutable security log...'}
                          className="flex-1 px-3 py-1.5 bg-black/60 border border-white/[0.08] focus:border-indigo-500 text-white rounded-lg text-xs text-right pr-3"
                        />
                      </div>

                      {/* Display Log Table */}
                      <div className="max-h-[140px] overflow-y-auto pr-1.5 custom-scrollbar space-y-1.5 text-[10px] font-mono">
                        {editActivityLog.map((log, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-[#070A12] border border-white/[0.03] hover:bg-white/[0.01] rounded-lg text-right">
                            <span className="text-gray-500">{log.date} {log.time}</span>
                            <span className="text-white max-w-md truncate">{log.action}</span>
                            <span className="text-brand-secondary font-bold">@{log.employee}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Modal Footer Controls */}
                  <div className="px-5 py-3.5 border-t border-white/5 bg-[#0B1020] flex justify-end gap-3 font-mono text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOperation(null);
                        setOpsProductSearchQuery('');
                        setOpsCustomLogInput('');
                      }}
                      className="px-4.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold cursor-pointer text-xs uppercase"
                    >
                      {lang === 'ar' ? 'إلغاء والتغاضي' : 'CLOSE & ROLLBACK'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSaveOperationDetails();
                        setSelectedOperation(null);
                        fireToast(lang === 'ar' ? 'تم حفظ التعديلات وإرسالها لقاعدة البيانات بنجاح!' : 'Operation compiled, authorized, and synchronized in Firestore!', 'success');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-[#22D3EE] text-[#0B0F1A] font-extrabold uppercase hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'تثبيت وحفظ العملية' : 'AUTHORIZE LEDGER WRITE'}</span>
                    </button>
                  </div>

                </div>

                {/* ================================== PRINTABLE RECEIPT TEMPLATE FOR A4 PAPER (VISIBLE ONLY UNDER PRINT MODE) ================================== */}
                {selectedOperation && (
                  <div id="elkholy-printable-invoice" className="hidden print:block text-black bg-white p-10 font-sans leading-relaxed text-[12px] text-right" dir={dir}>
                    {/* Invoice header */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                      <div className="text-left font-mono">
                        <h2 className="text-lg font-black tracking-widest leading-none">ELKHOLY MOTORS</h2>
                        <span className="text-[10px] text-gray-550 block">CHRONOS PRESTIGE SHOWROOM</span>
                        <span className="text-[10px] text-gray-550 block">ADDRESS: Cairo, Shubra Al-Khaima</span>
                        <span className="text-[10px] text-gray-550 block">PHONE: +201021464319</span>
                      </div>
                      <div className="text-right">
                        <h1 className="text-xl font-bold tracking-tight">{lang === 'ar' ? 'الخولي موتورز - فاتورة بيع معتمدة' : 'ELKHOLY MOTORS - OFFICIAL SALES INVOICE'}</h1>
                        <span className="text-xs text-gray-600 block">{lang === 'ar' ? 'التفويض: بوابات المبيعات وسلالم المعاينة' : 'Authorized Showroom & Accessories Center'}</span>
                        <span className="text-xs text-gray-600 block font-mono">{lang === 'ar' ? 'تاريخ اليوم:' : 'Print Timestamp:'} {new Date().toISOString().split('T')[0]}</span>
                      </div>
                    </div>

                    {/* Customer overview block */}
                    <div className="grid grid-cols-2 gap-6 pb-4 border-b border-gray-300 mb-6">
                      <div className="text-right space-y-1">
                        <span className="text-[11px] font-bold text-gray-600 block mb-1 uppercase">{lang === 'ar' ? 'بيانات العميل الحصري:' : 'CLIENT DOSSIER:'}</span>
                        <div><strong>{lang === 'ar' ? 'الاسم:' : 'Name:'}</strong> {editCustomerName}</div>
                        <div><strong>{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {editCustomerPhone}</div>
                        <div><strong>{lang === 'ar' ? 'العنوان:' : 'Address:'}</strong> {editCustomerAddress || (lang === 'ar' ? 'لم يحدد بعد' : 'Not specified')}</div>
                        <div><strong>{lang === 'ar' ? 'المحافظة:' : 'Gov:'}</strong> {editCustomerGov}</div>
                      </div>
                      <div className="text-left space-y-1">
                        <span className="text-[11px] font-bold text-gray-600 block mb-1 uppercase">{lang === 'ar' ? 'بيانات العملية المالية:' : 'TRANSACT SPECS:'}</span>
                        <div><strong>{lang === 'ar' ? 'رقم الفاتورة:' : 'Invoice SKU:'}</strong> <span className="font-mono">{editInvoiceNumber}</span></div>
                        <div><strong>{lang === 'ar' ? 'رمز المعاملة:' : 'Transaction ID:'}</strong> <span className="font-mono">#{selectedOperation.id.substring(0, 10).toUpperCase()}</span></div>
                        <div><strong>{lang === 'ar' ? 'الموظف المسؤول:' : 'Agent Officer:'}</strong> {editEmployeeAssigned}</div>
                        <div><strong>{lang === 'ar' ? 'حالة الدفتر:' : 'Ledger Status:'}</strong> <span className="font-bold">{editOrderStatus.toUpperCase()}</span></div>
                      </div>
                    </div>

                    {/* Table of products & items */}
                    <div className="mb-6">
                      <table className="w-full text-right border-collapse text-[11.5px]">
                        <thead>
                          <tr className="border-b border-black text-gray-500 text-[10.5px]">
                            <th className="pb-1.5 text-right">{lang === 'ar' ? 'تفاصيل العنصر / الكود' : 'ITEM DETAILS & SERIAL'}</th>
                            <th className="pb-1.5 text-center">{lang === 'ar' ? 'الكمية' : 'QTY'}</th>
                            <th className="pb-1.5 text-left">{lang === 'ar' ? 'سعر الوحدة' : 'PRICE'}</th>
                            <th className="pb-1.5 text-left">{lang === 'ar' ? 'الإجمالي' : 'TOTAL (EGP)'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Motorcycle line */}
                          {selectedOperation.motorcycleId && (
                            <tr className="border-b border-gray-200">
                              <td className="py-2.5">
                                <div className="font-bold">{motorcycles.find(m => m.id === selectedOperation.motorcycleId)?.name || selectedOperation.motorcycleName}</div>
                                <div className="text-[9.5px] text-gray-500 font-mono">CYCLE CODE: {selectedOperation.motorcycleId}</div>
                              </td>
                              <td className="py-2.5 text-center font-mono">1</td>
                              <td className="py-2.5 text-left font-mono">{(motorcycles.find(m => m.id === selectedOperation.motorcycleId)?.price || 0).toLocaleString()}</td>
                              <td className="py-2.5 text-left font-mono">{(motorcycles.find(m => m.id === selectedOperation.motorcycleId)?.price || 0).toLocaleString()} EGP</td>
                            </tr>
                          )}

                          {/* Accessories bundles lines */}
                          {editSelectedProducts.map((op, i) => {
                            const total = (op.product.price || 0) * (op.quantity || 1);
                            return (
                              <tr key={i} className="border-b border-gray-200">
                                <td className="py-2.5">
                                  <div className="font-semibold">{lang === 'ar' ? op.product.nameAr : op.product.name}</div>
                                  <div className="text-[9.5px] text-gray-500 font-mono">SKU: {op.product.id}</div>
                                </td>
                                <td className="py-2.5 text-center font-mono">{op.quantity || 1}</td>
                                <td className="py-2.5 text-left font-mono">{(op.product.price || 0).toLocaleString()}</td>
                                <td className="py-2.5 text-left font-mono">{total.toLocaleString()} EGP</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Sub totals & totals calculations */}
                    {(() => {
                      const associatedBike = motorcycles.find(m => m.id === selectedOperation.motorcycleId);
                      const bCost = associatedBike ? parseFloat(String(associatedBike.price).replace(/[^0-9]/g, '')) || 0 : 0;
                      const pCost = editSelectedProducts.reduce((sum, item) => sum + (parseFloat(String(item.product.price).replace(/[^0-9]/g, '')) || 0) * (item.quantity || 1), 0);
                      const baseSub = bCost + pCost;
                      const taxVal = (baseSub - editDiscountAmount) * editTaxRate / 100;
                      const grossInvoiceTotal = (baseSub - editDiscountAmount) + taxVal;

                      return (
                        <div className="w-1/2 mr-auto text-left space-y-1 font-mono text-[11.5px] border-t border-black pt-3 mb-10">
                          <div className="flex justify-between">
                            <span>{lang === 'ar' ? 'المجموع الفرعي الأولي:' : 'BASE SUBTOTAL:'}</span>
                            <span>{baseSub.toLocaleString()} EGP</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>{lang === 'ar' ? 'الخصم الخاص للعميل:' : 'DIRECT DISCOUNT:'}</span>
                            <span>-{editDiscountAmount.toLocaleString()} EGP</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>{lang === 'ar' ? `ضريبة القيمة المضافة (${editTaxRate}%):` : `VAT / INT TAX RATE (${editTaxRate}%):`}</span>
                            <span>+{taxVal.toLocaleString()} EGP</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold border-t border-dashed border-gray-400 pt-1.5 text-black">
                            <span>{lang === 'ar' ? 'الصافي النهائي للمطالبة:' : 'TOTAL AMOUNT DUE:'}</span>
                            <span>{grossInvoiceTotal.toLocaleString()} EGP</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Double Signature blocks */}
                    <div className="grid grid-cols-2 gap-10 text-center pt-8 border-t border-gray-300">
                      <div>
                        <div className="font-bold mb-10">{lang === 'ar' ? 'توقيع العميل المستلم' : 'CUSTOMER READINESS & RECEIPT'}</div>
                        <div className="w-40 border-b border-dashed border-black mx-auto" />
                        <span className="text-[10px] text-gray-550 block mt-1">{lang === 'ar' ? 'أقر باستلام كافة الأجهزة والضمان كاملاً' : 'Authorized Signee & ID Match Stamp'}</span>
                      </div>
                      <div>
                        <div className="font-bold mb-10">{lang === 'ar' ? 'توقيع وختم المعرض المرخص' : 'AUTHORIZED ELKHOLY BROTHERS OFFICER'}</div>
                        <div className="w-40 border-b border-dashed border-black mx-auto" style={{ textShadow: 'none' }} />
                        <span className="text-[10px] text-gray-550 block mt-1">{lang === 'ar' ? 'الختم الرسمي لفرع المعاملة' : 'Chronos HQ Authorized Delegation'}</span>
                      </div>
                    </div>

                    <div className="text-center text-[9px] text-gray-400 mt-16 border-t pt-4">
                      {lang === 'ar' 
                        ? 'مستند بيع رسمي ومطابق لمعايير جمارك الدراجات النارية بجمهورية مصر العربية.' 
                        : 'Official computer invoice generated by Chronos ElKholy Showrooms Systems. All rights reserved.'}
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

          {/* ================================== ADVANCED INVOICE PREVIEW SYSTEM MODAL ================================== */}
          <AnimatePresence>
            {isInvoicePreviewOpen && selectedOperation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-55 flex items-center justify-center bg-black/95 backdrop-blur-xl p-3 sm:p-5 overflow-y-auto print:hidden"
                dir={dir}
              >
                {/* Modal Container */}
                <div className={`w-full ${isInvoiceFullScreen ? 'h-full max-w-none' : 'max-w-5xl h-[90vh]'} flex flex-col bg-brand-bg border border-white/5 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300`}>
                  
                  {/* Top Bar / Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-black/40 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsInvoiceFullScreen(!isInvoiceFullScreen)}
                        className="p-1 px-2.5 rounded-md border border-white/10 hover:border-indigo-400 bg-white/5 text-gray-400 hover:text-indigo-400 transition-all text-xs flex items-center gap-1 font-mono cursor-pointer"
                        title={lang === 'ar' ? 'ملء الشاشة' : 'Toggle Fullscreen'}
                      >
                        {isInvoiceFullScreen ? (
                          <>
                            <Minimize2 className="w-4 h-4" />
                            <span>{lang === 'ar' ? 'تصغير' : 'Minimize'}</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-4 h-4" />
                            <span>{lang === 'ar' ? 'ملء الشاشة' : 'Full Screen'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center flex-1">
                      <h3 className="text-xs sm:text-sm font-black font-mono tracking-wider text-yellow-500 uppercase flex items-center justify-center gap-2">
                        <span>{lang === 'ar' ? '👁 معاينة الفاتورة المعتمدة' : '👁 APPROVED INVOICE PREVIEW'}</span>
                      </h3>
                    </div>

                    <button
                      onClick={() => setIsInvoicePreviewOpen(false)}
                      className="p-1 px-2.5 rounded-md border border-red-500/20 hover:border-red-500 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-all text-xs flex items-center gap-1 font-mono cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إغلاق' : 'Close'}</span>
                    </button>
                  </div>

                  {/* Dual Grid Layout or Stacked View */}
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* LEFT PANEL: Live Interactive Preview Document Wrapper */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070A12]/40 scroll-smooth">
                      
                      {/* Interactive Live Document Capture Block */}
                      <div 
                        id="elkholy-invoice-document-capture" 
                        className="bg-[#0B101E] border border-white/5 max-w-3xl mx-auto rounded-xl p-5 sm:p-8 space-y-6 text-right relative overflow-hidden shadow-2xl shadow-indigo-500/5 box-glow-indigo text-white font-sans"
                        dir={dir}
                      >
                        {/* Futuristic background glows */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                        {/* COMPANY Brand Information Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/5 pb-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center p-0.5 shadow-md shadow-indigo-500/20 border border-white/10">
                              <div className="w-full h-full bg-black/40 backdrop-blur-md rounded-[6px] flex items-center justify-center text-cyan-400">
                                {/* SVG Motorcycle Graphic */}
                                <svg className="w-6 h-6 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                </svg>
                              </div>
                            </div>
                            <div className="text-left font-sans">
                              <h2 className="text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-cyan-400">ELKHOLY MOTORS</h2>
                              <span className="text-[9px] text-gray-500 block uppercase tracking-wider font-mono">Premium Fleet & Accessories</span>
                            </div>
                          </div>

                          <div className="text-right space-y-1 font-mono text-[10px] text-gray-400">
                            <div className="flex items-center gap-1.5 justify-end">
                              <span>+201021464319</span>
                              <strong className="text-gray-500">{lang === 'ar' ? 'هاتف:' : 'TEL:'}</strong>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end text-emerald-400 font-bold">
                              <span>+201021464319</span>
                              <strong className="text-gray-500">{lang === 'ar' ? 'واتساب:' : 'WHATSAPP:'}</strong>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                              <span>{lang === 'ar' ? 'شبرا، القاهرة، مصر' : 'Cairo, Shubra Al-Khaima'}</span>
                              <strong className="text-gray-500">{lang === 'ar' ? 'العنوان:' : 'ADDR:'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* INVOICE & OPERATION META DETAILS */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-black/40 border border-white/5 p-3.5 rounded-xl font-mono text-[10px]">
                          <div className="space-y-0.5 text-right">
                            <span className="text-gray-500 text-[8.5px] uppercase block">{lang === 'ar' ? 'رقم الفاتورة:' : 'INVOICE NO:'}</span>
                            <span className="text-yellow-400 font-bold">{editInvoiceNumber || 'UNASSIGNED'}</span>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <span className="text-gray-500 text-[8.5px] uppercase block">{lang === 'ar' ? 'رمز المعاملة:' : 'OPERATION ID:'}</span>
                            <span className="text-cyan-400 font-bold">#{selectedOperation.id.substring(0, 8).toUpperCase()}</span>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <span className="text-gray-500 text-[8.5px] uppercase block">{lang === 'ar' ? 'معرف العميل:' : 'CUSTOMER ID:'}</span>
                            <span className="text-emerald-400 font-bold">{editCustomerId || 'CUST-TEMP'}</span>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <span className="text-gray-500 text-[8.5px] uppercase block">{lang === 'ar' ? 'تاريخ التحرير:' : 'ISSUE DATE:'}</span>
                            <span className="text-white font-bold">{editOrderDate || '2026-06-10'}</span>
                          </div>
                          <div className="space-y-0.5 text-right col-span-2 sm:col-span-1">
                            <span className="text-gray-500 text-[8.5px] uppercase block">{lang === 'ar' ? 'وقت الإصدار:' : 'ISSUE TIME:'}</span>
                            <span className="text-white font-bold">{editOrderTime || '10:00'}</span>
                          </div>
                        </div>

                        {/* CUSTOMER INFO SUMMARY */}
                        <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04] space-y-2.5 text-right">
                          <h4 className="text-[10px] font-black tracking-wider text-gray-500 border-b border-white/5 pb-1 uppercase">
                            👥 {lang === 'ar' ? 'بيانات العميل الحصري' : 'CUSTOMER DOSSIER'}
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-500 block font-mono">{lang === 'ar' ? 'اسم العميل الفني:' : 'CUSTOMER NAME:'}</span>
                              <span className="text-white font-bold">{editCustomerName || (lang === 'ar' ? 'غير مسجل' : 'Not Registered')}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-500 block font-mono">{lang === 'ar' ? 'رقم الهاتف المعتمد:' : 'PHONE NUMBER:'}</span>
                              <span className="text-white font-bold font-mono">{editCustomerPhone || 'N/A'}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-500 block font-mono">{lang === 'ar' ? 'المحافظة:' : 'GOVERNORATE:'}</span>
                              <span className="text-white font-bold">{editCustomerGov || 'N/A'}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-500 block font-mono">{lang === 'ar' ? 'العنوان الجغرافي:' : 'ADDRESS DETAILS:'}</span>
                              <span className="text-white font-bold">{editCustomerAddress || (lang === 'ar' ? 'لم يحدد' : 'Not Provided')}</span>
                            </div>
                          </div>
                        </div>

                        {/* MOTORCYCLE ATTACHED INFORMATION */}
                        {selectedOperation.motorcycleId && (
                          <div className="p-4 rounded-xl bg-indigo-600/5 border border-indigo-500/10 space-y-3">
                            <h4 className="text-[10px] font-black tracking-wider text-indigo-400 border-b border-indigo-500/5 pb-1 uppercase">
                              🏍 {lang === 'ar' ? 'دراجة المعرض المشتراة' : 'CYCLE SPECIFICATIONS & FLEET DETS'}
                            </h4>

                            {(() => {
                              const bike = motorcycles.find(m => m.id === selectedOperation.motorcycleId);
                              if (!bike) return null;
                              return (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
                                  <div className="flex items-center gap-3">
                                    {bike.image ? (
                                      <img 
                                        src={bike.image} 
                                        alt={bike.name} 
                                        className="w-14 h-10 object-cover rounded-lg border border-white/10"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-14 h-10 bg-black/45 rounded-lg border border-white/10 flex items-center justify-center">
                                        <ImageIcon className="w-4 h-4 text-gray-500" />
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-white font-extrabold text-sm block">{bike.name}</span>
                                      <span className="text-[9px] text-gray-500 font-mono block">CYCLE ID: {bike.id}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="bg-black/30 p-1 rounded border border-white/5">
                                      <QRCodeSVG value={`https://elkholy.com/bike/${bike.id}`} size={38} />
                                    </div>
                                    <div className="text-right font-mono">
                                      <span className="text-[9px] text-gray-500 block">{lang === 'ar' ? 'سعر المعرض المعتمد:' : 'SHOWROOM BASE:'}</span>
                                      <span className="text-cyan-400 font-bold block">{(parseFloat(String(bike.price).replace(/[^0-9]/g, '')) || 0).toLocaleString()} EGP</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* STORE PRODUCT ACCESSORIES LIST */}
                        {editSelectedProducts.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black tracking-wider text-[#22D3EE] border-b border-[#22D3EE]/10 pb-1 uppercase">
                              📦 {lang === 'ar' ? 'الملحقات والإكسسوارات المشمولة' : 'ACCESSORIES & STORE PRODUCTS'}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-[10.5px] border-collapse">
                                <thead>
                                  <tr className="border-b border-white/10 text-gray-400 text-[9.5px] font-mono">
                                    <th className="pb-1.5 text-right">{lang === 'ar' ? 'الهوية / المنتج' : 'PRODUCT / SKU'}</th>
                                    <th className="pb-1.5 text-center">{lang === 'ar' ? 'الكمية' : 'QTY'}</th>
                                    <th className="pb-1.5 text-left">{lang === 'ar' ? 'سعر الوحدة' : 'PRICE'}</th>
                                    <th className="pb-1.5 text-left">{lang === 'ar' ? 'الإجمالي' : 'TOTAL (EGP)'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {editSelectedProducts.map((op, i) => {
                                    const unitPrice = parseFloat(String(op.product.price).replace(/[^0-9]/g, '')) || 0;
                                    const total = unitPrice * (op.quantity || 1);
                                    return (
                                      <tr key={i} className="border-b border-white/5 py-1.5">
                                        <td className="py-2.5 text-right">
                                          <div className="flex items-center gap-2">
                                            {op.product.image ? (
                                              <img 
                                                src={op.product.image} 
                                                alt={op.product.name} 
                                                className="w-7 h-7 object-cover rounded border border-white/5"
                                                referrerPolicy="no-referrer"
                                              />
                                            ) : (
                                              <div className="w-7 h-7 bg-black/45 rounded border border-white/5 flex items-center justify-center">
                                                <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                                              </div>
                                            )}
                                            <div>
                                              <span className="font-semibold block">{lang === 'ar' ? op.product.nameAr || op.product.name : op.product.name}</span>
                                              <span className="text-[8.5px] text-gray-500 font-mono block">SKU: {op.product.id}</span>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-2.5 text-center font-mono text-gray-300">{op.quantity || 1}</td>
                                        <td className="py-2.5 text-left font-mono text-gray-300">{unitPrice.toLocaleString()}</td>
                                        <td className="py-2.5 text-left font-mono text-cyan-400 font-semibold">{total.toLocaleString()}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* FINANCIAL SUMMARY & LEDGER ANALYSIS */}
                        {(() => {
                          const associatedBike = motorcycles.find(m => m.id === selectedOperation.motorcycleId);
                          const bikeCost = associatedBike ? parseFloat(String(associatedBike.price).replace(/[^0-9]/g, '')) || 0 : 0;
                          const prodsCost = editSelectedProducts.reduce((sum, item) => sum + (parseFloat(String(item.product.price).replace(/[^0-9]/g, '')) || 0) * (item.quantity || 1), 0);
                          const orderPriceTotal = bikeCost + prodsCost;
                          const calculatedTax = (orderPriceTotal - editDiscountAmount) * editTaxRate / 100;
                          const grandOrderFinalTotal = (orderPriceTotal - editDiscountAmount) + calculatedTax;

                          return (
                            <div className="max-w-md mr-auto bg-black/40 border border-white/5 p-4 rounded-xl space-y-2 text-right font-mono text-[10.5px]">
                              <div className="flex justify-between items-center text-gray-400">
                                <span>{lang === 'ar' ? 'سعر الدراجات النارية:' : 'BIKES GROUP SUBTOTAL:'}</span>
                                <span className="text-white">{bikeCost.toLocaleString()} EGP</span>
                              </div>
                              <div className="flex justify-between items-center text-gray-400">
                                <span>{lang === 'ar' ? 'إجمالي الملحقات والإكسسوارات:' : 'PRODUCTS ACCESSORIES TOTAL:'}</span>
                                <span className="text-white">{prodsCost.toLocaleString()} EGP</span>
                              </div>
                              <div className="flex justify-between items-center text-gray-400 border-b border-white/5 pb-2">
                                <span>{lang === 'ar' ? 'الخصم الخاص الممنوح للعميل:' : 'DIRECT DISCOUNT APPLIED:'}</span>
                                <span className="text-yellow-400 font-bold">-{editDiscountAmount.toLocaleString()} EGP</span>
                              </div>
                              <div className="flex justify-between items-center text-gray-400 pt-1">
                                <span>{lang === 'ar' ? `ضريبة القيمة المضافة الإجمالية (${editTaxRate}%):` : `VAT / INTERNAL RET TAX (${editTaxRate}%):`}</span>
                                <span className="text-cyan-400">+{calculatedTax.toLocaleString()} EGP</span>
                              </div>
                              <div className="flex justify-between items-center border-t border-white/5 pt-2 text-xs font-bold text-white">
                                <span>{lang === 'ar' ? 'الصافي النهائي للمطالبة المالية:' : 'TOTAL OUTSTANDING GROSS:'}</span>
                                <span className="text-green-400 font-extrabold text-base">{grandOrderFinalTotal.toLocaleString()} EGP</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* FOUR SYSTEM ACTIVE QR CODES ROW CLUSTER */}
                        <div className="p-4 rounded-xl border border-white/5 bg-black/45 space-y-3.5">
                          <h4 className="text-[9px] font-black tracking-wider text-yellow-500 uppercase text-center font-mono">
                            🔍 SECURITY AUTHENTICATION SHIFT DECK & VERIFIABLE LOGS QR
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="space-y-1 p-2 bg-black/40 rounded-lg border border-white/5 flex flex-col items-center">
                              <QRCodeSVG value={`https://elkholy.com/operation/${selectedOperation.id}`} size={56} />
                              <span className="text-[8px] text-gray-500 font-mono tracking-tighter block mt-1 uppercase leading-none">{lang === 'ar' ? 'عملية' : 'OPERATION QR'}</span>
                            </div>
                            <div className="space-y-1 p-2 bg-black/40 rounded-lg border border-white/5 flex flex-col items-center">
                              <QRCodeSVG value={`https://elkholy.com/customer/${editCustomerPhone || 'generic'}`} size={56} />
                              <span className="text-[8px] text-gray-500 font-mono tracking-tighter block mt-1 uppercase leading-none">{lang === 'ar' ? 'عميل' : 'CUSTOMER QR'}</span>
                            </div>
                            <div className="space-y-1 p-2 bg-black/40 rounded-lg border border-white/5 flex flex-col items-center">
                              <QRCodeSVG value={selectedOperation.motorcycleId ? `https://elkholy.com/bike/${selectedOperation.motorcycleId}` : 'https://elkholy.com/showroom'} size={56} />
                              <span className="text-[8px] text-gray-500 font-mono tracking-tighter block mt-1 uppercase leading-none">{lang === 'ar' ? 'دراجة' : 'MOTORCYCLE QR'}</span>
                            </div>
                            <div className="space-y-1 p-2 bg-black/40 rounded-lg border border-white/5 flex flex-col items-center">
                              <QRCodeSVG value={editSelectedProducts[0]?.product?.id ? `https://elkholy.com/store/${editSelectedProducts[0].product.id}` : 'https://elkholy.com/store'} size={56} />
                              <span className="text-[8px] text-gray-500 font-mono tracking-tighter block mt-1 uppercase leading-none">{lang === 'ar' ? 'منتجات' : 'PRODUCT QR'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Signatures block inside preview exactly identical to paper print to keep previews matching */}
                        <div className="grid grid-cols-2 gap-4 text-center pt-6 border-t border-white/5 text-[10px] text-gray-400">
                          <div className="space-y-3">
                            <h5 className="font-bold">{lang === 'ar' ? 'توقيع وختم المعرض المرخص' : 'APPROVED SHOWROOM OFFICER'}</h5>
                            <div className="h-6 w-32 border-b border-dashed border-white/20 mx-auto" />
                          </div>
                          <div className="space-y-3">
                            <h5 className="font-bold">{lang === 'ar' ? 'إقرار العميل المستلم' : 'CUSTOMER SIGNATURE'}</h5>
                            <div className="h-6 w-32 border-b border-dashed border-white/20 mx-auto" />
                          </div>
                        </div>

                        {/* Bottom disclaimer */}
                        <div className="text-center text-[8.5px] text-gray-500 border-t border-white/5 pt-3">
                          {lang === 'ar'
                            ? 'نظام الخولي موتورز الذكي للفواتير المصدقة جمركياً بجمهورية مصر العربية.'
                            : 'Verifiable luxury digital invoice certificate matching national standards.'}
                        </div>
                      </div>

                    </div>

                    {/* RIGHT PANEL: Interactive Action Toolbar Panel */}
                    <div className="w-full md:w-80 bg-black/50 border-t md:border-t-0 md:border-l border-white/5 p-5 flex flex-col gap-4 justify-between">
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-black font-mono tracking-wider text-gray-400 uppercase border-b border-white/5 pb-1 mb-2">
                            {lang === 'ar' ? '⚙️ إجراءات الفاتورة' : '⚙️ PREVIEW ACTIONS'}
                          </h4>
                          <span className="text-[10px] text-gray-500 block">
                            {lang === 'ar' ? 'حدد ترخيص الإخراج المطلوب للفاتورة:' : 'Execute document generation or dispatch operations:'}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {/* Print action and download actions */}
                          <button
                            onClick={handleDownloadPDF}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600/20 to-red-500/10 hover:from-red-600/30 text-red-400 border border-red-500/20 font-sans font-bold text-xs cursor-pointer shadow transition-all active:scale-97"
                          >
                            <span className="font-mono text-[10px]">SAVE AS PDF (A4)</span>
                            <div className="flex items-center gap-2">
                              <span>{lang === 'ar' ? 'تحميل PDF ⬇' : 'Download PDF ⬇'}</span>
                              <FileText className="w-4 h-4 text-red-500" />
                            </div>
                          </button>

                          <button
                            onClick={handleDownloadPNG}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#22D3EE]/20 to-[#22D3EE]/10 hover:from-[#22D3EE]/30 text-[#22D3EE] border border-cyan-500/20 font-sans font-bold text-xs cursor-pointer shadow transition-all active:scale-97"
                          >
                            <span className="font-mono text-[10px]">HIGH RESOLUTION PNG</span>
                            <div className="flex items-center gap-2">
                              <span>{lang === 'ar' ? 'تحميل صورة 🖼' : 'Download PNG 🖼'}</span>
                              <ImageIcon className="w-4 h-4 text-cyan-400" />
                            </div>
                          </button>

                          <button
                            onClick={handlePrintInvoice}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-750 hover:bg-white hover:text-black hover:from-white hover:to-white text-gray-200 border border-white/10 font-sans font-bold text-xs cursor-pointer shadow transition-all active:scale-97"
                          >
                            <span className="font-mono text-[10px]">PAPER PRINTER (A4)</span>
                            <div className="flex items-center gap-2">
                              <span>{lang === 'ar' ? 'طباعة ورقية 🖨' : 'Print Invoice 🖨'}</span>
                              <Printer className="w-4 h-4 text-gray-400" />
                            </div>
                          </button>
                        </div>

                        <div className="border-t border-white/5 pt-3 space-y-2.5">
                          <h5 className="text-[10px] font-bold font-mono text-gray-400 uppercase">
                            📲 {lang === 'ar' ? 'خيارات الإرسال والتسليم المباشر' : 'SEND & CUSTOMER DELIVERY:'}
                          </h5>

                          {sessionUser?.role === 'Staff' && (
                            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex items-start gap-1.5 font-sans">
                              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-red-400 mt-0.5" />
                              <span>{lang === 'ar' ? 'صلاحيات منخفضة: لا يمكنك إرسال الفاتورة للعميل (محمي للمشرفين والمعلمين فقط).' : 'Restricted Role: Staff cannot send invoices. Requires Manager or Admin.'}</span>
                            </div>
                          )}

                          <button
                            onClick={() => handleSendInvoice('whatsapp')}
                            disabled={sessionUser?.role === 'Staff'}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 disabled:opacity-50 disabled:hover:bg-emerald-600/15 text-emerald-300 border border-emerald-500/20 font-sans font-bold text-xs cursor-pointer shadow transition-all active:scale-97"
                          >
                            <span className="font-mono text-[10px]">WHATSAPP DIRECT</span>
                            <div className="flex items-center gap-2">
                              <span>{lang === 'ar' ? 'إرسال واتساب 📲' : 'WhatsApp Delivery 📲'}</span>
                              <Send className="w-4 h-4 text-emerald-400" />
                            </div>
                          </button>

                          <button
                            onClick={() => handleSendInvoice('email')}
                            disabled={sessionUser?.role === 'Staff'}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 disabled:opacity-50 disabled:hover:bg-indigo-600/15 text-indigo-300 border border-indigo-500/20 font-sans font-bold text-xs cursor-pointer shadow transition-all active:scale-97"
                          >
                            <span className="font-mono text-[10px]">EMAIL INBOX DELIVERY</span>
                            <div className="flex items-center gap-2">
                              <span>{lang === 'ar' ? 'إرسال إيميل ✉' : 'Email Delivery ✉'}</span>
                              <Mail className="w-4 h-4 text-indigo-400" />
                            </div>
                          </button>

                          <button
                            onClick={() => handleSendInvoice('both')}
                            disabled={sessionUser?.role === 'Staff'}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 disabled:opacity-50 disabled:hover:bg-purple-600/15 text-purple-300 border border-purple-500/20 font-sans font-bold text-xs cursor-pointer shadow transition-all active:scale-97"
                          >
                            <span className="font-mono text-[10px]">ULTIMATE COMBINED</span>
                            <div className="flex items-center gap-2">
                              <span>{lang === 'ar' ? 'إرسال بكليهما 📲✉' : 'Send Both 📲✉'}</span>
                              <CheckCircle2 className="w-4 h-4 text-purple-400" />
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <span className="text-[10px] text-gray-500 block text-center font-mono uppercase">
                          Authorized node: {sessionUser?.username?.toUpperCase() || 'HOST'}
                        </span>
                      </div>

                    </div>

                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================================== CUSTOMER DELIVERY PREVIEW CONFIRMATION DIALOG ================================== */}
          <AnimatePresence>
            {isDeliveryModalOpen && selectedOperation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                dir={dir}
              >
                <div className="w-full max-w-md bg-[#0B101E] border border-indigo-500/20 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-sm font-bold font-mono tracking-wider text-yellow-500 uppercase flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-yellow-500" />
                      <span>{lang === 'ar' ? '📲 تأكيد تسليم وإرسال الفاتورة' : '📲 CONFIRM INVOICE DELIVERY'}</span>
                    </h3>
                    <button 
                      onClick={() => setIsDeliveryModalOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-right font-sans">
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1.5 text-[11px]">
                        <span className="text-white font-bold">{editCustomerName}</span>
                        <span className="text-gray-400">{lang === 'ar' ? 'اسم العميل:' : 'Customer Name:'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-1.5 text-[11px]">
                        <span className="text-white font-bold font-mono">{editCustomerPhone}</span>
                        <span className="text-gray-400">{lang === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-yellow-400 font-bold uppercase font-mono">{deliveryMethod.toUpperCase()}</span>
                        <span className="text-gray-400">{lang === 'ar' ? 'طريقة التسليم:' : 'Delivery Method:'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 block font-mono">
                        {lang === 'ar' ? 'تعديل طريقة التسليم:' : 'Select Transmission Channel:'}
                      </label>
                      <select
                        value={deliveryMethod}
                        onChange={(e: any) => setDeliveryMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-black/60 border border-white/[0.08] text-white focus:border-indigo-500 rounded-lg text-xs focus:outline-none text-right font-medium"
                      >
                        <option value="whatsapp">{lang === 'ar' ? '📲 WhatsApp Delivery (واتساب فوري)' : 'WhatsApp Delivery'}</option>
                        <option value="email">{lang === 'ar' ? '✉ Email Direct (بريد إلكتروني)' : 'Email Direct'}</option>
                        <option value="both">{lang === 'ar' ? '📲✉ Transmit on Both Channels (كلا الخيارين)' : 'Transmit on Both Channels'}</option>
                      </select>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-relaxed text-center font-mono">
                      {lang === 'ar' 
                        ? 'سيقوم النظام بتشفير وثيقة المبيعات الرسمية بصيغة رقمية مخصصة وإرسالها فوراً لوسائل اتصال العميل في سجلات المعرض.' 
                        : 'System will compile visual certificate specs and transmit directly to the registered customer coordinates listed on ledger.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setIsDeliveryModalOpen(false)}
                      className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 font-sans font-bold text-xs border border-white/5 cursor-pointer shadow transition-all"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleConfirmSendInvoice}
                      disabled={isSending}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white font-sans font-bold text-xs border border-indigo-400/20 cursor-pointer shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{lang === 'ar' ? 'جاري الإرسال للتسليم...' : 'Transmitting Docs...'}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'تأكيد الإرسال والتسليم' : 'Confirm & Transmit'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </motion.div>
    </div>
  );
}

const MOCK_HISTORICAL_SALES = [
  // January 2026 (Month 1)
  {
    id: 'HIST-M1-01',
    code: 'sport-cybersport-v4',
    name: 'ElKholy CyberSport V4',
    type: 'motorcycle',
    customerName: 'أحمد محمود العاصي',
    customerPhone: '01099887766',
    quantity: 1,
    unitPrice: 45000,
    totalPrice: 45000,
    date: '2026-01-12'
  },
  {
    id: 'HIST-M1-02',
    code: 'PRD-MTL710',
    name: 'زيت موتول 7100 10W40 تخليقي 1 لتر',
    type: 'product',
    customerName: 'محمد عبد الله',
    customerPhone: '01122334455',
    quantity: 3,
    unitPrice: 850,
    totalPrice: 2550,
    date: '2026-01-18'
  },
  {
    id: 'HIST-M1-03',
    code: 'PRD-AGVK1S',
    name: 'خوذة أي جي في K1 S الرياضية الأصلية',
    type: 'product',
    customerName: 'كريم أشرف',
    customerPhone: '01233445566',
    quantity: 1,
    unitPrice: 11500,
    totalPrice: 11500,
    date: '2026-01-25'
  },

  // February 2026 (Month 2)
  {
    id: 'HIST-M2-01',
    code: 'cruiser-cybercruiser-x1',
    name: 'ElKholy CyberCruiser X1',
    type: 'motorcycle',
    customerName: 'محمود الصاوي',
    customerPhone: '01566778899',
    quantity: 1,
    unitPrice: 38000,
    totalPrice: 38000,
    date: '2026-02-05'
  },
  {
    id: 'HIST-M2-02',
    code: 'PRD-SPCPRO',
    name: 'حامل جوال إس بي كونكت برو للدراجات',
    type: 'product',
    customerName: 'سامح غالي',
    customerPhone: '01011223344',
    quantity: 2,
    unitPrice: 2200,
    totalPrice: 4400,
    date: '2026-02-14'
  },
  {
    id: 'HIST-M2-03',
    code: 'PRD-CRDPTK',
    name: 'انتركوم كاردو باك توك ايدج ثنائي أصلي',
    type: 'product',
    customerName: 'وائل عزت',
    customerPhone: '01155443322',
    quantity: 1,
    unitPrice: 18900,
    totalPrice: 18900,
    date: '2026-02-22'
  },

  // March 2026 (Month 3)
  {
    id: 'HIST-M3-01',
    code: 'scooter-cyberscooter-s2',
    name: 'ElKholy CyberScooter S2',
    type: 'motorcycle',
    customerName: 'ياسر الطوخي',
    customerPhone: '01288776655',
    quantity: 1,
    unitPrice: 16000,
    totalPrice: 16000,
    date: '2026-03-08'
  },
  {
    id: 'HIST-M3-02',
    code: 'PRD-NGKIRD',
    name: 'بوجيه ان جي كي ايريديوم رياضي فائق الأداء',
    type: 'product',
    customerName: 'عمرو أديب',
    customerPhone: '01022334455',
    quantity: 4,
    unitPrice: 450,
    totalPrice: 1800,
    date: '2026-03-15'
  },
  {
    id: 'HIST-M3-03',
    code: 'PRD-YASBAT',
    name: 'بطارية يواسا اليابانية أصلية خالية من الصيانة',
    type: 'product',
    customerName: 'هاني شاكر',
    customerPhone: '01144332211',
    quantity: 1,
    unitPrice: 2400,
    totalPrice: 2400,
    date: '2026-03-29'
  },

  // April 2026 (Month 4)
  {
    id: 'HIST-M4-01',
    code: 'touring-cyberadventure-v8',
    name: 'ElKholy CyberAdventure V8',
    type: 'motorcycle',
    customerName: 'خالد الجندي',
    customerPhone: '01599887766',
    quantity: 1,
    unitPrice: 52000,
    totalPrice: 52000,
    date: '2026-04-10'
  },
  {
    id: 'HIST-M4-02',
    code: 'PRD-LQM4T1',
    name: 'زيت ليكوي مولي الألماني 10W50 للطرقات 1 لتر',
    type: 'product',
    customerName: 'أشرف زكي',
    customerPhone: '01066554433',
    quantity: 5,
    unitPrice: 780,
    totalPrice: 3900,
    date: '2026-04-18'
  },
  {
    id: 'HIST-M4-03',
    code: 'PRD-XIAAIR',
    name: 'منفاخ إطارات شاومي الكهربائي المحمول 2',
    type: 'product',
    customerName: 'إسلام صبحي',
    customerPhone: '01277665544',
    quantity: 2,
    unitPrice: 1850,
    totalPrice: 3700,
    date: '2026-04-26'
  },

  // May 2026 (Month 5)
  {
    id: 'HIST-M5-01',
    code: 'sport-cybersport-v4',
    name: 'ElKholy CyberSport V4',
    type: 'motorcycle',
    customerName: 'أيمن نور',
    customerPhone: '01188990011',
    quantity: 1,
    unitPrice: 45000,
    totalPrice: 45000,
    date: '2026-05-02'
  },
  {
    id: 'HIST-M5-02',
    code: 'PRD-ALPGLV',
    name: 'قفازات البين ستارز GP Pro V2 جلد سباقات الكاربون',
    type: 'product',
    customerName: 'هشام عباس',
    customerPhone: '01544332211',
    quantity: 1,
    unitPrice: 4800,
    totalPrice: 4800,
    date: '2026-05-15'
  },
  {
    id: 'HIST-M5-03',
    code: 'PRD-MCHRD6',
    name: 'إطار كاوتش ميشلان رود 6 أمامي استيراد',
    type: 'product',
    customerName: 'حسن شاكوش',
    customerPhone: '01011335577',
    quantity: 2,
    unitPrice: 6800,
    totalPrice: 13600,
    date: '2026-05-24'
  },

  // June 2026 (Month 6)
  {
    id: 'HIST-M6-01',
    code: 'scooter-cyberscooter-s2',
    name: 'ElKholy CyberScooter S2',
    type: 'motorcycle',
    customerName: 'بهاء سلطان',
    customerPhone: '01244556677',
    quantity: 1,
    unitPrice: 16000,
    totalPrice: 16000,
    date: '2026-06-01'
  },
  {
    id: 'HIST-M6-02',
    code: 'PRD-DNSR4J',
    name: 'جاكيت دانيز ريسينج 4 جلدي فاخر - أسود وذهبي',
    type: 'product',
    customerName: 'تامر حسني',
    customerPhone: '01177665544',
    quantity: 1,
    unitPrice: 18500,
    totalPrice: 18500,
    date: '2026-06-03'
  },
  {
    id: 'HIST-M6-03',
    code: 'PRD-MTLCHL',
    name: 'اسبراي مشحم جنزير موتول C2 حجم 400 مل',
    type: 'product',
    customerName: 'عمرو دياب',
    customerPhone: '01020304050',
    quantity: 4,
    unitPrice: 450,
    totalPrice: 1800,
    date: '2026-06-04'
  }
];
