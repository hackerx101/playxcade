import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, appCache } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import {
  UserProfile,
  Post,
  Comment,
  Chat,
  Message,
  NotificationItem,
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
  authProviderType: 'firebase' | 'supabase';
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
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  totalUnreadChatCount: number;
  unreadCountsBySender: Record<string, number>;
  markNotificationsAsRead: () => Promise<void>;
  markChatAsRead: (senderIdOrChatId?: string) => Promise<void>;
  fetchRealUsers: () => Promise<UserProfile[]>;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (query: string) => void;
  followingIds: string[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password?: string, username?: string, dob?: string, bio?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithSupabase: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signupWithSupabase: (email: string, password?: string, username?: string, dob?: string, bio?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  completeOnboarding: (data: { username: string; dob: string; bio: string; preferences?: string }) => Promise<{ success: boolean; error?: string }>;
  createPost: (postData: { caption: string; type: 'text' | 'image' | 'media_url'; media_url?: string; tags?: string[]; hashtags?: string[]; category?: string; }) => void;
  deletePost: (postId: string) => void;
  archivePost: (postId: string) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, content: string) => Promise<Comment | null>;
  fetchComments: (postId: string) => Promise<Comment[]>;
  toggleFollow: (targetUserId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  submitAppeal: (reason: string, details: { name: string; phone: string; email: string; dob: string }) => void;
  verifyIdentity: (data: Partial<IdentityVerification>) => void;
  restoreAccountStatus: () => void;
  verifications: IdentityVerification[];
  sendMessage: (chatId: string, text: string, username?: string) => void;
  fetchMessages: (chatId: string) => void;
  deleteMessage: (messageId: string, chatId: string) => Promise<void>;
  editMessage: (messageId: string, newText: string, chatId: string) => Promise<void>;
  reportMessage: (messageId: string, reason: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  fetchCachedProfile: (userIdOrUsername: string) => Promise<UserProfile | null>;
  uploadFile: (file: File) => Promise<string>;
  onlineUsers: Record<string, string>;
  joinRandomChat: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authProviderType, setAuthProviderType] = useState<'firebase' | 'supabase'>('firebase');

  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [recentAccounts, setRecentAccounts] = useState<RecentAccount[]>([]);
  const [doNotShowRecent, setDoNotShowRecent] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, string>>({});

  // Presence tracking
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('online_users');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const online: Record<string, string> = {};
      Object.keys(state).forEach(key => {
        const presence = (state[key] as any)[0];
        online[presence.user_id] = presence.status;
      });
      setOnlineUsers(online);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.user_id, status: 'online' });
      }
    });
    return () => { channel.unsubscribe(); };
  }, [user]);

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const { data, error } = await supabase.storage.from('media').upload(`${Date.now()}_${file.name}`, file);
      if (!error && data?.path) {
        return supabase.storage.from('media').getPublicUrl(data.path).data.publicUrl;
      }
    } catch (e) {
      console.warn('Supabase media upload fallback:', e);
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    });
  };

  // Real-time Firestore notifications listener using onSnapshot
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const notifRef = collection(db, 'notifications');
      const q = query(notifRef, where('recipient_id', '==', user.user_id));
      const unsubscribeNotifs = onSnapshot(
        q,
        (snapshot) => {
          const items: NotificationItem[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            recipient_id: docSnap.data().recipient_id,
            sender_id: docSnap.data().sender_id,
            sender_username: docSnap.data().sender_username,
            type: docSnap.data().type || 'system',
            title: docSnap.data().title || 'Notification',
            body: docSnap.data().body || '',
            created_at: docSnap.data().created_at || new Date().toISOString(),
            read: docSnap.data().read || false
          }));

          items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setNotifications(items);
        },
        (err) => {
          console.warn('Notifications listener notice:', err);
        }
      );

      return () => unsubscribeNotifs();
    } catch (err) {
      console.warn('Failed to start notifications onSnapshot listener:', err);
    }
  }, [user]);

  const markNotificationsAsRead = async () => {
    if (!user || notifications.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    for (const n of notifications.filter((item) => !item.read)) {
      updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {});
    }
  };

  const markChatAsRead = async (senderIdOrChatId?: string) => {
    if (!user || notifications.length === 0) return;
    const targetNotifs = notifications.filter((n) => 
      !n.read && 
      (n.type === 'message' || !n.type) &&
      (!senderIdOrChatId || n.sender_id === senderIdOrChatId || (n as any).chat_id === senderIdOrChatId)
    );
    if (targetNotifs.length === 0) return;

    setNotifications((prev) =>
      prev.map((n) => (targetNotifs.some((tn) => tn.id === n.id) ? { ...n, read: true } : n))
    );

    for (const n of targetNotifs) {
      updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {});
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const unreadMessageNotifications = useMemo(() => {
    return notifications.filter((n) => !n.read && (n.type === 'message' || n.title?.toLowerCase().includes('message')));
  }, [notifications]);

  const totalUnreadChatCount = unreadMessageNotifications.length;

  const unreadCountsBySender = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of unreadMessageNotifications) {
      if (n.sender_id) {
        map[n.sender_id] = (map[n.sender_id] || 0) + 1;
      }
      if ((n as any).chat_id) {
        map[(n as any).chat_id] = (map[(n as any).chat_id] || 0) + 1;
      }
    }
    return map;
  }, [unreadMessageNotifications]);

  const fetchRealUsers = useCallback(async (): Promise<UserProfile[]> => {
    try {
      const q = query(collection(db, 'profiles'));
      const querySnap = await getDocs(q);
      const list: UserProfile[] = [];
      querySnap.forEach((d) => {
        const data = d.data();
        if (data.username && (!user || data.user_id !== user.user_id)) {
          list.push({
            id: d.id,
            user_id: data.user_id || d.id,
            username: data.username,
            email: data.email || '',
            bio: data.bio || '',
            avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username}`,
            IsDeleted: false,
            account_status: data.account_status || 'active',
            appeal_status: 'none',
            IsIdentityVerify: data.is_verified || false,
            is_private: false,
            created_at: data.created_at || new Date().toISOString()
          });
        }
      });
      return list;
    } catch (err) {
      console.warn('Fetch real users notice:', err);
      return [];
    }
  }, [user?.user_id]);

  useEffect(() => {
    // 1. Firebase Auth listener (Primary)
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setAuthProviderType('firebase');
        await fetchProfile(firebaseUser.uid, firebaseUser.email || undefined);
      } else {
        // Fallback check for Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setAuthProviderType('supabase');
          await fetchProfile(session.user.id, session.user.email || undefined);
        } else {
          setUser(null);
        }
      }
    });

    // 2. Supabase Auth state listener (Failover)
    const { data: { subscription: supabaseSub } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && !auth.currentUser) {
        setAuthProviderType('supabase');
        await fetchProfile(session.user.id, session.user.email || undefined);
      }
    });

    fetchPosts();

    return () => {
      unsubscribeFirebase();
      supabaseSub.unsubscribe();
    };
  }, []);

  const saveDeviceMemory = (userId: string, email: string, username?: string) => {
    try {
      let deviceId = localStorage.getItem('garexcell_device_id');
      if (!deviceId) {
        deviceId = `dev_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
        localStorage.setItem('garexcell_device_id', deviceId);
      }

      const deviceRecord = {
        deviceId,
        userId,
        email,
        username: username || email.split('@')[0],
        savedAt: new Date().toISOString(),
        trusted: true
      };

      localStorage.setItem(`garexcell_trusted_device_${userId}`, JSON.stringify(deviceRecord));

      const existingStr = localStorage.getItem('garexcell_remembered_accounts');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updated = [
        deviceRecord,
        ...existing.filter((a: any) => a.userId !== userId)
      ].slice(0, 5);

      localStorage.setItem('garexcell_remembered_accounts', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save device memory:', err);
    }
  };

  /**
   * Fetch profile with smart caching to prevent unnecessary reads
   */
  const fetchProfile = async (userId: string, overrideEmail?: string): Promise<UserProfile | null> => {
    const cachedProfile = appCache.getProfile(userId);
    if (cachedProfile) {
      setUser(cachedProfile);
      return cachedProfile;
    }

    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileSnap = await getDoc(profileRef);
      const data = profileSnap.exists() ? profileSnap.data() : null;

      const userEmail = (data?.email || overrideEmail || '').toLowerCase();
      const isGarexcellEmail = userEmail.endsWith('@garexcell.com');
      const handle = data?.username || (userEmail ? userEmail.split('@')[0] : `user_${userId.substring(0, 6)}`);

      let formattedProfile: UserProfile;

      if (data) {
        saveDeviceMemory(userId, userEmail, handle);

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
            await updateDoc(profileRef, { account_status: 'active' });
          }
        }

        formattedProfile = {
          id: data.user_id || userId,
          user_id: data.user_id || userId,
          username: handle,
          email: userEmail,
          bio: data.bio || '',
          avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`,
          IsDeleted: false,
          account_status: status,
          limited_until: limitedUntil,
          appeal_status: data.appeal_status || 'none',
          IsIdentityVerify: data.is_verified || isGarexcellEmail,
          is_private: false,
          created_at: data.created_at || new Date().toISOString(),
          wallet_balance: data.wallet_balance || 0,
          followers_count: data.followers_count || 0,
          following_count: data.following_count || 0,
          strikes_count: data.strikes_count || 0,
          warnings_count: data.warnings_count || 0,
          needsProfileSetup: false,
          is_2fa_enabled: data.is_2fa_enabled || false
        };
      } else {
        // Create initial document in Firestore
        const avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`;
        formattedProfile = {
          id: userId,
          user_id: userId,
          username: handle,
          email: userEmail,
          bio: '',
          avatar_url,
          IsDeleted: false,
          account_status: 'active',
          appeal_status: 'none',
          IsIdentityVerify: isGarexcellEmail,
          is_private: false,
          created_at: new Date().toISOString(),
          wallet_balance: 0,
          followers_count: 0,
          following_count: 0,
          needsProfileSetup: false,
          is_2fa_enabled: false
        };

        // Persist to Firestore & Supabase in background
        await setDoc(profileRef, {
          user_id: userId,
          username: handle,
          email: userEmail,
          bio: '',
          avatar_url,
          account_status: 'active',
          created_at: new Date().toISOString()
        }, { merge: true });

        supabase.from('profiles').upsert({
          user_id: userId,
          username: handle,
          email: userEmail,
          bio: '',
          avatar_url,
          account_status: 'active'
        }).then(() => {});
      }

      // Cache profile
      appCache.setProfile(userId, formattedProfile);
      appCache.setProfile(handle, formattedProfile);

      setUser(formattedProfile);
      return formattedProfile;
    } catch (err) {
      console.warn('Error fetching Firestore profile:', err);
      return null;
    }
  };

  const fetchCachedProfile = async (userIdOrUsername: string): Promise<UserProfile | null> => {
    const cached = appCache.getProfile(userIdOrUsername);
    if (cached) return cached;
    return await fetchProfile(userIdOrUsername);
  };

  /**
   * Fetch posts with smart caching
   */
  const fetchPosts = useCallback(async (activeUserId?: string) => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('created_at', 'desc'));
      const querySnap = await getDocs(q);

      const targetUserId = activeUserId || user?.user_id;
      const userLikedPostIds = new Set<string>();
      if (targetUserId) {
        try {
          const likesRef = collection(db, 'post_likes');
          const likesQ = query(likesRef, where('user_id', '==', targetUserId));
          const likesSnap = await getDocs(likesQ);
          likesSnap.forEach(d => userLikedPostIds.add(d.data().post_id));
        } catch (e) {}
      }

      if (!querySnap.empty) {
        const fetchedPosts: Post[] = querySnap.docs.map(docSnap => {
          const p = docSnap.data();
          const isLiked = userLikedPostIds.has(docSnap.id);
          const postObj: Post = {
            id: docSnap.id,
            user_id: p.user_id,
            author_username: p.author_username || 'Garexcell User',
            author_email: p.author_email,
            author_avatar: p.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.user_id}`,
            author_is_verified: p.author_is_verified || false,
            caption: p.caption,
            type: p.type || 'text',
            media_url: p.media_url,
            likes_count: typeof p.likes_count === 'number' ? p.likes_count : 0,
            comments_count: typeof p.comments_count === 'number' ? p.comments_count : 0,
            is_liked: isLiked,
            created_at: p.created_at ? new Date(p.created_at).toLocaleString() : 'Just now'
          };
          appCache.setPost(docSnap.id, postObj);
          return postObj;
        });

        setPosts(fetchedPosts);
      } else {
        // Check Supabase if Firestore posts are not seeded yet
        const { data } = await supabase
          .from('posts')
          .select('*, profiles(username, avatar_url, is_verified, email)')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const formatted = data.map(p => {
            const profileObj = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
            const isLiked = userLikedPostIds.has(p.id);
            const postObj: Post = {
              id: p.id,
              user_id: p.user_id,
              author_username: profileObj?.username || 'Garexcell User',
              author_email: profileObj?.email,
              author_avatar: profileObj?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.user_id}`,
              author_is_verified: profileObj?.is_verified || false,
              caption: p.caption,
              type: p.type,
              media_url: p.media_url,
              likes_count: p.likes_count || 0,
              comments_count: p.comments_count || 0,
              is_liked: isLiked,
              created_at: new Date(p.created_at).toLocaleString()
            };
            // Seed Firestore
            setDoc(doc(db, 'posts', p.id), {
              ...postObj,
              created_at: p.created_at
            }, { merge: true });
            appCache.setPost(p.id, postObj);
            return postObj;
          });
          setPosts(formatted);
        }
      }
    } catch (err) {
      console.warn('Fetch posts warning:', err);
    }
  }, [user?.user_id]);

  /**
   * PRIMARY FIREBASE AUTH - Login
   */
  const login = async (email: string, password?: string) => {
    if (!password) return { success: false, error: 'Password required' };
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setAuthProviderType('firebase');
      if (userCredential.user) {
        await fetchProfile(userCredential.user.uid, email);
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase login failed, trying fallback:', err);
      // Attempt failover login via Supabase
      return await loginWithSupabase(email, password);
    }
  };

  /**
   * PRIMARY FIREBASE AUTH - Signup
   */
  const signup = async (email: string, password?: string, username?: string, dob?: string, bio?: string) => {
    if (!password) return { success: false, error: 'Password required' };
    const handle = username?.trim() || email.split('@')[0];

    if (isReservedUsername(handle, email)) {
      return {
        success: false,
        error: 'This username is reserved for official Garexcell staff members.'
      };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      setAuthProviderType('firebase');

      if (firebaseUser) {
        const avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`;

        // Create profile document in Firestore
        await setDoc(doc(db, 'profiles', firebaseUser.uid), {
          user_id: firebaseUser.uid,
          username: handle,
          email: email.toLowerCase(),
          bio: bio || '',
          avatar_url,
          account_status: 'active',
          followers_count: 0,
          following_count: 0,
          dob: dob || null,
          created_at: new Date().toISOString()
        }, { merge: true });

        // Backup creation in Supabase
        supabase.from('profiles').upsert({
          user_id: firebaseUser.uid,
          username: handle,
          email: email.toLowerCase(),
          bio: bio || '',
          avatar_url,
          account_status: 'active',
          dob: dob || null
        }).then(() => {});

        await fetchProfile(firebaseUser.uid, email);
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signup failed, trying Supabase signup:', err);
      return await signupWithSupabase(email, password, username, dob, bio);
    }
  };

  /**
   * FAILOVER SUPABASE AUTH - Login
   */
  const loginWithSupabase = async (email: string, password?: string) => {
    if (!password) return { success: false, error: 'Password required' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: sanitizeDatabaseError(error.message, 'auth') };
    setAuthProviderType('supabase');
    if (data.user) {
      await fetchProfile(data.user.id, email);
    }
    return { success: true };
  };

  /**
   * FAILOVER SUPABASE AUTH - Signup
   */
  const signupWithSupabase = async (email: string, password?: string, username?: string, dob?: string, bio?: string) => {
    if (!password) return { success: false, error: 'Password required' };
    const handle = username?.trim() || email.split('@')[0];

    if (isReservedUsername(handle, email)) {
      return {
        success: false,
        error: 'This username is reserved for official Garexcell staff members.'
      };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: sanitizeDatabaseError(error.message, 'auth') };

    setAuthProviderType('supabase');
    let sessionUser = data.user;

    if (!data.session) {
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
      if (signInData?.user) {
        sessionUser = signInData.user;
      }
    }

    if (sessionUser) {
      const avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`;

      await setDoc(doc(db, 'profiles', sessionUser.id), {
        user_id: sessionUser.id,
        username: handle,
        email: email.toLowerCase(),
        bio: bio || '',
        avatar_url,
        account_status: 'active',
        followers_count: 0,
        following_count: 0,
        dob: dob || null,
        created_at: new Date().toISOString()
      }, { merge: true });

      supabase.from('profiles').upsert({
        user_id: sessionUser.id,
        username: handle,
        email: email.toLowerCase(),
        bio: bio || '',
        avatar_url,
        account_status: 'active',
        dob: dob || null
      }).then(() => {});

      await fetchProfile(sessionUser.id, email);
    }

    return { success: true };
  };

  const logout = async () => {
    appCache.clear();
    await firebaseSignOut(auth);
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
      alert(`Account Restricted: Your account status is currently LIMITED. You cannot create posts for 8 hours (${remainingHours}h remaining).`);
      return;
    }

    const captionText = postData.caption || '';
    const modResult = analyzeTextContent(captionText);

    if (modResult.action === 'REJECT_AND_STRIKE') {
      const newStrikes = (user.strikes_count || 0) + 1;
      const willBeSuspended = newStrikes >= 4 || modResult.isSevere;

      await updateDoc(doc(db, 'profiles', user.user_id), {
        strikes_count: newStrikes,
        account_status: willBeSuspended ? 'suspended' : 'limited',
        is_banned: willBeSuspended
      });

      await fetchProfile(user.user_id);

      if (willBeSuspended) {
        sendSuspensionEmail({
          email: user.email || 'user@example.com',
          username: user.username || 'gamer',
          reason: modResult.description || 'Prohibited text content violation'
        });
      }

      alert(`🚨 POST BLOCKED & STRIKE APPLIED:\n\n${modResult.userFacingMessage}\n\nStrike Status: ${newStrikes}/4 strikes.`);
      return;
    }

    const newPostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPostObj: Post = {
      id: newPostId,
      user_id: user.user_id,
      author_username: user.username,
      author_email: user.email,
      author_avatar: user.avatar_url,
      author_is_verified: user.IsIdentityVerify,
      caption: captionText,
      type: postData.type || 'text',
      media_url: postData.media_url || undefined,
      category: postData.category || 'Warlands',
      hashtags: postData.hashtags || [],
      tags: postData.tags || [],
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      created_at: 'Just now'
    };

    // Save to Firestore
    await setDoc(doc(db, 'posts', newPostId), {
      ...newPostObj,
      created_at: new Date().toISOString()
    });

    // Save to cache
    appCache.setPost(newPostId, newPostObj);

    // Backup to Supabase
    supabase.from('posts').insert({
      id: newPostId,
      user_id: user.user_id,
      caption: captionText,
      type: postData.type || 'text',
      media_url: postData.media_url || null
    }).then(() => {});

    setPosts(prev => [newPostObj, ...prev]);
    return newPostObj;
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;
    if (user.account_status === 'limited') {
      alert(`Account Restricted: Your account status is LIMITED.`);
      return;
    }

    const followDocId = `${user.user_id}_${targetUserId}`;
    const followRef = doc(db, 'followers', followDocId);
    const followSnap = await getDoc(followRef);

    const isCurrentlyFollowing = followSnap.exists() || followingIds.includes(targetUserId);

    if (isCurrentlyFollowing) {
      setFollowingIds(prev => prev.filter(id => id !== targetUserId));
      setUser(prev => prev ? { ...prev, following_count: Math.max(0, (prev.following_count || 1) - 1) } : null);

      await deleteDoc(followRef).catch(() => {});
      
      // Remove from Supabase follows table
      supabase.from('follows')
        .delete()
        .match({ follower_id: user.user_id, following_id: targetUserId })
        .then(() => {});

      // Decrement following count on current user profile & followers count on target user profile
      updateDoc(doc(db, 'profiles', user.user_id), {
        following_count: increment(-1)
      }).catch(() => {});

      updateDoc(doc(db, 'profiles', targetUserId), {
        followers_count: increment(-1)
      }).catch(() => {});
    } else {
      setFollowingIds(prev => [...prev.filter(id => id !== targetUserId), targetUserId]);
      setUser(prev => prev ? { ...prev, following_count: (prev.following_count || 0) + 1 } : null);

      await setDoc(followRef, {
        follower_id: user.user_id,
        following_id: targetUserId,
        created_at: new Date().toISOString()
      }).catch(() => {});

      // Insert into Supabase follows table
      supabase.from('follows')
        .insert({
          follower_id: user.user_id,
          following_id: targetUserId,
          created_at: new Date().toISOString()
        })
        .then(() => {});

      // Increment following count on current user profile & followers count on target user profile
      updateDoc(doc(db, 'profiles', user.user_id), {
        following_count: increment(1)
      }).catch(() => {});

      updateDoc(doc(db, 'profiles', targetUserId), {
        followers_count: increment(1)
      }).catch(() => {});

      // Trigger real-time notification in Firestore
      addDoc(collection(db, 'notifications'), {
        recipient_id: targetUserId,
        sender_id: user.user_id,
        sender_username: user.username,
        type: 'follow',
        title: 'New Follower',
        body: `@${user.username} started following you!`,
        created_at: new Date().toISOString(),
        read: false
      }).catch(() => {});
    }
  };

  const completeOnboarding = async (data: { username: string; dob: string; bio: string; preferences?: string }) => {
    if (!user) return { success: false, error: 'User is not logged in.' };

    const handle = data.username.trim();
    if (isReservedUsername(handle, user.email)) {
      return {
        success: false,
        error: 'This username is reserved for official Garexcell staff members.'
      };
    }

    const avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`;

    setUser(prev => prev ? {
      ...prev,
      username: handle,
      bio: data.bio || prev.bio,
      avatar_url: avatar_url,
      needsProfileSetup: false
    } : null);

    await setDoc(doc(db, 'profiles', user.user_id), {
      username: handle,
      bio: data.bio || '',
      avatar_url,
      dob: data.dob
    }, { merge: true });

    await fetchProfile(user.user_id);
    return { success: true };
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'posts', postId));
    supabase.from('posts').delete().eq('id', postId).then(() => {});
    setPosts(prev => prev.filter(p => p.id !== postId));
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
    if (updates.is_2fa_enabled !== undefined) dbUpdates.is_2fa_enabled = updates.is_2fa_enabled;

    await updateDoc(doc(db, 'profiles', user.user_id), dbUpdates);
    supabase.from('profiles').update(dbUpdates).eq('user_id', user.user_id).then(() => {});
    await fetchProfile(user.user_id);
  };

  const removeRecentAccount = () => {};
  const addRecentSearch = (query: string) => {
    setRecentSearches(prev => [query, ...prev.filter(q => q !== query)].slice(0, 10));
  };
  const clearRecentSearches = () => setRecentSearches([]);
  const removeRecentSearch = (query: string) => setRecentSearches(prev => prev.filter(q => q !== query));
  const archivePost = () => {};

  const likePost = async (postId: string) => {
    if (!user) {
      alert('Please log in to like posts.');
      return;
    }
    const likeDocId = `${postId}_${user.user_id}`;
    const likeRef = doc(db, 'post_likes', likeDocId);
    const likeSnap = await getDoc(likeRef);

    const isCurrentlyLiked = likeSnap.exists();
    const newIsLiked = !isCurrentlyLiked;
    let targetPostAuthorId: string | null = null;

    if (isCurrentlyLiked) {
      await deleteDoc(likeRef).catch(() => {});
      supabase.from('post_likes').delete().eq('id', likeDocId).then(() => {});
    } else {
      await setDoc(likeRef, {
        id: likeDocId,
        post_id: postId,
        user_id: user.user_id,
        created_at: new Date().toISOString()
      }).catch(() => {});

      supabase.from('post_likes').insert({
        id: likeDocId,
        post_id: postId,
        user_id: user.user_id,
        created_at: new Date().toISOString()
      }).then(() => {});
    }

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        targetPostAuthorId = p.user_id;
        const newLikesCount = Math.max(0, p.likes_count + (newIsLiked ? 1 : -1));

        updateDoc(doc(db, 'posts', postId), {
          likes_count: increment(newIsLiked ? 1 : -1)
        }).catch(() => {});

        supabase.from('posts').update({ likes_count: newLikesCount }).eq('id', postId).then(() => {});

        return { ...p, is_liked: newIsLiked, likes_count: newLikesCount };
      }
      return p;
    }));

    if (newIsLiked && targetPostAuthorId && targetPostAuthorId !== user.user_id) {
      addDoc(collection(db, 'notifications'), {
        recipient_id: targetPostAuthorId,
        sender_id: user.user_id,
        sender_username: user.username,
        type: 'like',
        title: 'New Like',
        body: `@${user.username} liked your post!`,
        created_at: new Date().toISOString(),
        read: false
      }).catch(() => {});
    }
  };

  const addComment = async (postId: string, content: string): Promise<Comment | null> => {
    if (!user) {
      alert('Please log in to comment.');
      return null;
    }

    const modResult = analyzeTextContent(content);
    if (modResult.action === 'REJECT_AND_STRIKE') {
      alert(`🚨 COMMENT BLOCKED:\n\n${modResult.userFacingMessage}`);
      return null;
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newComment: Comment = {
      id: commentId,
      post_id: postId,
      user_id: user.user_id,
      author_username: user.username,
      author_avatar: user.avatar_url,
      content: content.trim(),
      created_at: 'Just now'
    };

    // Save to Firestore
    await setDoc(doc(db, 'comments', commentId), {
      ...newComment,
      created_at: nowIso
    });

    // Save to Supabase
    supabase.from('comments').insert({
      id: commentId,
      post_id: postId,
      user_id: user.user_id,
      content: content.trim(),
      created_at: nowIso
    }).then(() => {});

    // Increment comments_count on post
    let targetPostAuthorId: string | null = null;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        targetPostAuthorId = p.user_id;
        const newCommentsCount = (p.comments_count || 0) + 1;
        updateDoc(doc(db, 'posts', postId), {
          comments_count: increment(1)
        }).catch(() => {});
        supabase.from('posts').update({ comments_count: newCommentsCount }).eq('id', postId).then(() => {});
        return { ...p, comments_count: newCommentsCount };
      }
      return p;
    }));

    // Trigger real-time notification to post author
    if (targetPostAuthorId && targetPostAuthorId !== user.user_id) {
      addDoc(collection(db, 'notifications'), {
        recipient_id: targetPostAuthorId,
        sender_id: user.user_id,
        sender_username: user.username,
        type: 'comment',
        title: 'New Comment',
        body: `@${user.username} commented on your post: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
        created_at: nowIso,
        read: false
      }).catch(() => {});
    }

    return newComment;
  };

  const fetchComments = async (postId: string): Promise<Comment[]> => {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, where('post_id', '==', postId), orderBy('created_at', 'asc'));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        return querySnap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            post_id: data.post_id,
            user_id: data.user_id,
            author_username: data.author_username || 'User',
            author_avatar: data.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user_id}`,
            content: data.content || '',
            created_at: data.created_at ? new Date(data.created_at).toLocaleString() : 'Recently'
          };
        });
      }

      // Fallback check Supabase
      const { data } = await supabase
        .from('comments')
        .select('*, profiles(username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        return data.map(c => {
          const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          return {
            id: c.id,
            post_id: c.post_id,
            user_id: c.user_id,
            author_username: prof?.username || 'User',
            author_avatar: prof?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user_id}`,
            content: c.content || '',
            created_at: new Date(c.created_at).toLocaleString()
          };
        });
      }

      return [];
    } catch (err) {
      console.warn('Fetch comments error:', err);
      return [];
    }
  };

  const submitAppeal = () => {};
  const verifyIdentity = () => {};
  const restoreAccountStatus = () => {};

  const fetchChats = useCallback(async () => {
    if (!user) return;
    
    // Load local storage chats cache first for instant load
    try {
      const storedChats = localStorage.getItem(`playxcade_chats_${user.user_id}`);
      if (storedChats) {
        setChats(JSON.parse(storedChats));
      }
    } catch (e) {}

    try {
      const participantsRef = collection(db, 'chat_participants');
      const q = query(participantsRef, where('user_id', '==', user.user_id));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const chatIds = querySnap.docs.map(d => d.data().chat_id);
        const formattedChats: Chat[] = [];

        for (const cId of chatIds) {
          const otherPartQuery = query(collection(db, 'chat_participants'), where('chat_id', '==', cId));
          const otherSnap = await getDocs(otherPartQuery);
          const otherDoc = otherSnap.docs.find(d => d.data().user_id !== user.user_id);

          if (otherDoc) {
            const otherUserId = otherDoc.data().user_id;
            const otherProfile = await fetchCachedProfile(otherUserId);

            // Fetch last message for this chat thread
            let lastText = '';
            let lastTime = new Date().toISOString();
            try {
              const msgsRef = collection(db, 'messages');
              const qMsg = query(msgsRef, where('chat_id', '==', cId), orderBy('created_at', 'desc'));
              const msgSnap = await getDocs(qMsg);
              if (!msgSnap.empty) {
                lastText = msgSnap.docs[0].data().text || '';
                lastTime = msgSnap.docs[0].data().created_at || lastTime;
              }
            } catch (e) {}

            formattedChats.push({
              id: cId,
              participant_id: otherUserId,
              participant_username: otherProfile?.username || 'Unknown',
              participant_avatar: otherProfile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUserId}`,
              last_message: lastText,
              updated_at: lastTime
            });
          }
        }

        // Sort chats by most recent message/activity
        formattedChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setChats(formattedChats);

        // Store in localStorage for both users
        localStorage.setItem(`playxcade_chats_${user.user_id}`, JSON.stringify(formattedChats));
      }
    } catch (err) {
      console.warn('Fetch chats warning:', err);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (user?.user_id) {
      fetchChats();
    }
  }, [user?.user_id, fetchChats]);

  /**
   * Fetch messages with smart caching & localStorage fallback
   */
  const fetchMessages = useCallback((chatId: string) => {
    // 1. Check localStorage first
    try {
      const localMsgs = localStorage.getItem(`playxcade_msgs_${chatId}`);
      if (localMsgs) {
        setMessages(JSON.parse(localMsgs));
      }
    } catch (e) {}

    // 2. Check in-memory cache
    const cachedMsgs = appCache.getMessages(chatId);
    if (cachedMsgs && cachedMsgs.length > 0) {
      setMessages(cachedMsgs);
    }

    try {
      const msgsRef = collection(db, 'messages');
      const q = query(msgsRef, where('chat_id', '==', chatId));

      const unsubscribe = onSnapshot(
        q,
        (querySnap) => {
          const msgs: Message[] = querySnap.docs
            .map(docSnap => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                chat_id: d.chat_id,
                sender_id: d.sender_id,
                sender_username: d.sender_username || (d.sender_id === user?.user_id ? user?.username : 'User'),
                sender_avatar: d.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.sender_id}`,
                text: d.text || '',
                created_at: d.created_at || new Date().toISOString(),
                edited: d.edited || false
              };
            })
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          appCache.setMessages(chatId, msgs);
          setMessages(msgs);
          try {
            localStorage.setItem(`playxcade_msgs_${chatId}`, JSON.stringify(msgs));
          } catch (e) {}
        },
        (err) => {
          console.warn('Real-time Firestore messages snapshot warning:', err);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn('Fetch messages warning:', err);
    }
  }, [user?.user_id, user?.username]);

  const sendMessage = async (chatId: string, text: string, username?: string) => {
    if (!user) return;
    if (user.account_status === 'suspended' || user.account_status === 'permanently_disabled') {
      alert(`Account Suspended: Cannot send messages.`);
      return;
    }

    const modResult = analyzeTextContent(text || '');
    if (modResult.action === 'REJECT_AND_STRIKE') {
      alert(`🚨 MESSAGE BLOCKED: Content violation.`);
      return;
    }

    let actualChatId = chatId;
    let targetUserId: string | null = null;

    if (!actualChatId || actualChatId === 'new' || actualChatId.startsWith('new_')) {
      const newChatRef = doc(collection(db, 'chats'));
      actualChatId = newChatRef.id;

      await setDoc(newChatRef, {
        id: actualChatId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await addDoc(collection(db, 'chat_participants'), {
        chat_id: actualChatId,
        user_id: user.user_id
      });

      if (username) {
        const otherProf = await fetchCachedProfile(username);
        if (otherProf) {
          targetUserId = otherProf.user_id;
          await addDoc(collection(db, 'chat_participants'), {
            chat_id: actualChatId,
            user_id: otherProf.user_id
          });
        }
      }
    }

    if (actualChatId && actualChatId !== 'new') {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nowTime = new Date().toISOString();
      const newMsgDoc: Message = {
        id: msgId,
        chat_id: actualChatId,
        sender_id: user.user_id,
        sender_username: user.username,
        sender_avatar: user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.user_id}`,
        text: text.trim(),
        created_at: nowTime,
        edited: false
      };

      // Optimistically append to state immediately for 0ms latency display
      setMessages((prev) => {
        if (prev.some((m) => m.id === msgId)) return prev;
        const updated = [...prev, newMsgDoc];
        appCache.setMessages(actualChatId, updated);
        try {
          localStorage.setItem(`playxcade_msgs_${actualChatId}`, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // Store in Firebase Firestore 'messages' collection
      await setDoc(doc(db, 'messages', msgId), newMsgDoc);

      // Identify target recipient for notification
      if (!targetUserId) {
        const chatObj = chats.find(c => c.id === actualChatId);
        if (chatObj) {
          targetUserId = chatObj.participant_id;
        }
      }

      if (targetUserId && targetUserId !== user.user_id) {
        addDoc(collection(db, 'notifications'), {
          recipient_id: targetUserId,
          sender_id: user.user_id,
          sender_username: user.username,
          type: 'message',
          title: 'New Message',
          body: `@${user.username}: ${text.length > 50 ? text.substring(0, 50) + '...' : text}`,
          created_at: nowTime,
          read: false
        }).catch(() => {});
      }

      await fetchChats();
    }
  };

  const deleteMessage = async (messageId: string, chatId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'messages', messageId));
  };

  const editMessage = async (messageId: string, newText: string, chatId: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'messages', messageId), { text: newText.trim(), edited: true });
  };

  const reportMessage = async (messageId: string, reason: string) => {
    if (!user) return;
    await addDoc(collection(db, 'reports'), {
      messageId,
      reporterId: user.user_id,
      reason,
      created_at: new Date().toISOString()
    });
    alert('Message reported.');
  };

  const blockUser = async (userId: string) => {
    if (!user) return;
    // Add to firebase 'blocked' collection or user profile
    await addDoc(collection(db, 'blocked'), {
        blockerId: user.user_id,
        blockedId: userId,
        created_at: new Date().toISOString()
    });
  };

  const joinRandomChat = () => {
    const channelIds = ['world-chat', 'general', 'gaming', 'lounge', 'squad'];
    const randomChannel = channelIds[Math.floor(Math.random() * channelIds.length)];
    return randomChannel;
  };


  return (
    <AuthContext.Provider
      value={{
        user, authProviderType, recentAccounts, doNotShowRecent, setDoNotShowRecent, removeRecentAccount,
        language, setLanguage, theme, setTheme, posts, chats, messages, notifications, unreadNotificationCount,
        totalUnreadChatCount, unreadCountsBySender, markNotificationsAsRead, markChatAsRead, fetchRealUsers, recentSearches,
        addRecentSearch, clearRecentSearches, removeRecentSearch, followingIds,
        login, signup, loginWithSupabase, signupWithSupabase, logout, completeOnboarding, createPost, deletePost, archivePost,
        likePost, addComment, fetchComments, toggleFollow, updateProfile, submitAppeal, verifyIdentity, restoreAccountStatus,
        verifications, sendMessage, fetchMessages, deleteMessage, editMessage, reportMessage, blockUser, fetchCachedProfile, uploadFile, onlineUsers, joinRandomChat
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
