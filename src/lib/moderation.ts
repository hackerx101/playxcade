/**
 * Playxcade Statement-Based Moderation Engine
 * Fosters a safe, inclusive community while preserving free speech.
 * Differentiates between severe policy breaches (REJECT & STRIKE) and mild/borderline speech (WARN & ALLOW).
 */

export type ModerationCategory = 'violent_threat' | 'hate_speech' | 'nudity_solicitation' | 'scam' | 'borderline_conduct';
export type ModerationAction = 'REJECT_AND_STRIKE' | 'WARN_AND_ALLOW' | 'PASS';

export interface ModerationRule {
  id: string;
  category: ModerationCategory;
  action: ModerationAction;
  label: string;
  description: string;
  patterns: RegExp[];
}

export interface ModerationResult {
  action: ModerationAction;
  category?: ModerationCategory;
  label?: string;
  description?: string;
  matchedText?: string;
  isSevere: boolean;
  userFacingMessage?: string;
}

const BANNED_STATEMENT_RULES: ModerationRule[] = [
  // 1. Violent Threats & Direct Incitement (REJECT & STRIKE)
  {
    id: 'vt-01',
    category: 'violent_threat',
    action: 'REJECT_AND_STRIKE',
    label: 'Violent Threat or Incitement',
    description: 'Direct threats of physical harm, death, or severe violence.',
    patterns: [
      /\b(i\s*will\s*kill\s*you|gonna\s*kill\s*you|going\s*to\s*kill\s*you)\b/i,
      /\b(i\s*will\s*murder\s*you|death\s*to\s*all|i\s*will\s*slit\s*your)\b/i,
      /\b(go\s*kill\s*yourself|go\s*die\s*in\s*a\s*fire|hope\s*you\s*die)\b/i,
      /\b(i\s*will\s*hunt\s*you\s*down|coming\s*to\s*your\s*house\s*to\s*hurt)\b/i,
      /\b(shoot\s*up\s*the\s*school|shoot\s*up\s*the\s*place|bomb\s*the\s*building)\b/i,
      /\b(i\s*will\s*break\s*your\s*neck|stab\s*you\s*to\s*death)\b/i,
      /\b(kill\s*yourself|kys\b)/i
    ]
  },

  // 2. Hate Speech & Severe Harassment (REJECT & STRIKE)
  {
    id: 'hs-01',
    category: 'hate_speech',
    action: 'REJECT_AND_STRIKE',
    label: 'Hate Speech & Targeted Bigotry',
    description: 'Dehumanizing slurs, hate speech, or targeted discrimination against protected groups.',
    patterns: [
      /\b(n_?i_?g_?g_?e_?r|f_?a_?g_?g_?o_?t|k_?i_?k_?e|c_?h_?i_?n_?k|t_?r_?a_?n_?n_?y)\b/i,
      /\b(all\s+(black|white|jewish|muslim|gay|trans|queer)\s+people\s+should\s+die)\b/i,
      /\b(subhuman\s+trash|inferior\s+race|ethnic\s+cleansing)\b/i,
      /\b(get\s+out\s+of\s+our\s+country\s+you\s+(dirty|subhuman))\b/i,
      /\b(you\s+subhuman\s+scum)\b/i
    ]
  },

  // 3. Nudity, Explicit Sexual Solicitation & Sex Scams (REJECT & STRIKE)
  {
    id: 'ns-01',
    category: 'nudity_solicitation',
    action: 'REJECT_AND_STRIKE',
    label: 'Explicit Nudity or Sexual Solicitation',
    description: 'Soliciting explicit sexual material, nude images, or adult cam services.',
    patterns: [
      /\b(send\s+nudes|selling\s+nude\s+photos|dm\s+for\s+explicit\s+pics)\b/i,
      /\b(onlyfans\s+link\s+click\s+for\s+nude|cashapp\s+me\s+for\s+nudes)\b/i,
      /\b(sex\s+chat\s+with\s+me|18\+\s+cam\s+show\s+click)\b/i,
      /\b(hot\s+explicit\s+video\s+call\s+me|naked\s+photos\s+for\s+money)\b/i,
      /\b(underage\s+nude|child\s+porn|cp\s+link)\b/i
    ]
  },

  // 4. Financial Scams, Crypto Frauds & Account Phishing (REJECT & STRIKE)
  {
    id: 'sc-01',
    category: 'scam',
    action: 'REJECT_AND_STRIKE',
    label: 'Scam, Fraud, or Phishing',
    description: 'Deceptive financial schemes, password stealing, or fake currency exploits.',
    patterns: [
      /\b(free\s+robux\s+click\s+here|free\s+v-?bucks\s+at)\b/i,
      /\b(double\s+your\s+crypto|send\s+\d+\s+dollars\s+get\s+\d+\s+back)\b/i,
      /\b(pass\s+your\s+password\s+to\s+get\s+verified|give\s+me\s+your\s+login\s+info)\b/i,
      /\b(guaranteed\s+100x\s+return\s+in\s+24\s+hours)\b/i,
      /\b(whatsapp\s+me\s+for\s+guaranteed\s+crypto\s+profit)\b/i,
      /\b(click\s+this\s+link\s+to\s+claim\s+free\s+wallet\s+balance)\b/i
    ]
  },

  // 5. Borderline Conduct & Heated Language (WARN & ALLOW - Free Speech Protection)
  {
    id: 'bc-01',
    category: 'borderline_conduct',
    action: 'WARN_AND_ALLOW',
    label: 'Community Conduct Reminder',
    description: 'Heated expression or aggressive sportsmanship language. Allowed, but flagged for user awareness.',
    patterns: [
      /\b(you\s+suck\s+so\s+bad|get\s+a\s+life\s+loser|trash\s+player)\b/i,
      /\b(screw\s+you|shut\s+up\s+idiot|worst\s+gamer\s+ever)\b/i,
      /\b(dm\s+me\s+for\s+free\s+coins|click\s+here\s+for\s+free\s+stuff)\b/i
    ]
  }
];

/**
 * Analyzes text (post caption, comment, direct chat message) for policy violations.
 */
export function analyzeTextContent(content: string): ModerationResult {
  if (!content || !content.trim()) {
    return { action: 'PASS', isSevere: false };
  }

  const cleanText = content.trim();

  // First check critical REJECT_AND_STRIKE rules
  for (const rule of BANNED_STATEMENT_RULES) {
    if (rule.action === 'REJECT_AND_STRIKE') {
      for (const pattern of rule.patterns) {
        const match = cleanText.match(pattern);
        if (match) {
          return {
            action: 'REJECT_AND_STRIKE',
            category: rule.category,
            label: rule.label,
            description: rule.description,
            matchedText: match[0],
            isSevere: true,
            userFacingMessage: `Content blocked by Playxcade Moderation: Your text triggered our policy regarding ${rule.label}. Repeated violations will result in account suspension.`
          };
        }
      }
    }
  }

  // Next check WARN_AND_ALLOW rules
  for (const rule of BANNED_STATEMENT_RULES) {
    if (rule.action === 'WARN_AND_ALLOW') {
      for (const pattern of rule.patterns) {
        const match = cleanText.match(pattern);
        if (match) {
          return {
            action: 'WARN_AND_ALLOW',
            category: rule.category,
            label: rule.label,
            description: rule.description,
            matchedText: match[0],
            isSevere: false,
            userFacingMessage: `Community Courtesy Reminder: Your post contains heated language ("${match[0]}"). It was published, but please maintain sportsmanlike respect.`
          };
        }
      }
    }
  }

  return { action: 'PASS', isSevere: false };
}
