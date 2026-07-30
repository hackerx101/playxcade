const fs = require('fs');

const authContextCode = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  UserProfile,
  Post,
  Chat,
  Message,
  IdentityVerification,
  RecentAccount,
  Language,
  Theme
} from '../types';

interface AuthContextType {
  user: UserProfile | null;
  recentAccounts: RecentAccount[];
  doNotShowRecent: boolean;
  setDoNotShowRecent: (val: boolean) => void;
  removeRecentAccount: (email: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  posts: Post[];
  chats: Chat[];
  messages: Message[];
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (query: string) => void;
  followingIds: string[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password?: string, username?: string, dob?: string, bio?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  completeOnboarding: (data: { username: string; dob: string; bio: string; preferences?: string }) => void;
  createPost: (postData: { caption: string; type: 'text' | 'image' | 'video'; media_url?: string; tags?: string[]; hashtags?: string[]; category?: string; }) => void;
  deletePost: (postId: string) => void;
  archivePost: (postId: string) => void;
  likePost: (postId: string) => void;
  toggleFollow: (targetUserId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  submitAppeal: (reason: string, details: { name: string; phone: string; email: string; dob: string }) => void;
  verifyIdentity: (data: Partial<IdentityVerification>) => void;
  restoreAccountStatus: () => void;
  verifications: IdentityVerification[];
  sendMessage: (chatId: string, text: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [recentAccounts, setRecentAccounts] = useState<RecentAccount[]>([]);
  const [doNotShowRecent, setDoNotShowRecent] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [verifications, setVerifications] = useState<IdentityVerification[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });
    
    fetchPosts();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (data) {
      setUser({
        id: data.user_id,
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        IsDeleted: false,
        account_status: data.account_status || 'active',
        appeal_status: data.appeal_status || 'none',
        IsIdentityVerify: data.is_verified || false,
        is_private: false,
        created_at: data.created_at,
        wallet_balance: data.wallet_balance || 0
      } as any);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url, is_verified)')
      .order('created_at', { ascending: false });
      
    if (data) {
      const formattedPosts = data.map(p => ({
        id: p.id,
        user_id: p.user_id,
        author_username: p.profiles?.username || 'Unknown',
        author_avatar: p.profiles?.avatar_url || '',
        author_is_verified: p.profiles?.is_verified || false,
        caption: p.caption,
        type: p.type,
        media_url: p.media_url,
        likes_count: p.likes_count,
        comments_count: p.comments_count,
        is_liked: false,
        created_at: new Date(p.created_at).toLocaleString()
      })) as Post[];
      setPosts(formattedPosts);
    }
  };

  const login = async (email: string, password?: string) => {
    if (!password) return { success: false, error: 'Password required' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signup = async (email: string, password?: string, username?: string, dob?: string, bio?: string) => {
    if (!password) return { success: false, error: 'Password required' };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    
    if (data.user && username) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        username,
        email,
        bio,
        avatar_url: \`https://api.dicebear.com/7.x/bottts/svg?seed=\${username}\`
      });
      if (profileError) {
        console.error("Profile error:", profileError);
      }
    }
    
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const createPost = async (postData: any) => {
    if (!user) return;
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.user_id,
      caption: postData.caption,
      type: postData.type,
      media_url: postData.media_url
    }).select();
    if (!error) {
      fetchPosts();
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchPosts();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    const dbUpdates: any = {};
    if (updates.username) dbUpdates.username = updates.username;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar_url) dbUpdates.avatar_url = updates.avatar_url;
    // Map wallet_balance correctly if passed
    if ((updates as any).wallet_balance !== undefined) dbUpdates.wallet_balance = (updates as any).wallet_balance;
    
    await supabase.from('profiles').update(dbUpdates).eq('user_id', user.user_id);
    await fetchProfile(user.user_id);
  };

  const removeRecentAccount = () => {};
  const addRecentSearch = () => {};
  const clearRecentSearches = () => {};
  const removeRecentSearch = () => {};
  const completeOnboarding = () => {};
  const archivePost = () => {};
  const likePost = () => {};
  const toggleFollow = () => {};
  const submitAppeal = () => {};
  const verifyIdentity = () => {};
  const restoreAccountStatus = () => {};
  const sendMessage = () => {};

  return (
    <AuthContext.Provider
      value={{
        user, recentAccounts, doNotShowRecent, setDoNotShowRecent, removeRecentAccount,
        language, setLanguage, theme, setTheme, posts, chats, messages, recentSearches,
        addRecentSearch, clearRecentSearches, removeRecentSearch, followingIds,
        login, signup, logout, completeOnboarding, createPost, deletePost, archivePost,
        likePost, toggleFollow, updateProfile, submitAppeal, verifyIdentity, restoreAccountStatus,
        verifications, sendMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
`
fs.writeFileSync('src/context/AuthContext.tsx', authContextCode);
