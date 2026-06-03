/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Flame, HelpCircle } from 'lucide-react';
import { FilterState, CategorySlug } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FilterSectionProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  speedRange: number;
  onSpeedRangeChange: (speed: number) => void;
}

export default function FilterSection({
  filters,
  onFilterChange,
  speedRange,
  onSpeedRangeChange,
}: FilterSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { lang, dir, t } = useLanguage();

  const setCategory = (category: CategorySlug | 'ALL') => {
    onFilterChange({ ...filters, category });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, priceRange: parseInt(e.target.value, 10) });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] });
  };

  const togglePopularOnly = () => {
    onFilterChange({ ...filters, onlyPopular: !filters.onlyPopular });
  };

  const resetFilters = () => {
    onFilterChange({
      searchQuery: '',
      category: 'ALL',
      priceRange: 50000,
      sortBy: 'default',
      onlyPopular: false,
    });
    onSpeedRangeChange(100);
  };

  const categoriesList: { code: CategorySlug | 'ALL'; name: string }[] = [
    { code: 'ALL', name: t('cat_ALL') },
    { code: 'A', name: t('cat_A') },
    { code: 'B', name: t('cat_B') },
    { code: 'C', name: t('cat_C') },
    { code: 'S', name: t('cat_S') },
  ];

  return (
    <section id="gallery" className="glass-panel rounded-3xl p-6 sm:p-8 max-w-7xl mx-auto border border-white/5 relative z-10 box-glow-indigo text-left" dir={dir}>
      
      {/* Decorative cyber corner highlights */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-accent rounded-tl-3xl opacity-60" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-secondary rounded-br-3xl opacity-60" />

      {/* Header and top panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8" dir={dir}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-brand-accent animate-ping" />
            <h2 className="text-2xl font-bold tracking-wider text-white uppercase font-mono">
              {lang === 'ar' ? <>المعرض <span className="text-brand-accent">الرقمي الفخم</span></> : <>DIGITAL <span className="text-brand-accent">SHOWROOM</span></>}
            </h2>
          </div>
          <p className="text-sm text-gray-400 font-sans leading-relaxed">
            {t('showroom_desc')}
          </p>
        </div>

        {/* Buttons / Settings indicators */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] hover:border-brand-accent font-mono text-xs tracking-wider text-gray-300 hover:text-white bg-[#0B0F1A]/40 transition-colors pointer-events-auto cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-accent" />
            <span>{collapsed ? t('show_advanced') : t('hide_advanced')}</span>
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2.5 rounded-xl border border-white/[0.08] hover:border-brand-secondary font-mono text-xs tracking-wider text-gray-400 hover:text-white bg-[#0B0F1A]/20 transition-colors pointer-events-auto cursor-pointer"
          >
            {t('reset_filters')}
          </button>
        </div>
      </div>

      {/* Core Search & Categories row */}
      <div className="space-y-6">
        
        {/* Row 1: Search & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Search Box */}
          <div className="lg:col-span-4 relative flex items-center">
            <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} w-4 h-4 text-brand-accent`} />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder={t('search_placeholder')}
              className={`w-full bg-[#111827]/70 border border-white/[0.08] focus:border-brand-accent text-white placeholder-gray-500 rounded-xl ${dir === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent/20 transition-all font-sans text-left`} dir={dir}
            />
          </div>

          {/* Categories select pills container */}
          <div className="lg:col-span-8 flex flex-wrap gap-2 items-center">
            {categoriesList.map((cat) => (
              <button
                key={cat.code}
                onClick={() => setCategory(cat.code)}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono tracking-widest font-semibold transition-all duration-300 border cursor-pointer uppercase ${
                  filters.category === cat.code
                    ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white border-transparent shadow-lg shadow-brand-primary/15 scale-105'
                    : 'bg-white/[0.02] text-gray-400 hover:text-white border-white/[0.06] hover:bg-white/[0.05]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

        </div>

        {/* Collapsible Panel with Advanced Filters */}
        {!collapsed && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/[0.06] relative z-20">
            
            {/* Price slider filter */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-400 tracking-wider uppercase">{t('max_budget')}</span>
                <span className="text-brand-accent font-black">
                  {lang === 'ar' ? `${(filters.priceRange * 50).toLocaleString()} جنيه` : `${(filters.priceRange * 50).toLocaleString()} EGP`}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={filters.priceRange}
                onChange={handlePriceChange}
                className="w-full accent-brand-accent"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-600">
                <span>{lang === 'ar' ? '500,000 جنيه' : '500,000 EGP'}</span>
                <span>{lang === 'ar' ? '5,000,000 جنيه' : '5,000,000 EGP'}</span>
              </div>
            </div>

            {/* Speed slider filter */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-400 tracking-wider uppercase">{t('min_speed')}</span>
                <span className="text-brand-secondary font-black">{speedRange} KM/H</span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                step="10"
                value={speedRange}
                onChange={(e) => onSpeedRangeChange(parseInt(e.target.value, 10))}
                className="w-full accent-brand-secondary"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-600">
                <span>100 KM/H</span>
                <span>400 KM/H</span>
              </div>
            </div>

            {/* Sort by dropdown */}
            <div className="space-y-2.5 text-left">
              <label className="block text-xs font-mono text-gray-400 tracking-wider uppercase">
                {t('sort_flights')}
              </label>
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={handleSortChange}
                  className="w-full bg-[#111827]/70 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-accent font-mono uppercase"
                >
                  <option value="default">{t('sort_default')}</option>
                  <option value="price-asc">{t('sort_price_asc')}</option>
                  <option value="price-desc">{t('sort_price_desc')}</option>
                  <option value="speed-desc">{t('sort_speed_desc')}</option>
                </select>
              </div>
            </div>

            {/* Filter Toggle: Popular Only */}
            <div className="col-span-1 md:col-span-3 pt-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.onlyPopular}
                  onChange={togglePopularOnly}
                  className="w-4 h-4 rounded border-brand-accent bg-[#111827]"
                />
                <span className="text-xs font-mono text-gray-300 font-bold uppercase">
                  ⭐ SHOW ONLY {t('crowned_popular')} EXCLUSIVES
                </span>
              </label>
            </div>

          </div>
        )}

      </div>

    </section>
  );
}
