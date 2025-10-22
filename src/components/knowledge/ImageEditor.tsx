import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';

interface ImageEditorProps {
  open: boolean;
  imageFile: File | null;
  onClose: () => void;
  onSave: (editedBlob: Blob, alignment: string) => void;
}

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:2', value: 3 / 2 },
];

const ALIGNMENTS = [
  { label: 'Left', value: 'align-left' },
  { label: 'Center', value: 'align-center' },
  { label: 'Right', value: 'align-right' },
  { label: 'Full Width', value: 'align-full' },
];

export function ImageEditor({ open, imageFile, onClose, onSave }: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [alignment, setAlignment] = useState('align-center');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load image when file changes
  useEffect(() => {
    if (imageFile && open) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setImageSrc('');
    }
  }, [imageFile, open]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (): Promise<Blob | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Calculate dimensions after rotation
    const rotRad = (rotation * Math.PI) / 180;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotRad);
    if (flipH) ctx.scale(-1, 1);
    if (flipV) ctx.scale(1, -1);

    // Draw the cropped image
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      -croppedAreaPixels.width / 2,
      -croppedAreaPixels.height / 2,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg();
      if (croppedBlob) {
        onSave(croppedBlob, alignment);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    // Reset all states
    setImageSrc('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio(null);
    setAlignment('align-center');
    onClose();
  };

  if (!imageFile) return null;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
          <DialogDescription>
            Crop, zoom, rotate, and set alignment for your image before inserting it into the article.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Area */}
          <div className="relative h-[400px] bg-black rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio === null ? undefined : aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            {/* Zoom */}
            <div>
              <Label>Zoom: {zoom.toFixed(2)}x</Label>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <Label>Aspect Ratio</Label>
              <div className="flex gap-1 mt-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <Button
                    key={ratio.label}
                    type="button"
                    size="sm"
                    variant={aspectRatio === ratio.value ? 'default' : 'outline'}
                    onClick={() => setAspectRatio(ratio.value)}
                  >
                    {ratio.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Rotation & Flip */}
          <div>
            <Label>Transform</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleRotate(90)}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate 90°
              </Button>
              <Button
                type="button"
                size="sm"
                variant={flipH ? 'default' : 'outline'}
                onClick={() => setFlipH(!flipH)}
              >
                <FlipHorizontal className="h-4 w-4 mr-2" />
                Flip H
              </Button>
              <Button
                type="button"
                size="sm"
                variant={flipV ? 'default' : 'outline'}
                onClick={() => setFlipV(!flipV)}
              >
                <FlipVertical className="h-4 w-4 mr-2" />
                Flip V
              </Button>
            </div>
          </div>

          {/* Alignment */}
          <div>
            <Label>Image Alignment</Label>
            <div className="flex gap-2 mt-2">
              {ALIGNMENTS.map((align) => (
                <Button
                  key={align.value}
                  type="button"
                  size="sm"
                  variant={alignment === align.value ? 'default' : 'outline'}
                  onClick={() => setAlignment(align.value)}
                >
                  {align.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Insert Image'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
