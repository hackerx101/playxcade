const fs = require('fs');

let authContext = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

authContext = authContext.replace(
  'sendMessage: (chatId: string, text: string, username?: string) => void;',
  'sendMessage: (chatId: string, text: string, username?: string) => void;\n  fetchMessages: (chatId: string) => void;'
);

authContext = authContext.replace(
  'verifications, sendMessage',
  'verifications, sendMessage, fetchMessages'
);

fs.writeFileSync('src/context/AuthContext.tsx', authContext);
