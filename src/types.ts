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

export interface UserAccount {
  username: string;
  password?: string;
  role: UserRole;
}

export interface HomepageConfig {
  font: string;
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
    };
    quickLinks: { label: string; labelAr: string; url: string }[];
  };
}
