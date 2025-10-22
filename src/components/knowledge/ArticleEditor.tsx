import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectRoot as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Image, Paperclip, X, Loader2, Trash2, Download, Eye } from 'lucide-react';
import { ImageEditor } from './ImageEditor';
import { RichTextEditor } from './RichTextEditor';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

interface ArticleEditorProps {
  initialData?: any;
  categories: Category[];
  userId: string;
  onSave: (wasSaved: boolean) => void;
  onCancel: () => void;
  onDelete?: (article: any) => void;
}

export function ArticleEditor({ initialData, categories, userId, onSave, onCancel, onDelete }: ArticleEditorProps) {
  // Parse tags from string or use as array
  const parseTags = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags);
      } catch {
        return tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category_id: initialData?.category_id || '',
    status: initialData?.status || 'draft',
    tags: parseTags(initialData?.tags),
    suggested_categories: initialData?.suggested_categories || [],
  });

  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Image editor state
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [editingImageSrc, setEditingImageSrc] = useState<string | null>(null);

  // Ticket categories for suggestions
  const ticketCategories = ['Technical Support', 'Account Issues', 'Billing', 'Hardware', 'Software', 'Network', 'Security', 'General Inquiry'];

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t: string) => t !== tag),
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Open image editor
    setSelectedImageFile(file);
    setIsImageEditorOpen(true);

    // Reset input
    e.target.value = '';
  };

  const handleImageEditSave = async (editedBlob: Blob, alignment: string) => {
    setIsUploading(true);
    setIsImageEditorOpen(false);

    try {
      const formData = new FormData();
      formData.append('file', editedBlob, selectedImageFile?.name || 'image.jpg');
      formData.append('user_id', userId);

      const articleId = initialData?.id || 'temp';
      const response = await fetch(`${API_BASE}/api/articles/${articleId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = `${API_BASE}${data.attachment.url}`;
        const htmlImage = `<img src="${imageUrl}" alt="${selectedImageFile?.name || 'image'}" class="${alignment}" />`;

        if (editingImageSrc) {
          // Replace existing image
          setFormData(prev => ({
            ...prev,
            content: prev.content.replace(
              new RegExp(`<img[^>]*src="${editingImageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'),
              htmlImage
            ),
          }));
          // Remove old attachment and add new one
          const oldFilenameMatch = editingImageSrc.match(/\/([^/]+)$/);
          if (oldFilenameMatch) {
            const oldFilename = oldFilenameMatch[1];
            setAttachments(prev => [...prev.filter(att => !att.url.includes(oldFilename)), data.attachment]);
          }
        } else {
          // Insert new image
          setFormData(prev => ({
            ...prev,
            content: prev.content + htmlImage,
          }));
          setAttachments([...attachments, data.attachment]);
        }
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
      setSelectedImageFile(null);
      setEditingImageSrc(null);
    }
  };

  const handleImageEdit = async (src: string) => {
    // When editing an inline image, fetch it and reopen ImageEditor
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });
      setSelectedImageFile(file);
      setEditingImageSrc(src);
      setIsImageEditorOpen(true);
    } catch (error) {
      console.error('Failed to load image for editing:', error);
      alert('Failed to load image for editing');
    }
  };

  const handleImageDelete = (src: string) => {
    // Remove image from content
    setFormData(prev => ({
      ...prev,
      content: prev.content.replace(new RegExp(`<img[^>]*src="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'), ''),
    }));

    // Also remove from attachments list if it's there
    const filenameMatch = src.match(/\/([^/]+)$/);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      setAttachments(prev => prev.filter(att => !att.url.includes(filename)));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);

      const articleId = initialData?.id || 'temp';
      const response = await fetch(`${API_BASE}/api/articles/${articleId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAttachments([...attachments, data.attachment]);
      } else {
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = (attachmentId: number) => {
    if (window.confirm('Delete this attachment?')) {
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    }
  };

  const handleSave = async (publishNow: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    try {
      const url = initialData?.id
        ? `${API_BASE}/api/articles/${initialData.id}`
        : `${API_BASE}/api/articles`;

      const response = await fetch(url, {
        method: initialData?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: publishNow ? 'published' : formData.status,
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSave(true);
      } else {
        alert(data.error || 'Failed to save article');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="How to reset your password"
          className="text-lg"
        />
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category_id.toString()}
          onValueChange={(value) => setFormData({ ...formData, category_id: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content Editor */}
      <div>
        <Label htmlFor="content">Content *</Label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={isUploading}
          >
            <Image className="h-4 w-4 mr-2" />
            Insert Image
          </Button>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isUploading}
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Attach File
          </Button>
        </div>
        <RichTextEditor
          value={formData.content}
          onChange={(content) => setFormData({ ...formData, content })}
          onImageEdit={handleImageEdit}
          onImageDelete={handleImageDelete}
        />
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div>
          <Label>Attachments ({attachments.length})</Label>
          <div className="mt-2 space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{att.fileName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(att.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`${API_BASE}${att.url}`, '_blank')}
                    title="View/Download"
                  >
                    {att.fileType.startsWith('image/') ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAttachment(att.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Add tags..."
          />
          <Button type="button" onClick={handleAddTag}>Add</Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Suggested for Ticket Categories */}
      <div>
        <Label>Suggest this article for ticket categories</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select categories where this article should appear as a suggestion during ticket creation
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ticketCategories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent">
              <input
                type="checkbox"
                checked={formData.suggested_categories.includes(cat)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      suggested_categories: [...formData.suggested_categories, cat],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      suggested_categories: formData.suggested_categories.filter((c: string) => c !== cat),
                    });
                  }
                }}
              />
              <span className="text-sm">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <Label>Status</Label>
          <p className="text-xs text-muted-foreground">
            {formData.status === 'published' ? 'Visible to all users' : 'Only visible to agents'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Draft</span>
          <Switch
            checked={formData.status === 'published'}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, status: checked ? 'published' : 'draft' })
            }
          />
          <span className="text-sm">Published</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-2">
        <div>
          {initialData && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => onDelete(initialData)}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Article
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Draft'
            )}
          </Button>
          <Button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish'
            )}
          </Button>
        </div>
      </div>

      {/* Image Editor Modal */}
      <ImageEditor
        open={isImageEditorOpen}
        imageFile={selectedImageFile}
        onClose={() => {
          setIsImageEditorOpen(false);
          setSelectedImageFile(null);
        }}
        onSave={handleImageEditSave}
      />
    </div>
  );
}
