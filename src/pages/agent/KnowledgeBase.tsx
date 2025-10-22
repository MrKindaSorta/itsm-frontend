import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectRoot as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Eye, Settings as SettingsIcon, BarChart3, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CategoryManager } from '@/components/knowledge/CategoryManager';
import { ArticleEditor } from '@/components/knowledge/ArticleEditor';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface Article {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  status: 'draft' | 'published';
  views: number;
  helpful_count: number;
  not_helpful_count: number;
  author_name: string;
  created_at: string;
  updated_at: string;
  tags?: string;
  attachments?: any[];
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  article_count: number;
}

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Editor/Preview states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [searchQuery, filterCategory, filterStatus, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterCategory !== 'all') params.append('category_id', filterCategory);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('user_id', user?.id || '');

      const response = await fetch(`${API_BASE}/api/articles?${params}`);
      const data = await response.json();
      if (data.success) {
        let sortedArticles = data.articles;

        // Client-side sorting
        if (sortBy === 'views') {
          sortedArticles = sortedArticles.sort((a: Article, b: Article) => b.views - a.views);
        } else if (sortBy === 'helpful') {
          sortedArticles = sortedArticles.sort((a: Article, b: Article) => b.helpful_count - a.helpful_count);
        }

        setArticles(sortedArticles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm('Are you sure you want to delete this article? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/articles/${articleId}?user_id=${user?.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchArticles();
      } else {
        alert(data.error || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article');
    }
  };

  const openEditor = (article?: Article) => {
    setEditingArticle(article || null);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingArticle(null);
    fetchArticles();
    fetchCategories();
  };

  const openPreview = async (articleId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/articles/${articleId}?user_id=${user?.id}`);
      const data = await response.json();
      if (data.success) {
        setPreviewArticle(data.article);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  const getHelpfulPercentage = (article: Article) => {
    const total = article.helpful_count + article.not_helpful_count;
    if (total === 0) return 0;
    return Math.round((article.helpful_count / total) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Knowledge Base</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage articles, categories, and knowledge base content
              </p>
            </div>
            <Button onClick={() => openEditor()}>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles">
            <FileText className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="categories">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="views">Most Viewed</SelectItem>
                    <SelectItem value="helpful">Most Helpful</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading articles...</p>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No articles found</p>
                  <Button variant="outline" className="mt-4" onClick={() => openEditor()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Article
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {articles.map((article) => {
                    const IconComponent = Icons[article.category_icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                    const helpfulPercent = getHelpfulPercentage(article);

                    return (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {IconComponent && (
                              <IconComponent className={`h-4 w-4 ${article.category_color} flex-shrink-0`} />
                            )}
                            <h3 className="font-medium truncate">{article.title}</h3>
                            <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                              {article.status}
                            </Badge>
                            {article.tags && article.tags.split(',').map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{article.category_name}</span>
                            <span>•</span>
                            <span>{article.views} views</span>
                            <span>•</span>
                            <span>{helpfulPercent}% helpful</span>
                            <span>•</span>
                            <span>by {article.author_name}</span>
                            <span>•</span>
                            <span>{new Date(article.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPreview(article.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditor(article)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <CategoryManager userId={user?.id || ''} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Total Articles</p>
                  <p className="text-3xl font-bold mt-2">{articles.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {articles.filter(a => a.status === 'published').length} published
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-3xl font-bold mt-2">
                    {articles.reduce((sum, a) => sum + a.views, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all articles
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Avg Helpful Rating</p>
                  <p className="text-3xl font-bold mt-2">
                    {articles.length > 0
                      ? Math.round(articles.reduce((sum, a) => sum + getHelpfulPercentage(a), 0) / articles.length)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average across all articles
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Most Viewed Articles</h3>
                <div className="space-y-2">
                  {articles
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5)
                    .map((article, index) => (
                      <div key={article.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="text-lg font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{article.title}</p>
                          <p className="text-xs text-muted-foreground">{article.category_name}</p>
                        </div>
                        <p className="text-sm font-medium">{article.views} views</p>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Article Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</DialogTitle>
          </DialogHeader>
          <ArticleEditor
            initialData={editingArticle}
            categories={categories}
            userId={user?.id || ''}
            onSave={closeEditor}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Article Preview Dialog */}
      <Dialog open={!!previewArticle} onOpenChange={() => setPreviewArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {previewArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{previewArticle.category_name}</Badge>
                  <Badge variant={previewArticle.status === 'published' ? 'default' : 'secondary'}>
                    {previewArticle.status}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{previewArticle.title}</DialogTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{previewArticle.views} views</span>
                  <span>•</span>
                  <span>{getHelpfulPercentage(previewArticle)}% helpful</span>
                  <span>•</span>
                  <span>by {previewArticle.author_name}</span>
                </div>
              </DialogHeader>
              <div className="prose prose-sm max-w-none dark:prose-invert mt-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {previewArticle.content}
                </ReactMarkdown>
              </div>
              {previewArticle.attachments && previewArticle.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3">Attachments</h4>
                  <div className="space-y-2">
                    {previewArticle.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={`${API_BASE}${att.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 border rounded hover:bg-accent"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{att.fileName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
