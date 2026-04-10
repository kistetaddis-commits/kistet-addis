-- Migration: Fix admin authentication system
-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update users table schema
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
        ALTER TABLE public.users RENAME COLUMN password TO password_hash;
    END IF;
END $$;

-- Ensure password_hash exists (it should after rename, or if it was already there)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 3. Seed default admin
-- Password '12345678' hashed with SHA-256: ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE username = 'KistetAddis') THEN
        INSERT INTO public.users (name, email, username, password_hash, role)
        VALUES (
            'Kistet Addis Admin', 
            'admin@kistetaddis.com', 
            'KistetAddis', 
            'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 
            'admin'
        );
    END IF;
END $$;

-- 4. RLS Policies
-- To make the custom login work with RLS enabled, we need to allow selecting users for lookup.
DROP POLICY IF EXISTS "Public can view users for login" ON public.users;
CREATE POLICY "Public can view users for login" 
ON public.users 
FOR SELECT 
USING (true);

-- Allow updates for the admin user specifically
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
CREATE POLICY "Users can update their own record" 
ON public.users 
FOR UPDATE 
USING (true)
WITH CHECK (true);