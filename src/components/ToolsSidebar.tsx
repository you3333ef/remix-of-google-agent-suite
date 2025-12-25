import { useState } from 'react';
import { 
  Map, BarChart3, Megaphone, Building2, ShoppingCart, Search,
  Mail, Globe, Terminal, Code, Copy, Smartphone,
  Bot, FlaskConical, Settings, TestTube, ChevronRight
} from 'lucide-react';
import { tools } from '@/data/agents';
import { cn } from '@/lib/utils';
import { ToolCategory } from '@/types/agent';

const categoryIcons: Record<ToolCategory, React.ReactNode> = {
  google: <Search className="h-4 w-4" />,
  communication: <Mail className="h-4 w-4" />,
  development: <Code className="h-4 w-4" />,
  ai: <Bot className="h-4 w-4" />,
  automation: <Settings className="h-4 w-4" />,
};

const categoryLabels: Record<ToolCategory, string> = {
  google: 'Google APIs',
  communication: 'Communication',
  development: 'Development',
  ai: 'AI Tools',
  automation: 'Automation',
};

const toolIconMap: Record<string, React.ReactNode> = {
  'google-maps': <Map className="h-4 w-4" />,
  'google-analytics': <BarChart3 className="h-4 w-4" />,
  'google-ads': <Megaphone className="h-4 w-4" />,
  'google-business': <Building2 className="h-4 w-4" />,
  'google-merchant': <ShoppingCart className="h-4 w-4" />,
  'search-console': <Search className="h-4 w-4" />,
  'email': <Mail className="h-4 w-4" />,
  'dns': <Globe className="h-4 w-4" />,
  'terminal': <Terminal className="h-4 w-4" />,
  'code-editor': <Code className="h-4 w-4" />,
  'web-clone': <Copy className="h-4 w-4" />,
  'app-builder': <Smartphone className="h-4 w-4" />,
  'ai-chat': <Bot className="h-4 w-4" />,
  'deep-research': <FlaskConical className="h-4 w-4" />,
  'automation': <Settings className="h-4 w-4" />,
  'testing': <TestTube className="h-4 w-4" />,
};

interface ToolsSidebarProps {
  onToolSelect?: (toolId: string) => void;
}

export default function ToolsSidebar({ onToolSelect }: ToolsSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<ToolCategory[]>(['google', 'development']);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const toggleCategory = (category: ToolCategory) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
    onToolSelect?.(toolId);
  };

  const categories = Object.keys(categoryLabels) as ToolCategory[];

  return (
    <div className="space-y-2">
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tools & Services
        </h3>
      </div>

      {categories.map((category) => {
        const categoryTools = tools.filter(t => t.category === category);
        const isExpanded = expandedCategories.includes(category);

        return (
          <div key={category} className="space-y-1">
            <button
              onClick={() => toggleCategory(category)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-secondary",
                isExpanded && "text-foreground"
              )}
            >
              <ChevronRight className={cn(
                "h-3 w-3 transition-transform duration-200",
                isExpanded && "rotate-90"
              )} />
              {categoryIcons[category]}
              <span className="text-sm font-medium flex-1 text-left">
                {categoryLabels[category]}
              </span>
              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                {categoryTools.length}
              </span>
            </button>

            {isExpanded && (
              <div className="ml-4 space-y-1 animate-fade-in">
                {categoryTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                      "text-sm text-muted-foreground hover:text-foreground",
                      selectedTool === tool.id
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "hover:bg-secondary"
                    )}
                  >
                    <span className={cn(
                      "p-1.5 rounded-md",
                      selectedTool === tool.id ? "bg-primary/20" : "bg-secondary"
                    )}>
                      {toolIconMap[tool.id]}
                    </span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{tool.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
