import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deep Research query:', query);

    // Step 1: Search the web using Firecrawl
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Firecrawl search error:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || 'Search failed' }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Process and summarize results
    const results = searchData.data || [];
    
    const processedResults = results.map((result: any, index: number) => ({
      rank: index + 1,
      title: result.title || 'No title',
      url: result.url,
      description: result.description || '',
      content: result.markdown?.slice(0, 2000) || '', // Limit content length
    }));

    // Step 3: Generate AI summary using Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let summary = '';

    if (lovableApiKey && processedResults.length > 0) {
      try {
        const contentForSummary = processedResults
          .map((r: any) => `### ${r.title}\n${r.description}\n${r.content.slice(0, 500)}`)
          .join('\n\n---\n\n');

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a research assistant. Summarize the following search results into a clear, actionable report in Arabic. Focus on key findings and insights.',
              },
              {
                role: 'user',
                content: `Query: "${query}"\n\nSearch Results:\n${contentForSummary}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          summary = aiData.choices?.[0]?.message?.content || '';
        }
      } catch (aiError) {
        console.error('AI summary error:', aiError);
      }
    }

    console.log(`Deep Research completed: ${processedResults.length} results`);

    return new Response(
      JSON.stringify({
        success: true,
        query,
        resultsCount: processedResults.length,
        summary,
        results: processedResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Deep Research error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
