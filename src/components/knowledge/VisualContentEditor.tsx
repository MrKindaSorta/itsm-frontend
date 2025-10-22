import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SelectRoot as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VisualContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  showPreview: boolean;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string;
  alignment?: string;
}

// Sortable image component
function SortableImage({ block, onDelete, onAlignmentChange }: {
  block: ContentBlock;
  onDelete: () => void;
  onAlignmentChange: (alignment: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Extract image URL from markdown
  const imageMatch = block.content.match(/!\[.*?\]\((.*?)\)/);
  const imageUrl = imageMatch ? imageMatch[1] : '';
  const alignmentClass = block.alignment || 'align-center';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative border rounded-lg p-4 bg-muted/30 hover:bg-muted/50"
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing pt-2">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Image Preview */}
        <div className="flex-1">
          <img
            src={imageUrl}
            alt="Article"
            className={`max-w-full h-auto rounded ${alignmentClass}`}
            style={{
              maxHeight: '200px',
              marginLeft: alignmentClass === 'align-left' ? '0' : alignmentClass === 'align-right' ? 'auto' : 'auto',
              marginRight: alignmentClass === 'align-left' ? 'auto' : alignmentClass === 'align-right' ? '0' : 'auto',
              width: alignmentClass === 'align-full' ? '100%' : 'auto',
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Select value={alignmentClass} onValueChange={onAlignmentChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="align-left">Left</SelectItem>
              <SelectItem value="align-center">Center</SelectItem>
              <SelectItem value="align-right">Right</SelectItem>
              <SelectItem value="align-full">Full Width</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VisualContentEditor({ value, onChange, showPreview }: VisualContentEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Parse markdown into blocks
  useEffect(() => {
    const parseContent = () => {
      const imageRegex = /<img[^>]+src="([^"]+)"[^>]*class="([^"]+)"[^>]*\/?>/g;
      const markdownImageRegex = /!\[[^\]]*\]\([^\)]+\)/g;

      let newBlocks: ContentBlock[] = [];
      let lastIndex = 0;
      let match;

      // Find all images (both HTML and markdown format)
      const allMatches: Array<{ index: number; content: string; alignment: string }> = [];

      // HTML format images
      while ((match = imageRegex.exec(value)) !== null) {
        allMatches.push({
          index: match.index,
          content: match[0],
          alignment: match[2] || 'align-center',
        });
      }

      // Markdown format images (convert to our tracking format)
      while ((match = markdownImageRegex.exec(value)) !== null) {
        const htmlImg = match[0].replace(/!\[(.*?)\]\((.*?)\)/, '<img src="$2" alt="$1" class="align-center" />');
        allMatches.push({
          index: match.index,
          content: htmlImg,
          alignment: 'align-center',
        });
      }

      // Sort matches by index
      allMatches.sort((a, b) => a.index - b.index);

      // Build blocks
      allMatches.forEach((imgMatch, idx) => {
        // Add text before this image
        if (imgMatch.index > lastIndex) {
          const textContent = value.slice(lastIndex, imgMatch.index).trim();
          if (textContent) {
            newBlocks.push({
              id: `text-${idx}`,
              type: 'text',
              content: textContent,
            });
          }
        }

        // Add image block
        newBlocks.push({
          id: `image-${idx}`,
          type: 'image',
          content: imgMatch.content,
          alignment: imgMatch.alignment,
        });

        lastIndex = imgMatch.index + imgMatch.content.length;
      });

      // Add remaining text
      if (lastIndex < value.length) {
        const textContent = value.slice(lastIndex).trim();
        if (textContent) {
          newBlocks.push({
            id: `text-end`,
            type: 'text',
            content: textContent,
          });
        }
      }

      // If no blocks, add a text block
      if (newBlocks.length === 0 && value.trim()) {
        newBlocks.push({
          id: 'text-0',
          type: 'text',
          content: value,
        });
      }

      setBlocks(newBlocks);
    };

    parseContent();
  }, [value]);

  // Reconstruct markdown from blocks
  const blocksToMarkdown = (blocks: ContentBlock[]) => {
    return blocks.map(block => block.content).join('\n\n');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex);
      setBlocks(reorderedBlocks);
      onChange(blocksToMarkdown(reorderedBlocks));
    }
  };

  const handleDeleteImage = (blockId: string) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(newBlocks);
    onChange(blocksToMarkdown(newBlocks));
  };

  const handleAlignmentChange = (blockId: string, alignment: string) => {
    const newBlocks = blocks.map(block => {
      if (block.id === blockId) {
        // Update the class in the HTML
        const updatedContent = block.content.replace(/class="[^"]*"/, `class="${alignment}"`);
        return { ...block, content: updatedContent, alignment };
      }
      return block;
    });
    setBlocks(newBlocks);
    onChange(blocksToMarkdown(newBlocks));
  };

  const imageBlocks = blocks.filter(b => b.type === 'image');

  return (
    <div className="space-y-4">
      {/* Image Management Section - Always visible if images exist */}
      {imageBlocks.length > 0 && (
        <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
          <h4 className="text-sm font-medium">Images ({imageBlocks.length})</h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={imageBlocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {imageBlocks.map((block) => (
                <SortableImage
                  key={block.id}
                  block={block}
                  onDelete={() => handleDeleteImage(block.id)}
                  onAlignmentChange={(alignment) => handleAlignmentChange(block.id, alignment)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Content Editor with Optional Preview */}
      <div className={showPreview ? 'grid grid-cols-2 gap-4' : ''}>
        {/* Markdown Editor */}
        <div>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter article content..."
            className="min-h-[400px] font-mono text-sm"
          />
        </div>

        {/* Markdown Preview (only when showPreview is true) */}
        {showPreview && (
          <div className="min-h-[400px] p-4 border rounded-lg prose prose-sm max-w-none dark:prose-invert overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
