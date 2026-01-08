-- Create avatar status enum
CREATE TYPE avatar_status AS ENUM (
  'PENDING',
  'IN_QUEUE',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

-- Create avatars table
CREATE TABLE IF NOT EXISTS avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status avatar_status NOT NULL DEFAULT 'PENDING',

  -- fal.ai request tracking
  fal_request_id TEXT,
  fal_response_url TEXT,
  fal_status_url TEXT,
  fal_cancel_url TEXT,

  -- Generation parameters
  prompt TEXT NOT NULL,
  prompt_expanded TEXT,

  -- Avatar options (JSON for flexibility)
  options JSONB,

  -- Generated image data
  image_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  seed INTEGER,
  has_nsfw BOOLEAN,

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_avatars_user_id ON avatars(user_id);
CREATE INDEX idx_avatars_status ON avatars(status);
CREATE INDEX idx_avatars_fal_request_id ON avatars(fal_request_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_avatars_updated_at
  BEFORE UPDATE ON avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own avatars"
  ON avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own avatars"
  ON avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatars"
  ON avatars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own avatars"
  ON avatars FOR DELETE
  USING (auth.uid() = user_id);
