import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, ChevronRight, TrendingUp, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import * as Icons from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface Article {
  id: number;
  title: string;
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  views: number;
  helpful_count: number;
  not_helpful_count: number;
  content?: string;
  tags?: string;
  attachments?: any[];
  user_feedback?: number | null;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

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
    try {
      const response = await fetch(`${API_BASE}/api/articles?status=published`);
      const data = await response.json();
      if (data.success) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArticleDetail = async (articleId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/articles/${articleId}?user_id=${user?.id || ''}`);
      const data = await response.json();
      if (data.success) {
        setSelectedArticle(data.article);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  const handleFeedback = async (isHelpful: boolean) => {
    if (!selectedArticle || !user) return;

    try {
      const response = await fetch(`${API_BASE}/api/articles/${selectedArticle.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          is_helpful: isHelpful,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedArticle({
          ...selectedArticle,
          user_feedback: isHelpful ? 1 : 0,
          helpful_count: isHelpful ? selectedArticle.helpful_count + 1 : selectedArticle.helpful_count,
          not_helpful_count: !isHelpful ? selectedArticle.not_helpful_count + 1 : selectedArticle.not_helpful_count,
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || article.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, articles]);

  const popularArticles = useMemo(() => {
    return [...articles].sort((a, b) => b.views - a.views).slice(0, 5);
  }, [articles]);

  // If article is selected, show article view
  if (selectedArticle) {
    const helpfulTotal = selectedArticle.helpful_count + selectedArticle.not_helpful_count;
    const helpfulPercent = helpfulTotal > 0 ? Math.round((selectedArticle.helpful_count / helpfulTotal) * 100) : 0;

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
                {selectedArticle.category_name}
              </Badge>
              <CardTitle className="text-3xl">{selectedArticle.title}</CardTitle>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>{selectedArticle.views} views</span>
                <span>•</span>
                <span>{helpfulPercent}% found helpful</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            {selectedArticle.content && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedArticle.content}
              </ReactMarkdown>
            )}
          </CardContent>

          {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
            <CardContent className="border-t pt-6">
              <h4 className="font-medium mb-3">Attachments</h4>
              <div className="space-y-2">
                {selectedArticle.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`${API_BASE}${att.url}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 border rounded hover:bg-accent"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{att.fileName}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      ({(att.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </a>
                ))}
              </div>
            </CardContent>
          )}

          <CardContent className="border-t pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Was this article helpful?</p>
              {user && (
                <div className="flex gap-2">
                  <Button
                    variant={selectedArticle.user_feedback === 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFeedback(true)}
                    disabled={selectedArticle.user_feedback !== null && selectedArticle.user_feedback !== undefined}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Yes
                  </Button>
                  <Button
                    variant={selectedArticle.user_feedback === 0 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFeedback(false)}
                    disabled={selectedArticle.user_feedback !== null && selectedArticle.user_feedback !== undefined}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    No
                  </Button>
                </div>
              )}
              {!user && (
                <p className="text-sm text-muted-foreground">Please log in to provide feedback</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
                  {articles.length}
                </Badge>
              </button>
              {categories.map((category) => {
                const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                const categoryCount = articles.filter(a => a.category_id === category.id).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {IconComponent && <IconComponent className={`h-4 w-4 ${category.color}`} />}
                      <span className="truncate">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {categoryCount}
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
                  onClick={() => fetchArticleDetail(article.id)}
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
                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Articles'} ({filteredArticles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading articles...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No articles found matching your search.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredArticles.map((article) => {
                    const IconComponent = Icons[article.category_icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                    const helpfulTotal = article.helpful_count + article.not_helpful_count;
                    const helpfulCount = helpfulTotal > 0 ? article.helpful_count : 0;

                    return (
                      <button
                        key={article.id}
                        onClick={() => fetchArticleDetail(article.id)}
                        className="w-full block p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              {IconComponent && <IconComponent className={`h-5 w-5 ${article.category_color} mt-0.5 flex-shrink-0`} />}
                              <div className="flex-1">
                                <h3 className="font-medium mb-1">{article.title}</h3>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {article.category_name}
                                  </Badge>
                                  <span>{article.views} views</span>
                                  <span>{helpfulCount} found helpful</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
