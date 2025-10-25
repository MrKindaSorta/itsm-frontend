import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Code, DollarSign, Users, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">About Forge ITSM</CardTitle>
          <CardDescription className="text-base">
            Built by Someone Who Understands Your Pain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:block">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-base leading-relaxed">
                Hey there! I'm Joshua, founder of Forge Underground, a veteran-owned and operated company behind Forge ITSM. With 10+ years in IT, I built this to cut through the noise of overpriced, complex ticketing systems and underpowered free tools. It's designed for teams who need a fast, intuitive way to manage tickets without the hassle. Your trust fuels our mission to keep IT simple and effective. Thanks for choosing us. — Joshua, Founder
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Makes It Different */}
      <Card>
        <CardHeader>
          <CardTitle>What Makes Forge ITSM Different</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Honest Approach</h3>
                <p className="text-sm text-muted-foreground">
                  No upsells, no bloat—just a complete ticketing system. Everything you need: SLA tracking, custom portals, knowledge base, etc.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">For Small Teams</h3>
                <p className="text-sm text-muted-foreground">
                  Designed for small to medium teams who need a capable tool. Simple setup (5 minutes), intuitive UI, no training required.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Modern & Secure</h3>
                <p className="text-sm text-muted-foreground">
                  Powered by Cloudflare: global edge network for speed, encryption, 99.9% uptime, GDPR-compliant (not HIPAA—avoid PHI). Auto-backups with 30-day restores.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Built With Care</h3>
                <p className="text-sm text-muted-foreground">
                  Every feature draws from real IT trenches: inline edits, smart routing, sticky filters. I'm all ears for your feedback—bugs, ideas, anything. Let's improve together.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closing Message */}
      <Card>
        <CardContent className="py-6">
          <div className="text-center space-y-4">
            <p className="text-base">
              Thanks for choosing Forge.
            </p>
            <p className="text-sm font-medium">
              — Joshua, Founder & Developer
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Version Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div>Version 1.0.0 • Built with React, TypeScript & Cloudflare</div>
            <div>© {new Date().getFullYear()} Forge ITSM. All rights reserved.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
