-- Migration: Create settings table for payment accounts
-- Timestamp: 20240524000000

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    payment_method TEXT PRIMARY KEY,
    account_details TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Everyone (public) can read settings to know how to pay
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view settings') THEN
        CREATE POLICY "Public can view settings" ON public.settings FOR SELECT USING (true);
    END IF;
END $$;

-- Only admins can manage (insert/update/delete) settings
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage settings') THEN
        CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;

-- 4. Seed initial settings
INSERT INTO public.settings (payment_method, account_details)
VALUES 
    ('telebirr', 'Not Configured'),
    ('cbe_birr', 'Not Configured'),
    ('mpesa', 'Not Configured')
ON CONFLICT (payment_method) DO NOTHING;