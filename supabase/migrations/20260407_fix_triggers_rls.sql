-- Fix RLS Policies for paryuktam dashboard

-- 1. team_members policies
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop potentially recursive or broken existing policies
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "Members can view their team" ON public.team_members;

-- Allow users to view their own team memberships seamlessly
CREATE POLICY "team_members_select" 
ON public.team_members FOR SELECT 
USING (user_id = auth.uid());

-- Typically insertion is handled securely by supabaseAdmin (Service Role bypasses RLS) 
-- but if anon client inserts happen, we need this:
CREATE POLICY "team_members_insert" 
ON public.team_members FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "team_members_update" 
ON public.team_members FOR UPDATE 
USING (user_id = auth.uid());


-- 2. profiles policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- Allow users to view profiles (often public, or at least visible authenticated users)
CREATE POLICY "profiles_select" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow users to insert/upsert their OWN profile securely
CREATE POLICY "profiles_insert" 
ON public.profiles FOR INSERT 
WITH CHECK (id = auth.uid());

-- Allow users to update their own profile securely
CREATE POLICY "profiles_update" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());


-- 3. Cleanup Triggers failing
-- Drop the trigger that clashes with our logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
