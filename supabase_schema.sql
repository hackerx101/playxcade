-- Supabase Database Schema for Playxcade / Garexcell

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  account_status VARCHAR(50) DEFAULT 'active',
  appeal_status VARCHAR(50) DEFAULT 'none',
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure columns exist if table was previously created without them
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS appeal_status VARCHAR(50) DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- POSTS TABLE
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  media_url TEXT,
  type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'video'
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- LIKES TABLE
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- COMMENTS TABLE
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- FOLLOWERS TABLE
CREATE TABLE IF NOT EXISTS followers (
  follower_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

-- CHATS TABLE (List of Chats)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- CHAT PARTICIPANTS (To map users to chats)
CREATE TABLE IF NOT EXISTS chat_participants (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (chat_id, user_id)
);

-- MESSAGES TABLE (Actual Messages)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, authenticated insert/update
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- Posts: Public read, owner insert/update/delete
CREATE POLICY "Posts are viewable by everyone." ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts." ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts." ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts." ON posts FOR DELETE USING (auth.uid() = user_id);

-- Likes: Public read, owner insert/delete
CREATE POLICY "Likes are viewable by everyone." ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes." ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes." ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: Public read, owner insert/delete
CREATE POLICY "Comments are viewable by everyone." ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments." ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- Followers: Public read, owner insert/delete
CREATE POLICY "Followers are viewable by everyone." ON followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others." ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others." ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Chats & Messages (Private)
CREATE POLICY "Users can view chats they are in." ON chat_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join chats." ON chat_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view chats they participate in." ON chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = chats.id AND user_id = auth.uid())
);
CREATE POLICY "Users can create chats." ON chats FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view messages in their chats." ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = messages.chat_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages." ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can delete their own messages." ON messages FOR DELETE USING (auth.uid() = sender_id);
