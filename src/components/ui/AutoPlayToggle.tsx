import React from 'react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'autoplay_next_video';

export function getAutoPlayPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setAutoPlayPreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {}
}

interface AutoPlayToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

const AutoPlayToggle: React.FC<AutoPlayToggleProps> = ({ enabled, onChange, className = '' }) => {
  const { t } = useTranslation();

  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
        {t('videoPlayer.autoPlay', 'Auto-play')}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => {
          const next = !enabled;
          setAutoPlayPreference(next);
          onChange(next);
        }}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
          enabled ? 'bg-primary-500' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </label>
  );
};

export default AutoPlayToggle;
