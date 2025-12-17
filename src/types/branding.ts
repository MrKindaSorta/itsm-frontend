export interface BrandingLogo {
  url: string;
  fileName?: string;
  fileSize?: number;
}

export interface BrandingColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export interface ThemeBrandingColors {
  light: BrandingColors;
  dark: BrandingColors;
}

export interface BrandingTypography {
  fontFamily: string;
  headingFontFamily?: string;
}

export interface BrandingContent {
  companyName: string;
  applicationName?: string;
  tagline?: string;
  welcomeMessage?: string;
  loginTitle?: string;
  loginSubtitle?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface BrandingConfiguration {
  id: string;
  name: string;

  // Logo assets
  logo?: BrandingLogo;
  logoSmall?: BrandingLogo;
  favicon?: BrandingLogo;

  // Colors (theme-aware: separate colors for light and dark modes)
  colors: ThemeBrandingColors;

  // Typography
  typography?: BrandingTypography;

  // Content
  content: BrandingContent;

  // Portal specific
  portalSettings?: {
    showCompanyName: boolean;
    showTagline: boolean;
    headerStyle: 'minimal' | 'standard' | 'full';
  };

  // Login/Signup specific
  authSettings?: {
    backgroundStyle: 'solid' | 'gradient' | 'image';
    backgroundImage?: string;
    cardStyle: 'standard' | 'elevated' | 'minimal';
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingPreset {
  id: string;
  name: string;
  description: string;
  colors: ThemeBrandingColors;
  previewImage?: string;
}

// Predefined color presets
export const BRANDING_PRESETS: BrandingPreset[] = [
  {
    id: 'default',
    name: 'Default Blue',
    description: 'Professional blue theme',
    colors: {
      light: {
        primary: '#3b82f6',
        secondary: '#f1f5f9',
        accent: '#f1f5f9',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f1f5f9',
        border: '#e2e8f0',
      },
      dark: {
        primary: '#60a5fa',
        secondary: '#334155',
        accent: '#334155',
        background: '#0f172a',
        foreground: '#f1f5f9',
        muted: '#1e293b',
        border: '#334155',
      },
    },
  },
  {
    id: 'purple',
    name: 'Purple',
    description: 'Modern purple theme',
    colors: {
      light: {
        primary: '#8b5cf6',
        secondary: '#64748b',
        accent: '#a78bfa',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f5f3ff',
        border: '#e9d5ff',
      },
      dark: {
        primary: '#a78bfa',
        secondary: '#94a3b8',
        accent: '#c4b5fd',
        background: '#0f172a',
        foreground: '#f1f5f9',
        muted: '#1e1b4b',
        border: '#4c1d95',
      },
    },
  },
  {
    id: 'green',
    name: 'Green',
    description: 'Fresh green theme',
    colors: {
      light: {
        primary: '#10b981',
        secondary: '#64748b',
        accent: '#34d399',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f0fdf4',
        border: '#d1fae5',
      },
      dark: {
        primary: '#34d399',
        secondary: '#94a3b8',
        accent: '#6ee7b7',
        background: '#0f172a',
        foreground: '#f1f5f9',
        muted: '#064e3b',
        border: '#065f46',
      },
    },
  },
  {
    id: 'orange',
    name: 'Orange',
    description: 'Energetic orange theme',
    colors: {
      light: {
        primary: '#f97316',
        secondary: '#64748b',
        accent: '#fb923c',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#fff7ed',
        border: '#fed7aa',
      },
      dark: {
        primary: '#fb923c',
        secondary: '#94a3b8',
        accent: '#fdba74',
        background: '#0f172a',
        foreground: '#f1f5f9',
        muted: '#431407',
        border: '#7c2d12',
      },
    },
  },
  {
    id: 'red',
    name: 'Red',
    description: 'Bold red theme',
    colors: {
      light: {
        primary: '#ef4444',
        secondary: '#64748b',
        accent: '#f87171',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#fef2f2',
        border: '#fecaca',
      },
      dark: {
        primary: '#f87171',
        secondary: '#94a3b8',
        accent: '#fca5a5',
        background: '#0f172a',
        foreground: '#f1f5f9',
        muted: '#450a0a',
        border: '#7f1d1d',
      },
    },
  },
  {
    id: 'teal',
    name: 'Teal',
    description: 'Calm teal theme',
    colors: {
      light: {
        primary: '#14b8a6',
        secondary: '#64748b',
        accent: '#2dd4bf',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f0fdfa',
        border: '#ccfbf1',
      },
      dark: {
        primary: '#2dd4bf',
        secondary: '#94a3b8',
        accent: '#5eead4',
        background: '#0f172a',
        foreground: '#f1f5f9',
        muted: '#042f2e',
        border: '#134e4a',
      },
    },
  },
];

export const DEFAULT_BRANDING: BrandingConfiguration = {
  id: 'default',
  name: 'Default Branding',
  logo: undefined,
  logoSmall: undefined,
  favicon: undefined,
  colors: BRANDING_PRESETS[0].colors, // Uses default blue with light/dark variants
  content: {
    companyName: 'ITSM',
    applicationName: 'ITSM Agent',
    tagline: 'Enterprise IT Service Management',
    welcomeMessage: 'Welcome to our support portal',
    loginTitle: 'Welcome back',
    loginSubtitle: 'Enter your credentials to access your account',
    supportEmail: 'support@company.com',
    supportPhone: '1-800-SUPPORT',
  },
  portalSettings: {
    showCompanyName: true,
    showTagline: true,
    headerStyle: 'standard',
  },
  authSettings: {
    backgroundStyle: 'solid',
    cardStyle: 'standard',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};
