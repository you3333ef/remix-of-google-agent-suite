-- Create table for storing Google OAuth tokens securely
CREATE TABLE public.user_google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own tokens
CREATE POLICY "Users can view their own tokens" 
ON public.user_google_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow users to insert their own tokens
CREATE POLICY "Users can insert their own tokens" 
ON public.user_google_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own tokens
CREATE POLICY "Users can update their own tokens" 
ON public.user_google_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_google_tokens_updated_at
BEFORE UPDATE ON public.user_google_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();