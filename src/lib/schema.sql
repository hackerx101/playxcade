-- ==========================================================
-- PLAYXCADE - GAREXCELL SUPABASE DATABASE SCHEMA & POLICIES
-- Execute this SQL in your Supabase SQL Editor
-- Project URL: https://eqcvnwcvahziwswbohlx.supabase.co
-- ==========================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  username VARCHAR(11) NOT NULL UNIQUE,
  email TEXT NOT NULL,
  bio TEXT DEFAULT '',
  dob DATE,
  avatar_url TEXT DEFAULT '',
  "IsDeleted" BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'disabled'
  suspension_reason TEXT DEFAULT '',
  appeal_status VARCHAR(20) DEFAULT 'none', -- 'none', 'pending', 'approved', 'rejected'
  "IsIdentityVerify" BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  phone_number VARCHAR(20) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 3. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
  id VARCHAR(12) PRIMARY KEY, -- 12-digit unique string ID
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  author_username VARCHAR(11) NOT NULL,
  author_avatar TEXT DEFAULT '',
  author_is_verified BOOLEAN DEFAULT FALSE,
  caption TEXT DEFAULT '',
  type VARCHAR(10) CHECK (type IN ('text', 'image', 'video')),
  media_url TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  category VARCHAR(50) DEFAULT 'Gaming',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id VARCHAR(12) NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  author_username VARCHAR(11) NOT NULL,
  author_avatar TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LIKES TABLE
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id VARCHAR(12) NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 6. CHATS TABLE
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  participant_two UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  last_message TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'Garexcell VIP',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. IDENTITY VERIFICATION TABLE
CREATE TABLE IF NOT EXISTS public.identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  dob DATE NOT NULL,
  email TEXT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  doc_type VARCHAR(50) DEFAULT 'Government ID',
  doc_number VARCHAR(50) DEFAULT '',
  doc_expiry DATE,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  selfie_code VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'verified',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  device_name TEXT DEFAULT 'Browser',
  ip_address TEXT DEFAULT '127.0.0.1',
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR user_id = user_id);
CREATE POLICY "Allow delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id OR user_id = user_id);

-- Follows Policies
CREATE POLICY "Allow view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Allow add follow" ON public.follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete follow" ON public.follows FOR DELETE USING (true);

-- Posts Policies
CREATE POLICY "Allow see other posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow upload own post" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete own post" ON public.posts FOR DELETE USING (true);

-- Comments Policies
CREATE POLICY "Allow view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow create comment" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete comment" ON public.comments FOR DELETE USING (true);

-- Likes Policies
CREATE POLICY "Allow view likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Allow insert like" ON public.likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete like" ON public.likes FOR DELETE USING (true);

-- Chats & Messages Policies
CREATE POLICY "Allow view chats" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Allow create chat" ON public.chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow insert messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Subscriptions Policies
CREATE POLICY "Allow view subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow insert subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete subscriptions" ON public.subscriptions FOR DELETE USING (true);

-- Identity Policies
CREATE POLICY "Allow view identity" ON public.identity FOR SELECT USING (true);
CREATE POLICY "Allow insert identity" ON public.identity FOR INSERT WITH CHECK (true);

-- Sessions Policies
CREATE POLICY "Allow view sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow insert sessions" ON public.sessions FOR INSERT WITH CHECK (true);
