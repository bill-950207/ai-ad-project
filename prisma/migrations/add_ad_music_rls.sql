-- Enable RLS on ad_music table
ALTER TABLE public.ad_music ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own music
CREATE POLICY "Users can view their own ad music"
ON public.ad_music
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own music
CREATE POLICY "Users can insert their own ad music"
ON public.ad_music
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own music
CREATE POLICY "Users can update their own ad music"
ON public.ad_music
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own music
CREATE POLICY "Users can delete their own ad music"
ON public.ad_music
FOR DELETE
USING (auth.uid() = user_id);
