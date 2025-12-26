-- Create project_members table for sharing projects
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id AND accepted = true
  )
$$;

-- Security definer function to check project ownership
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND user_id = _user_id
  )
$$;

-- Policies for project_members
CREATE POLICY "Project owners can view all members"
ON public.project_members FOR SELECT
USING (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project members can view members"
ON public.project_members FOR SELECT
USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Users can view their own invites"
ON public.project_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Project owners can add members"
ON public.project_members FOR INSERT
WITH CHECK (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can update members"
ON public.project_members FOR UPDATE
USING (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY "Users can accept their own invites"
ON public.project_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Project owners can remove members"
ON public.project_members FOR DELETE
USING (public.is_project_owner(project_id, auth.uid()));

-- Update projects policies to allow members to view
CREATE POLICY "Project members can view shared projects"
ON public.projects FOR SELECT
USING (public.is_project_member(id, auth.uid()));

-- Update files policies to allow project members access
CREATE POLICY "Project members can view files"
ON public.files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = files.project_id
    AND pm.user_id = auth.uid()
    AND pm.accepted = true
  )
);

CREATE POLICY "Project members with editor+ can edit files"
ON public.files FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = files.project_id
    AND pm.user_id = auth.uid()
    AND pm.accepted = true
    AND pm.role IN ('editor', 'admin')
  )
);

CREATE POLICY "Project members with editor+ can create files"
ON public.files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = files.project_id
    AND pm.user_id = auth.uid()
    AND pm.accepted = true
    AND pm.role IN ('editor', 'admin')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_project_members_updated_at
BEFORE UPDATE ON public.project_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();