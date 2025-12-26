import { useState, useEffect } from 'react';
import { Users, Mail, Trash2, Check, X, Crown, Edit3, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ProjectMember {
  id: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  accepted: boolean;
  user_id: string;
}

interface ProjectSharingPanelProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

const roleIcons = {
  viewer: Eye,
  editor: Edit3,
  admin: Crown,
};

const roleLabels = {
  viewer: 'Can view',
  editor: 'Can edit',
  admin: 'Full access',
};

export default function ProjectSharingPanel({ projectId, projectName, isOpen, onClose }: ProjectSharingPanelProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && projectId) {
      loadMembers();
    }
  }, [isOpen, projectId]);

  const loadMembers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error loading members:', error);
    } else {
      setMembers((data || []).map(m => ({
        ...m,
        role: m.role as 'viewer' | 'editor' | 'admin'
      })));
    }
    setIsLoading(false);
  };

  const inviteMember = async () => {
    if (!email.trim() || !user) return;

    setIsInviting(true);
    try {
      // First, check if user exists
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();

      if (!profileData) {
        toast({
          title: 'User not found',
          description: 'This email is not registered. They need to sign up first.',
          variant: 'destructive',
        });
        setIsInviting(false);
        return;
      }

      const { error } = await supabase.from('project_members').insert({
        project_id: projectId,
        user_id: profileData.id,
        email: email.trim(),
        role,
        invited_by: user.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already invited', description: 'This user is already a member', variant: 'destructive' });
        } else {
          throw error;
        }
      } else {
        toast({ title: 'Invited', description: `${email} has been invited as ${roleLabels[role].toLowerCase()}` });
        setEmail('');
        loadMembers();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to invite member', variant: 'destructive' });
    }
    setIsInviting(false);
  };

  const updateRole = async (memberId: string, newRole: 'viewer' | 'editor' | 'admin') => {
    const { error } = await supabase
      .from('project_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    } else {
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    }
  };

  const removeMember = async (memberId: string, memberEmail: string) => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' });
    } else {
      setMembers(members.filter(m => m.id !== memberId));
      toast({ title: 'Removed', description: `${memberEmail} has been removed` });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Share Project
          </SheetTitle>
          <SheetDescription>
            Invite team members to collaborate on "{projectName}"
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Invite Form */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Invite by email</label>
            <div className="flex gap-2">
              <Input
                placeholder="email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviteMember()}
              />
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={inviteMember} disabled={!email.trim() || isInviting} className="w-full gap-2">
              {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send Invite
            </Button>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Team members</label>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No team members yet. Invite someone to collaborate!
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role];
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg bg-secondary/50",
                        !member.accepted && "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.email}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <RoleIcon className="h-3 w-3" />
                            {roleLabels[member.role]}
                            {!member.accepted && (
                              <span className="ml-2 text-yellow-500">(pending)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={member.role}
                          onValueChange={(v) => updateRole(member.id, v as any)}
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeMember(member.id, member.email)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
