import { useState, useEffect } from 'react';
import { Mail, Send, Users, FileText, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface EmailDraft {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  isHtml: boolean;
}

interface SentEmail {
  id: string;
  to: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export default function EmailManager() {
  const [draft, setDraft] = useState<EmailDraft>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    isHtml: false
  });
  const [sending, setSending] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkSmtpConfig();
    }
  }, [user]);

  const checkSmtpConfig = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_settings')
      .select('api_keys')
      .eq('user_id', user.id)
      .single();

    if (data?.api_keys) {
      const keys = data.api_keys as Record<string, string>;
      setSmtpConfigured(!!keys.smtp_host && !!keys.smtp_user && !!keys.smtp_pass);
    }
  };

  const sendEmail = async () => {
    if (!draft.to || !draft.subject) {
      toast({
        title: "Validation Error",
        description: "Recipient and subject are required",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('api_keys')
        .eq('user_id', user?.id)
        .single();

      const apiKeys = settings?.api_keys as Record<string, string> || {};

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          smtp: {
            host: apiKeys.smtp_host,
            port: parseInt(apiKeys.smtp_port || '587'),
            user: apiKeys.smtp_user,
            pass: apiKeys.smtp_pass
          },
          email: {
            to: draft.to.split(',').map(e => e.trim()),
            cc: draft.cc ? draft.cc.split(',').map(e => e.trim()) : [],
            bcc: draft.bcc ? draft.bcc.split(',').map(e => e.trim()) : [],
            subject: draft.subject,
            body: draft.body,
            isHtml: draft.isHtml
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Email Sent",
          description: `Successfully sent to ${draft.to}`
        });
        
        setSentEmails(prev => [{
          id: Date.now().toString(),
          to: draft.to,
          subject: draft.subject,
          sentAt: new Date().toISOString(),
          status: 'sent'
        }, ...prev]);

        setDraft({
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          body: '',
          isHtml: false
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send email",
        variant: "destructive"
      });
      
      setSentEmails(prev => [{
        id: Date.now().toString(),
        to: draft.to,
        subject: draft.subject,
        sentAt: new Date().toISOString(),
        status: 'failed'
      }, ...prev]);
    } finally {
      setSending(false);
    }
  };

  const templates = [
    { name: 'Welcome Email', subject: 'Welcome to our platform!', body: 'Dear {{name}},\n\nWelcome to our platform. We\'re excited to have you on board!\n\nBest regards,\nThe Team' },
    { name: 'Password Reset', subject: 'Password Reset Request', body: 'Dear {{name}},\n\nWe received a request to reset your password. Click the link below to proceed:\n\n{{reset_link}}\n\nIf you didn\'t request this, please ignore this email.\n\nBest regards,\nThe Team' },
    { name: 'Newsletter', subject: 'Monthly Newsletter', body: 'Dear Subscriber,\n\nHere are the latest updates from our team:\n\n{{content}}\n\nStay tuned for more!\n\nBest regards,\nThe Team' }
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-3 sm:p-4 border-b border-border/60">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold">Email Manager</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Compose and send emails via SMTP</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="compose" className="h-full flex flex-col">
          <TabsList className="mx-3 sm:mx-4 mt-3 sm:mt-4 w-fit">
            <TabsTrigger value="compose" className="text-xs sm:text-sm px-2 sm:px-3">Compose</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm px-2 sm:px-3">Templates</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm px-2 sm:px-3">History</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4">
            {!smtpConfigured ? (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                  <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold">SMTP Configuration Required</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Please configure your SMTP settings in Settings → Integrations
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      To
                    </label>
                    <Input
                      placeholder="recipient@example.com"
                      value={draft.to}
                      onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium">CC</label>
                      <Input
                        placeholder="cc@example.com"
                        value={draft.cc}
                        onChange={(e) => setDraft({ ...draft, cc: e.target.value })}
                        className="h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium">BCC</label>
                      <Input
                        placeholder="bcc@example.com"
                        value={draft.bcc}
                        onChange={(e) => setDraft({ ...draft, bcc: e.target.value })}
                        className="h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      Subject
                    </label>
                    <Input
                      placeholder="Email subject"
                      value={draft.subject}
                      onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Message</label>
                    <Textarea
                      placeholder="Write your message here..."
                      className="min-h-[120px] sm:min-h-[200px] resize-none text-xs sm:text-sm"
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={draft.isHtml}
                        onChange={(e) => setDraft({ ...draft, isHtml: e.target.checked })}
                        className="rounded border-border w-3.5 h-3.5 sm:w-4 sm:h-4"
                      />
                      Send as HTML
                    </label>

                    <Button onClick={sendEmail} disabled={sending} size="sm" className="text-xs sm:text-sm h-8 sm:h-10 self-end sm:self-auto">
                      {sending ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      )}
                      Send Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3">
            {templates.map((template, i) => (
              <Card
                key={i}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setDraft({ ...draft, subject: template.subject, body: template.body })}
              >
                <CardContent className="p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium mb-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">{template.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2 line-clamp-2">{template.body}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3">
            {sentEmails.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Mail className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                <h3 className="text-sm sm:text-base font-semibold mb-2">No Emails Sent</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your sent emails will appear here
                </p>
              </div>
            ) : (
              sentEmails.map((email) => (
                <Card key={email.id}>
                  <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{email.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">To: {email.to}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(email.sentAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={email.status === 'sent' ? 'default' : 'destructive'} className="self-start sm:self-auto text-xs">
                      {email.status === 'sent' ? (
                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      ) : (
                        <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      )}
                      {email.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
