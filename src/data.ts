/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Motorcycle, HomepageConfig } from './types';

// Importing generated premium images
import heroBannerImg from './assets/images/elkholy_hero_banner_1780393961041.png';
import sportBikeImg from './assets/images/elkholy_sport_bike_1780393979815.png';
import cruiserBikeImg from './assets/images/elkholy_cruiser_bike_1780393998079.png';
import adventureBikeImg from './assets/images/elkholy_adventure_bike_1780394016498.png';
import scooterImg from './assets/images/elkholy_scooter_1780394036022.png';

export const HERO_BG_IMAGE = heroBannerImg;

export const DEFAULT_ADDONS = [
  {
    id: 'addon-helmet',
    name: 'ELKHOLY Cyber Helmet V1',
    nameAr: 'خوذة الخولي الذكية V1',
    image: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=200',
    description: 'Smart helmet with integrated HUD, telemetry sync, and noise cancellation.',
    descAr: 'خوذة ذكية مزودة بشاشة عرض أمامية (HUD)، ومزامنة البيانات وتصفية الضوضاء.',
    price: 150
  },
  {
    id: 'addon-oil',
    name: 'Castrol Ultra Synth Oil',
    nameAr: 'زيت كاسترول التخليقي الفائق',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200',
    description: 'Extended endurance liquid fluid optimized for high-rpm engines.',
    descAr: 'سائل تخليقي لزيادة التحمل مصمم خصيصاً للمحركات ذات الدوران العالي.',
    price: 50
  },
  {
    id: 'addon-holder',
    name: 'Anti-Vibration Phone Mount',
    nameAr: 'حامل هاتف مقاوم للاهتزاز',
    image: 'https://images.unsplash.com/photo-1584438784894-089d6a128f3e?auto=format&fit=crop&q=80&w=200',
    description: 'Aircraft-grade aluminum phone holder with secure multi-clamp lock.',
    descAr: 'حامل هاتف من ألومنيوم الطائرات مع قفل حماية متعدد المحاور لواتساب آمن.',
    price: 30
  },
  {
    id: 'addon-bag',
    name: 'Carbon Aero Smart Bag',
    nameAr: 'حقيبة كربون ذكية انسيابية',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200',
    description: 'Waterproof aerodynamic tail bag with integrated charge controller.',
    descAr: 'حقيبة خلفية انسيابية مقاومة للماء مع وحدة شحن وتحكم متكاملة.',
    price: 185
  }
];

