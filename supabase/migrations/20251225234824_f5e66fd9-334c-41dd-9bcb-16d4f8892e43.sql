-- Create custom_agents table for user-created agents
CREATE TABLE public.custom_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT NOT NULL DEFAULT '🤖',
  tools TEXT[] NOT NULL DEFAULT '{}',
  provider TEXT NOT NULL DEFAULT 'openai',
  color TEXT NOT NULL DEFAULT 'from-cyan-500 to-blue-600',
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own agents"
ON public.custom_agents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents"
ON public.custom_agents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
ON public.custom_agents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
ON public.custom_agents FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_agents_updated_at
BEFORE UPDATE ON public.custom_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add active_project_id to user_settings to track current project
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS active_project_id UUID REFERENCES public.projects(id);

-- Add current_file_id to track which file is open in editor
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS current_file_id UUID REFERENCES public.files(id);