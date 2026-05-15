import React from 'react';

interface ShopIconProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const ShopIcon: React.FC<ShopIconProps> = ({ 
  size = 24, 
  strokeWidth = 2.5,
  color = "currentColor" 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bag Body */}
      <path d="M6 8h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" />
      {/* Handle */}
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
};
