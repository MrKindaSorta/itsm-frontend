import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, Book, ChevronRight, TrendingUp, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  category: string;
  views: number;
  helpful: number;
  content?: string;
}

const mockArticles: Article[] = [
  {
    id: '1',
    title: 'How to reset your password',
    category: 'Account & Settings',
    views: 1250,
    helpful: 45,
    content: `
## Overview
If you've forgotten your password or need to reset it for security reasons, this guide will walk you through the password reset process step by step.

## Method 1: Reset from Login Page

1. **Go to the login page**
   - Navigate to the company portal login page
   - Click on the "Forgot Password?" link below the login button

2. **Enter your email address**
   - Type your company email address in the provided field
   - Click "Send Reset Link"
   - You should receive an email within 5 minutes

3. **Check your email**
   - Open the password reset email from IT Support
   - **Note:** Check your spam folder if you don't see it in your inbox
   - The link expires in 24 hours

4. **Create a new password**
   - Click the reset link in the email
   - Enter your new password
   - Confirm the password by typing it again
   - Click "Reset Password"

## Method 2: Reset While Logged In

If you're already logged in and want to change your password:

1. Go to **Profile** → **Security**
2. Enter your current password
3. Enter your new password twice
4. Click "Update Password"

## Password Requirements

Your new password must meet these requirements:

- ✅ At least 8 characters long
- ✅ Contains at least one uppercase letter (A-Z)
- ✅ Contains at least one lowercase letter (a-z)
- ✅ Contains at least one number (0-9)
- ✅ Contains at least one special character (!@#$%^&*)
- ❌ Cannot be the same as your last 5 passwords
- ❌ Cannot contain your username or email

## Common Issues

**"I didn't receive the reset email"**
- Wait 5-10 minutes - emails can be delayed
- Check your spam/junk folder
- Verify you entered the correct email address
- Contact IT support if still not received

**"The reset link expired"**
- Reset links are valid for 24 hours only
- Request a new reset link from the login page

**"My new password isn't accepted"**
- Make sure it meets all password requirements listed above
- Avoid common passwords like "Password123!"

## Security Tips

- 🔒 Never share your password with anyone
- 🔄 Change your password every 90 days
- 📝 Use a password manager to store passwords securely
- ⚠️ Don't use the same password for multiple accounts
- 🚫 Don't write passwords on sticky notes

## Still Need Help?

If you're still having trouble resetting your password:

1. **Contact IT Support**
   - Email: support@company.com
   - Phone: (555) 123-4567
   - Live Chat: Available 9 AM - 5 PM EST

2. **Create a Ticket**
   - Go to Create Ticket page
   - Select "Account & Settings" category
   - Choose "Password Reset" issue type

**Average resolution time:** 2 hours during business hours

---

*Last updated: October 15, 2024*
*Article ID: KB-001*
    `
  },
  { id: '2', title: 'Setting up email on mobile devices', category: 'Email & Communication', views: 980, helpful: 38 },
  { id: '3', title: 'VPN setup and troubleshooting guide', category: 'Network & Connectivity', views: 856, helpful: 42 },
  { id: '4', title: 'Printer connection and setup', category: 'Hardware', views: 745, helpful: 35 },
  { id: '5', title: 'Creating and managing tickets', category: 'Getting Started', views: 620, helpful: 50 },
  { id: '6', title: 'Understanding ticket priorities', category: 'Getting Started', views: 510, helpful: 28 },
  { id: '7', title: 'Microsoft Teams troubleshooting', category: 'Software', views: 890, helpful: 40 },
  { id: '8', title: 'Accessing shared drives', category: 'Access & Permissions', views: 678, helpful: 33 },
  { id: '9', title: 'Slow computer performance fixes', category: 'Troubleshooting', views: 920, helpful: 41 },
  { id: '10', title: 'Software installation requests', category: 'Software', views: 580, helpful: 25 },
  { id: '11', title: 'Two-factor authentication setup', category: 'Account & Settings', views: 720, helpful: 37 },
  { id: '12', title: 'Browser issues and cache clearing', category: 'Troubleshooting', views: 810, helpful: 34 },
];

const categories = [
  { name: 'Getting Started', icon: Book, color: 'text-blue-500', count: 2 },
  { name: 'Account & Settings', icon: FileText, color: 'text-green-500', count: 2 },
  { name: 'Email & Communication', icon: FileText, color: 'text-purple-500', count: 1 },
  { name: 'Network & Connectivity', icon: FileText, color: 'text-orange-500', count: 1 },
  { name: 'Hardware', icon: FileText, color: 'text-red-500', count: 1 },
  { name: 'Software', icon: FileText, color: 'text-indigo-500', count: 2 },
  { name: 'Access & Permissions', icon: FileText, color: 'text-teal-500', count: 1 },
  { name: 'Troubleshooting', icon: FileText, color: 'text-yellow-600', count: 2 },
];

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = useMemo(() => {
    return mockArticles.filter(article => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || article.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const popularArticles = useMemo(() => {
    return [...mockArticles].sort((a, b) => b.views - a.views).slice(0, 5);
  }, []);

  // If article is selected, show article view
  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedArticle(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>

        <Card>
          <CardHeader className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-3">
                {selectedArticle.category}
              </Badge>
              <CardTitle className="text-3xl">{selectedArticle.title}</CardTitle>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>{selectedArticle.views} views</span>
                <span>•</span>
                <span>{selectedArticle.helpful} found helpful</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            {selectedArticle.content ? (
              <div className="space-y-4">
                {selectedArticle.content.split('\n').map((line, index) => {
                  // Handle headers
                  if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-xl font-bold mt-6 mb-3">{line.replace('## ', '')}</h2>;
                  }
                  // Handle bold text
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={index} className="font-semibold mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>;
                  }
                  // Handle numbered lists
                  if (/^\d+\./.test(line)) {
                    return <p key={index} className="ml-4 mb-2">{line}</p>;
                  }
                  // Handle bullet points
                  if (line.startsWith('- ')) {
                    return <p key={index} className="ml-6 mb-1">{line}</p>;
                  }
                  // Handle horizontal rule
                  if (line.trim() === '---') {
                    return <hr key={index} className="my-6 border-border" />;
                  }
                  // Handle italic (metadata)
                  if (line.startsWith('*') && line.endsWith('*') && !line.includes('**')) {
                    return <p key={index} className="text-sm text-muted-foreground italic">{line.replace(/\*/g, '')}</p>;
                  }
                  // Regular paragraphs
                  if (line.trim()) {
                    return <p key={index} className="mb-3 leading-relaxed">{line}</p>;
                  }
                  return null;
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Content not available.</p>
            )}
          </CardContent>
          <CardContent className="border-t pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Was this article helpful?</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button variant="outline" size="sm">
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground mt-2">
          Browse articles and find answers to common questions
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
                  selectedCategory === null
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <span>All Articles</span>
                <Badge variant="secondary" className="ml-2">
                  {mockArticles.length}
                </Badge>
              </button>
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category.name
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${category.color}`} />
                      <span className="truncate">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {category.count}
                    </Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Popular Articles */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Popular Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {popularArticles.map((article, index) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="w-full block p-2 rounded-md hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground mt-0.5">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{article.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {article.views} views
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedCategory || 'All Articles'} ({filteredArticles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No articles found matching your search.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="w-full block p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-medium mb-1">{article.title}</h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {article.category}
                                </Badge>
                                <span>{article.views} views</span>
                                <span>{article.helpful} found helpful</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
