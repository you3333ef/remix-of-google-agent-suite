import { useState, useEffect } from 'react';
import { X, Settings, Palette, Key, User, Moon, Sun, Monitor, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Theme = 'dark' | 'light' | 'system';
type Tab = 'profile' | 'theme' | 'api-keys';

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [theme, setTheme] = useState<Theme>('dark');
  const [displayName, setDisplayName] = useState('');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    google: '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || '');
    }

    // Load settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('theme, api_keys')
      .eq('user_id', user.id)
      .single();

    if (settings) {
      setTheme((settings.theme as Theme) || 'dark');
      if (settings.api_keys && typeof settings.api_keys === 'object') {
        setApiKeys(prev => ({ ...prev, ...(settings.api_keys as Record<string, string>) }));
      }
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      // Update settings
      await supabase
        .from('user_settings')
        .update({ 
          theme, 
          api_keys: apiKeys 
        })
        .eq('user_id', user.id);

      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, icon: User, label: 'Profile' },
    { id: 'theme' as const, icon: Palette, label: 'Appearance' },
    { id: 'api-keys' as const, icon: Key, label: 'API Keys' },
  ];

  const themeOptions = [
    { id: 'dark' as const, icon: Moon, label: 'Dark' },
    { id: 'light' as const, icon: Sun, label: 'Light' },
    { id: 'system' as const, icon: Monitor, label: 'System' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl glass-panel max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Settings</h2>
              <p className="text-sm text-muted-foreground">Manage your preferences</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-border p-2 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Profile Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Email</label>
                      <Input value={user?.email || ''} disabled className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Display Name</label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium mb-3 text-destructive">Danger Zone</h3>
                  <Button variant="destructive" onClick={signOut} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Theme</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {themeOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setTheme(option.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors",
                            theme === option.id
                              ? "bg-primary/20 border border-primary"
                              : "bg-secondary hover:bg-secondary/80 border border-transparent"
                          )}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Preferences</h3>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm">Animations</div>
                      <div className="text-xs text-muted-foreground">Enable motion effects</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm">Sound Effects</div>
                      <div className="text-xs text-muted-foreground">Play sounds on actions</div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">API Keys</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Add your own API keys to use custom AI providers. Keys are stored securely.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">OpenAI API Key</label>
                      <Input
                        type="password"
                        value={apiKeys.openai}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                        placeholder="sk-..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Anthropic API Key</label>
                      <Input
                        type="password"
                        value={apiKeys.anthropic}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                        placeholder="sk-ant-..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Google AI API Key</label>
                      <Input
                        type="password"
                        value={apiKeys.google}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, google: e.target.value }))}
                        placeholder="AIza..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-border bg-secondary/30">
          <Button variant="ghost" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
