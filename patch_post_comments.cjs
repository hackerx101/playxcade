const fs = require('fs');
let code = fs.readFileSync('src/pages/PostDetailPage.tsx', 'utf8');

code = code.replace(
  "const isScorpioComment = c.author_username?.toLowerCase() === 'scorpio';",
  "const isScorpioComment = c.author_username?.toLowerCase() === 'orion' || c.author_username?.toLowerCase() === 'scorpio';"
);

code = code.replace(
  "isScorpioComment ? 'bg-purple-50/80 border border-purple-200' : 'bg-slate-50/70'",
  "isScorpioComment ? 'bg-gradient-to-r from-purple-50/80 to-indigo-50/80 border border-purple-200' : 'bg-slate-50/70'"
);

code = code.replace(
  "const isScorpio = handle.toLowerCase() === 'scorpio';",
  "const isScorpio = handle.toLowerCase() === 'orion' || handle.toLowerCase() === 'scorpio';"
);

code = code.replace(
  "className={`w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0`}",
  "className={`w-8 h-8 rounded-full object-cover border ${isScorpioComment ? 'border-purple-300 shadow-sm' : 'border-slate-200'} shrink-0`}"
);

fs.writeFileSync('src/pages/PostDetailPage.tsx', code);
