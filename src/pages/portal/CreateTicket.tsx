import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, FileText, AlertCircle, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Knowledge base articles
const knowledgeBaseArticles = [
  { id: '1', title: 'How to reset your password', category: 'Account & Settings', keywords: ['password', 'reset', 'login', 'forgot', 'change', 'credentials', 'access'] },
  { id: '2', title: 'Setting up email on mobile devices', category: 'Email & Communication', keywords: ['email', 'mobile', 'phone', 'iphone', 'android', 'setup', 'configure', 'outlook', 'mail'] },
  { id: '3', title: 'VPN setup and troubleshooting guide', category: 'Network & Connectivity', keywords: ['vpn', 'connection', 'network', 'remote', 'access', 'secure', 'connect', 'disconnect'] },
  { id: '4', title: 'Printer connection and setup', category: 'Hardware', keywords: ['printer', 'print', 'printing', 'driver', 'connection', 'setup', 'wireless', 'network'] },
  { id: '5', title: 'Creating and managing tickets', category: 'Getting Started', keywords: ['ticket', 'support', 'request', 'help', 'create', 'submit', 'issue'] },
  { id: '6', title: 'Understanding ticket priorities', category: 'Getting Started', keywords: ['priority', 'urgent', 'high', 'low', 'critical', 'ticket', 'emergency'] },
  { id: '7', title: 'Microsoft Teams troubleshooting', category: 'Software', keywords: ['teams', 'microsoft', 'meeting', 'call', 'video', 'audio', 'chat', 'conference'] },
  { id: '8', title: 'Accessing shared drives', category: 'Access & Permissions', keywords: ['shared', 'drive', 'folder', 'access', 'permission', 'network', 'file', 'storage'] },
  { id: '9', title: 'Slow computer performance fixes', category: 'Troubleshooting', keywords: ['slow', 'performance', 'computer', 'laptop', 'speed', 'lag', 'freeze', 'hang'] },
  { id: '10', title: 'Software installation requests', category: 'Software', keywords: ['software', 'install', 'application', 'program', 'download', 'setup', 'app'] },
  { id: '11', title: 'Two-factor authentication setup', category: 'Account & Settings', keywords: ['2fa', 'two-factor', 'authentication', 'security', 'mfa', 'verification', 'code'] },
  { id: '12', title: 'Browser issues and cache clearing', category: 'Troubleshooting', keywords: ['browser', 'chrome', 'firefox', 'edge', 'safari', 'cache', 'cookies', 'clear'] },
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle ticket submission
    const ticketData = {
      title,
      description,
      priority,
      category,
      attachments: attachments.map(f => f.name),
    };
    console.log('Creating ticket:', ticketData);

    // Show success message
    setShowSuccess(true);

    // Redirect to tickets list after 2 seconds
    setTimeout(() => {
      navigate('/portal/tickets');
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Smart KB article suggestions based on title input
  const kbSuggestions = useMemo(() => {
    if (title.length < 3) return [];

    const searchTerms = title.toLowerCase().split(' ').filter(term => term.length > 2);

    // Score each article based on keyword matches
    const scoredArticles = knowledgeBaseArticles.map(article => {
      let score = 0;

      // Check if title contains search terms
      searchTerms.forEach(term => {
        if (article.title.toLowerCase().includes(term)) {
          score += 3; // High weight for title match
        }

        // Check if keywords contain search terms
        article.keywords.forEach(keyword => {
          if (keyword.includes(term)) {
            score += 1; // Lower weight for keyword match
          }
        });
      });

      return { ...article, score };
    });

    // Filter articles with score > 0 and sort by score
    return scoredArticles
      .filter(article => article.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Show top 5 matches
  }, [title]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Ticket</h1>
        <p className="text-muted-foreground mt-2">
          Submit a support request and we'll get back to you as soon as possible
        </p>
      </div>

      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Ticket created successfully! Redirecting to your tickets...
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of your issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Network">Network</option>
                      <option value="Email">Email</option>
                      <option value="Access">Access & Permissions</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Onboarding">Onboarding</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about your issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachments">Attachments</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('attachments')?.click()}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Add Files
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Max 10MB per file
                    </span>
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-md bg-secondary/50"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full sm:w-auto" disabled={showSuccess}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-base">Knowledge Base Suggestions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {kbSuggestions.length > 0 ? (
                <div className="space-y-3">
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
                      Found {kbSuggestions.length} article{kbSuggestions.length > 1 ? 's' : ''} that might help! Try checking these before submitting.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    {kbSuggestions.map((article) => (
                      <a
                        key={article.id}
                        href="/portal/knowledge-base"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-md hover:bg-accent transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                              {article.title}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1.5">
                              {article.category}
                            </Badge>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    💡 Click an article to open in a new tab
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Start typing your issue in the title field above
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Relevant help articles will appear here automatically
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
