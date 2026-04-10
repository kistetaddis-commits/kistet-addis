-- Migration: Setup storage bucket for event images
-- Timestamp: 20240527000000

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for event-images bucket
-- Allow public access to read files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update/delete their own files (optional but good)
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (
    bucket_id = 'event-images' AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'event-images' AND auth.role() = 'authenticated'
);