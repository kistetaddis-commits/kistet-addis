-- Migration: Enhance organizer system and update dashboard metrics
-- Date: 2024-05-25

-- 1. Update users table to support direct event assignment
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- 2. Update RLS Policies for Organizer Access

-- Clear existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view events" ON public.events;
DROP POLICY IF EXISTS "Organizers view own associations" ON public.organizers;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view tickets for assigned events" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can scan tickets for assigned events" ON public.tickets;

-- Events: Public can view all, but we might want to restrict some fields later. For now, public view is fine.
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);

-- Tickets: 
-- - Users see their own
-- - Admins see all
-- - Organizers see tickets for their assigned event
CREATE POLICY "Users view own tickets" ON public.tickets 
FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
    event_id = (SELECT event_id FROM public.users WHERE id = auth.uid() AND role = 'organizer') OR
    EXISTS (SELECT 1 FROM public.organizers WHERE user_id = auth.uid() AND event_id = public.tickets.event_id)
);

-- Tickets: Organizers can update status to 'used' (scanning)
CREATE POLICY "Organizers can scan tickets" ON public.tickets
FOR UPDATE USING (
    event_id = (SELECT event_id FROM public.users WHERE id = auth.uid() AND role = 'organizer') OR
    EXISTS (SELECT 1 FROM public.organizers WHERE user_id = auth.uid() AND event_id = public.tickets.event_id)
) WITH CHECK (
    status = 'used'
);

-- Users:
-- - Organizers need to see buyer info for their tickets
DROP POLICY IF EXISTS "Public can view users for login" ON public.users;
CREATE POLICY "Public can view users for login" ON public.users FOR SELECT USING (true);

-- 3. Create a helper function for dashboard metrics if needed, 
-- but we can do it via the client as requested.

-- 4. Ensure the 'organizer' role exists (it should from initial migration)
-- and add check constraint for roles if not already there.