import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Edit, TrendingUp, GripVertical, BarChart3, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategoryManager } from '@/components/knowledge/CategoryManager';
import { ArticleEditor } from '@/components/knowledge/ArticleEditor';
import { useAuth } from '@/contexts/AuthContext';

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
  display_order: number;
}

// Sortable category item component
function SortableCategoryItem({ category, isSelected, onClick }: { category: Category; isSelected: boolean; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-accent'
      }`}
    >
      <button
        onClick={onClick}
        className="flex items-center gap-2 flex-1 text-left"
      >
        {IconComponent && <IconComponent className={`h-4 w-4 ${category.color}`} />}
        <span className="truncate">{category.name}</span>
      </button>
      <div className="flex items-center gap-1">
        <Badge variant="secondary" className="ml-2">
          {category.article_count}
        </Badge>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const [originalArticleData, setOriginalArticleData] = useState<{ title: string; content: string } | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, searchQuery]);

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
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      params.append('user_id', user?.id || '');

      const response = await fetch(`${API_BASE}/api/articles?${params}`);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(reorderedCategories);

      // Update server
      try {
        const response = await fetch(`${API_BASE}/api/categories/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categories: reorderedCategories.map((cat, idx) => ({ id: cat.id, display_order: idx })),
            user_id: user?.id,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          console.error('Reorder failed:', data.error);
          fetchCategories(); // Revert on error
        }
      } catch (error) {
        console.error('Error reordering categories:', error);
        // Revert on error
        fetchCategories();
      }
    }
  };

  const openEditor = async (article?: Article) => {
    if (article) {
      // Editing existing article
      setEditingArticle(article);
      setIsNewlyCreated(false);
      setOriginalArticleData({ title: article.title, content: article.content });
      setIsEditorOpen(true);
    } else {
      // Creating new article - create a blank draft first
      if (!selectedCategory) {
        alert('Please select a category first');
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/articles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '',
            content: '',
            category_id: selectedCategory,
            status: 'draft',
            user_id: user?.id,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Open editor with the newly created article
          const newArticle = {
            ...data.article,
            category_name: categories.find(c => c.id === selectedCategory)?.name || '',
            category_icon: categories.find(c => c.id === selectedCategory)?.icon || '',
            category_color: categories.find(c => c.id === selectedCategory)?.color || '',
            author_name: user?.name || '',
            views: 0,
            helpful_count: 0,
            not_helpful_count: 0,
            tags: '',
            attachments: [],
          };
          setEditingArticle(newArticle);
          setIsNewlyCreated(true);
          setOriginalArticleData({ title: '', content: '' });
          setIsEditorOpen(true);
        } else {
          alert(data.error || 'Failed to create article');
        }
      } catch (error) {
        console.error('Create article error:', error);
        alert('Failed to create article');
      }
    }
  };

  const closeEditor = async (wasSaved: boolean = false) => {
    // If this was a newly created article and wasn't saved (or was unchanged), delete it
    if (isNewlyCreated && !wasSaved && editingArticle) {
      const isUnchanged =
        editingArticle.title === originalArticleData?.title &&
        editingArticle.content === originalArticleData?.content;

      if (isUnchanged) {
        // Delete the empty article
        try {
          await fetch(`${API_BASE}/api/articles/${editingArticle.id}?user_id=${user?.id}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.error('Failed to cleanup empty article:', error);
        }
      }
    }

    setEditingArticle(null);
    setIsEditorOpen(false);
    setIsNewlyCreated(false);
    setOriginalArticleData(null);
    fetchArticles();
    fetchCategories();
  };

  const openDeleteDialog = (article: Article) => {
    setArticleToDelete(article);
    setDeleteDialogOpen(true);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/api/articles/${articleToDelete.id}?user_id=${user?.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setDeleteDialogOpen(false);
        setArticleToDelete(null);
        fetchArticles();
        fetchCategories();
      } else {
        alert(data.error || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Delete article error:', error);
      alert('Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  const popularArticles = useMemo(() => {
    return [...articles].sort((a, b) => b.views - a.views).slice(0, 5);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || article.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, articles]);

  const totalViews = useMemo(() => articles.reduce((sum, a) => sum + a.views, 0), [articles]);
  const totalHelpful = useMemo(() => articles.reduce((sum, a) => sum + a.helpful_count, 0), [articles]);
  const totalFeedback = useMemo(() => articles.reduce((sum, a) => sum + a.helpful_count + a.not_helpful_count, 0), [articles]);
  const helpfulPercent = totalFeedback > 0 ? Math.round((totalHelpful / totalFeedback) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search + Analytics Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-10 h-12 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowAnalytics(!showAnalytics)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Panel */}
      {showAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{articles.length}</div>
                <div className="text-sm text-muted-foreground">Total Articles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{articles.filter(a => a.status === 'published').length}</div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{totalViews}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{helpfulPercent}%</div>
                <div className="text-sm text-muted-foreground">Helpful Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Categories</CardTitle>
                <Button size="sm" onClick={() => setIsCategoryManagerOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((category) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      isSelected={selectedCategory === category.id}
                      onClick={() => setSelectedCategory(category.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
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
                  onClick={() => openEditor(article)}
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {selectedCategory
                    ? categories.find(c => c.id === selectedCategory)?.name
                    : 'All Articles'}{' '}
                  ({filteredArticles.length})
                </CardTitle>
                {selectedCategory && (
                  <Button size="sm" onClick={() => openEditor()}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Article
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading articles...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-2">Get Started with Knowledge Base</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first category to organize articles. Once created, you can add articles within that category.
                    </p>
                    <Button onClick={() => setIsCategoryManagerOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </Button>
                  </div>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No articles found matching your search.
                  </p>
                  {selectedCategory && (
                    <Button className="mt-4" onClick={() => openEditor()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Article
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredArticles.map((article) => {
                    const IconComponent = Icons[article.category_icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                    const helpfulTotal = article.helpful_count + article.not_helpful_count;
                    const helpfulCount = helpfulTotal > 0 ? article.helpful_count : 0;

                    return (
                      <div
                        key={article.id}
                        className="p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              {IconComponent && <IconComponent className={`h-5 w-5 ${article.category_color} mt-0.5 flex-shrink-0`} />}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium">{article.title}</h3>
                                  <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                                    {article.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {article.category_name}
                                  </Badge>
                                  <span>{article.views} views</span>
                                  <span>{helpfulCount} found helpful</span>
                                  <span>by {article.author_name}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditor(article)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(article)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Manager Dialog */}
      <Dialog open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Create, edit, and organize knowledge base categories
            </DialogDescription>
          </DialogHeader>
          <CategoryManager
            userId={user?.id || ''}
          />
          <div className="flex justify-end mt-4">
            <Button onClick={() => {
              setIsCategoryManagerOpen(false);
              fetchCategories();
            }}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Article Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={(open) => !open && closeEditor(false)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</DialogTitle>
            <DialogDescription>
              {editingArticle ? 'Edit article content, category, and settings' : 'Create a new knowledge base article'}
            </DialogDescription>
          </DialogHeader>
          <ArticleEditor
            initialData={editingArticle}
            categories={categories}
            userId={user?.id || ''}
            onSave={closeEditor}
            onCancel={() => closeEditor(false)}
            onDelete={(article) => {
              setIsEditorOpen(false);
              openDeleteDialog(article);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "<strong>{articleToDelete?.title}</strong>"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteArticle}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
