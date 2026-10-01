import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'compact' | 'segmented' | 'dropdown';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { themeMode, resolvedTheme, isDark, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Segmented mode (ideal for Profile / Settings)
  if (variant === 'segmented') {
    return (
      <div className={`flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-950/80 border border-slate-300/80 dark:border-slate-800 ${className}`}>
        <button
          type="button"
          onClick={() => setThemeMode('system')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            themeMode === 'system'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Seguir apariencia del sistema"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Sistema</span>
        </button>

        <button
          type="button"
          onClick={() => setThemeMode('light')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            themeMode === 'light'
              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Modo claro"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Claro</span>
        </button>

        <button
          type="button"
          onClick={() => setThemeMode('dark')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            themeMode === 'dark'
              ? 'bg-white dark:bg-slate-800 text-sky-500 dark:text-sky-400 shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Modo oscuro"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Oscuro</span>
        </button>
      </div>
    );
  }

  // Dropdown / Popover mode (quick switcher)
  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        id="btn-theme-toggle"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700/60 transition-all cursor-pointer flex items-center gap-1.5"
        title={`Tema actual: ${themeMode === 'system' ? 'Sistema' : themeMode === 'light' ? 'Claro' : 'Oscuro'}`}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-sky-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
        {themeMode === 'system' && (
          <span className="text-[10px] font-mono font-bold px-1 py-0.2 rounded bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            AUTO
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 py-1.5 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-fadeIn text-xs text-slate-700 dark:text-slate-200">
          <button
            type="button"
            onClick={() => {
              setThemeMode('system');
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Sistema</span>
            </div>
            {themeMode === 'system' && <Check className="w-3.5 h-3.5 text-sky-500" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setThemeMode('light');
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Claro</span>
            </div>
            {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-amber-500" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setThemeMode('dark');
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span>Oscuro</span>
            </div>
            {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-sky-400" />}
          </button>
        </div>
      )}
    </div>
  );
};
