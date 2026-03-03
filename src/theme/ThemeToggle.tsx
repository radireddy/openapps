import React from 'react';
import { useEditorTheme } from './useEditorTheme';

const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, availableThemes } = useEditorTheme();

  const handleToggle = () => {
    const currentIndex = availableThemes.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    setTheme(availableThemes[nextIndex].id);
  };

  const currentTheme = availableThemes.find(t => t.id === theme);
  const label = `Switch theme (current: ${currentTheme?.label || theme})`;

  return (
    <button
      onClick={handleToggle}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-ed-bg-tertiary hover:bg-ed-bg-hover text-ed-text-secondary hover:text-ed-text transition-colors"
      aria-label={label}
      title={label}
    >
      <div className="relative w-5 h-5">
        <SunIcon
          className={`absolute inset-0 w-5 h-5 transition-all duration-200 ${
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-50'
          }`}
        />
        <MoonIcon
          className={`absolute inset-0 w-5 h-5 transition-all duration-200 ${
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
      </div>
    </button>
  );
};
