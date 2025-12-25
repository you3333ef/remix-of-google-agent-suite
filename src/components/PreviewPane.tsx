import { useState } from 'react';
import { RefreshCw, Maximize2, Minimize2, Smartphone, Tablet, Monitor, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

interface PreviewPaneProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function PreviewPane({ isExpanded, onToggleExpand }: PreviewPaneProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState('https://example.com');

  const viewportSizes = {
    mobile: { width: '375px', icon: Smartphone },
    tablet: { width: '768px', icon: Tablet },
    desktop: { width: '100%', icon: Monitor },
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
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

        {/* URL Bar */}
        <div className="flex-1 mx-4 max-w-md">
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5">
            <span className="text-neon-green text-xs">●</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-transparent text-xs text-muted-foreground outline-none"
            />
          </div>
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
          <Button variant="ghost" size="icon-sm" title="Open in new tab">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onToggleExpand}>
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-background/50 flex items-center justify-center p-4">
        <div
          className={cn(
            "h-full bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 shadow-lg",
            isLoading && "opacity-50"
          )}
          style={{ width: viewportSizes[viewport].width, maxWidth: '100%' }}
        >
          {/* Demo Content */}
          <div className="h-full flex flex-col">
            {/* Demo Header */}
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                    A
                  </div>
                  <span className="font-semibold text-foreground">Agentic Max</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-16 h-6 bg-secondary rounded-md" />
                  <div className="w-16 h-6 bg-secondary rounded-md" />
                </div>
              </div>
            </div>

            {/* Demo Hero */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl animate-float">
                🤖
              </div>
              <h2 className="text-xl font-bold gradient-text">AI Agent Suite</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Full Google Integration • Multi-Provider AI • No-Code Builder
              </p>
              <div className="flex gap-2">
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  Get Started
                </div>
                <div className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm">
                  Learn More
                </div>
              </div>
            </div>
          </div>
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
