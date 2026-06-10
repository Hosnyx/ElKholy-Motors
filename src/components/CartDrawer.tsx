import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout
}: CartDrawerProps) {
  const { lang, dir, t } = useLanguage();
  
  const totalPrice = cartItems.reduce((acc, item) => {
    const price = Number((item.product as any).price) || Number((item.product as any).priceNum) || 0;
    return acc + (price * item.quantity);
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: dir === 'rtl' ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-full sm:w-[400px] bg-[#070A11] border-${dir === 'rtl' ? 'r' : 'l'} border-white/[0.08] z-50 flex flex-col shadow-2xl`}
            dir={dir}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <h2 className="text-white font-bold font-sans uppercase tracking-wide">
                    {lang === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {cartItems.length} {lang === 'ar' ? 'عناصر' : 'ITEMS'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <ShoppingBag className="w-12 h-12 text-gray-800" />
                  <p className="text-gray-500 font-mono text-sm uppercase">
                    {lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="w-16 h-16 rounded-lg object-contain bg-[#0B0F1A]" 
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="text-sm text-white font-bold font-sans line-clamp-1 pr-4">
                          {(item.product as any).nameAr && lang === 'ar' ? (item.product as any).nameAr : item.product.name}
                        </div>
                        <button onClick={() => onRemoveItem(item.id)} className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer">
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-brand-accent font-mono text-xs font-bold mt-1">
                        {(Number((item.product as any).price) || Number((item.product as any).priceNum) || 0).toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                         <div className="flex items-center bg-white/5 rounded-lg border border-white/10">
                           <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:bg-white/10 rounded-l-lg text-gray-400 hover:text-white cursor-pointer"><Minus className="w-3 h-3"/></button>
                           <span className="w-6 text-center text-xs font-mono text-white">{item.quantity}</span>
                           <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-white/10 rounded-r-lg text-gray-400 hover:text-white cursor-pointer"><Plus className="w-3 h-3"/></button>
                         </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-white/[0.08] bg-[#0A0D15]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-sans text-sm uppercase">{lang === 'ar' ? 'المجموع الإجمالي:' : 'Subtotal:'}</span>
                  <span className="text-white font-mono font-bold text-xl">{totalPrice.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
                
                <button
                  onClick={onCheckout}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-mono text-sm tracking-widest font-bold uppercase transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'ar' ? 'إتمام الطلب واتساب' : 'Checkout via WhatsApp'}
                </button>
                
                <button
                  onClick={onClearCart}
                  className="w-full mt-3 py-2 text-gray-500 hover:text-red-400 font-mono text-xs uppercase cursor-pointer transition-colors"
                >
                  {lang === 'ar' ? 'تفريغ السلة' : 'Clear Cart'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
