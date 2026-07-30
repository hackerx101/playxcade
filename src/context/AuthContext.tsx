import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  UserProfile,
  Post,
  Chat,
  Message,
  IdentityVerification,
  RecentAccount,
  Language,
  Theme,
  AccountStatus
} from '../types';
import { isReservedUsername, sanitizeDatabaseError } from '../lib/validation';
import { analyzeTextContent } from '../lib/moderation';
import { sendSuspensionEmail } from '../lib/resendService';

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
  completeOnboarding: (data: { username: string; dob: string; bio: string; preferences?: string }) => Promise<{ success: boolean; error?: string }>;
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
  sendMessage: (chatId: string, text: string, username?: string) => void;
  fetchMessages: (chatId: string) => void;
  deleteMessage: (messageId: string, chatId: string) => Promise<void>;
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

  useEffect(() => { if (user) fetchChats(); }, [user]);

  const fetchProfile = async (userId: string, overrideEmail?: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    
    // Check if user is permanently disabled or banned
    if (data && (data.account_status === 'disabled' || data.account_status === 'permanently_disabled' || data.is_banned)) {
      localStorage.setItem('perma_ban', 'true');
    }

    if (data && data.username && data.username.trim() !== '') {
      let status: AccountStatus = data.account_status || 'active';
      let limitedUntil: number | undefined = undefined;

      if (status === 'limited') {
        const storageKey = `limited_until_${userId}`;
        let until = localStorage.getItem(storageKey);
        if (!until) {
          const expiryTime = Date.now() + 8 * 60 * 60 * 1000;
          localStorage.setItem(storageKey, expiryTime.toString());
          until = expiryTime.toString();
        }
        limitedUntil = Number(until);

        if (Date.now() >= limitedUntil) {
          status = 'active';
          localStorage.removeItem(storageKey);
          await supabase.from('profiles').update({ account_status: 'active' }).eq('user_id', userId);
        }
      }

      setUser({
        id: data.user_id,
        user_id: data.user_id,
        username: data.username,
        email: data.email || overrideEmail || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username}`,
        IsDeleted: false,
        account_status: status,
        limited_until: limitedUntil,
        appeal_status: data.appeal_status || 'none',
        IsIdentityVerify: data.is_verified || false,
        is_private: false,
        created_at: data.created_at || new Date().toISOString(),
        wallet_balance: data.wallet_balance || 0,
        followers_count: data.followers_count || 0,
        following_count: data.following_count || 0,
        strikes_count: data.strikes_count || 0,
        warnings_count: data.warnings_count || 0,
        needsProfileSetup: false
      });
    } else {
      // User exists in auth but profile has no username / row missing
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = overrideEmail || session?.user?.email || '';
      setUser({
        id: userId,
        user_id: userId,
        username: '',
        email: userEmail,
        bio: '',
        avatar_url: '',
        IsDeleted: false,
        account_status: 'active',
        appeal_status: 'none',
        IsIdentityVerify: false,
        is_private: false,
        created_at: new Date().toISOString(),
        wallet_balance: 0,
        needsProfileSetup: true
      });
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url, is_verified)')
      .order('created_at', { ascending: false });
      
    if (data) {
      const formattedPosts = data.map(p => {
        const profileObj = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        return {
          id: p.id,
          user_id: p.user_id,
          author_username: profileObj?.username || 'Garexcell User',
          author_avatar: profileObj?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.user_id}`,
          author_is_verified: profileObj?.is_verified || false,
          caption: p.caption,
          type: p.type,
          media_url: p.media_url,
          likes_count: p.likes_count || 0,
          comments_count: p.comments_count || 0,
          is_liked: false,
          created_at: new Date(p.created_at).toLocaleString()
        };
      }) as Post[];
      setPosts(formattedPosts);
    }
  };

  const login = async (email: string, password?: string) => {
    if (!password) return { success: false, error: 'Password required' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: sanitizeDatabaseError(error.message, 'auth') };
    if (data.user) {
      await fetchProfile(data.user.id, email);
    }
    return { success: true };
  };

  const signup = async (email: string, password?: string, username?: string, dob?: string, bio?: string) => {
    if (!password) return { success: false, error: 'Password required' };
    
    const handle = username?.trim() || email.split('@')[0];

    // Check reserved username restriction
    if (isReservedUsername(handle, email)) {
      return {
        success: false,
        error: 'This username is reserved for official Garexcell staff members.'
      };
    }

    // 1. SignUp user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: sanitizeDatabaseError(error.message, 'auth') };

    let sessionUser = data.user;

    // 2. Ensure session is active for JWT / RLS by attempting signIn if session is missing
    if (!data.session) {
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
      if (signInData?.user) {
        sessionUser = signInData.user;
      }
    }

    // 3. Create or upsert profile
    if (sessionUser) {
      const avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`;

      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: sessionUser.id,
        username: handle,
        email,
        bio: bio || '',
        avatar_url,
        account_status: 'active',
        followers_count: 0,
        following_count: 0
      });

      if (profileError) {
        console.error("Profile creation error during signup:", profileError);
        return { success: false, error: sanitizeDatabaseError(profileError.message) };
      }

      await fetchProfile(sessionUser.id, email);
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const createPost = async (postData: any) => {
    if (!user) return;
    if (user.account_status === 'suspended' || user.account_status === 'permanently_disabled') {
      alert(`Account Suspended: Your account has been suspended due to community guidelines violations.`);
      return;
    }
    if (user.account_status === 'limited') {
      const remainingMs = Math.max(0, (user.limited_until || (Date.now() + 8 * 60 * 60 * 1000)) - Date.now());
      const remainingHours = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60)));
      alert(`Account Restricted: Your account status is currently LIMITED. You cannot create posts or follow anyone for 8 hours (${remainingHours}h remaining).`);
      return;
    }

    // MODERATION ENGINE CHECK
    const captionText = postData.caption || '';
    const modResult = analyzeTextContent(captionText);

    const { data: { session } } = await supabase.auth.getSession();
    const effectiveUserId = session?.user?.id || user.user_id;

    if (modResult.action === 'REJECT_AND_STRIKE') {
      const newStrikes = (user.strikes_count || 0) + 1;
      const willBeSuspended = newStrikes >= 4 || modResult.isSevere;

      // Try RPC function first, or direct fallback update
      try {
        await supabase.rpc('record_moderation_event', {
          p_user_id: effectiveUserId,
          p_event_type: 'strike',
          p_reason: modResult.description || 'Prohibited statement',
          p_is_severe: modResult.isSevere
        });
      } catch (e) {
        await supabase.from('profiles').update({
          strikes_count: newStrikes,
          account_status: willBeSuspended ? 'suspended' : 'limited',
          is_banned: willBeSuspended
        }).eq('user_id', effectiveUserId);
      }

      await fetchProfile(effectiveUserId);

      if (willBeSuspended) {
        sendSuspensionEmail({
          email: user.email || session?.user?.email || 'user@example.com',
          username: user.username || 'gamer',
          reason: modResult.description || 'Prohibited text content violation'
        });
      }

      alert(`🚨 POST BLOCKED & STRIKE APPLIED:\n\n${modResult.userFacingMessage}\n\nStrike Status: ${newStrikes}/4 strikes.${willBeSuspended ? ' Your account is now SUSPENDED. An automated suspension notice with an appeal link has been sent to your email.' : ''}`);
      return;
    }

    if (modResult.action === 'WARN_AND_ALLOW') {
      try {
        await supabase.rpc('record_moderation_event', {
          p_user_id: effectiveUserId,
          p_event_type: 'warning',
          p_reason: modResult.description || 'Heated statement',
          p_is_severe: false
        });
      } catch (e) {
        await supabase.from('profiles').update({
          warnings_count: (user.warnings_count || 0) + 1
        }).eq('user_id', effectiveUserId);
      }
      alert(`⚠️ COMMUNITY COURTESY REMINDER:\n\n${modResult.userFacingMessage}`);
    }

    // Ensure profile row exists to satisfy posts foreign key
    const { data: profileCheck } = await supabase.from('profiles').select('user_id').eq('user_id', effectiveUserId).maybeSingle();
    if (!profileCheck) {
      const handle = user.username || session?.user?.email?.split('@')[0] || `user_${effectiveUserId.slice(0, 6)}`;
      await supabase.from('profiles').upsert({
        user_id: effectiveUserId,
        username: handle,
        email: user.email || session?.user?.email || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`,
        account_status: 'active'
      });
    }

    const { data, error } = await supabase.from('posts').insert({
      user_id: effectiveUserId,
      caption: captionText,
      type: postData.type || 'text',
      media_url: postData.media_url || null
    }).select();

    if (error) {
      console.error("Error creating post:", error);
      alert(sanitizeDatabaseError(error.message, 'post'));
    } else {
      await fetchPosts();
    }
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;
    if (user.account_status === 'limited') {
      const remainingMs = Math.max(0, (user.limited_until || (Date.now() + 8 * 60 * 60 * 1000)) - Date.now());
      const remainingHours = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60)));
      alert(`Account Restricted: Your account status is currently LIMITED. You cannot post or follow anyone for 8 hours (${remainingHours}h remaining).`);
      return;
    }
    if (followingIds.includes(targetUserId)) {
      setFollowingIds(prev => prev.filter(id => id !== targetUserId));
    } else {
      setFollowingIds(prev => [...prev, targetUserId]);
    }
  };

  const completeOnboarding = async (data: { username: string; dob: string; bio: string; preferences?: string }) => {
    if (!user) return { success: false, error: 'User is not logged in.' };

    const { data: { session } } = await supabase.auth.getSession();
    const effectiveUserId = session?.user?.id || user.user_id;
    const effectiveEmail = user.email || session?.user?.email || `${data.username}@garexcell.com`;

    if (isReservedUsername(data.username, effectiveEmail)) {
      return {
        success: false,
        error: 'This username is reserved for official Garexcell staff members.'
      };
    }

    const avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username}`;
    const { error } = await supabase.from('profiles').upsert({
      user_id: effectiveUserId,
      username: data.username,
      email: effectiveEmail,
      bio: data.bio || '',
      avatar_url: avatar_url,
      account_status: 'active',
      followers_count: 0,
      following_count: 0
    });

    if (error) {
      console.error("completeOnboarding error:", error);
      return { success: false, error: sanitizeDatabaseError(error.message) };
    }

    await fetchProfile(effectiveUserId, effectiveEmail);
    return { success: true };
  };
  const deletePost = async (postId: string) => {
    if (!user) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchPosts();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    if (updates.username && isReservedUsername(updates.username, user.email)) {
      alert('This username is reserved for official Garexcell staff members.');
      return;
    }

    const dbUpdates: any = {};
    if (updates.username) dbUpdates.username = updates.username;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar_url) dbUpdates.avatar_url = updates.avatar_url;
    if ((updates as any).wallet_balance !== undefined) dbUpdates.wallet_balance = (updates as any).wallet_balance;
    
    const { error } = await supabase.from('profiles').update(dbUpdates).eq('user_id', user.user_id);
    if (error) {
      alert(sanitizeDatabaseError(error.message));
    } else {
      await fetchProfile(user.user_id);
    }
  };

  const removeRecentAccount = () => {};
  const addRecentSearch = (query: string) => {
    setRecentSearches(prev => [query, ...prev.filter(q => q !== query)].slice(0, 10));
  };
  const clearRecentSearches = () => setRecentSearches([]);
  const removeRecentSearch = (query: string) => setRecentSearches(prev => prev.filter(q => q !== query));
  const archivePost = () => {};
  const likePost = async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.is_liked;
        return { ...p, is_liked: isLiked, likes_count: p.likes_count + (isLiked ? 1 : -1) };
      }
      return p;
    }));
  };
  const submitAppeal = () => {};
  const verifyIdentity = () => {};
  const restoreAccountStatus = () => {};
  
  const fetchChats = async () => {
    if (!user) return;
    const { data: myChats } = await supabase
      .from('chat_participants')
      .select('chat_id, chats(updated_at)')
      .eq('user_id', user.user_id);
      
    if (myChats && myChats.length > 0) {
      const chatIds = myChats.map(c => c.chat_id);
      // Get other participants
      const { data: otherParticipants } = await supabase
        .from('chat_participants')
        .select('chat_id, user_id, profiles(username, avatar_url)')
        .in('chat_id', chatIds)
        .neq('user_id', user.user_id);
        
      // Get latest message
      const { data: latestMsgs } = await supabase
        .from('messages')
        .select('chat_id, text, created_at')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false });

      if (otherParticipants) {
        const formattedChats = otherParticipants.map(op => {
          const chatMsg = latestMsgs?.find(m => m.chat_id === op.chat_id);
          const profile: any = Array.isArray(op.profiles) ? op.profiles[0] : op.profiles;
          return {
            id: op.chat_id,
            participant_id: op.user_id,
            participant_username: profile?.username || 'Unknown',
            participant_avatar: profile?.avatar_url || '',
            last_message: chatMsg?.text || '',
            updated_at: chatMsg?.created_at || ''
          };
        });
        setChats(formattedChats);
      }
    }
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data as any[]);
    }
  };

  const sendMessage = async (chatId: string, text: string, username?: string) => {
    if (!user) return;
    if (user.account_status === 'suspended' || user.account_status === 'permanently_disabled') {
      alert(`Account Suspended: Your account is suspended and cannot send direct messages.`);
      return;
    }

    // MODERATION ENGINE CHECK FOR MESSAGES
    const modResult = analyzeTextContent(text || '');

    if (modResult.action === 'REJECT_AND_STRIKE') {
      const newStrikes = (user.strikes_count || 0) + 1;
      const willBeSuspended = newStrikes >= 4 || modResult.isSevere;

      try {
        await supabase.rpc('record_moderation_event', {
          p_user_id: user.user_id,
          p_event_type: 'strike',
          p_reason: modResult.description || 'Prohibited message',
          p_is_severe: modResult.isSevere
        });
      } catch (e) {
        await supabase.from('profiles').update({
          strikes_count: newStrikes,
          account_status: willBeSuspended ? 'suspended' : 'limited',
          is_banned: willBeSuspended
        }).eq('user_id', user.user_id);
      }

      await fetchProfile(user.user_id);

      if (willBeSuspended) {
        sendSuspensionEmail({
          email: user.email || 'user@example.com',
          username: user.username || 'gamer',
          reason: modResult.description || 'Prohibited messaging violation'
        });
      }

      alert(`🚨 MESSAGE BLOCKED & STRIKE APPLIED:\n\n${modResult.userFacingMessage}\n\nStrike Status: ${newStrikes}/4 strikes.${willBeSuspended ? ' Your account is now SUSPENDED. An email notice with an appeal link has been sent to your address.' : ''}`);
      return;
    }

    if (modResult.action === 'WARN_AND_ALLOW') {
      try {
        await supabase.rpc('record_moderation_event', {
          p_user_id: user.user_id,
          p_event_type: 'warning',
          p_reason: modResult.description || 'Heated text',
          p_is_severe: false
        });
      } catch (e) {
        await supabase.from('profiles').update({
          warnings_count: (user.warnings_count || 0) + 1
        }).eq('user_id', user.user_id);
      }
      alert(`⚠️ COMMUNITY REMINDER:\n\n${modResult.userFacingMessage}`);
    }

    let actualChatId = chatId;
    
    // If it's a new chat, we need to create it first
    if (!actualChatId || actualChatId === 'new') {
      const { data: newChat } = await supabase.from('chats').insert({}).select().single();
      if (newChat) {
        actualChatId = newChat.id;
        await supabase.from('chat_participants').insert([
          { chat_id: actualChatId, user_id: user.user_id }
        ]);
        // Ideally we need the other user's id. But since we just have username from ChatPage,
        if (username) {
          const { data: otherUser } = await supabase.from('profiles').select('user_id').eq('username', username).single();
          if (otherUser) {
            await supabase.from('chat_participants').insert([
              { chat_id: actualChatId, user_id: otherUser.user_id }
            ]);
          }
        }
      }
    }

    if (actualChatId && actualChatId !== 'new') {
      await supabase.from('messages').insert({
        chat_id: actualChatId,
        sender_id: user.user_id,
        text
      });
      await fetchChats();
      await fetchMessages(actualChatId);
    }
  };

  const deleteMessage = async (messageId: string, chatId: string) => {
    if (!user) return;
    await supabase.from('messages').delete().eq('id', messageId).eq('sender_id', user.user_id);
    await fetchMessages(chatId);
    await fetchChats();
  };


  return (
    <AuthContext.Provider
      value={{
        user, recentAccounts, doNotShowRecent, setDoNotShowRecent, removeRecentAccount,
        language, setLanguage, theme, setTheme, posts, chats, messages, recentSearches,
        addRecentSearch, clearRecentSearches, removeRecentSearch, followingIds,
        login, signup, logout, completeOnboarding, createPost, deletePost, archivePost,
        likePost, toggleFollow, updateProfile, submitAppeal, verifyIdentity, restoreAccountStatus,
        verifications, sendMessage, fetchMessages, deleteMessage
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
