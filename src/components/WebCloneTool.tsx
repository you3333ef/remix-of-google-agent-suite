import { useState } from 'react';
import { Copy, Globe, Loader2, Download, Eye, Code, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface WebCloneToolProps {
  onCodeGenerated?: (html: string, css: string) => void;
}

interface BrandingData {
  colorScheme?: string;
  logo?: string;
  colors?: Record<string, string>;
  fonts?: Array<{ family: string }>;
}

export default function WebCloneTool({ onCodeGenerated }: WebCloneToolProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    html?: string;
    markdown?: string;
    branding?: BrandingData;
    metadata?: { title?: string; description?: string };
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleClone = async () => {
    if (!url.trim()) {
      toast({ title: "Error", description: "Please enter a URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { 
          url,
          options: {
            formats: ['html', 'markdown', 'branding'],
            onlyMainContent: false,
          }
        },
      });

      if (error) throw error;

      if (data?.success === false) {
        throw new Error(data.error || 'Failed to scrape website');
      }

      // Access nested data structure from Firecrawl
      const scraped = data?.data || data;
      
      setResult({
        html: scraped?.html || scraped?.rawHtml,
        markdown: scraped?.markdown,
        branding: scraped?.branding,
        metadata: scraped?.metadata,
      });

      // Save to database if user is authenticated
      if (user && scraped?.html) {
        await supabase.from('cloned_websites').insert({
          user_id: user.id,
          source_url: url,
          html_content: scraped.html,
          branding: scraped.branding || null,
          status: 'completed',
        });
      }

      toast({ title: "Success!", description: "Website cloned successfully" });
      
      if (scraped?.html && onCodeGenerated) {
        onCodeGenerated(scraped.html, '');
      }
    } catch (error) {
      console.error('Clone error:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to clone website", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied!", description: "Content copied to clipboard" });
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Copy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Web Clone</h2>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && handleClone()}
            />
          </div>
          <Button onClick={handleClone} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Clone
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing website...</p>
          </div>
        )}

        {result && !loading && (
          <Tabs defaultValue="preview" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" /> Preview
              </TabsTrigger>
              <TabsTrigger value="html" className="gap-2">
                <Code className="h-4 w-4" /> HTML
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Palette className="h-4 w-4" /> Branding
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 m-4 mt-2 overflow-hidden">
              <div className="h-full bg-card rounded-lg border border-border overflow-auto">
                {result.html ? (
                  <iframe
                    srcDoc={result.html}
                    className="w-full h-full"
                    sandbox="allow-same-origin"
                    title="Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No preview available
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="html" className="flex-1 m-4 mt-2 overflow-hidden flex flex-col">
              <div className="flex gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => result.html && copyToClipboard(result.html)}
                  className="gap-2"
                >
                  <Copy className="h-3 w-3" /> Copy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => result.html && downloadFile(result.html, 'cloned-site.html')}
                  className="gap-2"
                >
                  <Download className="h-3 w-3" /> Download
                </Button>
              </div>
              <div className="flex-1 bg-card rounded-lg border border-border overflow-auto p-4">
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {result.html || 'No HTML content'}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="flex-1 m-4 mt-2 overflow-auto">
              {result.branding ? (
                <div className="space-y-4">
                  {result.branding.colors && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Colors</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.branding.colors).map(([name, color]) => (
                          <div
                            key={name}
                            className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg"
                          >
                            <div
                              className="w-6 h-6 rounded border border-border"
                              style={{ backgroundColor: color }}
                            />
                            <div>
                              <div className="text-xs font-medium">{name}</div>
                              <div className="text-xs text-muted-foreground">{color}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.branding.fonts && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Fonts</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.branding.fonts.map((font, i) => (
                          <div key={i} className="bg-secondary px-3 py-2 rounded-lg text-sm">
                            {font.family}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.branding.logo && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Logo</h3>
                      <img 
                        src={result.branding.logo} 
                        alt="Logo" 
                        className="max-h-16 bg-secondary p-2 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No branding data extracted
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!loading && !result && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Copy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Clone Any Website</h3>
              <p className="text-sm text-muted-foreground">
                Enter a URL to extract HTML, CSS, and branding information
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
