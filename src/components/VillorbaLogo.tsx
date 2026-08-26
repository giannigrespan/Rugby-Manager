import React from 'react';

interface VillorbaLogoProps {
  className?: string;
  variant?: 'horizontal' | 'icon' | 'badge' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  colorMode?: 'light' | 'dark' | 'gold' | 'original';
}

export const VillorbaHedgehogIcon: React.FC<{ className?: string; color?: string }> = ({ 
  className = "w-8 h-8",
  color = "currentColor"
}) => (
  <svg 
    viewBox="0 0 160 180" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Hedgehog Mascot holding rugby ball - Villorba Rugby style */}
    <g stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Spikes / Aculei del riccio */}
      <path 
        d="M 68 15 
           L 72 2 
           L 84 20 
           L 96 6 
           L 102 28 
           L 118 18 
           L 116 40 
           L 134 32 
           L 126 56 
           L 142 54 
           L 128 74 
           L 140 82 
           L 124 96 
           L 132 110 
           L 112 114" 
        fill={color === 'currentColor' ? 'none' : 'transparent'}
      />

      {/* Head, Snout, and Ear */}
      <path 
        d="M 68 15 
           C 54 20, 42 32, 30 42 
           L 16 52 
           C 12 55, 12 58, 18 60 
           L 36 62 
           C 40 68, 38 78, 48 80 
           C 42 88, 38 98, 44 108
           C 48 116, 42 126, 48 134" 
      />

      {/* Snout Nose tip */}
      <circle cx="16" cy="54" r="3.5" fill={color} />

      {/* Eye and Smile */}
      <path d="M 38 48 Q 42 42 44 48" strokeWidth="4" />
      <circle cx="41" cy="46" r="2" fill={color} />
      <path d="M 32 64 Q 38 68 44 65" strokeWidth="3.5" />
      
      {/* Ear */}
      <path d="M 52 38 C 52 32, 58 32, 58 40" strokeWidth="3.5" />

      {/* Cheek and Fur tufts under chin */}
      <path d="M 36 72 L 28 80 L 38 82 L 30 92 L 42 94" />

      {/* Rugby Ball held in arms */}
      <path 
        d="M 72 62 
           C 62 72, 60 95, 74 112 
           C 88 128, 102 122, 106 106 
           C 110 90, 100 68, 86 62 
           Z" 
        strokeWidth="4.5"
      />
      {/* Rugby ball central seam and laces */}
      <path d="M 77 64 Q 86 88 98 116" strokeWidth="3" strokeDasharray="6 3" />

      {/* Left Arm grasping ball */}
      <path 
        d="M 48 80 
           C 52 82, 58 84, 66 84 
           L 70 80 
           C 74 78, 76 86, 70 88 
           L 64 90
           C 56 94, 52 98, 50 102" 
        strokeWidth="4" 
      />

      {/* Right Arm/Paw holding ball right side */}
      <path 
        d="M 100 82 
           C 106 82, 112 86, 110 94 
           C 108 100, 102 102, 96 102" 
        strokeWidth="4" 
      />

      {/* Left Leg and Big Foot with 3 rounded toes */}
      <path 
        d="M 52 130 
           C 50 140, 46 148, 38 152 
           C 28 156, 22 164, 26 172 
           C 30 178, 40 178, 46 172 
           C 50 178, 60 178, 64 172 
           C 68 178, 78 176, 76 166 
           C 74 156, 68 148, 64 134" 
        strokeWidth="4.5"
      />

      {/* Right Leg and Foot */}
      <path 
        d="M 88 128 
           C 90 138, 92 148, 98 152 
           C 96 162, 104 170, 112 170 
           C 118 170, 124 164, 126 156 
           C 128 164, 136 164, 138 156 
           C 140 148, 134 140, 128 136 
           C 120 130, 114 126, 110 114" 
        strokeWidth="4.5"
      />
    </g>
  </svg>
);

export const VillorbaLogo: React.FC<VillorbaLogoProps> = ({
  className = '',
  variant = 'horizontal',
  size = 'md',
  showSubtitle = true,
  colorMode = 'gold'
}) => {
  // Color configuration
  const textColor = colorMode === 'light' 
    ? 'text-[#0B2545]' 
    : colorMode === 'original' 
      ? 'text-[#002B5C]' 
      : 'text-[#E0E0E1]';

  const accentColor = colorMode === 'gold' 
    ? 'text-[#D4AF37]' 
    : colorMode === 'original' 
      ? 'text-[#002B5C]' 
      : 'text-[#D4AF37]';

  const iconColor = colorMode === 'original' 
    ? '#002B5C' 
    : colorMode === 'gold' 
      ? '#D4AF37' 
      : '#FFFFFF';

  // Size mapping
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center p-1.5 rounded-xl bg-[#1D1D21] border border-[#2A2A2E] shadow-md shadow-black/40 ${className}`}>
        <VillorbaHedgehogIcon className={iconSizes[size]} color={iconColor} />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex flex-col items-center text-center p-3 rounded-2xl bg-[#17171A] border border-[#D4AF37]/30 shadow-xl ${className}`}>
        <div className="p-2 rounded-xl bg-[#1D1D21] border border-[#2A2A2E] mb-2">
          <VillorbaHedgehogIcon className={iconSizes[size]} color={iconColor} />
        </div>
        <span className={`font-black tracking-wider uppercase font-sans ${titleSizes[size]} ${textColor}`}>
          VILLORBA
        </span>
        <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${accentColor} -mt-0.5`}>
          RUGBY
        </span>
        {showSubtitle && (
          <span className="mt-1 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
            Serie A Elite
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Iconic Mascot Badge */}
      <div className="flex-shrink-0 p-1.5 rounded-xl bg-[#1D1D21] border border-[#D4AF37]/30 shadow-md shadow-[#D4AF37]/10 flex items-center justify-center">
        <VillorbaHedgehogIcon className={iconSizes[size]} color={iconColor} />
      </div>

      {/* Official Typography */}
      <div className="min-w-0 flex flex-col justify-center leading-none">
        <div className="flex items-baseline">
          <span className={`font-black tracking-wider uppercase font-sans ${titleSizes[size]} ${textColor}`}>
            VILLORBA
          </span>
        </div>
        <div className="flex items-center justify-between w-full mt-0.5">
          <span className={`text-[10px] font-black tracking-[0.35em] uppercase ${accentColor}`}>
            RUGBY
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[9px] uppercase font-bold text-[#D4AF37]/90 tracking-wider truncate mt-1">
            Serie A Elite Femminile
          </p>
        )}
      </div>
    </div>
  );
};
