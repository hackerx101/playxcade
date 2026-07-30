const fs = require('fs');

let authContext = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const newMethods = `
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
          return {
            id: op.chat_id,
            participant_id: op.user_id,
            participant_username: op.profiles?.username || 'Unknown',
            participant_avatar: op.profiles?.avatar_url || '',
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
`;

authContext = authContext.replace('const sendMessage = () => {};', newMethods);
// also add fetchChats to useEffect when user is loaded
authContext = authContext.replace('fetchPosts();\n  }, []);', 'fetchPosts();\n  }, []);\n\n  useEffect(() => { if (user) fetchChats(); }, [user]);');

fs.writeFileSync('src/context/AuthContext.tsx', authContext);
