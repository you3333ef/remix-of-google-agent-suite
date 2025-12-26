-- Create maps_conversations table for agent memory
CREATE TABLE public.maps_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maps_saved_places table
CREATE TABLE public.maps_saved_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  place_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  rating DOUBLE PRECISION,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maps_saved_routes table
CREATE TABLE public.maps_saved_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  waypoints JSONB DEFAULT '[]'::jsonb,
  travel_mode TEXT NOT NULL DEFAULT 'driving',
  distance TEXT,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maps_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps_saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps_saved_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maps_conversations
CREATE POLICY "Users can view their own conversations" 
ON public.maps_conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.maps_conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.maps_conversations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.maps_conversations FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for maps_saved_places
CREATE POLICY "Users can view their saved places" 
ON public.maps_saved_places FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save places" 
ON public.maps_saved_places FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved places" 
ON public.maps_saved_places FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved places" 
ON public.maps_saved_places FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for maps_saved_routes
CREATE POLICY "Users can view their saved routes" 
ON public.maps_saved_routes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save routes" 
ON public.maps_saved_routes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved routes" 
ON public.maps_saved_routes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved routes" 
ON public.maps_saved_routes FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_maps_conversations_updated_at
BEFORE UPDATE ON public.maps_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();