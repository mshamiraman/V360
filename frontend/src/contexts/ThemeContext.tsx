import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';
import api from '../services/api';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  setTheme: (mode: PaletteMode) => void;
  loadUserPreferences: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

// Define modern color palette
const colors = {
  primary: {
    main: '#6366F1', // Indigo
    light: '#818CF8',
    dark: '#4F46E5',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#06B6D4', // Cyan
    light: '#22D3EE',
    dark: '#0891B2',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#EF4444', // Red
    light: '#F87171',
    dark: '#B91C1C',
  },
  warning: {
    main: '#F59E0B', // Amber
    light: '#FBBF24',
    dark: '#B45309',
  },
  success: {
    main: '#10B981', // Emerald
    light: '#34D399',
    dark: '#047857',
  },
  dark: {
    bg: '#0B0F19',
    paper: '#111827',
    border: 'rgba(255, 255, 255, 0.08)',
    glass: 'rgba(17, 24, 39, 0.7)',
  },
  light: {
    bg: '#F8FAFC',
    paper: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.08)',
    glass: 'rgba(255, 255, 255, 0.7)',
  }
};

// Common component style overrides
const commonComponents = (mode: PaletteMode) => ({
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none' as const,
        fontWeight: 600,
        padding: '8px 20px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: mode === 'dark' 
            ? '0 4px 12px rgba(99, 102, 241, 0.3)' 
            : '0 4px 12px rgba(99, 102, 241, 0.2)',
        },
      },
      containedPrimary: {
        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        backgroundImage: 'none',
        backgroundColor: mode === 'dark' ? colors.dark.paper : colors.light.paper,
        border: `1px solid ${mode === 'dark' ? colors.dark.border : colors.light.border}`,
        boxShadow: mode === 'dark' 
          ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
          : '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: mode === 'dark' ? colors.dark.glass : colors.light.glass,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${mode === 'dark' ? colors.dark.border : colors.light.border}`,
        boxShadow: 'none',
        color: mode === 'dark' ? '#FFFFFF' : '#0F172A',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: mode === 'dark' ? colors.dark.bg : colors.light.bg,
        borderRight: `1px solid ${mode === 'dark' ? colors.dark.border : colors.light.border}`,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '4px 8px',
        '&.Mui-selected': {
          backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
          color: colors.primary.main,
          '& .MuiListItemIcon-root': {
            color: colors.primary.main,
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 600,
      },
    },
  },
});

// Define light theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    success: colors.success,
    background: {
      default: colors.light.bg,
      paper: colors.light.paper,
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: commonComponents('light'),
});

// Define dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    success: colors.success,
    background: {
      default: colors.dark.bg,
      paper: colors.dark.paper,
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: commonComponents('dark'),
});

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('vulnpatch-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme as PaletteMode;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setTheme(newMode);
  };

  const setTheme = async (newMode: PaletteMode) => {
    setMode(newMode);
    localStorage.setItem('vulnpatch-theme', newMode);
    
    // Temporarily disable backend sync to prevent unauthorized requests
    // TODO: Re-enable after proper authentication flow
    console.log('Theme preference saved locally only - backend sync disabled');
    
    /* // Update user preference on backend only if user is authenticated
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        await api.patch('/theme/preferences', {
          theme_preference: newMode
        });
      } catch (error) {
        console.warn('Failed to save theme preference to backend:', error);
      }
    } */
  };

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('vulnpatch-theme');
      if (savedTheme === 'auto' || !savedTheme) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const loadUserPreferences = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || preferencesLoaded) {
      return; // Skip API call if not authenticated or already loaded
    }

    // Temporarily disable API calls to prevent unauthorized requests
    // TODO: Re-enable after user authentication flow is properly handled
    console.log('Theme preferences API call skipped - authentication required');
    setPreferencesLoaded(true);
    
    /* try {
      const response = await api.get('/theme/preferences');
      if (response.data.theme_preference) {
        setMode(response.data.theme_preference);
        localStorage.setItem('vulnpatch-theme', response.data.theme_preference);
      }
      setPreferencesLoaded(true);
    } catch (error) {
      console.warn('Failed to load theme preference from backend:', error);
      setPreferencesLoaded(true); // Mark as loaded even on error to prevent retries
    } */
  };

  // Load user preference from backend on mount only if authenticated
  useEffect(() => {
    // Don't make API calls on initial load - only load from localStorage
    // User preferences will be loaded after login via loadUserPreferences()
  }, []);

  const theme = mode === 'light' ? lightTheme : darkTheme;

  const value = {
    mode,
    toggleTheme,
    setTheme,
    loadUserPreferences,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};