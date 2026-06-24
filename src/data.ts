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

const IMAGE_URLS: Record<string, string> = {
  A: 'https://ais-dev-hnldjom4qmimvlbr4q3rxq-767004676094.europe-west2.run.app/src/assets/images/elkholy_sport_bike_1780393979815.png',
  B: 'https://ais-dev-hnldjom4qmimvlbr4q3rxq-767004676094.europe-west2.run.app/src/assets/images/elkholy_cruiser_bike_1780393998079.png',
  C: 'https://ais-dev-hnldjom4qmimvlbr4q3rxq-767004676094.europe-west2.run.app/src/assets/images/elkholy_adventure_bike_1780394016498.png',
  S: 'https://ais-dev-hnldjom4qmimvlbr4q3rxq-767004676094.europe-west2.run.app/src/assets/images/elkholy_scooter_1780394036022.png'
};

export const MOTORCYCLES_DATA: Motorcycle[] = [
  // ==================== CATEGORY A: SPORT (4 models) ====================
  {
    id: 'sport-cybersport-v4',
    name: 'ElKholy CyberSport V4',
    category: 'A',
    categoryName: 'Sport',
    price: '$37,500',
    priceNum: 37500,
    image: IMAGE_URLS['A'],
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
    image: IMAGE_URLS['A'],
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
    id: 'sport-vortex-overdrive',
    name: 'ElKholy Vortex Overdrive',
    category: 'A',
    categoryName: 'Sport',
    price: '$41,000',
    priceNum: 41000,
    image: IMAGE_URLS['A'],
    tagline: 'Break the Sound Barrier',
    shortDesc: 'Precision engineered speed racer with an ionic aerodynamic shell and real-time tire pressure matrix.',
    longDesc: 'Formulated with ultra-high voltage dual magnetic rotors, the Vortex Overdrive is built for enthusiasts seeking sheer adrenaline. Adapts dynamically to asphalt temperatures and wet coefficient indices.',
    specs: {
      engine: '1100cc Dual-Magnetic Rotors Core',
      topSpeed: '360 km/h',
      fuelConsumption: '0.0 L/100km (Electric)',
      power: '220 hp / 285 Nm',
      weight: '165 kg'
    },
    isPopular: true,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'sport-cyberforce-ultra',
    name: 'ElKholy CyberForce Ultra',
    category: 'A',
    categoryName: 'Sport',
    price: '$29,900',
    priceNum: 29900,
    image: IMAGE_URLS['A'],
    tagline: 'Light, Agile, Unleashed',
    shortDesc: 'Lightweight entry-level sport model containing interactive neural navigation links and rapid heat dissipation.',
    longDesc: 'The CyberForce Ultra incorporates aerospace-grade composites for structural resilience. A perfect machine for urban racers seeking track-level performance on everyday streets.',
    specs: {
      engine: '750cc Liquid-Cooled Electric Inducer',
      topSpeed: '280 km/h',
      fuelConsumption: '0.0 L/100km (Electric)',
      power: '150 hp / 190 Nm',
      weight: '155 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'sport-hypercharged-x',
    name: 'ElKholy HyperCharged X',
    category: 'A',
    categoryName: 'Sport',
    price: '$34,500',
    priceNum: 34500,
    image: IMAGE_URLS['A'],
    tagline: 'Futuristic Electric Thunderbolt',
    shortDesc: 'Hypercharged induction superbike featuring active lateral stabilizers and advanced torque vectoring matrices.',
    longDesc: 'The HyperCharged X represents the zenith of electrical velocity. Equipped with custom carbon-glass cooling canals and a solid-electrolyte power pack, this motorcycle delivers continuous high-output propulsion under any track load.',
    specs: {
      engine: '1000cc Dual-Array Supercharged Induction',
      topSpeed: '310 km/h',
      fuelConsumption: '0.0 L/100km (Electric)',
      power: '185 hp / 240 Nm',
      weight: '162 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },

  // ==================== CATEGORY B: CRUISER (4 models) ====================
  {
    id: 'cruiser-ghost-cruiser',
    name: 'ElKholy Ghost Cruiser',
    category: 'B',
    categoryName: 'Cruiser',
    price: '$43,200',
    priceNum: 43200,
    image: IMAGE_URLS['B'],
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
    image: IMAGE_URLS['B'],
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
    id: 'cruiser-titan-beast',
    name: 'ElKholy Titan Beast',
    category: 'B',
    categoryName: 'Cruiser',
    price: '$46,000',
    priceNum: 46000,
    image: IMAGE_URLS['B'],
    tagline: 'The Ultimate Iron Giant',
    shortDesc: 'A colossal low-slung powerhouse offering heavy-duty chrome detailing, ambient dynamic exhaust notes, and dual highway mapping.',
    longDesc: 'The Titan Beast combines a retro double-cradle posture with absolute hyper-electric solid state power. Offers micro-seconds adaptive pneumatic ride buffers to ensure a smooth, luxurious floating sensation.',
    specs: {
      engine: '1900cc Dual Solid State Hybrid Induction',
      topSpeed: '210 km/h',
      fuelConsumption: '0.5 L/100km',
      power: '180 hp / 320 Nm',
      weight: '260 kg'
    },
    isPopular: true,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'cruiser-rebel-v2',
    name: 'ElKholy Rebel V2',
    category: 'B',
    categoryName: 'Cruiser',
    price: '$32,000',
    priceNum: 32000,
    image: IMAGE_URLS['B'],
    tagline: 'Neon Renegade',
    shortDesc: 'Stripped-down bobber styling paired with advanced smart diagnostics, active wheel lights, and standard ABS.',
    longDesc: 'Comfortable, nimble, and beautifully accented with customizable perimeter glow grids. Designed specifically for evening cruises and long relaxed road adventures.',
    specs: {
      engine: '1200cc Parallel-Twin High Torque',
      topSpeed: '180 km/h',
      fuelConsumption: '1.8 L/100km',
      power: '110 hp / 195 Nm',
      weight: '210 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'cruiser-royal-sovereign',
    name: 'ElKholy Royal Sovereign',
    category: 'B',
    categoryName: 'Cruiser',
    price: '$41,500',
    priceNum: 41500,
    image: IMAGE_URLS['B'],
    tagline: 'Imperial Cruiser Majesty',
    shortDesc: 'Premium heavy bobber layout accented with hand-polished nickel cladding, solid-gel comfort frame, and custom smart soundscapes.',
    longDesc: 'Engineered as the quintessential majestic long-distance sovereign, this model provides full active pneumatic load leveling, premium ergonomic heated seating curves, and ambient perimeter LED strips linked directly with navigation alerts.',
    specs: {
      engine: '1750cc Solid-State Magnetic Torque Hub',
      topSpeed: '195 km/h',
      fuelConsumption: '0.0 L/100km (Electric)',
      power: '150 hp / 265 Nm',
      weight: '238 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },

  // ==================== CATEGORY C: TOURING / ADVENTURE (4 models) ====================
  {
    id: 'adventure-dune-wanderer',
    name: 'ElKholy Dune Wanderer',
    category: 'C',
    categoryName: 'Adventure',
    price: '$34,000',
    priceNum: 34000,
    image: IMAGE_URLS['C'],
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
    image: IMAGE_URLS['C'],
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
    id: 'adventure-canyon-tracker',
    name: 'ElKholy Canyon Tracker',
    category: 'C',
    categoryName: 'Adventure',
    price: '$31,500',
    priceNum: 31500,
    image: IMAGE_URLS['C'],
    tagline: 'Pathfinder of the Wilds',
    shortDesc: 'Robust multi-terrain explorer equipped with water-resistant composite side-panniers, manual suspension lifting, and GPRS link.',
    longDesc: 'Perfectly balanced for extended dual-sport expeditions. Equipped with an auxiliary hydrogen-charge cells array that can regenerate energy during passive braking or descent.',
    specs: {
      engine: '950cc Self-charging HydrogenCore',
      topSpeed: '175 km/h',
      fuelConsumption: '0.0 L/100km (Hydrogen)',
      power: '110 hp / 160 Nm',
      weight: '190 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'adventure-aurora-explorer',
    name: 'ElKholy Aurora Explorer',
    category: 'C',
    categoryName: 'Adventure',
    price: '$48,000',
    priceNum: 48000,
    image: IMAGE_URLS['C'],
    tagline: 'The Long Range Pioneer',
    shortDesc: 'Luxury heavy-touring ship equipped with heated seats, satellite navigation HUD, and carbon safety armor.',
    longDesc: 'Whether tracking through remote mountain pathways or embarking on continental tours, the Aurora Explorer delivers supreme stability and cargo space. Double-layered carbon armor bars defend crucial mechanisms from impact.',
    specs: {
      engine: '1400cc Dual-induct Electro-Fusion Cluster',
      topSpeed: '220 km/h',
      fuelConsumption: '0.1 L/100km',
      power: '180 hp / 270 Nm',
      weight: '230 kg'
    },
    isPopular: true,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'adventure-nomad-legend',
    name: 'ElKholy Nomad Legend',
    category: 'C',
    categoryName: 'Adventure',
    price: '$38,900',
    priceNum: 38900,
    image: IMAGE_URLS['C'],
    tagline: 'Untamable Terrain Dominator',
    shortDesc: 'A powerful off-road dual-sport titan constructed with heavy-duty titanium alloy and customizable cargo expansion racks.',
    longDesc: 'The Nomad Legend was built for the fearless. It features predictive multi-terrain traction algorithms, heavy duty reinforced crash frame bars, high capacity adventure panniers, and standard military-grade navigation GPS setups.',
    specs: {
      engine: '1150cc Liquid-Cooled Parallel Twin',
      topSpeed: '200 km/h',
      fuelConsumption: '2.5 L/100km',
      power: '135 hp / 195 Nm',
      weight: '205 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },

  // ==================== CATEGORY S: SCOOTER (4 models) ====================
  {
    id: 'scooter-cyberglide',
    name: 'ElKholy CyberGlide X',
    category: 'S',
    categoryName: 'Scooter',
    price: '$12,500',
    priceNum: 12500,
    image: IMAGE_URLS['S'],
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
    image: IMAGE_URLS['S'],
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
  },
  {
    id: 'scooter-solar-wave',
    name: 'ElKholy Solar Wave Smart',
    category: 'S',
    categoryName: 'Scooter',
    price: '$14,000',
    priceNum: 14000,
    image: IMAGE_URLS['S'],
    tagline: 'Ride the Sunlight',
    shortDesc: 'Lightweight carbon carbon-fiber frame retrofitted with micro solar-recharge panels and built-in navigation.',
    longDesc: 'The Solar Wave features integrated high-efficiency photovoltaic panels across the front fairing, feeding a trickle-charge into the auxiliary battery. Reclaim city commutes on a completely self-sustaining energy loop.',
    specs: {
      engine: '500cc High-Output Solar-Electric Hub',
      topSpeed: '140 km/h',
      fuelConsumption: '0.0 L/100km',
      power: '60 hp / 105 Nm',
      weight: '105 kg'
    },
    isPopular: false,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'scooter-quantum-pulse',
    name: 'ElKholy Quantum Pulse Jet',
    category: 'S',
    categoryName: 'Scooter',
    price: '$16,500',
    priceNum: 16500,
    image: IMAGE_URLS['S'],
    tagline: 'The City Lightning Bolt',
    shortDesc: 'High-velocity premium commuter scooter with instant smart-drive torque, smart helmets support, and perimeter lasers.',
    longDesc: 'The Quantum Pulse represents the upper-tier of premium urban mobility. Featuring double-wishbone active electronic front suspension shocks and a full digital diagnostic cockpit.',
    specs: {
      engine: '650cc Quantum Induction Liquid-Cooled Hub',
      topSpeed: '150 km/h',
      fuelConsumption: '0.0 L/100km',
      power: '72 hp / 120 Nm',
      weight: '115 kg'
    },
    isPopular: true,
    addOns: DEFAULT_ADDONS
  },
  {
    id: 'scooter-fusion-lite',
    name: 'ElKholy Fusion Lite',
    category: 'S',
    categoryName: 'Scooter',
    price: '$11,000',
    priceNum: 11000,
    image: IMAGE_URLS['S'],
    tagline: 'Ultralight Urban Fleet',
    shortDesc: 'Featherweight high-efficiency electronic scooter perfect for quick smart commutes and dense urban corridors.',
    longDesc: 'The Fusion Lite offers responsive performance with dual rear brushless motors and a super compact collapsible posture. Features full interactive bluetooth application linkage for keyless digital engine ignition.',
    specs: {
      engine: '350cc Dual Rear Brushless Hubs',
      topSpeed: '120 km/h',
      fuelConsumption: '0.0 L/100km (Solid state compact)',
      power: '45 hp / 85 Nm',
      weight: '88 kg'
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
  fontHeadings: 'Space Grotesk',
  fontSubheadings: 'Cairo',
  fontBody: 'Inter',
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

