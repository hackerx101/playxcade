const fs = require('fs');

let exploreContent = fs.readFileSync('src/pages/ExplorePage.tsx', 'utf8');

exploreContent = exploreContent.replace(
  'import { useAuth } from \'../context/AuthContext\';',
  'import { useAuth } from \'../context/AuthContext\';\nimport { supabase } from \'../lib/supabase\';'
);

exploreContent = exploreContent.replace(
  'const MOCK_USERS: MockUser[] = [];',
  ''
);

exploreContent = exploreContent.replace(
  'interface MockUser {',
  'interface SearchUser {'
);

exploreContent = exploreContent.replace(
  'export const ExplorePage: React.FC = () => {',
  `export const ExplorePage: React.FC = () => {
  const [users, setUsers] = useState<SearchUser[]>([]);
  React.useEffect(() => {
    supabase.from('profiles').select('*').limit(20).then(({ data }) => {
      if (data) {
        setUsers(data.map((p: any) => ({
          id: p.user_id,
          username: p.username,
          avatar: p.avatar_url,
          bio: p.bio,
          followers: 0
        })));
      }
    });
  }, []);`
);

exploreContent = exploreContent.replace(
  'const filteredUsers = MOCK_USERS.filter((u) => {',
  'const filteredUsers = users.filter((u) => {'
);

exploreContent = exploreContent.replace(
  'MockUser',
  'SearchUser'
);
exploreContent = exploreContent.replace(
  'MockUser',
  'SearchUser'
);

fs.writeFileSync('src/pages/ExplorePage.tsx', exploreContent);
