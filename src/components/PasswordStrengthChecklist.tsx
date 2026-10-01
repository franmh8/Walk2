import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  matchesConfirm: boolean;
}

export function evaluatePassword(password: string, confirmPassword?: string): PasswordCriteria {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  // Special characters like !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const matchesConfirm = confirmPassword !== undefined ? (password.length > 0 && password === confirmPassword) : false;

  return {
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    matchesConfirm,
  };
}

export function isPasswordStrong(criteria: PasswordCriteria): boolean {
  return (
    criteria.hasMinLength &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumber &&
    criteria.hasSpecial
  );
}

interface PasswordStrengthChecklistProps {
  criteria: PasswordCriteria;
  showConfirmCheck?: boolean;
  hasTypedConfirm?: boolean;
}

export const PasswordStrengthChecklist: React.FC<PasswordStrengthChecklistProps> = ({
  criteria,
  showConfirmCheck = true,
  hasTypedConfirm = false,
}) => {
  const rules = [
    { key: 'hasUpper', label: 'Una letra mayúscula (A-Z)', met: criteria.hasUpper },
    { key: 'hasLower', label: 'Una letra minúscula (a-z)', met: criteria.hasLower },
    { key: 'hasNumber', label: 'Al menos un número (0-9)', met: criteria.hasNumber },
    { key: 'hasSpecial', label: 'Un carácter especial (!@#$%...*)', met: criteria.hasSpecial },
    { key: 'hasMinLength', label: 'Mínimo 8 caracteres', met: criteria.hasMinLength },
  ];

  return (
    <div className="bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 rounded-xl p-2.5 space-y-1.5 transition-all text-[11px]">
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
        Requisitos de seguridad:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
        {rules.map((rule) => (
          <div
            key={rule.key}
            className={`flex items-center gap-1.5 transition-colors ${
              rule.met
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                rule.met
                  ? 'bg-emerald-500 text-white scale-105'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {rule.met ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="w-1 h-1 rounded-full bg-slate-400" />}
            </div>
            <span className="truncate">{rule.label}</span>
          </div>
        ))}
      </div>

      {showConfirmCheck && hasTypedConfirm && (
        <div
          className={`pt-1 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 transition-colors ${
            criteria.matchesConfirm
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-rose-500 dark:text-rose-400 font-medium'
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${
              criteria.matchesConfirm
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {criteria.matchesConfirm ? (
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            ) : (
              <X className="w-2.5 h-2.5 stroke-[3]" />
            )}
          </div>
          <span>
            {criteria.matchesConfirm
              ? 'Las contraseñas coinciden exactamente'
              : 'Las contraseñas no coinciden todavía'}
          </span>
        </div>
      )}
    </div>
  );
};
