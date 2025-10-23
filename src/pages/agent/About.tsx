import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Code, DollarSign, Users, Zap, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">About Forge ITSM</CardTitle>
          <CardDescription className="text-base">
            Built by someone who understands your pain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:block">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-base leading-relaxed">
                Hi there! I'm a solo developer who created Forge ITSM as a passion project. This platform helps me
                support my family while solving a problem I've been frustrated with for years. Thank you for trusting
                me with your business—it truly means the world.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                After spending over 10 years working in IT, I've watched teams struggle with the same dilemma:
                enterprise ITSM platforms cost thousands per month and are loaded with features most small teams
                never use, while the free and budget options are so feature-lacking they force you to cobble
                together multiple tools just to get basic ticketing done.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            The Mission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">
            Forge ITSM was built to bridge that gap. It's a modern, feature-complete ticketing system that doesn't
            require a second mortgage or force you to sacrifice essential functionality. Whether you're a 5-person
            startup or a 200-person company, you deserve tools that just work—without the bloat or the price tag.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Every feature you see was built based on real-world needs from my years in the trenches: SLA tracking
            that actually makes sense, customizable workflows without requiring a CS degree, proper role-based
            permissions, and a knowledge base that your users will actually use.
          </p>
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
                <h3 className="font-semibold">Honest Pricing</h3>
                <p className="text-sm text-muted-foreground">
                  No hidden fees, no per-agent gouging, no forced annual contracts. Pay for what you need,
                  nothing more.
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
                <h3 className="font-semibold">Built for Small Teams</h3>
                <p className="text-sm text-muted-foreground">
                  Designed for teams of 10-200 users who need power without complexity. No enterprise bloat.
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
                <h3 className="font-semibold">Modern Tech Stack</h3>
                <p className="text-sm text-muted-foreground">
                  Built on Cloudflare's edge network for blazing-fast performance worldwide, with zero
                  server maintenance.
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
                <h3 className="font-semibold">Secure by Design</h3>
                <p className="text-sm text-muted-foreground">
                  Role-based permissions, secure authentication, and regular security updates. Your data
                  is protected.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Built With Section */}
      <Card>
        <CardHeader>
          <CardTitle>Built With Care</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">
            This isn't just another SaaS product churned out by a faceless corporation. Every line of code,
            every feature decision, every design choice comes from someone who's actually used (and been
            frustrated by) these tools in the real world.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            I'm constantly improving Forge ITSM based on feedback from users like you. Have an idea? Found a bug?
            Want a feature? I'm listening. Your input directly shapes the future of this platform.
          </p>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Thank you for choosing Forge ITSM. Let's build something great together.
            </p>
            <p className="text-sm font-medium text-center sm:text-left mt-2">
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
