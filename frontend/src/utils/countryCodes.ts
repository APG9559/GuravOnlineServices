// ── Country Codes with Flags ───────────────────────────────────────────────
// Commonly used country codes with emoji flags. India is first/default.

export interface CountryCode {
  code: string;   // e.g. "+91"
  name: string;   // e.g. "India"
  flag: string;   // e.g. "🇮🇳"
  short: string;  // e.g. "IN"
}

export const COUNTRY_CODES: CountryCode[] = [
  // ── Default ──
  { code: '+91', name: 'India', flag: '🇮🇳', short: 'IN' },

  // ── South Asia ──
  { code: '+92', name: 'Pakistan', flag: '🇵🇰', short: 'PK' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', short: 'BD' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', short: 'LK' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', short: 'NP' },

  // ── Middle East ──
  { code: '+971', name: 'UAE', flag: '🇦🇪', short: 'AE' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', short: 'SA' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦', short: 'QA' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭', short: 'BH' },
  { code: '+968', name: 'Oman', flag: '🇴🇲', short: 'OM' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼', short: 'KW' },

  // ── East & Southeast Asia ──
  { code: '+86', name: 'China', flag: '🇨🇳', short: 'CN' },
  { code: '+81', name: 'Japan', flag: '🇯🇵', short: 'JP' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷', short: 'KR' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', short: 'SG' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', short: 'MY' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭', short: 'TH' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭', short: 'PH' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', short: 'ID' },

  // ── Europe ──
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', short: 'GB' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', short: 'DE' },
  { code: '+33', name: 'France', flag: '🇫🇷', short: 'FR' },
  { code: '+39', name: 'Italy', flag: '🇮🇹', short: 'IT' },
  { code: '+34', name: 'Spain', flag: '🇪🇸', short: 'ES' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱', short: 'NL' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭', short: 'CH' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪', short: 'SE' },

  // ── Americas ──
  { code: '+1', name: 'United States', flag: '🇺🇸', short: 'US' },
  { code: '+1', name: 'Canada', flag: '🇨🇦', short: 'CA' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', short: 'BR' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽', short: 'MX' },

  // ── Africa ──
  { code: '+27', name: 'South Africa', flag: '🇿🇦', short: 'ZA' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬', short: 'NG' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', short: 'KE' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬', short: 'EG' },

  // ── Oceania ──
  { code: '+61', name: 'Australia', flag: '🇦🇺', short: 'AU' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿', short: 'NZ' },

  // ── Russia & CIS ──
  { code: '+7', name: 'Russia', flag: '🇷🇺', short: 'RU' },
];

/** Default country code (India) */
export const DEFAULT_COUNTRY_CODE = COUNTRY_CODES[0];
