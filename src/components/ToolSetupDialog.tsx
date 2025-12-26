import React, { useState, forwardRef } from 'react';
import { Key, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
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

const ToolSetupDialog = forwardRef<HTMLDivElement, ToolSetupDialogProps>(
  ({ tool, isOpen, onClose, onSetupComplete }, ref) => {
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
      <div ref={ref}>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md max-w-[95vw] p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {instructions.title}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Follow these steps to configure {tool.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              {/* Steps */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-medium text-foreground">Setup Steps:</h4>
                <ol className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-1.5 sm:gap-2">
                      <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
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
                  className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View Documentation <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </a>
              )}

              {/* API Key Input */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  {tool.setupKey || 'API Key'}
                </label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="font-mono text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()} size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
                {isSaving ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1.5 sm:mr-2" />
                ) : (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                )}
                Save & Activate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

ToolSetupDialog.displayName = 'ToolSetupDialog';

export default ToolSetupDialog;
