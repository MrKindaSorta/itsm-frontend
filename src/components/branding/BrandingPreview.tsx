import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BrandingConfiguration } from '@/types/branding';
import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';

interface BrandingPreviewProps {
  branding: BrandingConfiguration;
  previewMode: 'login' | 'portal';
}

export default function BrandingPreview({ branding, previewMode }: BrandingPreviewProps) {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  const colors = branding.colors.light;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Device Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Preview</h3>
              <Badge variant="outline" className="text-xs">
                {previewMode === 'login' ? 'Login Page' : 'Portal Header'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 border rounded-md p-1">
              <button
                onClick={() => setDeviceView('desktop')}
                className={`p-1.5 rounded ${
                  deviceView === 'desktop'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeviceView('mobile')}
                className={`p-1.5 rounded ${
                  deviceView === 'mobile'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div
            className={`border rounded-lg overflow-hidden transition-all ${
              deviceView === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'
            }`}
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            {previewMode === 'login' ? (
              <LoginPreview branding={branding} isMobile={deviceView === 'mobile'} />
            ) : (
              <PortalPreview branding={branding} isMobile={deviceView === 'mobile'} />
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This is a live preview - changes will reflect immediately
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoginPreview({
  branding,
  isMobile,
}: {
  branding: BrandingConfiguration;
  isMobile: boolean;
}) {
  const colors = branding.colors.light;
  const content = branding.content;

  return (
    <div
      className="p-8 min-h-[400px] flex items-center justify-center"
      style={{
        backgroundColor:
          branding.authSettings?.backgroundStyle === 'gradient'
            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`
            : colors.background,
      }}
    >
      <div className={`${isMobile ? 'w-full' : 'w-full max-w-md'}`}>
        {/* Logo/Brand */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            {branding.logo?.url ? (
              <div
                className="h-12 w-12 rounded-lg bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${branding.logo.url})` }}
              />
            ) : (
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.primary, color: colors.background }}
              >
                <span className="font-bold text-2xl">
                  {content.companyName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-bold text-2xl" style={{ color: colors.foreground }}>
              {content.companyName}
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div
          className="rounded-lg border shadow-sm p-6"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.foreground,
          }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: colors.foreground }}>
              {content.loginTitle || 'Welcome back'}
            </h2>
            <p className="text-sm mt-1" style={{ color: colors.secondary }}>
              {content.loginSubtitle || 'Enter your credentials to access your account'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: colors.foreground }}>
                Email
              </label>
              <div
                className="h-9 rounded-md border px-3 flex items-center text-sm"
                style={{ borderColor: colors.border, backgroundColor: colors.background }}
              >
                <span style={{ color: colors.muted }}>name@company.com</span>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: colors.foreground }}>
                Password
              </label>
              <div
                className="h-9 rounded-md border px-3 flex items-center text-sm"
                style={{ borderColor: colors.border, backgroundColor: colors.background }}
              >
                <span style={{ color: colors.muted }}>••••••••</span>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              className="w-full h-9 rounded-md font-medium text-sm"
              style={{ backgroundColor: colors.primary, color: colors.background }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortalPreview({
  branding,
  isMobile,
}: {
  branding: BrandingConfiguration;
  isMobile: boolean;
}) {
  const colors = branding.colors.light;
  const content = branding.content;
  const settings = branding.portalSettings;

  return (
    <div>
      {/* Portal Header */}
      <div
        className={`border-b px-6 ${settings?.headerStyle === 'minimal' ? 'py-3' : 'py-4'}`}
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between">
          {/* Logo and Company Name */}
          <div className="flex items-center gap-3">
            {branding.logo?.url ? (
              <div
                className={`${
                  settings?.headerStyle === 'minimal' ? 'h-8 w-8' : 'h-10 w-10'
                } rounded-lg bg-contain bg-center bg-no-repeat flex-shrink-0`}
                style={{ backgroundImage: `url(${branding.logo.url})` }}
              />
            ) : (
              <div
                className={`${
                  settings?.headerStyle === 'minimal' ? 'h-8 w-8' : 'h-10 w-10'
                } rounded-lg flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: colors.primary, color: colors.background }}
              >
                <span className={`font-bold ${settings?.headerStyle === 'minimal' ? 'text-lg' : 'text-xl'}`}>
                  {content.companyName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {settings?.showCompanyName && !isMobile && (
              <div>
                <h1
                  className={`font-bold ${settings?.headerStyle === 'minimal' ? 'text-lg' : 'text-xl'}`}
                  style={{ color: colors.foreground }}
                >
                  {content.companyName}
                </h1>
                {settings?.showTagline && content.tagline && settings?.headerStyle !== 'minimal' && (
                  <p className="text-xs" style={{ color: colors.secondary }}>
                    {content.tagline}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* User Avatar */}
          {!isMobile && (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ backgroundColor: colors.primary, color: colors.background }}
            >
              JD
            </div>
          )}
        </div>
      </div>

      {/* Portal Content Area Sample */}
      <div className="p-6" style={{ backgroundColor: colors.muted }}>
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
            <div className="h-4 rounded" style={{ backgroundColor: colors.muted, width: '120px' }} />
          </div>
          <div className="space-y-2">
            <div className="h-3 rounded" style={{ backgroundColor: colors.muted, width: '100%' }} />
            <div className="h-3 rounded" style={{ backgroundColor: colors.muted, width: '80%' }} />
            <div className="h-3 rounded" style={{ backgroundColor: colors.muted, width: '60%' }} />
          </div>
          <div className="mt-4 flex gap-2">
            <div
              className="h-7 rounded px-3 flex items-center text-xs font-medium"
              style={{ backgroundColor: colors.primary, color: colors.background }}
            >
              Primary Button
            </div>
            <div
              className="h-7 rounded border px-3 flex items-center text-xs"
              style={{ borderColor: colors.border, color: colors.foreground }}
            >
              Secondary
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
