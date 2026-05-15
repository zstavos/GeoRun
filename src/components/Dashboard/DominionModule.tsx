import React, { useState } from 'react';
import { useAuth } from '../FirebaseProvider';
import { Shield, Target, Crosshair, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CLASSES = [
  { id: 'scout', name: 'Scout', icon: <Target size={14} />, desc: 'High speed, low defense' },
  { id: 'tank', name: 'Tank', icon: <Shield size={14} />, desc: 'Low speed, high defense' },
  { id: 'phantom', name: 'Phantom', icon: <Crosshair size={14} />, desc: 'Stealth movement' }
];

export const DominionModule: React.FC = () => {
  const { profile } = useAuth();
  const [currentClassIdx, setCurrentClassIdx] = useState(0);

  const cycleClass = () => {
    setCurrentClassIdx((prev) => (prev + 1) % CLASSES.length);
  };

  const currentClass = CLASSES[currentClassIdx];

  return (
    <section className="bento-card p-6 flex flex-col justify-between bg-white relative overflow-hidden group min-h-[220px]">
      <div className="absolute top-0 right-0 p-4 text-slate-50">
        <Shield size={120} strokeWidth={1} />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic mb-4">Dominion integrity</h3>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-[2rem] border border-slate-100 bg-slate-50 flex items-center justify-center font-black text-rose-600 text-2xl shadow-sm">
            {profile?.ownedTerritoryCount || 0}
          </div>
          <div>
            <div className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Sectors held</div>
            <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none mt-1">Validated grid units</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        <div className="space-y-2">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Operative Class</p>
          <button 
            onClick={cycleClass}
            className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-slate-100 transition-all group/btn"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white">
                {currentClass.icon}
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">{currentClass.name}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">{currentClass.desc}</p>
              </div>
            </div>
            <div className="text-[9px] font-black text-slate-400 group-hover/btn:text-rose-600 transition-colors uppercase italic pr-2">Cycle</div>
          </button>
        </div>
      </div>
    </section>
  );
};
