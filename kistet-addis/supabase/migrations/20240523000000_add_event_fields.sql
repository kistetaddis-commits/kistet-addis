-- Migration: Add extra fields to events table
-- Timestamp: 20240523000000

-- Add new columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS total_tickets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS event_type TEXT;

-- Update RLS policies to allow admins and organizers to create events
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can create events') THEN
        CREATE POLICY "Admins can create events" ON public.events FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'organizer'))
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update events') THEN
        CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'organizer'))
        );
    END IF;
END $$;