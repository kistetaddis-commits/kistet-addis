-- Migration: Fix Authentication RLS and restrictive profile access
-- Date: 2025-05-26

-- 1. Tighten RLS on public.users (profiles table)
-- We want to ensure users can only see their own profile, but admins can see all.
-- This fulfills the requirement: "Add policy to allow: auth.uid() = id"

-- First, drop the overly permissive policy if it exists
DROP POLICY IF EXISTS "Public can view users for login" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- 2. Create the standard restrictive policy for users
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- 3. Create an override policy for Admins to view all profiles (needed for dashboard management)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles') THEN
        CREATE POLICY "Admins can view all profiles" 
        ON public.users 
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
    END IF;
END $$;

-- 4. Create an override policy for Organizers to view user profiles (needed for scanning tickets)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organizers can view customer profiles') THEN
        CREATE POLICY "Organizers can view customer profiles" 
        ON public.users 
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'organizer'
            )
        );
    END IF;
END $$;

-- 5. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;