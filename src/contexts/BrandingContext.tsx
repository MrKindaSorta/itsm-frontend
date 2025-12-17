import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { BrandingConfiguration } from '@/types/branding';
import { DEFAULT_BRANDING } from '@/types/branding';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const BRANDING_STORAGE_KEY = 'itsm-branding-configuration';

interface BrandingContextType {
  branding: BrandingConfiguration;
  updateBranding: (newBranding: BrandingConfiguration) => void;
  refreshBranding: () => Promise<void>;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Migration function to convert legacy branding format to theme-aware format
function migrateLegacyBranding(data: any): BrandingConfiguration {
  // Check if this is legacy format (colors is a flat object, not theme-aware)
  if (data.colors && data.colors.primary && !data.colors.light && !data.colors.dark) {
    console.log('Migrating legacy branding format to theme-aware structure');

    // Legacy format detected - convert to theme-aware
    return {
      ...data,
      colors: {
        light: { ...data.colors }, // Use old colors for light mode
        dark: { ...data.colors },  // Duplicate for dark mode (can be customized later)
      },
    };
  }

  // Check if colors structure exists at all
  if (!data.colors || !data.colors.light || !data.colors.dark) {
    console.warn('Invalid branding colors structure, using default colors but preserving logos');
    return {
      ...DEFAULT_BRANDING,
      logo: data.logo || null,
      logoSmall: data.logoSmall || null,
      favicon: data.favicon || null,
    };
  }

  // Already in new format
  return data;
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfiguration>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const { actualTheme } = useTheme();

  // Load branding configuration from API (fallback to localStorage)
  const loadBranding = async () => {
    setIsLoading(true);
    let loadedBranding: BrandingConfiguration = DEFAULT_BRANDING;

    try {
      // Try loading from API first
      const response = await fetchWithAuth(`/api/config/branding`);
      const data = await response.json();

      if (data.success && data.config) {
        const rawConfig = {
          ...data.config,
          createdAt: new Date(data.config.createdAt),
          updatedAt: new Date(data.config.updatedAt),
        };

        // Migrate legacy format if needed
        loadedBranding = migrateLegacyBranding(rawConfig);

        // Cache migrated version in localStorage
        localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(loadedBranding));
      } else {
        throw new Error('No branding config from API');
      }
    } catch (error) {
      console.log('Loading branding from localStorage fallback');

      // Fallback to localStorage
      const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const rawConfig = {
            ...parsed,
            createdAt: new Date(parsed.createdAt),
            updatedAt: new Date(parsed.updatedAt),
          };

          // Migrate legacy format if needed
          loadedBranding = migrateLegacyBranding(rawConfig);

          // Save migrated version back to localStorage
          if (loadedBranding !== DEFAULT_BRANDING) {
            localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(loadedBranding));
          }
        } catch (parseError) {
          console.error('Failed to parse localStorage branding:', parseError);
          loadedBranding = DEFAULT_BRANDING;
        }
      } else {
        loadedBranding = DEFAULT_BRANDING;
      }
    }

    setBranding(loadedBranding);
    setIsLoading(false);
  };

  // Helper function to convert hex to HSL format for Tailwind
  const hexToHSL = (hex: string): string => {
    // Remove the # if present
    hex = hex.replace('#', '');

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  // Apply branding colors as CSS custom properties
  const applyBrandingStyles = () => {
    // Safety check: ensure colors structure is valid
    if (!branding.colors?.light || !branding.colors?.dark) {
      console.warn('Invalid branding colors structure, using defaults');
      return;
    }

    const colors = actualTheme === 'dark' ? branding.colors.dark : branding.colors.light;

    // Create or update style element
    let styleElement = document.getElementById('branding-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'branding-styles';
      document.head.appendChild(styleElement);
    }

    // Convert all colors to HSL format for Tailwind
    const primaryHSL = hexToHSL(colors.primary);
    const secondaryHSL = hexToHSL(colors.secondary);
    const accentHSL = hexToHSL(colors.accent);
    const backgroundHSL = hexToHSL(colors.background);
    const foregroundHSL = hexToHSL(colors.foreground);
    const mutedHSL = hexToHSL(colors.muted);
    const borderHSL = hexToHSL(colors.border);

    // Generate CSS with theme-aware colors in HSL format
    const css = `
      ${actualTheme === 'dark' ? '.dark' : ':root'} {
        --background: ${backgroundHSL};
        --foreground: ${foregroundHSL};

        --primary: ${primaryHSL};
        --primary-foreground: ${backgroundHSL};

        --secondary: ${secondaryHSL};
        --secondary-foreground: ${foregroundHSL};

        --accent: ${accentHSL};
        --accent-foreground: ${foregroundHSL};

        --muted: ${mutedHSL};
        --muted-foreground: ${foregroundHSL};

        --border: ${borderHSL};
        --input: ${borderHSL};
        --ring: ${primaryHSL};

        --card: ${backgroundHSL};
        --card-foreground: ${foregroundHSL};

        --popover: ${backgroundHSL};
        --popover-foreground: ${foregroundHSL};
      }

      /* Keep hex values for direct usage */
      :root {
        --branding-primary: ${colors.primary};
        --branding-secondary: ${colors.secondary};
        --branding-accent: ${colors.accent};
        --branding-background: ${colors.background};
        --branding-foreground: ${colors.foreground};
        --branding-muted: ${colors.muted};
        --branding-border: ${colors.border};
      }
    `;

    styleElement.textContent = css;
  };

  // Apply logo and favicon
  const applyBrandingAssets = () => {
    // Update page title
    document.title = `${branding.content.companyName} - Portal`;

    // Update favicon if provided
    if (branding.favicon?.url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.favicon.url;
    }
  };

  // Initial load
  useEffect(() => {
    loadBranding();
  }, []);

  // Re-apply styles when branding or theme changes
  useEffect(() => {
    if (!isLoading) {
      applyBrandingStyles();
      applyBrandingAssets();
    }
  }, [branding, actualTheme, isLoading]);

  const updateBranding = (newBranding: BrandingConfiguration) => {
    setBranding(newBranding);
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(newBranding));
  };

  const refreshBranding = async () => {
    await loadBranding();
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, refreshBranding, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
