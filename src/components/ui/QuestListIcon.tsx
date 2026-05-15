import React from 'react';

interface QuestListIconProps {
  size?: number;
  strokeWidth?: number;
  lineColor?: string;
  checkColor?: string;
}

export const QuestListIcon: React.FC<QuestListIconProps> = ({ 
  size = 24, 
  strokeWidth = 2.5,
  lineColor = "currentColor",
  checkColor = "#22c55e"
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Line & Check */}
      <path 
        d="M3 7L5 9L9 5" 
        stroke={checkColor} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M13 7H21" 
        stroke={lineColor} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
      />

      {/* Middle Line & Check */}
      <path 
        d="M3 12L5 14L9 10" 
        stroke={checkColor} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M13 12H21" 
        stroke={lineColor} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
      />

      {/* Bottom Line & Check */}
      <path 
        d="M3 17L5 19L9 15" 
        stroke={checkColor} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M13 17H21" 
        stroke={lineColor} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
      />
    </svg>
  );
};