export const MOTORCYCLES_DATA: Motorcycle[] = [
  {
    id: 'sport-cybersport-v4',
    name: 'ElKholy CyberSport V4',
    category: 'A',
    categoryName: 'Sport',
    price: '$37,500',
    priceNum: 37500,
    image: sportBikeImg,
    tagline: 'Adrenaline Redefined',
    shortDesc: 'Aerodynamic carbon-monocoque masterpiece with high-frequency stabilizers and liquid-neon vectoring.',
    longDesc: 'Engineered for maximum racing precision, the CyberSport V4 features a smart carbon monocoque frame, predictive digital aerodynamics, and a state-of-the-art quad-electric powertrain. Designed to break limits, it delivers instant torque and hyper-stability at high velocities.',
    specs: {
      engine: '1200cc Solid-State Quad-Electric Hub',
      topSpeed: '380 km/h',
      fuelConsumption: '0.0 L/100km (Zero-emission)',
      power: '240 hp / 310 Nm',
      weight: '168 kg'
    },
    isPopular: true,
    originalPrice: 42500,
    discount: 5000,
    discountType: 'fixed',
    offerLabel: '🔥 HOT DEAL',
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'sport-phantom-apex',
    name: 'ElKholy Phantom Apex',
    category: 'A',
    categoryName: 'Sport',
    price: '$36,000',
    priceNum: 36000,
    image: sportBikeImg, // Reuse beautifully styled sport image
    tagline: 'The Dark Knight of Speed',
    shortDesc: 'Stealth-styled lightning runner featuring full-spectrum HUD connectivity and custom neural speed presets.',
    longDesc: 'The Phantom Apex is built around active bio-luminescent fiber composites that display real-time speed diagnostics. Outfitted with intelligent torque vectoring and automatic lane-assist lidar, this is the ultimate hybrid speedster.',
    specs: {
      engine: '998cc Liquid-Cooled Plasma Hybrid Engine',
      topSpeed: '330 km/h',
      fuelConsumption: '1.2 L/100km',
      power: '195 hp / 220 Nm',
      weight: '172 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'cruiser-ghost-cruiser',
    name: 'ElKholy Ghost Cruiser',
    category: 'B',
    categoryName: 'Cruiser',
    price: '$43,200',
    priceNum: 43200,
    image: cruiserBikeImg,
    tagline: 'Sovereign of the Highways',
    shortDesc: 'A ultra-luxury relaxed cruiser offering hover-feel electronic suspension and deep-bass exhaust waves.',
    longDesc: 'Enjoy infinite open highways on this ultimate comfortable luxury cruiser. Outfitted with orthopedic smart-gel seats, dynamic cybernetic shock-absorbers that adapt to road imperfections in microseconds, and an custom acoustic synthesizer.',
    specs: {
      engine: '1800cc Dual-Rotor Plasma Induction core',
      topSpeed: '220 km/h',
      fuelConsumption: '0.2 L/100km (Bio-Plasma)',
      power: '165 hp / 290 Nm',
      weight: '245 kg'
    },
    isPopular: true,
    originalPrice: 48000,
    discount: 10,
    discountType: 'percentage',
    offerLabel: '⚡ 10% OFF',
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'cruiser-obsidian',
    name: 'ElKholy Obsidian Cyber',
    category: 'B',
    categoryName: 'Cruiser',
    price: '$39,500',
    priceNum: 39500,
    image: cruiserBikeImg,
    tagline: 'Pure Luxury, Dark Soul',
    shortDesc: 'Handcrafted ultra-low stance cruiser featuring reactive matte titanium framing and adjustable neon base glow.',
    longDesc: 'The Obsidian Cruiser merges retro-futuristic chopper lines with futuristic electronic styling. Features automated parking kickstands, full integrated digital helmet link, and high-fidelity smart radar arrays for complete 360 safety.',
    specs: {
      engine: '1650cc Supercharged Electric Hybrid',
      topSpeed: '200 km/h',
      fuelConsumption: '1.5 L/100km',
      power: '140 hp / 250 Nm',
      weight: '235 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'adventure-dune-wanderer',
    name: 'ElKholy Dune Wanderer',
    category: 'C',
    categoryName: 'Adventure',
    price: '$34,000',
    priceNum: 34000,
    image: adventureBikeImg,
    tagline: 'Master of Every Grid',
    shortDesc: 'Planetary expedition build with robust impact-absorbing armor, smart GPS grids and terrain adaptation.',
    longDesc: 'Engineered for extreme sands, cyber-jungles, and cracked concrete, the Dune Wanderer boasts active magnetic ride suspensions and mud-shedding carbon panels. Equipped with high-powered survival spotlights and emergency power nodes.',
    specs: {
      engine: '1050cc Self-Generating Fusion Battery',
      topSpeed: '190 km/h',
      fuelConsumption: '0.0 L/100km (Fusion Hub)',
      power: '125 hp / 185 Nm',
      weight: '198 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'adventure-horizon',
    name: 'ElKholy Horizon Voyager',
    category: 'C',
    categoryName: 'Adventure',
    price: '$43,000',
    priceNum: 43000,
    image: adventureBikeImg,
    tagline: 'Endless Horizons Await',
    shortDesc: 'The luxury continent-crosser containing virtual shielding, multi-fuel bio-systems, and campsite battery link.',
    longDesc: 'Our flagship adventurer features a biological plasma generator, allowing it to take bio-fuels without losing its glowing electric propulsion capacity. Includes integrated dual 6K HUD navigation displays and an extra cargo-drone bay.',
    specs: {
      engine: '1250cc Multi-fuel Bio-Plasma Generator',
      topSpeed: '210 km/h',
      fuelConsumption: '2.1 L/100km',
      power: '155 hp / 240 Nm',
      weight: '215 kg'
    },
    isPopular: true,
    originalPrice: 45000,
    discount: 2000,
    discountType: 'fixed',
    offerLabel: '🔥 MEGA DEAL',
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'scooter-cyberglide',
    name: 'ElKholy CyberGlide X',
    category: 'S',
    categoryName: 'Scooter',
    price: '$12,500',
    priceNum: 12500,
    image: scooterImg,
    tagline: 'Reclaim the Urban Core',
    shortDesc: 'High-end smart scooter with hover-inspired design, interactive heads-up screen, and automatic city lane tracking.',
    longDesc: 'Designed to slalom through neo-city traffic jams in style. Built-in magnetic hub motor and dynamic smart-cruise controller ensure smooth riding. Charges fully in under 8 minutes with high-speed quantum chargers.',
    specs: {
      engine: '400cc Hyper-Magnetic Urban Hub Motor',
      topSpeed: '135 km/h',
      fuelConsumption: '0.0 L/100km (High-density battery)',
      power: '55 hp / 95 Nm',
      weight: '110 kg'
    },
    isPopular: true,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'scooter-neon-breeze',
    name: 'ElKholy Neon Breeze',
    category: 'S',
    categoryName: 'Scooter',
    price: '$9,000',
    priceNum: 9000,
    image: scooterImg,
    tagline: 'Agility Meets Neon Elegance',
    shortDesc: 'Comfortable lightweight smart scooter featuring interchangeable side trunks and adaptive underglow lighting strips.',
    longDesc: 'The Neon Breeze combines extreme agility with high-end aesthetic details. Custom-sync the wheel lights directly to your smartphone music beats. Built-in secure wireless helmet lock and advanced anti-theft biometrics.',
    specs: {
      engine: '300cc Brushless Direct-Drive Motor',
      topSpeed: '110 km/h',
      fuelConsumption: '0.0 L/100km (Solid-electrolyte battery)',
      power: '38 hp / 72 Nm',
      weight: '95 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  }
];

export const CATEGORY_DES_MAP = {
  A: {
    title: "⚡ Sport Motorcycles",
    desc: "Engineered for pure speed, extreme acceleration, and cutting-edge digital aerodynamics. Built for track dominance and night speed."
  },
  B: {
    title: "🛋 Cruiser Motorcycles",
    desc: "Where low-slung retro-classic chopper comfort meets continuous high-energy hover magnetic power. Cruise the cosmic highways."
  },
  C: {
    title: "🌎 Adventure / Touring Series",
    desc: "Robust off-road armored builds crafted to bypass structural constraints, dust storms, and extreme gravel terrains with ease."
  },
  S: {
    title: "🔋 Smart City Scooters",
    desc: "Ultra-sleek, lightweight electric urban slalomers with instant high-density charging and interactive multi-touch cockpits."
  }
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  font: 'Space Grotesk',
  theme: {
    primaryColor: '#6366F1',
    secondaryColor: '#A855F7',
    backgroundColor: '#0B0F1A',
    buttonRadius: 'rounded-xl',
    iconShape: 'circle',
    spacingMultiplier: 1.0,
  },
  header: {
    backgroundImage: HERO_BG_IMAGE,
    logoUrl: '',
    logoText: 'ELKHOLY',
    logoTextAr: 'الخولي',
    logoSize: 'medium',
    logoPosition: 'left',
    logoEffect: 'glow',
    title: 'ELKHOLY',
    titleAr: 'الخولي',
    accent: 'MOTORS',
    accentAr: 'موتورز',
    subtitle: 'RIDE THE FUTURE',
    subtitleAr: 'سابق مع المستقبل',
    customHtmlEnabled: false,
    customHtml: `<div class="p-4 bg-white/5 border border-white/10 rounded-xl my-4 text-center text-xs font-mono">
  <p class="text-brand-accent font-bold">✨ EXTREME RACING EVENT CODES ACTIVE ✨</p>
  <p class="text-gray-400 mt-1">Special track testing starts Friday 8:00 PM at Cairo Ring Road virtual gateway. All operators welcome.</p>
</div>`,
    buttonExploreText: 'EXPLORE VEHICLES ↓',
    buttonExploreTextAr: 'استكشف المركبات ↓',
    buttonBookText: 'QUICK BOOK 🏆',
    buttonBookTextAr: 'حجز سريع 🏆',
    animationsEnabled: true,
  },
  mainContent: {
    showCategories: true,
    showFeatured: true,
    showOffers: true,
    categoriesTitle: 'Showroom Categories',
    categoriesTitleAr: 'أقسام المعرض الرقمية',
    featuredTitle: 'Holographic Super Machines',
    featuredTitleAr: 'الموتوسيكلات الخارقة المميزة',
    offersTitle: 'Active Trade Options & Discounts',
    offersTitleAr: 'العروض الساخنة والخصومات المتفردة',
    layoutStyle: 'grid',
    customCategoryIcons: {
      A: '',
      B: '',
      C: '',
      S: '',
    },
    iconColor: '#22D3EE',
    iconSize: 'md',
  },
  footer: {
    visible: true,
    collapsible: true,
    content: 'Step inside the virtual grid. ElKholy Motors introduces extreme-output solid-state performance bikes, plasma touring adventurers, and high-fidelity smart urban scooters designed in 2026. Explore our catalog, review blueprints, and book a secure ride directly.',
    contentAr: 'انضم إلى عالم الغد. تقدم الخولي موتورز أقوى الموتوسيكلات والاسكوترات فائقة الأداء للمستقبل. استكشف كتالوجاتنا، واقرأ المواصفات واحجز رحلتك مباشرة.',
    socialLinks: {
      facebook: 'https://facebook.com/elkholy.motors',
      instagram: 'https://instagram.com/elkholy.motors',
      whatsapp: 'https://wa.me/201007062123',
      youtube: 'https://youtube.com/elkholy.motors',
    },
    quickLinks: [
      { label: 'Home', labelAr: 'الرئيسية', url: '#home' },
      { label: 'Showroom', labelAr: 'المعرض الرقمي', url: '#gallery' },
      { label: 'Categories', labelAr: 'الأقسام', url: '#categories' },
    ],
  },
};

