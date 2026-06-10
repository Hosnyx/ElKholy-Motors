/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategorySlug = 'A' | 'B' | 'C' | 'S';

export interface MotorcycleSpecs {
  engine: string;
  topSpeed: string;
  fuelConsumption: string;
  power: string;
  weight: string;
}

export interface AddOn {
  id: string;
  name: string;
  nameAr?: string;
  image: string;
  description: string;
  descAr?: string;
  price: number;
}

export interface Motorcycle {
  id: string;
  name: string;
  category: CategorySlug;
  categoryName: string;
  price: string;
  priceNum: number;
  image: string;
  shortDesc: string;
  longDesc: string;
  specs: MotorcycleSpecs;
  isPopular: boolean;
  tagline: string;
  // New features
  catalogFileName?: string;
  catalogFileContent?: string; // base64 string or file URL
  originalPrice?: number;
  discount?: number; // percentage or fixed value
  discountType?: 'percentage' | 'fixed';
  offerLabel?: string;
  addOns?: AddOn[];
  relatedProductIds?: string[];
  serialCode?: string;
  isSold?: boolean;
  isReserved?: boolean;
  reservationExpiry?: string;
}

export interface BookingData {
  motorcycleId: string;
  motorcycleName: string;
  category: CategorySlug;
  price: string;
  name: string;
  phone: string;
  email: string;
  date: string;
}

export interface FilterState {
  searchQuery: string;
  category: CategorySlug | 'ALL';
  priceRange: number; // Max price filter
  sortBy: 'price-asc' | 'price-desc' | 'speed-desc' | 'default';
  onlyPopular: boolean;
}

export type UserRole = 'Admin' | 'Manager' | 'Staff';

export type StoreCategory = 'Oils' | 'Safety' | 'Smart' | 'Parts' | 'Lifestyle';

export interface StoreProduct {
  id: string; // The generated Product Code
  name: string;
  nameAr: string;
  category: StoreCategory;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  offerLabel?: string;
  offerLabelAr?: string;
  image: string;
  galleryUrls: string[];
  description: string;
  descriptionAr: string;
  specs: string; // Or mapped key-values
  specsAr: string;
  stockCount: number;
  soldCount: number;
  isHidden: boolean;
  isOffer: boolean;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
}

export interface CartItem {
  id: string;
  product: StoreProduct | Motorcycle | AddOn;
  type: 'product' | 'motorcycle' | 'addon';
  quantity: number;
}

export interface UserAccount {
  username: string;
  password?: string;
  role: UserRole;
}

export interface HomepageConfig {
  font: string;
  fontHeadings?: string;
  fontSubheadings?: string;
  fontBody?: string;
  invoiceWhatsappNumber?: string; // New WhatsApp number for invoices
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    buttonRadius: string;
    iconShape: 'circle' | 'square' | 'squircle';
    spacingMultiplier: number; // 0.8: Compact, 1.0: Normal, 1.2: Expanded
  };
  header: {
    backgroundImage: string;
    logoUrl: string;
    logoText: string;
    logoTextAr: string;
    logoSize?: 'small' | 'medium' | 'large';
    logoPosition?: 'left' | 'center';
    logoEffect?: 'none' | 'glow' | 'neon' | 'shadow';
    title: string;
    titleAr: string;
    accent: string;
    accentAr: string;
    subtitle: string;
    subtitleAr: string;
    customHtmlEnabled: boolean;
    customHtml: string;
    buttonExploreText: string;
    buttonExploreTextAr: string;
    buttonBookText: string;
    buttonBookTextAr: string;
    animationsEnabled: boolean;
  };
  mainContent: {
    showCategories: boolean;
    showFeatured: boolean;
    showOffers: boolean;
    categoriesTitle: string;
    categoriesTitleAr: string;
    featuredTitle: string;
    featuredTitleAr: string;
    offersTitle: string;
    offersTitleAr: string;
    layoutStyle: 'grid' | 'slider';
    customCategoryIcons: {
      A: string;
      B: string;
      C: string;
      S: string;
    };
    iconColor: string;
    iconSize: 'sm' | 'md' | 'lg';
  };
  footer: {
    visible: boolean;
    collapsible: boolean;
    content: string;
    contentAr: string;
    socialLinks: {
      facebook: string;
      instagram: string;
      whatsapp: string;
      youtube: string;
      [key: string]: string;
    };
    quickLinks: { label: string; labelAr: string; url: string }[];
    address?: string;
    addressAr?: string;
    phone?: string;
    email?: string;
    hoursSunThu?: string;
    hoursSunThuAr?: string;
    hoursFri?: string;
    hoursFriAr?: string;
    hoursSat?: string;
    hoursSatAr?: string;
    copyright?: string;
    copyrightAr?: string;
    customSocialLinks?: { id: string; name: string; url: string; iconUrl?: string }[];
  };
}
