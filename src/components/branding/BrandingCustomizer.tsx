import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BrandingConfiguration } from '@/types/branding';
import { BRANDING_PRESETS } from '@/types/branding';
import {
  Palette,
  Type,
  Image as ImageIcon,
  Settings,
  Upload,
  X,
  Sparkles,
} from 'lucide-react';

interface BrandingCustomizerProps {
  branding: BrandingConfiguration;
  onUpdate: (branding: BrandingConfiguration) => void;
}

export default function BrandingCustomizer({ branding, onUpdate }: BrandingCustomizerProps) {
  const [activeSection, setActiveSection] = useState<'colors' | 'logos' | 'content' | 'settings'>(
    'colors'
  );
  const [colorTheme, setColorTheme] = useState<'light' | 'dark'>('light');

  const updateBranding = (updates: Partial<BrandingConfiguration>) => {
    onUpdate({
      ...branding,
      ...updates,
      updatedAt: new Date(),
    });
  };

  const updateColors = (theme: 'light' | 'dark', colorKey: string, value: string) => {
    updateBranding({
      colors: {
        ...branding.colors,
        [theme]: {
          ...branding.colors[theme],
          [colorKey]: value,
        },
      },
    });
  };

  const updateContent = (contentKey: keyof typeof branding.content, value: string) => {
    updateBranding({
      content: {
        ...branding.content,
        [contentKey]: value,
      },
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = BRANDING_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      updateBranding({ colors: preset.colors });
    }
  };

  const handleLogoUpload = (type: 'logo' | 'logoSmall' | 'favicon') => {
    // Mock file upload - in production this would use a real file input
    const mockUrl = `https://via.placeholder.com/150/` + branding.colors.light.primary.replace('#', '') + `/FFFFFF?text=Logo`;
    updateBranding({
      [type]: {
        url: mockUrl,
        fileName: 'logo.png',
        fileSize: 15000,
      },
    });
  };

  const removeLogo = (type: 'logo' | 'logoSmall' | 'favicon') => {
    updateBranding({
      [type]: undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeSection === 'colors' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('colors')}
            >
              <Palette className="h-4 w-4 mr-2" />
              Colors & Theme
            </Button>
            <Button
              variant={activeSection === 'logos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('logos')}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Logos & Assets
            </Button>
            <Button
              variant={activeSection === 'content' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('content')}
            >
              <Type className="h-4 w-4 mr-2" />
              Content & Text
            </Button>
            <Button
              variant={activeSection === 'settings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Display Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Colors Section */}
      {activeSection === 'colors' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Colors & Theme
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Customize colors for your portal and authentication pages
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Presets */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Quick Themes</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BRANDING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className="p-3 border rounded-lg hover:border-primary transition-colors text-left group"
                  >
                    <div className="flex gap-2 mb-2">
                      {[preset.colors.light.primary, preset.colors.light.secondary, preset.colors.light.accent].map(
                        (color, i) => (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-full border"
                            style={{ backgroundColor: color }}
                          />
                        )
                      )}
                    </div>
                    <p className="text-sm font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Custom Colors</Label>
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <button
                    onClick={() => setColorTheme('light')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      colorTheme === 'light' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                  >
                    Light Mode
                  </button>
                  <button
                    onClick={() => setColorTheme('dark')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      colorTheme === 'dark' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Primary"
                  description="Main brand color, buttons"
                  value={branding.colors[colorTheme].primary}
                  onChange={(val) => updateColors(colorTheme, 'primary', val)}
                />
                <ColorPicker
                  label="Secondary"
                  description="Text, labels, icons"
                  value={branding.colors[colorTheme].secondary}
                  onChange={(val) => updateColors(colorTheme, 'secondary', val)}
                />
                <ColorPicker
                  label="Accent"
                  description="Highlights, links"
                  value={branding.colors[colorTheme].accent}
                  onChange={(val) => updateColors(colorTheme, 'accent', val)}
                />
                <ColorPicker
                  label="Background"
                  description="Page background"
                  value={branding.colors[colorTheme].background}
                  onChange={(val) => updateColors(colorTheme, 'background', val)}
                />
                <ColorPicker
                  label="Foreground"
                  description="Primary text color"
                  value={branding.colors[colorTheme].foreground}
                  onChange={(val) => updateColors(colorTheme, 'foreground', val)}
                />
                <ColorPicker
                  label="Border"
                  description="Card borders, dividers"
                  value={branding.colors[colorTheme].border}
                  onChange={(val) => updateColors(colorTheme, 'border', val)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logos Section */}
      {activeSection === 'logos' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logos & Assets
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your company logos for portal and authentication pages
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Logo */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Main Logo</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Displayed on login page and portal header • Recommended: 200x60px PNG or SVG
              </p>
              {branding.logo ? (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-16 w-16 rounded border bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${branding.logo.url})` }}
                    />
                    <div>
                      <p className="text-sm font-medium">{branding.logo.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(branding.logo.fileSize! / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLogo('logo')}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleLogoUpload('logo')}
                  className="w-full h-32 border-dashed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm">Click to upload logo</span>
                    <span className="text-xs text-muted-foreground">PNG, SVG up to 2MB</span>
                  </div>
                </Button>
              )}
            </div>

            {/* Small Logo/Icon */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Small Logo / Icon</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Compact version for mobile and collapsed states • Recommended: 48x48px PNG or SVG
              </p>
              {branding.logoSmall ? (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded border bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${branding.logoSmall.url})` }}
                    />
                    <div>
                      <p className="text-sm font-medium">{branding.logoSmall.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(branding.logoSmall.fileSize! / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLogo('logoSmall')}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleLogoUpload('logoSmall')}
                  className="w-full h-24 border-dashed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Click to upload small logo</span>
                  </div>
                </Button>
              )}
            </div>

            {/* Favicon */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Favicon</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Browser tab icon • Recommended: 32x32px PNG or ICO
              </p>
              {branding.favicon ? (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded border bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${branding.favicon.url})` }}
                    />
                    <div>
                      <p className="text-sm font-medium">{branding.favicon.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(branding.favicon.fileSize! / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLogo('favicon')}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleLogoUpload('favicon')}
                  className="w-full h-20 border-dashed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Click to upload favicon</span>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Section */}
      {activeSection === 'content' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Content & Text
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Customize text content displayed across portal and authentication
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={branding.content.companyName}
                  onChange={(e) => updateContent('companyName', e.target.value)}
                  placeholder="ACME Corporation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={branding.content.tagline || ''}
                  onChange={(e) => updateContent('tagline', e.target.value)}
                  placeholder="Your trusted IT partner"
                />
                <p className="text-xs text-muted-foreground">
                  Short phrase displayed under company name in portal header
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loginTitle">Login Page Title</Label>
                  <Input
                    id="loginTitle"
                    value={branding.content.loginTitle || ''}
                    onChange={(e) => updateContent('loginTitle', e.target.value)}
                    placeholder="Welcome back"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginSubtitle">Login Page Subtitle</Label>
                  <Input
                    id="loginSubtitle"
                    value={branding.content.loginSubtitle || ''}
                    onChange={(e) => updateContent('loginSubtitle', e.target.value)}
                    placeholder="Sign in to your account"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Display Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure how branding elements are displayed
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Portal Settings */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Portal Settings</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Show Company Name</p>
                    <p className="text-xs text-muted-foreground">Display in portal header</p>
                  </div>
                  <button
                    onClick={() =>
                      updateBranding({
                        portalSettings: {
                          ...branding.portalSettings!,
                          showCompanyName: !branding.portalSettings?.showCompanyName,
                        },
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      branding.portalSettings?.showCompanyName ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        branding.portalSettings?.showCompanyName ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Show Tagline</p>
                    <p className="text-xs text-muted-foreground">Display tagline in header</p>
                  </div>
                  <button
                    onClick={() =>
                      updateBranding({
                        portalSettings: {
                          ...branding.portalSettings!,
                          showTagline: !branding.portalSettings?.showTagline,
                        },
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      branding.portalSettings?.showTagline ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        branding.portalSettings?.showTagline ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Auth Settings */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Authentication Pages</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Show Demo Accounts</p>
                    <p className="text-xs text-muted-foreground">Display demo login credentials</p>
                  </div>
                  <button
                    onClick={() =>
                      updateBranding({
                        authSettings: {
                          ...branding.authSettings!,
                          showDemoAccounts: !branding.authSettings?.showDemoAccounts,
                        },
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      branding.authSettings?.showDemoAccounts ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        branding.authSettings?.showDemoAccounts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ColorPicker({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pr-12"
            placeholder="#000000"
          />
          <div className="absolute right-1 top-1 bottom-1 flex items-center">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-7 w-10 rounded border cursor-pointer"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
