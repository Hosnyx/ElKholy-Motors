import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingCart, Info, Check, Package, Layers, Shield, Zap, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { StoreProduct, HomepageConfig } from '../types';
import StoreProductCard from './StoreProductCard';

interface StoreViewProps {
  products: StoreProduct[];
  homepageConfig: HomepageConfig;
  onAddToCart: (product: StoreProduct) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: any) => void;
}

export default function StoreView({ products, homepageConfig, onAddToCart, favorites, onToggleFavorite }: StoreViewProps) {
  const { lang, dir, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | StoreProduct['category']>('ALL');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product');
    if (prodId) {
      setSearchQuery(prodId);
      setActiveCategory('ALL');
    }
  }, []);
  
  const categories = [
    { id: 'ALL', labelAr: 'الكل', labelEn: 'All', icon: Layers },
    { id: 'Oils', labelAr: 'زيوت ومحروقات', labelEn: 'Oils & Lubricants', icon: Zap },
    { id: 'Safety', labelAr: 'معدات أمان', labelEn: 'Safety Equipment', icon: Shield },
    { id: 'Smart', labelAr: 'اكسسوارات ذكية', labelEn: 'Smart Accessories', icon: Info },
    { id: 'Parts', labelAr: 'قطع غيار', labelEn: 'Spare Parts', icon: Package },
    { id: 'Lifestyle', labelAr: 'منتجات لايف ستايل', labelEn: 'Lifestyle Products', icon: Check },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== 'ALL' && p.category !== activeCategory) return false;
      if (!p.isHidden) {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.nameAr.includes(q) || p.id.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
        }
        return true;
      }
      return false;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <div className="pt-28 pb-20 min-h-screen bg-[#0B0F1A]" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black font-sans text-white uppercase tracking-tight">
              {lang === 'ar' ? 'المتجر الإلكتروني' : 'Digital Store'}
            </h1>
            <p className="text-brand-accent font-mono text-xs tracking-widest uppercase mt-1">
              {lang === 'ar' ? 'اكسسوارات، قطع غيار والمزيد' : 'Accessories, Parts & More'}
            </p>
          </div>
          
          <div className="relative w-full md:w-auto flex-1 max-w-md">
            <Search className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} />
            <input 
              type="text" 
              placeholder={lang === 'ar' ? 'ابحث برقم المنتج، اسم، تصنيف...' : 'Search by ID, name, category...'}
              className={`w-full bg-[#0F172A]/80 border border-white/10 rounded-xl py-2.5 ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-white focus:border-brand-primary outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-gray-600 transition-all font-mono`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-10 pb-2">
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border whitespace-nowrap transition-all font-mono text-xs tracking-widest uppercase cursor-pointer ${
                  isActive 
                    ? 'bg-brand-primary/10 border-brand-primary text-brand-accent font-bold' 
                    : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {lang === 'ar' ? c.labelAr : c.labelEn}
              </button>
            )
          })}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <StoreProductCard 
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </AnimatePresence>
          
          {filteredProducts.length === 0 && (
             <div className="col-span-full py-20 text-center flex flex-col items-center">
                 <Package className="w-16 h-16 text-white/5 mb-4" />
                 <h2 className="text-xl font-bold text-gray-400 font-sans">{lang === 'ar' ? 'لا توجد منتجات تطابق بحثك' : 'No products match your search'}</h2>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
