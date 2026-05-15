import React from 'react';
import { motion } from 'motion/react';

interface MapAvatarProps {
  level: number;
  xp: number;
  equippedItems: string[];
  username?: string;
}

/**
 * MapAvatar Component
 * Renders a cohesive, high-quality character marker for the map.
 * Style: Stylized 3D Top-Down.
 */
export const MapAvatar: React.FC<MapAvatarProps> = ({ level, xp, equippedItems = [], username = 'Explorer' }) => {
  const isStarterShirtUnlocked = xp >= 5000;
  
  const hasHat = equippedItems.some(id => id.startsWith('h'));
  const hasShirt = equippedItems.some(id => id.startsWith('sh')) || (isStarterShirtUnlocked && !equippedItems.some(id => id.startsWith('sh')));
  const hasShoes = equippedItems.some(id => id.startsWith('s'));

  // Logic for character mapping
  const skinTone = "#fcd34d"; // Amber-300 for a vibrant 3D look
  const shirtColor = hasShirt ? "#e11d48" : skinTone; // Rose-600
  const hatColor = "#0f172a"; // Slate-950

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Subtle under-glow for position visibility */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.2, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute w-12 h-12 bg-rose-500/20 blur-md rounded-full"
      />

      {/* Unified Cohesive Sprite (SVG) */}
      <div className="relative w-12 h-12 z-10 flex items-center justify-center drop-shadow-2xl">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="grad_skin" cx="50" cy="45" r="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <radialGradient id="grad_shirt" cx="50" cy="65" r="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#9f1239" />
            </radialGradient>
            <filter id="shadow_inner" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feOffset dx="0" dy="1"/>
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInner"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.2 0" />
              <feMerge>
                <feMergeNode in="SourceGraphic"/>
                <feMergeNode in="shadowInner"/>
              </feMerge>
            </filter>
          </defs>

          {/* Shoulders / Torso (Top-Down) */}
          <ellipse 
            cx="50" cy="62" rx="38" ry="22" 
            fill={hasShirt ? "url(#grad_shirt)" : "url(#grad_skin)"} 
            stroke="#0f172a" 
            strokeWidth="2" 
          />

          {/* Arms */}
          <circle cx="15" cy="62" r="10" fill="url(#grad_skin)" stroke="#0f172a" strokeWidth="2" />
          <circle cx="85" cy="62" r="10" fill="url(#grad_skin)" stroke="#0f172a" strokeWidth="2" />

          {/* Head */}
          <circle 
            cx="50" cy="45" r="22" 
            fill="url(#grad_skin)" 
            stroke="#0f172a" 
            strokeWidth="2" 
          />

          {/* Layer: Hat */}
          {hasHat && (
            <g transform="translate(50, 45)">
              <circle cx="0" cy="0" r="23" fill={hatColor} />
              <path d="M-23 0c0-12.7 10.3-23 23-23s23 10.3 23 23c0 4-4 8-23 8s-23-4-23-8z" fill={hatColor} stroke="#1e293b" strokeWidth="1" />
            </g>
          )}
          
          {/* Hair Detail if no hat */}
          {!hasHat && (
            <path d="M35 35c5-5 25-5 30 0-2-2-28-2-30 0z" fill="#451a03" />
          )}
        </svg>
      </div>

      {/* User Identity Badge - Dark Pill */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl flex items-center gap-2 min-w-max">
          <span className="text-white font-bold text-[12px] tracking-tight antialiased">
            @{username}
          </span>
          <div className="w-[1px] h-3 bg-white/20" />
          <span className="text-rose-400 font-extrabold text-[12px]">
            {level}
          </span>
        </div>
      </div>
    </div>
  );
};

