import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAuY7L-O5uAWLRzKZvNCQ3eRX-4E078Vqg",
  authDomain: "playxcade.firebaseapp.com",
  projectId: "playxcade",
  storageBucket: "playxcade.firebasestorage.app",
  messagingSenderId: "1083845605548",
  appId: "1:1083845605548:web:e093c015534d5b43714709",
  measurementId: "G-4JQ8FHQJE3"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with persistent local cache to minimize database read charges
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

/**
 * Seed & Ensure all collections from Supabase tables exist in Firestore
 */
export const seedFirestoreCollections = async () => {
  try {
    // 1. profiles collection
    const sysProfileRef = doc(db, 'profiles', 'system_init');
    const sysProfileSnap = await getDoc(sysProfileRef);
    if (!sysProfileSnap.exists()) {
      await setDoc(sysProfileRef, {
        user_id: 'system_init',
        username: 'playxcade_system',
        email: 'system@garexcell.com',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
        bio: 'Official Playxcade System Account',
        wallet_balance: 100.00,
        followers_count: 1,
        following_count: 0,
        is_verified: true,
        IsIdentityVerify: true,
        account_status: 'active',
        appeal_status: 'none',
        is_banned: false,
        strikes_count: 0,
        warnings_count: 0,
        created_at: new Date().toISOString()
      });
    }

    // 2. posts collection
    const sysPostRef = doc(db, 'posts', 'welcome_post');
    const sysPostSnap = await getDoc(sysPostRef);
    if (!sysPostSnap.exists()) {
      await setDoc(sysPostRef, {
        id: 'welcome_post',
        user_id: 'system_init',
        author_username: 'playxcade_system',
        author_email: 'system@garexcell.com',
        author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
        author_is_verified: true,
        caption: 'Welcome to Playxcade! Connect, stream, and share your gaming highlights.',
        type: 'text',
        media_url: '',
        tags: ['welcome', 'gaming'],
        hashtags: ['#playxcade'],
        category: 'Gaming',
        likes_count: 1,
        comments_count: 0,
        is_archived: false,
        is_official: true,
        created_at: new Date().toISOString()
      });
    }

    // 2b. Tip Posts from playxcade_system
    const tip1Ref = doc(db, 'posts', 'sys_tip_1');
    const tip1Snap = await getDoc(tip1Ref);
    if (!tip1Snap.exists()) {
      await setDoc(tip1Ref, {
        id: 'sys_tip_1',
        user_id: 'system_init',
        author_username: 'playxcade_system',
        author_email: 'system@garexcell.com',
        author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
        author_is_verified: true,
        caption: '💡 Playxcade Tip #1: For butter-smooth streaming performance, set your bitrate to 4500 kbps and enable hardware NVENC/VAAPI encoding in studio settings!',
        type: 'text',
        tags: ['tips', 'streaming'],
        hashtags: ['#PlayxcadeTips', '#Streaming'],
        category: 'Tutorial',
        likes_count: 42,
        comments_count: 3,
        is_archived: false,
        is_official: true,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      });
    }

    const tip2Ref = doc(db, 'posts', 'sys_tip_2');
    const tip2Snap = await getDoc(tip2Ref);
    if (!tip2Snap.exists()) {
      await setDoc(tip2Ref, {
        id: 'sys_tip_2',
        user_id: 'system_init',
        author_username: 'playxcade_system',
        author_email: 'system@garexcell.com',
        author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
        author_is_verified: true,
        caption: '💡 Playxcade Tip #2: Protect your vision during late-night gaming sessions! Toggle dark mode in app settings and take a 5-minute screen break every hour.',
        type: 'text',
        tags: ['tips', 'gaming', 'health'],
        hashtags: ['#GamerHealth', '#PlayxcadeTips'],
        category: 'Community',
        likes_count: 68,
        comments_count: 5,
        is_archived: false,
        is_official: true,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      });
    }

    const tip3Ref = doc(db, 'posts', 'sys_tip_3');
    const tip3Snap = await getDoc(tip3Ref);
    if (!tip3Snap.exists()) {
      await setDoc(tip3Ref, {
        id: 'sys_tip_3',
        user_id: 'system_init',
        author_username: 'playxcade_system',
        author_email: 'system@garexcell.com',
        author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
        author_is_verified: true,
        caption: '💡 Playxcade Tip #3: Enable Real-time Sync in chat channels to get instant live message updates and stream reactions without refreshing!',
        type: 'text',
        tags: ['tips', 'chat'],
        hashtags: ['#PlayxcadeTips', '#RealTimeSync'],
        category: 'Community',
        likes_count: 89,
        comments_count: 8,
        is_archived: false,
        is_official: true,
        created_at: new Date(Date.now() - 3600000 * 8).toISOString()
      });
    }

    // 2c. Esports Carribean Free Fire Event Post
    const esportsRef = doc(db, 'posts', 'esports_caribbean_freefire');
    const esportsSnap = await getDoc(esportsRef);
    if (!esportsSnap.exists()) {
      await setDoc(esportsRef, {
        id: 'esports_caribbean_freefire',
        user_id: 'esports_caribbean_user',
        author_username: 'Esports Carribean',
        author_email: 'info@esportscaribbean.com',
        author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=EsportsCaribbean',
        author_is_verified: true,
        caption: '🔥 BIG ANNOUNCEMENT! Esports Carribean is hosting the ultimate Free Fire Championship live across The Bahamas 🇧🇸 and Jamaica 🇯🇲! $15,000 cash prize pool! Squad registrations open next week. Who is repping their island? 🏝️🎮',
        type: 'text',
        tags: ['freefire', 'esports', 'bahamas', 'jamaica'],
        hashtags: ['#FreeFire', '#EsportsCarribean', '#Bahamas', '#Jamaica'],
        category: 'Esports',
        likes_count: 150,
        comments_count: 24,
        is_archived: false,
        is_official: true,
        created_at: new Date(Date.now() - 3600000 * 1).toISOString()
      });
    }

    // 3. post_likes collection
    const sysLikeRef = doc(db, 'post_likes', 'welcome_post_system_init');
    const sysLikeSnap = await getDoc(sysLikeRef);
    if (!sysLikeSnap.exists()) {
      await setDoc(sysLikeRef, {
        id: 'welcome_post_system_init',
        post_id: 'welcome_post',
        user_id: 'system_init',
        created_at: new Date().toISOString()
      });
    }

    // 4. post_comments collection
    const sysCommentRef = doc(db, 'post_comments', 'welcome_comment_1');
    const sysCommentSnap = await getDoc(sysCommentRef);
    if (!sysCommentSnap.exists()) {
      await setDoc(sysCommentRef, {
        id: 'welcome_comment_1',
        post_id: 'welcome_post',
        user_id: 'system_init',
        author_username: 'playxcade_system',
        author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
        content: 'Enjoy your stay!',
        created_at: new Date().toISOString()
      });
    }

    // 5. followers collection
    const sysFollowRef = doc(db, 'followers', 'init_follow');
    const sysFollowSnap = await getDoc(sysFollowRef);
    if (!sysFollowSnap.exists()) {
      await setDoc(sysFollowRef, {
        id: 'init_follow',
        follower_id: 'system_init',
        following_id: 'system_init',
        created_at: new Date().toISOString()
      });
    }

    // 6. chats collection
    const sysChatRef = doc(db, 'chats', 'system_welcome_chat');
    const sysChatSnap = await getDoc(sysChatRef);
    if (!sysChatSnap.exists()) {
      await setDoc(sysChatRef, {
        id: 'system_welcome_chat',
        participant_one: 'system_init',
        participant_two: 'system_init',
        last_message: 'Welcome to Playxcade DMs!',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // 7. chat_participants collection
    const sysPartRef = doc(db, 'chat_participants', 'system_welcome_participant');
    const sysPartSnap = await getDoc(sysPartRef);
    if (!sysPartSnap.exists()) {
      await setDoc(sysPartRef, {
        id: 'system_welcome_participant',
        chat_id: 'system_welcome_chat',
        user_id: 'system_init',
        created_at: new Date().toISOString()
      });
    }

    // 8. messages collection
    const sysMsgRef = doc(db, 'messages', 'system_welcome_msg');
    const sysMsgSnap = await getDoc(sysMsgRef);
    if (!sysMsgSnap.exists()) {
      await setDoc(sysMsgRef, {
        id: 'system_welcome_msg',
        chat_id: 'system_welcome_chat',
        sender_id: 'system_init',
        text: 'Welcome to Playxcade DMs!',
        is_read: true,
        created_at: new Date().toISOString()
      });
    }

    // 9. subscriptions collection
    const sysSubRef = doc(db, 'subscriptions', 'system_sub_init');
    const sysSubSnap = await getDoc(sysSubRef);
    if (!sysSubSnap.exists()) {
      await setDoc(sysSubRef, {
        id: 'system_sub_init',
        user_id: 'system_init',
        plan: 'Garexcell VIP',
        status: 'active',
        created_at: new Date().toISOString()
      });
    }

    // 10. identity collection
    const sysIdentRef = doc(db, 'identity', 'system_ident_init');
    const sysIdentSnap = await getDoc(sysIdentRef);
    if (!sysIdentSnap.exists()) {
      await setDoc(sysIdentRef, {
        id: 'system_ident_init',
        user_id: 'system_init',
        full_name: 'Playxcade System Admin',
        dob: '2000-01-01',
        email: 'system@garexcell.com',
        phone_number: '+10000000000',
        doc_type: 'Government ID',
        doc_number: 'SYS-001',
        selfie_code: 'SYS001',
        status: 'verified',
        timestamp: new Date().toISOString()
      });
    }

    // 11. sessions collection
    const sysSessRef = doc(db, 'sessions', 'system_sess_init');
    const sysSessSnap = await getDoc(sysSessRef);
    if (!sysSessSnap.exists()) {
      await setDoc(sysSessRef, {
        id: 'system_sess_init',
        user_id: 'system_init',
        device_name: 'Cloud Ingress Node',
        ip_address: '127.0.0.1',
        last_active: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Error seeding Firestore collections:', err);
  }
};

// Auto-run seeding to immediately populate all 11 collections in Firebase Console
seedFirestoreCollections();

/**
 * Smart Client-Side In-Memory & Local Storage Cache Layer
 * Prevents redundant read calls to Firestore for Profiles, Posts, and Messages.
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

class DataCache {
  private profilesMap = new Map<string, CacheEntry<any>>();
  private postsMap = new Map<string, CacheEntry<any>>();
  private messagesMap = new Map<string, CacheEntry<any[]>>();

  // Profile Cache
  getProfile(key: string): any | null {
    const cached = this.profilesMap.get(key.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  }

  setProfile(key: string, data: any): void {
    if (!key) return;
    this.profilesMap.set(key.toLowerCase(), {
      data,
      timestamp: Date.now()
    });
  }

  // Post Cache
  getPost(postId: string): any | null {
    const cached = this.postsMap.get(postId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  }

  setPost(postId: string, data: any): void {
    if (!postId) return;
    this.postsMap.set(postId, {
      data,
      timestamp: Date.now()
    });
  }

  // Messages Cache
  getMessages(chatId: string): any[] | null {
    const cached = this.messagesMap.get(chatId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  }

  setMessages(chatId: string, messages: any[]): void {
    if (!chatId) return;
    this.messagesMap.set(chatId, {
      data: messages,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.profilesMap.clear();
    this.postsMap.clear();
    this.messagesMap.clear();
  }
}

export const appCache = new DataCache();
