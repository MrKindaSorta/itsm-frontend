interface FormBuilderLayoutProps {
  header: React.ReactNode;
  palette: React.ReactNode;
  livePreview: React.ReactNode;
}

export default function FormBuilderLayout({
  header,
  palette,
  livePreview,
}: FormBuilderLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        {header}
      </div>

      {/* Main Content Area - 2 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Field Palette (Fixed 200px) */}
        <div className="w-[200px] flex-shrink-0 border-r border-border bg-card overflow-y-auto">
          {palette}
        </div>

        {/* Right - Live Form Preview (Flex 1, Centered) */}
        <div className="flex-1 overflow-auto bg-muted/30">
          {livePreview}
        </div>
      </div>
    </div>
  );
}
