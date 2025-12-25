-- Enable realtime for files table to support collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;