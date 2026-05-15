import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coins, Check } from 'lucide-react';
import { ShopIcon } from '../ui/ShopIcon';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // Hats
  { id: 'h1', name: 'Tactical Cap', price: 450, category: 'Hats', image: '🧢' },
  { id: 'h2', name: 'Recon Beanie', price: 300, category: 'Hats', image: '🧶' },
  { id: 'h3', name: 'Elite Beret', price: 600, category: 'Hats', image: '💂' },
  // Shirts
  { id: 'sh1', name: 'Stealth Tee', price: 800, category: 'Shirts', image: '👕' },
  { id: 'sh2', name: 'Combat Hoodie', price: 1200, category: 'Shirts', image: '🧥' },
  { id: 'sh3', name: 'Tactical Vest', price: 1500, category: 'Shirts', image: '🎽' },
  // Pants
  { id: 'p1', name: 'Cargo Runners', price: 900, category: 'Pants', image: '👖' },
  { id: 'p2', name: 'Stealth Slacks', price: 1100, category: 'Pants', image: '🚶' },
  // Shoes
  { id: 's1', name: 'Recon Boots', price: 1400, category: 'Shoes', image: '🥾' },
  { id: 's2', name: 'Sprint Sneakers', price: 1000, category: 'Shoes', image: '👟' },
  // Accessories
  { id: 'a1', name: 'Tactical Watch', price: 2000, category: 'Accessories', image: '⌚' },
  { id: 'a2', name: 'Recon Goggles', price: 2500, category: 'Accessories', image: '🥽' },
  { id: 'a3', name: 'Drone Remote', price: 5000, category: 'Accessories', image: '🎮' },
];

const CATEGORIES = ['Hats', 'Shirts', 'Pants', 'Shoes', 'Accessories'];

interface ShopWindowProps {
  isOpen: boolean;
  onClose: () => void;
  userCredits: number;
  inventory: string[];
  equippedItems: string[];
  onPurchase: (item: ShopItem) => void;
  onEquip: (itemId: string, category: string) => void;
}

export const ShopWindow: React.FC<ShopWindowProps> = ({ 
  isOpen, 
  onClose, 
  userCredits, 
  inventory = [], 
  equippedItems = [],
  onPurchase,
  onEquip
}) => {
  const [activeCategory, setActiveCategory] = useState('Hats');
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  const filteredItems = SHOP_ITEMS.filter(item => item.category === activeCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 shrink-0 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900">
            <ShopIcon size={24} strokeWidth={2.5} color="#fb7185" />
            Shop
          </h1>
        </div>
        
        <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 shadow-sm">
          <Coins size={18} className="text-amber-500" />
          <span className="text-sm font-black text-amber-600">{userCredits.toLocaleString()} Credits</span>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="w-full bg-white border-b border-slate-100 sticky top-20 z-10 overflow-x-auto scrollbar-hide">
        <div className="flex px-4 py-4 min-w-max gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeCategory === category 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Item Grid */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-slate-50/30">
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <motion.button
              key={item.id}
              layoutId={item.id}
              onClick={() => {
                const isOwned = inventory.includes(item.id);
                if (isOwned) {
                  onEquip(item.id, item.category);
                } else {
                  setConfirmItem(item);
                }
              }}
              className="group p-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md hover:border-slate-200 active:scale-95"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform duration-500 relative">
                {item.image}
                {equippedItems.includes(item.id) && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <Check size={14} strokeWidth={4} />
                  </div>
                )}
              </div>
              <p className="font-black text-slate-900 text-sm mb-2">{item.name}</p>
              
              {inventory.includes(item.id) ? (
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  equippedItems.includes(item.id) 
                    ? 'bg-rose-100 text-rose-600' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {equippedItems.includes(item.id) ? 'Equipped' : 'Equip'}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                  <Coins size={12} className="text-amber-500" />
                  <span className="text-[10px] font-black text-amber-600">{item.price}</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
        <div className="h-24" /> {/* Spacer for bottom Nav spacing padding */}
      </div>

      {/* Confirmation Popup */}
      <AnimatePresence>
        {confirmItem && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setConfirmItem(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xs bg-white border border-slate-100 rounded-[3rem] p-8 text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto mb-6">
                {confirmItem.image}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{confirmItem.name}</h3>
              <p className="text-slate-500 text-sm font-bold mb-8">Confirm purchase for {confirmItem.price} credits?</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    onPurchase(confirmItem);
                    setConfirmItem(null);
                  }}
                  disabled={userCredits < confirmItem.price}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                >
                  {userCredits >= confirmItem.price ? 'Purchase' : 'Insufficient Credits'}
                </button>
                <button 
                  onClick={() => setConfirmItem(null)}
                  className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
