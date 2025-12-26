import { useState, useEffect } from 'react';
import { X, Settings, Palette, Key, User, Moon, Sun, Monitor, Save, Trash2, ExternalLink, Check, Bot, Plug, Mail, MapPin, BarChart3, Cloud, Globe, Shield, Zap, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { aiProviders, defaultProvider, defaultModel } from '@/data/aiProviders';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Theme = 'dark' | 'light' | 'system';
type Tab = 'profile' | 'theme' | 'ai-providers' | 'integrations';
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface IntegrationKey {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  docsUrl: string;
  description: string;
  testable: boolean;
  fields?: { id: string; label: string; placeholder: string; type?: string }[];
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ai-providers');
  const [theme, setTheme] = useState<Theme>('dark');
  const [displayName, setDisplayName] = useState('');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || '');
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('theme, api_keys, preferred_ai_provider, preferred_agent')
      .eq('user_id', user.id)
      .single();

    if (settings) {
      setTheme((settings.theme as Theme) || 'dark');
      if (settings.api_keys && typeof settings.api_keys === 'object') {
        setApiKeys(settings.api_keys as Record<string, string>);
      }
      if (settings.preferred_ai_provider) {
        setSelectedProvider(settings.preferred_ai_provider);
      }
      if (settings.preferred_agent) {
        setSelectedModel(settings.preferred_agent);
      }
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);

    try {
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      await supabase
        .from('user_settings')
        .update({ 
          theme, 
          api_keys: apiKeys,
          preferred_ai_provider: selectedProvider,
          preferred_agent: selectedModel,
        })
        .eq('user_id', user.id);

      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateApiKey = (providerId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: value }));
    // Reset test status when key changes
    setTestStatus(prev => ({ ...prev, [providerId]: 'idle' }));
  };

  const testConnection = async (integrationId: string) => {
    setTestStatus(prev => ({ ...prev, [integrationId]: 'testing' }));
    
    try {
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { 
          integrationId,
          apiKeys: apiKeys
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        setTestStatus(prev => ({ ...prev, [integrationId]: 'success' }));
        toast({ 
          title: "Connection successful", 
          description: `${integrationId} is configured correctly.` 
        });
      } else {
        throw new Error(data?.error || 'Connection failed');
      }
    } catch (error: any) {
      setTestStatus(prev => ({ ...prev, [integrationId]: 'error' }));
      toast({ 
        title: "Connection failed", 
        description: error.message || 'Failed to connect to the service.',
        variant: "destructive"
      });
    }
  };

  const currentProvider = aiProviders.find(p => p.id === selectedProvider);

  const tabs = [
    { id: 'ai-providers' as const, icon: Bot, label: 'AI Providers' },
    { id: 'integrations' as const, icon: Plug, label: 'Integrations' },
    { id: 'profile' as const, icon: User, label: 'Profile' },
    { id: 'theme' as const, icon: Palette, label: 'Appearance' },
  ];

  const integrationKeys: IntegrationKey[] = [
    {
      id: 'google_maps',
      label: 'Google Maps',
      icon: <MapPin className="h-4 w-4 text-red-500" />,
      placeholder: 'AIzaSy...',
      docsUrl: 'https://console.cloud.google.com/apis/credentials',
      description: 'Enable interactive maps and location services',
      testable: true,
      fields: [
        { id: 'google_maps_api_key', label: 'API Key', placeholder: 'AIzaSy...' }
      ]
    },
    {
      id: 'google_analytics',
      label: 'Google Analytics',
      icon: <BarChart3 className="h-4 w-4 text-yellow-500" />,
      placeholder: 'G-XXXXXXXXXX',
      docsUrl: 'https://analytics.google.com/',
      description: 'Track website traffic and user behavior',
      testable: false,
      fields: [
        { id: 'google_analytics_id', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' }
      ]
    },
    {
      id: 'smtp',
      label: 'Email (SMTP)',
      icon: <Mail className="h-4 w-4 text-blue-500" />,
      placeholder: 'smtp.gmail.com',
      docsUrl: 'https://support.google.com/mail/answer/7126229',
      description: 'Send and receive emails',
      testable: true,
      fields: [
        { id: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
        { id: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
        { id: 'smtp_user', label: 'Username', placeholder: 'your-email@gmail.com' },
        { id: 'smtp_pass', label: 'Password', placeholder: '••••••••', type: 'password' }
      ]
    },
    {
      id: 'cloudflare',
      label: 'Cloudflare DNS',
      icon: <Cloud className="h-4 w-4 text-orange-500" />,
      placeholder: 'Your API Key',
      docsUrl: 'https://dash.cloudflare.com/profile/api-tokens',
      description: 'Manage DNS records and domains',
      testable: true,
      fields: [
        { id: 'cloudflare_api_key', label: 'API Key', placeholder: 'Your global API key' },
        { id: 'cloudflare_zone_id', label: 'Zone ID', placeholder: 'Zone ID from dashboard' }
      ]
    },
    {
      id: 'google_ads',
      label: 'Google Ads',
      icon: <Zap className="h-4 w-4 text-green-500" />,
      placeholder: 'Your Developer Token',
      docsUrl: 'https://ads.google.com/',
      description: 'Manage advertising campaigns',
      testable: false,
      fields: [
        { id: 'google_ads_developer_token', label: 'Developer Token', placeholder: 'Developer token' },
        { id: 'google_ads_client_id', label: 'Client ID', placeholder: 'OAuth Client ID' },
        { id: 'google_ads_client_secret', label: 'Client Secret', placeholder: 'OAuth Client Secret', type: 'password' }
      ]
    },
    {
      id: 'google_search_console',
      label: 'Search Console',
      icon: <Globe className="h-4 w-4 text-purple-500" />,
      placeholder: 'OAuth credentials',
      docsUrl: 'https://search.google.com/search-console',
      description: 'Monitor search performance',
      testable: false,
      fields: [
        { id: 'google_search_console_client_id', label: 'Client ID', placeholder: 'OAuth Client ID' },
        { id: 'google_search_console_client_secret', label: 'Client Secret', placeholder: 'OAuth Client Secret', type: 'password' }
      ]
    }
  ];

  const getTestStatusIcon = (integrationId: string) => {
    const status = testStatus[integrationId];
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-neon-green" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const themeOptions = [
    { id: 'dark' as const, icon: Moon, label: 'Dark' },
    { id: 'light' as const, icon: Sun, label: 'Light' },
    { id: 'system' as const, icon: Monitor, label: 'System' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl glass-panel max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Settings</h2>
              <p className="text-sm text-muted-foreground">Manage your AI providers and preferences</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-border/60 p-2 space-y-1 bg-card/30">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
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
            {activeTab === 'ai-providers' && (
              <div className="space-y-6">
                {/* Default Provider Selection */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Default AI Provider</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select your preferred AI provider. Lovable AI works without an API key.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {aiProviders.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => {
                          setSelectedProvider(provider.id);
                          setSelectedModel(provider.models[0]?.id || '');
                        }}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl text-left transition-all duration-200",
                          selectedProvider === provider.id
                            ? "bg-primary/15 border-2 border-primary"
                            : "bg-secondary/50 border-2 border-transparent hover:border-border"
                        )}
                      >
                        <span className="text-xl">{provider.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{provider.name}</div>
                          {selectedProvider === provider.id && (
                            <Check className="h-3 w-3 text-primary inline" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selection */}
                {currentProvider && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Default Model</h3>
                      <p className="text-xs text-muted-foreground">
                        Choose the AI model to use by default
                      </p>
                    </div>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="bg-secondary/50 border-border">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {currentProvider.models.map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-muted-foreground">- {model.description}</span>
                              {model.contextWindow && (
                                <span className="text-xs text-primary/70 ml-auto">{model.contextWindow}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* API Keys */}
                <div className="space-y-4 pt-4 border-t border-border/60">
                  <div>
                    <h3 className="text-sm font-medium mb-1">API Keys</h3>
                    <p className="text-xs text-muted-foreground">
                      Add your API keys to use your own accounts. Keys are stored securely.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {aiProviders.filter(p => p.id !== 'lovable').map(provider => (
                      <div key={provider.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{provider.icon}</span>
                            <label className="text-sm font-medium">{provider.name}</label>
                          </div>
                          <a 
                            href={provider.docsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Docs <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <Input
                          type="password"
                          value={apiKeys[provider.id] || ''}
                          onChange={(e) => updateApiKey(provider.id, e.target.value)}
                          placeholder={provider.apiKeyPlaceholder}
                          className="bg-secondary/50 border-border font-mono text-sm"
                        />
                        {apiKeys[provider.id] && (
                          <div className="flex items-center gap-1 text-xs text-neon-green">
                            <Check className="h-3 w-3" />
                            Key configured
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                        className="bg-secondary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60">
                  <h3 className="text-sm font-medium mb-3 text-destructive">Danger Zone</h3>
                  <Button variant="destructive" onClick={signOut} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-1">External Services</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Configure API keys for external services. Keys are stored securely in your account.
                  </p>
                </div>

                <div className="space-y-6">
                  {integrationKeys.map(integration => {
                    const hasAnyValue = integration.fields?.some(f => apiKeys[f.id]);
                    return (
                      <div 
                        key={integration.id} 
                        className={cn(
                          "p-4 rounded-xl border transition-all duration-200",
                          hasAnyValue 
                            ? "bg-primary/5 border-primary/30" 
                            : "bg-secondary/30 border-border/60"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                              {integration.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{integration.label}</span>
                                {hasAnyValue && (
                                  <span className="flex items-center gap-1 text-xs text-neon-green">
                                    <Check className="h-3 w-3" />
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{integration.description}</p>
                            </div>
                          </div>
                          <a 
                            href={integration.docsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Get Key <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        
                        <div className="space-y-3">
                          {integration.fields?.map(field => (
                            <div key={field.id} className="space-y-1">
                              <label className="text-xs text-muted-foreground">{field.label}</label>
                              <Input
                                type={field.type || 'text'}
                                value={apiKeys[field.id] || ''}
                                onChange={(e) => updateApiKey(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                className="bg-background/50 border-border font-mono text-sm h-9"
                              />
                            </div>
                          ))}
                        </div>

                        {integration.testable && hasAnyValue && (
                          <div className="mt-4 pt-3 border-t border-border/40">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testConnection(integration.id)}
                              disabled={testStatus[integration.id] === 'testing'}
                              className="gap-2"
                            >
                              {getTestStatusIcon(integration.id)}
                              {testStatus[integration.id] === 'testing' ? 'Testing...' : 'Test Connection'}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-accent">Security Note</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        All API keys are encrypted and stored securely. They are only used for the specific services you enable and are never shared.
                      </p>
                    </div>
                  </div>
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
                            "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200",
                            theme === option.id
                              ? "bg-primary/20 border-2 border-primary"
                              : "bg-secondary/50 border-2 border-transparent hover:border-border"
                          )}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-medium">Preferences</h3>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                    <div>
                      <div className="text-sm">Animations</div>
                      <div className="text-xs text-muted-foreground">Enable motion effects</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                    <div>
                      <div className="text-sm">Sound Effects</div>
                      <div className="text-xs text-muted-foreground">Play sounds on actions</div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-border/60 bg-card/30">
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
