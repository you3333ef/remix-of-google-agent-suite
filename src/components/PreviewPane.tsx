import { useState, useEffect } from 'react';
import { RefreshCw, Maximize2, Minimize2, Smartphone, Tablet, Monitor, ExternalLink, Globe, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

interface PreviewPaneProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  htmlContent?: string;
  previewUrl?: string;
}

export default function PreviewPane({ isExpanded, onToggleExpand, htmlContent, previewUrl }: PreviewPaneProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState(previewUrl || '');
  const [content, setContent] = useState(htmlContent || '');
  const [mode, setMode] = useState<'url' | 'html'>(htmlContent ? 'html' : 'url');

  useEffect(() => {
    if (htmlContent) {
      setContent(htmlContent);
      setMode('html');
    }
  }, [htmlContent]);

  useEffect(() => {
    if (previewUrl) {
      setUrl(previewUrl);
      setMode('url');
    }
  }, [previewUrl]);

  const viewportSizes = {
    mobile: { width: '375px', icon: Smartphone },
    tablet: { width: '768px', icon: Tablet },
    desktop: { width: '100%', icon: Monitor },
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className={cn(
      "flex flex-col glass-panel overflow-hidden transition-all duration-300",
      isExpanded ? "fixed inset-4 z-50" : "h-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Preview</span>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setMode('url')}
            className={cn(
              "px-2 py-1 rounded-md text-xs transition-colors",
              mode === 'url' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            URL
          </button>
          <button
            onClick={() => setMode('html')}
            className={cn(
              "px-2 py-1 rounded-md text-xs transition-colors",
              mode === 'html' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            HTML
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Viewport Toggles */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5 mr-2">
            {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => {
              const Icon = viewportSizes[size].icon;
              return (
                <button
                  key={size}
                  onClick={() => setViewport(size)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewport === size
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>

          <Button variant="ghost" size="icon-sm" onClick={handleRefresh} title="Refresh">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggleExpand}>
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* URL Bar (when in URL mode) */}
      {mode === 'url' && (
        <div className="px-3 py-2 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5">
            <span className="text-neon-green text-xs">●</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to preview..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-background/50 flex items-center justify-center p-4">
        <div
          className={cn(
            "h-full bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 shadow-lg",
            isLoading && "opacity-50"
          )}
          style={{ width: viewportSizes[viewport].width, maxWidth: '100%' }}
        >
          {mode === 'html' && content ? (
            <iframe
              srcDoc={content}
              className="w-full h-full"
              sandbox="allow-same-origin allow-scripts"
              title="HTML Preview"
            />
          ) : mode === 'url' && url ? (
            <iframe
              src={url}
              className="w-full h-full"
              sandbox="allow-same-origin allow-scripts"
              title="URL Preview"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Live Preview</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {mode === 'url' 
                  ? 'Enter a URL above to preview any website'
                  : 'Clone a website or generate code to see a live preview here'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
        <span>Viewport: {viewport} ({viewportSizes[viewport].width})</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neon-green" />
          Live
        </span>
      </div>
    </div>
  );
}
