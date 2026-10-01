import React from 'react';

interface C5iLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const C5iLogo: React.FC<C5iLogoProps> = ({
  className = 'w-28 h-24',
  size,
  showText = false,
}) => {
  const dimensionProps = size ? { width: size, height: size } : {};

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <img
        src="/c5i-logo.svg"
        alt="C5i Walkiet"
        className="w-full h-full object-contain filter drop-shadow-md transition-transform"
        {...dimensionProps}
      />

      {showText && (
        <div className="mt-1.5 text-center">
          <span className="text-xs font-black tracking-widest text-[#691c32] dark:text-[#f8fafc] uppercase block">
            C5i Walkiet
          </span>
          <span className="text-[9px] font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            Sistema de Radiocomunicación Táctica
          </span>
        </div>
      )}
    </div>
  );
};
