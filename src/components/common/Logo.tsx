import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  collapsed?: boolean;
  showTagline?: boolean;
  className?: string;
}

export const MountainLogoSVG: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg
      viewBox="0 0 500 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Facet Gradients */}
        <linearGradient id="gold-bright" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
        <linearGradient id="gold-mid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="gold-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A16207" />
          <stop offset="100%" stopColor="#713F12" />
        </linearGradient>
        <linearGradient id="gold-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#854D0E" />
          <stop offset="100%" stopColor="#3F2205" />
        </linearGradient>
      </defs>

      {/* Geometric Faceted Mountain Peak (Recreated from Official Logo) */}
      <g>
        {/* Far Left Slope */}
        <polygon points="160,260 215,220 220,240" fill="url(#gold-mid)" />
        <polygon points="160,260 220,240 200,280" fill="url(#gold-shadow)" />

        {/* Left Shoulder Peak */}
        <polygon points="200,280 220,240 240,190" fill="url(#gold-bright)" />
        <polygon points="200,280 240,190 250,210" fill="#EAB308" />
        <polygon points="240,190 260,200 250,210" fill="url(#gold-bright)" />
        <polygon points="250,210 260,200 265,225" fill="url(#gold-shadow)" />

        {/* Central Highest Peak */}
        {/* Main Lit Left Face */}
        <polygon points="250,135 285,50 285,170" fill="url(#gold-bright)" />
        <polygon points="250,135 285,170 265,225" fill="#EAB308" />
        <polygon points="240,190 250,135 265,225" fill="url(#gold-mid)" />

        {/* Main Shadow Right Face */}
        <polygon points="285,50 320,110 285,170" fill="url(#gold-shadow)" />
        <polygon points="320,110 350,150 285,170" fill="url(#gold-dark)" />
        <polygon points="285,170 350,150 300,225" fill="url(#gold-shadow)" />

        {/* Sub Peak Right Side */}
        <polygon points="320,110 340,90 350,150" fill="url(#gold-bright)" />
        <polygon points="340,90 375,130 350,150" fill="url(#gold-shadow)" />
        <polygon points="375,130 395,150 350,150" fill="url(#gold-bright)" />

        {/* Far Right Lower Slopes */}
        <polygon points="350,150 395,150 370,210" fill="url(#gold-mid)" />
        <polygon points="395,150 430,200 370,210" fill="url(#gold-bright)" />
        <polygon points="430,200 450,220 370,210" fill="url(#gold-shadow)" />
        <polygon points="395,150 410,180 430,200" fill="url(#gold-dark)" />
      </g>
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  collapsed = false,
  showTagline = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-base', tagline: 'text-[7px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', tagline: 'text-[9px]' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl', tagline: 'text-[11px]' },
    xl: { icon: 'w-24 h-24', text: 'text-5xl', tagline: 'text-[14px]' },
  };

  const currentSize = sizeClasses[size];

  if (collapsed) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`} title="MOTONOMAD">
        <MountainLogoSVG className={currentSize.icon} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Faceted Mountain Symbol */}
      <MountainLogoSVG className={`${currentSize.icon} mb-1 transition-transform duration-300 hover:scale-105`} />

      {/* Brand Text */}
      <div className={`font-black tracking-wider uppercase font-sans leading-none ${currentSize.text}`}>
        <span className="text-white">MOTO</span>
        <span className="text-[#D4A017]">NOMAD</span>
      </div>

      {/* Tagline */}
      {showTagline && (
        <div className={`font-semibold tracking-[0.22em] text-[#C5C6C7] uppercase mt-1 ${currentSize.tagline}`}>
          PREMIUM MOTORCYCLE RENTAL
        </div>
      )}
    </div>
  );
};

export default Logo;
