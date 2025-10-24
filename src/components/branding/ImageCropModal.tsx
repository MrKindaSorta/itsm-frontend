import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (croppedBlob: Blob, filename: string) => void;
  file: File | null;
  type: 'logo' | 'logoSmall' | 'favicon';
}

// Recommended dimensions for each type
const RECOMMENDED_DIMENSIONS = {
  logo: { width: 200, height: 60, label: 'Main Logo' },
  logoSmall: { width: 48, height: 48, label: 'Small Logo' },
  favicon: { width: 32, height: 32, label: 'Favicon' },
};

export default function ImageCropModal({ open, onClose, onConfirm, file, type }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const recommended = RECOMMENDED_DIMENSIONS[type];

  // Load the image file
  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '');
    });
    reader.readAsDataURL(file);
  }, [file]);

  // Generate preview
  useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return;

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scale;
    canvas.height = crop.height * pixelRatio * scale;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.save();

    // Translate and rotate
    const centerX = crop.width / 2;
    const centerY = crop.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    ctx.restore();
  }, [completedCrop, scale, rotate]);

  const handleConfirm = async () => {
    if (!previewCanvasRef.current || !completedCrop) return;

    const canvas = previewCanvasRef.current;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Failed to create blob');
          return;
        }
        onConfirm(blob, file?.name || 'cropped-image.png');
      },
      'image/png',
      1
    );
  };

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    setCrop(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Crop & Position {recommended.label}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Recommended size: {recommended.width}x{recommended.height}px
          </p>
        </DialogHeader>

        <Tabs defaultValue="crop" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="crop">Crop & Adjust</TabsTrigger>
            <TabsTrigger value="preview">Preview Placement</TabsTrigger>
          </TabsList>

          <TabsContent value="crop" className="space-y-4">
            {/* Crop Area */}
            <div className="flex justify-center bg-muted/30 rounded-lg p-4">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={type === 'logoSmall' || type === 'favicon' ? 1 : undefined}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Upload"
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxWidth: '100%',
                      maxHeight: '400px',
                    }}
                  />
                </ReactCrop>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Zoom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <ZoomIn className="h-4 w-4" />
                    Zoom: {scale.toFixed(1)}x
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScale(1)}
                  >
                    Reset
                  </Button>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={(value) => setScale(value[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Rotate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4" />
                    Rotate: {rotate}°
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRotate(0)}
                  >
                    Reset
                  </Button>
                </div>
                <Slider
                  value={[rotate]}
                  onValueChange={(value) => setRotate(value[0])}
                  min={-180}
                  max={180}
                  step={15}
                  className="w-full"
                />
              </div>
            </div>

            {/* Hidden preview canvas */}
            <canvas
              ref={previewCanvasRef}
              style={{ display: 'none' }}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-6">
              {/* Header Preview */}
              {type === 'logo' && (
                <div className="space-y-2">
                  <Label>Portal Header</Label>
                  <div className="border rounded-lg p-4 bg-background flex items-center gap-3">
                    <div className="h-12 w-40 border-2 border-dashed border-primary rounded flex items-center justify-center">
                      {completedCrop && (
                        <canvas
                          ref={(canvas) => {
                            if (!canvas || !completedCrop || !imgRef.current) return;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return;
                            canvas.width = 160;
                            canvas.height = 48;
                            const image = imgRef.current;
                            const scaleX = image.naturalWidth / image.width;
                            const scaleY = image.naturalHeight / image.height;
                            ctx.drawImage(
                              image,
                              completedCrop.x * scaleX,
                              completedCrop.y * scaleY,
                              completedCrop.width * scaleX,
                              completedCrop.height * scaleY,
                              0,
                              0,
                              160,
                              48
                            );
                          }}
                          className="max-h-12"
                        />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">Company Name</span>
                  </div>
                </div>
              )}

              {/* Small Logo Preview */}
              {type === 'logoSmall' && (
                <div className="space-y-2">
                  <Label>Collapsed Sidebar</Label>
                  <div className="border rounded-lg p-4 bg-background w-16 flex items-center justify-center">
                    <div className="h-12 w-12 border-2 border-dashed border-primary rounded flex items-center justify-center">
                      {completedCrop && (
                        <canvas
                          ref={(canvas) => {
                            if (!canvas || !completedCrop || !imgRef.current) return;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return;
                            canvas.width = 48;
                            canvas.height = 48;
                            const image = imgRef.current;
                            const scaleX = image.naturalWidth / image.width;
                            const scaleY = image.naturalHeight / image.height;
                            ctx.drawImage(
                              image,
                              completedCrop.x * scaleX,
                              completedCrop.y * scaleY,
                              completedCrop.width * scaleX,
                              completedCrop.height * scaleY,
                              0,
                              0,
                              48,
                              48
                            );
                          }}
                          className="max-h-12"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Favicon Preview */}
              {type === 'favicon' && (
                <div className="space-y-2">
                  <Label>Browser Tab</Label>
                  <div className="border rounded-lg p-4 bg-background flex items-center gap-2">
                    <div className="h-8 w-8 border-2 border-dashed border-primary rounded flex items-center justify-center">
                      {completedCrop && (
                        <canvas
                          ref={(canvas) => {
                            if (!canvas || !completedCrop || !imgRef.current) return;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return;
                            canvas.width = 32;
                            canvas.height = 32;
                            const image = imgRef.current;
                            const scaleX = image.naturalWidth / image.width;
                            const scaleY = image.naturalHeight / image.height;
                            ctx.drawImage(
                              image,
                              completedCrop.x * scaleX,
                              completedCrop.y * scaleY,
                              completedCrop.width * scaleX,
                              completedCrop.height * scaleY,
                              0,
                              0,
                              32,
                              32
                            );
                          }}
                          className="max-h-8"
                        />
                      )}
                    </div>
                    <span className="text-sm">ITSM Portal</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!completedCrop}>
            Upload Logo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
