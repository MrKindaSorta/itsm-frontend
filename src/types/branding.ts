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

export interface BrandingTypography {
  fontFamily: string;
  headingFontFamily?: string;
}

export interface BrandingContent {
  companyName: string;
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

  // Colors
  colors: BrandingColors;

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
    showDemoAccounts: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingPreset {
  id: string;
  name: string;
  description: string;
  colors: BrandingColors;
  previewImage?: string;
}

// Predefined color presets
export const BRANDING_PRESETS: BrandingPreset[] = [
  {
    id: 'default',
    name: 'Default Blue',
    description: 'Professional blue theme',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f1f5f9',
      border: '#e2e8f0',
    },
  },
  {
    id: 'purple',
    name: 'Purple',
    description: 'Modern purple theme',
    colors: {
      primary: '#8b5cf6',
      secondary: '#64748b',
      accent: '#a78bfa',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f5f3ff',
      border: '#e9d5ff',
    },
  },
  {
    id: 'green',
    name: 'Green',
    description: 'Fresh green theme',
    colors: {
      primary: '#10b981',
      secondary: '#64748b',
      accent: '#34d399',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f0fdf4',
      border: '#d1fae5',
    },
  },
  {
    id: 'orange',
    name: 'Orange',
    description: 'Energetic orange theme',
    colors: {
      primary: '#f97316',
      secondary: '#64748b',
      accent: '#fb923c',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#fff7ed',
      border: '#fed7aa',
    },
  },
  {
    id: 'red',
    name: 'Red',
    description: 'Bold red theme',
    colors: {
      primary: '#ef4444',
      secondary: '#64748b',
      accent: '#f87171',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#fef2f2',
      border: '#fecaca',
    },
  },
  {
    id: 'teal',
    name: 'Teal',
    description: 'Calm teal theme',
    colors: {
      primary: '#14b8a6',
      secondary: '#64748b',
      accent: '#2dd4bf',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f0fdfa',
      border: '#ccfbf1',
    },
  },
];

export const DEFAULT_BRANDING: BrandingConfiguration = {
  id: 'default',
  name: 'Default Branding',
  colors: BRANDING_PRESETS[0].colors,
  content: {
    companyName: 'ITSM',
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
    showDemoAccounts: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};
