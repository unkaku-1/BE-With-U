import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme types
export type Theme = 'dark' | 'light' | 'system';

// Theme configuration
interface ThemeConfig {
  name: string;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
}

// Available themes
const themes: Record<Theme, ThemeConfig> = {
  dark: {
    name: 'dark',
    displayName: 'ダークテーマ',
    colors: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      accent: '#ef4444',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  light: {
    name: 'light',
    displayName: 'ライトテーマ',
    colors: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      accent: '#ef4444',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  system: {
    name: 'system',
    displayName: 'システム設定に従う',
    colors: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      accent: '#ef4444',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// Context interface
interface ThemeContextType {
  theme: Theme;
  actualTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  themeConfig: ThemeConfig;
  availableThemes: { value: Theme; label: string }[];
  isDark: boolean;
  isLight: boolean;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Utility functions
const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getActualTheme = (theme: Theme): 'dark' | 'light' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

// Provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from localStorage
    const saved = localStorage.getItem('bewithU-theme') as Theme;
    if (saved && Object.keys(themes).includes(saved)) {
      return saved;
    }
    return 'system';
  });

  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>(() => 
    getActualTheme(theme)
  );

  // Available themes for UI
  const availableThemes = [
    { value: 'system' as Theme, label: 'システム設定に従う' },
    { value: 'dark' as Theme, label: 'ダークテーマ' },
    { value: 'light' as Theme, label: 'ライトテーマ' },
  ];

  // Set theme function
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('bewithU-theme', newTheme);
    
    const newActualTheme = getActualTheme(newTheme);
    setActualTheme(newActualTheme);
    
    // Update document class
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newActualTheme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', 
        newActualTheme === 'dark' ? '#0f172a' : '#ffffff'
      );
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newActualTheme = e.matches ? 'dark' : 'light';
      setActualTheme(newActualTheme);
      
      // Update document class
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(newActualTheme);
      
      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', 
          newActualTheme === 'dark' ? '#0f172a' : '#ffffff'
        );
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme on mount and theme change
  useEffect(() => {
    const newActualTheme = getActualTheme(theme);
    setActualTheme(newActualTheme);
    
    // Update document class
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newActualTheme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', 
        newActualTheme === 'dark' ? '#0f172a' : '#ffffff'
      );
    }

    // Apply CSS custom properties
    const root = document.documentElement;
    const themeConfig = themes[actualTheme];
    
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [theme, actualTheme]);

  // Context value
  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    themeConfig: themes[actualTheme],
    availableThemes,
    isDark: actualTheme === 'dark',
    isLight: actualTheme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

