import { useState } from 'react';
import { Key, X, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tool } from '@/types/agent';

interface ToolSetupDialogProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: (toolId: string) => void;
}

const setupInstructions: Record<string, { title: string; steps: string[]; docsUrl: string }> = {
  'google-maps': {
    title: 'Google Maps API Setup',
    steps: [
      'Go to Google Cloud Console',
      'Create a new project or select existing',
      'Enable Maps JavaScript API',
      'Create credentials (API Key)',
      'Copy and paste your API key below',
    ],
    docsUrl: 'https://developers.google.com/maps/documentation/javascript/get-api-key',
  },
  'google-analytics': {
    title: 'Google Analytics API Setup',
    steps: [
      'Go to Google Cloud Console',
      'Enable Google Analytics Data API',
      'Create OAuth 2.0 credentials',
      'Download the credentials JSON',
    ],
    docsUrl: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
  },
  'email': {
    title: 'Email (SMTP) Setup',
    steps: [
      'Get your SMTP server details',
      'For Gmail: Enable 2FA and create App Password',
      'Enter SMTP host, port, username, and password',
    ],
    docsUrl: 'https://support.google.com/mail/answer/185833',
  },
  'dns': {
    title: 'DNS Manager Setup (Cloudflare)',
    steps: [
      'Log in to Cloudflare dashboard',
      'Go to My Profile → API Tokens',
      'Create a new API token',
      'Copy and paste your API token below',
    ],
    docsUrl: 'https://developers.cloudflare.com/fundamentals/api/get-started/create-token/',
  },
};

export default function ToolSetupDialog({ tool, isOpen, onClose, onSetupComplete }: ToolSetupDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (!tool) return null;

  const instructions = setupInstructions[tool.id] || {
    title: `Setup ${tool.name}`,
    steps: ['Enter your API key below'],
    docsUrl: '',
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'Error', description: 'Please enter an API key', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    // In a real implementation, this would save to Supabase secrets
    // For now, we'll show a success message
    setTimeout(() => {
      toast({
        title: 'Setup Complete',
        description: `${tool.name} has been configured successfully`,
      });
      setIsSaving(false);
      setApiKey('');
      onSetupComplete(tool.id);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            {instructions.title}
          </DialogTitle>
          <DialogDescription>
            Follow these steps to configure {tool.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Steps */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Setup Steps:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Docs Link */}
          {instructions.docsUrl && (
            <a
              href={instructions.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View Documentation <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {tool.setupKey || 'API Key'}
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Save & Activate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
