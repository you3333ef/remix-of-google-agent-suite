import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, RefreshCw, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied?: boolean;
}

const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'];

export default function DNSManager() {
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [zoneId, setZoneId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'A',
    name: '',
    content: '',
    ttl: 3600,
    proxied: false
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_settings')
      .select('api_keys')
      .eq('user_id', user.id)
      .single();

    if (data?.api_keys) {
      const keys = data.api_keys as Record<string, string>;
      setApiKey(keys.cloudflare_api_key || '');
      setZoneId(keys.cloudflare_zone_id || '');
    }
  };

  const fetchRecords = async () => {
    if (!apiKey || !zoneId) {
      toast({
        title: "Configuration Required",
        description: "Please configure Cloudflare API key and Zone ID in Settings",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cloudflare-dns', {
        body: {
          action: 'list',
          apiKey,
          zoneId
        }
      });

      if (error) throw error;

      if (data.success && data.records) {
        setRecords(data.records);
        toast({
          title: "Records Loaded",
          description: `Found ${data.records.length} DNS records`
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch DNS records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async () => {
    if (!newRecord.name || !newRecord.content) {
      toast({
        title: "Validation Error",
        description: "Name and content are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cloudflare-dns', {
        body: {
          action: 'create',
          apiKey,
          zoneId,
          record: newRecord
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: "Success", description: "DNS record created" });
        setShowAddForm(false);
        setNewRecord({ type: 'A', name: '', content: '', ttl: 3600, proxied: false });
        fetchRecords();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cloudflare-dns', {
        body: {
          action: 'delete',
          apiKey,
          zoneId,
          recordId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: "Success", description: "DNS record deleted" });
        fetchRecords();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isConfigured = apiKey && zoneId;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-3 sm:p-4 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold">DNS Manager</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Manage Cloudflare DNS records</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecords}
              disabled={loading || !isConfigured}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <RefreshCw className={cn("h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2", loading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              disabled={!isConfigured}
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {!isConfigured ? (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 flex-shrink-0" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold">Configuration Required</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Please configure your Cloudflare API Key and Zone ID in Settings → Integrations
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {showAddForm && (
              <Card className="border-primary/30">
                <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-base font-medium">Add New Record</h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Type</label>
                      <Select
                        value={newRecord.type}
                        onValueChange={(v) => setNewRecord({ ...newRecord, type: v })}
                      >
                        <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {recordTypes.map((type) => (
                            <SelectItem key={type} value={type} className="text-xs sm:text-sm">{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium">TTL</label>
                      <Input
                        type="number"
                        value={newRecord.ttl}
                        onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) })}
                        className="h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Name</label>
                    <Input
                      placeholder="e.g., www or @"
                      value={newRecord.name}
                      onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Content</label>
                    <Input
                      placeholder="e.g., 192.168.1.1"
                      value={newRecord.content}
                      onChange={(e) => setNewRecord({ ...newRecord, content: e.target.value })}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddForm(false)} size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                      Cancel
                    </Button>
                    <Button onClick={createRecord} disabled={loading} size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                      <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                      Create
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {records.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Globe className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                <h3 className="text-sm sm:text-base font-semibold mb-2">No Records Found</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Click "Refresh" to load DNS records or add a new one
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((record) => (
                  <Card key={record.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <Badge variant="outline" className="font-mono text-xs">
                          {record.type}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{record.name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{record.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          TTL: {record.ttl}
                        </Badge>
                        {record.proxied && (
                          <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-xs">
                            Proxied
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRecord(record.id)}
                          className="text-destructive hover:text-destructive h-7 w-7 sm:h-8 sm:w-8"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
