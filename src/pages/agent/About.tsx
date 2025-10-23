import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Code, DollarSign, Users, Zap, Shield, Check, X, TrendingDown } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      {/* Pricing Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            <CardTitle>Transparent, Affordable Pricing</CardTitle>
          </div>
          <CardDescription>
            Compare our pricing to industry leaders and see the difference
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Our Pricing */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Forge ITSM Plans</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-4 bg-primary/5">
                <div className="text-center space-y-2">
                  <h4 className="font-bold text-xl">Starter</h4>
                  <div className="text-3xl font-bold text-primary">$49.99</div>
                  <p className="text-sm text-muted-foreground">/month</p>
                  <div className="pt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Up to 3 Agents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">Unlimited Users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>All Core Features</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-primary rounded-lg p-4 relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                <div className="text-center space-y-2">
                  <h4 className="font-bold text-xl">Professional</h4>
                  <div className="text-3xl font-bold text-primary">$69.99</div>
                  <p className="text-sm text-muted-foreground">/month</p>
                  <div className="pt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Up to 5 Agents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">Unlimited Users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>All Core Features</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-center space-y-2">
                  <h4 className="font-bold text-xl">Business</h4>
                  <div className="text-3xl font-bold text-primary">$119.99</div>
                  <p className="text-sm text-muted-foreground">/month</p>
                  <div className="pt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Up to 10 Agents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">Unlimited Users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>$9.99 per additional agent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Competitor Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4">How We Compare to Industry Leaders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Platform</th>
                    <th className="p-3 text-center font-medium">3 Agents/Month</th>
                    <th className="p-3 text-center font-medium">5 Agents/Month</th>
                    <th className="p-3 text-center font-medium">10 Agents/Month</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-primary/5">
                    <td className="p-3 font-semibold">Forge ITSM</td>
                    <td className="p-3 text-center font-bold text-primary">$49.99</td>
                    <td className="p-3 text-center font-bold text-primary">$69.99</td>
                    <td className="p-3 text-center font-bold text-primary">$119.99</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Zendesk Suite</td>
                    <td className="p-3 text-center text-muted-foreground">$165/mo</td>
                    <td className="p-3 text-center text-muted-foreground">$275/mo</td>
                    <td className="p-3 text-center text-muted-foreground">$550/mo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Freshdesk Pro</td>
                    <td className="p-3 text-center text-muted-foreground">$147/mo</td>
                    <td className="p-3 text-center text-muted-foreground">$245/mo</td>
                    <td className="p-3 text-center text-muted-foreground">$490/mo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Jira Service Mgmt</td>
                    <td className="p-3 text-center text-muted-foreground">$60/mo</td>
                    <td className="p-3 text-center text-muted-foreground">$100/mo</td>
                    <td className="p-3 text-center text-muted-foreground">$200/mo</td>
                  </tr>
                  <tr>
                    <td className="p-3">ServiceNow</td>
                    <td className="p-3 text-center text-muted-foreground" colSpan={3}>Enterprise pricing only (thousands/month)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Competitor prices based on standard tier plans. Enterprise features may cost significantly more.
            </p>
          </div>

          {/* Savings Calculator */}
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-900">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Real Savings for Your Team
            </h4>
            <div className="grid gap-3 md:grid-cols-3 text-sm">
              <div>
                <div className="font-semibold">5-Agent Team</div>
                <div className="text-muted-foreground">Save $175-$205/month vs. Zendesk/Freshdesk</div>
                <div className="font-bold text-green-600">$2,100-$2,460/year saved</div>
              </div>
              <div>
                <div className="font-semibold">10-Agent Team</div>
                <div className="text-muted-foreground">Save $370-$430/month vs. competitors</div>
                <div className="font-bold text-green-600">$4,440-$5,160/year saved</div>
              </div>
              <div>
                <div className="font-semibold">15-Agent Team (10+5 add'l)</div>
                <div className="text-muted-foreground">$169.94/mo vs. $735-$825/mo</div>
                <div className="font-bold text-green-600">$6,780-$7,860/year saved</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Why Forge ITSM Delivers More Value
          </CardTitle>
          <CardDescription>
            Feature-complete at a fraction of the cost
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-base leading-relaxed">
            Forge ITSM was built to bridge the gap between expensive enterprise platforms and feature-lacking free tools.
            You get a modern, complete ticketing system without the bloat or the price tag. Whether you're a 5-person
            startup or a 200-person company, you deserve tools that just work.
          </p>

          {/* Feature Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Feature</th>
                  <th className="p-3 text-center font-medium">Forge ITSM<br/>(All Plans)</th>
                  <th className="p-3 text-center font-medium">Zendesk<br/>(Suite Growth)</th>
                  <th className="p-3 text-center font-medium">Freshdesk<br/>(Pro)</th>
                  <th className="p-3 text-center font-medium">Spiceworks<br/>(Free)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Multi-channel Ticketing</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">SLA Management</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Knowledge Base</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Custom Fields & Forms</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center text-xs text-muted-foreground">Limited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Role-Based Permissions</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center text-xs text-muted-foreground">Basic</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Advanced Reporting</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center text-xs text-muted-foreground">Higher tier</td>
                  <td className="p-3 text-center text-xs text-muted-foreground">Higher tier</td>
                  <td className="p-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Automation & Workflows</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center text-xs text-muted-foreground">Basic</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Asset Management</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center text-xs text-muted-foreground">Add-on cost</td>
                  <td className="p-3 text-center text-xs text-muted-foreground">Add-on cost</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Email Integration</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Mobile App Support</td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                  <td className="p-3 text-center text-xs text-muted-foreground">Limited</td>
                </tr>
                <tr className="border-b bg-primary/5">
                  <td className="p-3 font-semibold">Price for 5 Agents</td>
                  <td className="p-3 text-center font-bold text-primary">$69.99/mo</td>
                  <td className="p-3 text-center text-muted-foreground">$275/mo</td>
                  <td className="p-3 text-center text-muted-foreground">$245/mo</td>
                  <td className="p-3 text-center text-green-600 font-semibold">Free</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong>Every feature you see was built based on real-world needs from 10+ years in IT:</strong> SLA tracking
              that actually makes sense, customizable workflows without requiring a CS degree, proper role-based
              permissions matrix, asset tracking for IT teams, and a knowledge base that your users will actually use.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Unlike enterprise platforms that lock key features behind $89-$115/agent tiers, Forge ITSM includes everything
              in every plan. And unlike free tools that force you to cobble together multiple platforms, we deliver a complete
              solution with enterprise features at small-business pricing.
            </p>
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
