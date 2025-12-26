import { useState } from 'react';
import { Search, Loader2, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ResearchResult {
  rank: number;
  title: string;
  url: string;
  description: string;
  content: string;
}

interface ResearchResponse {
  success: boolean;
  query: string;
  resultsCount: number;
  summary: string;
  results: ResearchResult[];
  error?: string;
}

export default function DeepResearchTool() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ResearchResponse | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({ title: 'Error', description: 'Please enter a search query', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke('deep-research', {
        body: { query: query.trim(), limit: 5 },
      });

      if (error) throw error;

      if (data.success) {
        setResponse(data);
        toast({ title: 'Research Complete', description: `Found ${data.resultsCount} results` });
      } else {
        throw new Error(data.error || 'Research failed');
      }
    } catch (error) {
      console.error('Deep research error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to perform research',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/60 bg-card/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Deep Research</h2>
            <p className="text-sm text-muted-foreground">AI-powered web search & analysis</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter your research query..."
            className="flex-1 bg-secondary/50 border-border"
            disabled={isLoading}
          />
          <Button onClick={handleSearch} disabled={isLoading || !query.trim()} variant="neon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1 p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground">Searching the web...</p>
          </div>
        )}

        {response && !isLoading && (
          <div className="space-y-6">
            {/* AI Summary */}
            {response.summary && (
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">AI Summary</h3>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {response.summary}
                </p>
              </Card>
            )}

            {/* Search Results */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {response.resultsCount} Sources Found
              </h3>

              {response.results.map((result) => (
                <Card key={result.rank} className="p-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                          #{result.rank}
                        </span>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:text-primary truncate flex items-center gap-1"
                        >
                          {result.title}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-2">{result.url}</p>
                      <p className="text-sm text-foreground/80 line-clamp-3">
                        {result.description || result.content.slice(0, 200)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!response && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Start Your Research</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Enter a query above to search the web and get AI-powered insights and summaries.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
