-- RLS policies for ad_background table

-- Enable RLS
ALTER TABLE public.ad_background ENABLE ROW LEVEL SECURITY;

-- Create policies
-- SELECT: 사용자는 자신의 배경만 조회 가능
CREATE POLICY "Users can view their own backgrounds"
ON public.ad_background
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: 사용자는 자신의 배경만 생성 가능
CREATE POLICY "Users can insert their own backgrounds"
ON public.ad_background
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: 사용자는 자신의 배경만 수정 가능
CREATE POLICY "Users can update their own backgrounds"
ON public.ad_background
FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: 사용자는 자신의 배경만 삭제 가능
CREATE POLICY "Users can delete their own backgrounds"
ON public.ad_background
FOR DELETE
USING (auth.uid() = user_id);
