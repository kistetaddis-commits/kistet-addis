-- Migration: Tighten RLS policies for users table
-- Date: 2024-05-26

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Public can view users for login" ON public.users;

-- 2. Create a policy for users to see their own data (MANDATORY)
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- 3. Create a policy for users to update their own data
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- 4. Create a policy for admins to view all users
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Ensure the table is correctly configured
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;