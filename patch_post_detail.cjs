const fs = require('fs');
let code = fs.readFileSync('src/pages/PostDetailPage.tsx', 'utf8');

// 1. Get auth values
code = code.replace(
  'const { user, addComment, fetchComments, likePost, toggleFollow } = useAuth();',
  'const { user, addComment, fetchComments, likePost, toggleFollow, followingIds, fetchRealUsers } = useAuth();\n  const [followingProfiles, setFollowingProfiles] = useState<any[]>([]);\n  useEffect(() => {\n    if (user && followingIds && followingIds.length > 0) {\n      fetchRealUsers().then(users => {\n        setFollowingProfiles(users.filter(u => followingIds.includes(u.user_id)));\n      });\n    }\n  }, [user, followingIds, fetchRealUsers]);'
);

// 2. Change CANDIDATE_HANDLES
code = code.replace(
  `  const CANDIDATE_HANDLES = [
    { username: 'scorpio', name: 'Scorpio AI', desc: 'Assistant 🤖', isBot: true },
    { username: 'playxcade_system', name: 'Playxcade System', desc: 'Official Network Bot 💡', isBot: true },
    { username: 'Esports Carribean', name: 'Esports Carribean', desc: 'Tournament Partner 🔥', isBot: false },
    { username: 'garexcell', name: 'Garexcell Official', desc: 'Platform Admin ⚡', isBot: false },
  ];`,
  `  let CANDIDATE_HANDLES = [
    { username: 'orion', name: 'Orion AI', desc: 'Assistant 🤖', isBot: true },
    { username: 'garexcell', name: 'Garexcell Support', desc: 'Platform Admin ⚡', isBot: false },
  ];
  if (followingProfiles.length > 0) {
    const dynamicHandles = followingProfiles.map(p => ({ username: p.username, name: p.name || p.username, desc: 'Following', isBot: false }));
    CANDIDATE_HANDLES = [...dynamicHandles, ...CANDIDATE_HANDLES];
  }
  `
);

// 3. Make sure to update the type @scorpio to @orion
code = code.replace(
  'Type @ to mention Scorpio AI',
  'Type @ to mention Orion or users you follow'
);
code = code.replace(
  '@scorpio or @orion',
  '@orion'
);

fs.writeFileSync('src/pages/PostDetailPage.tsx', code);
