import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hexagon, ChevronRight, Zap, Shield, Target } from 'lucide-react';
import { useTactical } from '../TacticalContext';

const BOOSTS = [
  { id: 'volt', name: 'Volt Sprint', icon: <Zap size={14} />, desc: 'Boost energy restoration speed in contested zones.', color: 'lime' },
  { id: 'guard', name: 'Aegis Shield', icon: <Shield size={14} />, desc: 'Double territory defense for 30 minutes.', color: 'rose' },
  { id: 'scan', name: 'Ghost Scan', icon: <Target size={14} />, desc: 'Hide your movement trail from other operatives.', color: 'sky' }
];

export const UpgradeModule: React.FC = () => {
  const { activeBoost, setActiveBoost } = useTactical();

  return (
    <section className={`bento-card p-6 flex flex-col justify-between relative group cursor-pointer overflow-hidden transition-all min-h-[220px] ${
      activeBoost 
        ? 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-500/10' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <span className={`text-[10px] font-black uppercase tracking-widest italic ${activeBoost ? 'text-rose-600' : 'text-slate-400'}`}>
            {activeBoost ? 'Uplink active' : 'Next upgrade'}
          </span>
          <div className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-sm italic uppercase tracking-widest">
            {activeBoost ? 'SECURE' : 'New'}
          </div>
        </div>

        <div className="mt-auto">
          <AnimatePresence mode="wait">
            {!activeBoost ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="text-2xl font-black italic tracking-tighter leading-none uppercase mb-2 text-slate-900">Vault sprint</div>
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight tracking-tight mb-6">Boost energy restoration speed in contested zones.</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveBoost('volt'); }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Deploy Upgrade <ChevronRight size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                    <Zap size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-600 uppercase italic tracking-widest">Voltage Active</h4>
                    <p className="text-[8px] text-rose-400 uppercase font-black tracking-widest">System Overload in 24:12</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveBoost(null); }}
                  className="w-full py-3 rounded-2xl bg-white border border-rose-200 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                >
                  Terminate Link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {!activeBoost && (
        <Hexagon className="absolute bottom-[-15%] right-[-10%] w-36 h-36 text-slate-50 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-45" />
      )}
    </section>
  );
};
