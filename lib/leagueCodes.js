// lib/leagueCodes.js
module.exports = {
  // Football-Data.org competition codes
  COMPETITION_CODES: {
    'epl': 'PL',
    'premier': 'PL',
    'premier-league': 'PL',
    'premierleague': 'PL',
    'english-premier-league': 'PL',
    'laliga': 'PD',
    'la-liga': 'PD',
    'laliga-santander': 'PD',
    'serie-a': 'SA',
    'seriea': 'SA',
    'serie-a-italy': 'SA',
    'bundesliga': 'BL1',
    'german-bundesliga': 'BL1',
    'ligue1': 'FL1',
    'ligue-1': 'FL1',
    'ligue-1-france': 'FL1',
    'ucl': 'CL',
    'champions-league': 'CL',
    'champions': 'CL',
    'uefa-champions-league': 'CL',
    'europa-league': 'EL',
    'europa': 'EL',
    'uel': 'EL',
    'conference-league': 'ECL',
    'conference': 'ECL',
    'euro': 'EC',
    'european-championship': 'EC',
    'world-cup': 'WC',
    'worldcup': 'WC',
    'wc': 'WC',
    'fifa-world-cup': 'WC',
    'eredivisie': 'ED',
    'dutch-league': 'ED',
    'netherlands': 'ED',
    'primeira-liga': 'PPL',
    'portuguese-league': 'PPL',
    'portugal': 'PPL',
    'belgian-pro-league': 'BPL',
    'belgium': 'BPL',
    'scottish-premiership': 'SPL',
    'scotland': 'SPL'
  },

  // Competition names for display
  COMPETITION_NAMES: {
    'PL': 'Premier League',
    'PD': 'La Liga',
    'SA': 'Serie A',
    'BL1': 'Bundesliga',
    'FL1': 'Ligue 1',
    'CL': 'UEFA Champions League',
    'EL': 'UEFA Europa League',
    'ECL': 'UEFA Conference League',
    'EC': 'European Championship',
    'WC': 'FIFA World Cup',
    'ED': 'Eredivisie',
    'PPL': 'Primeira Liga',
    'BPL': 'Belgian Pro League',
    'SPL': 'Scottish Premiership'
  },

  // Competition emojis
  COMPETITION_EMOJIS: {
    'PL': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'PD': '🇪🇸',
    'SA': '🇮🇹',
    'BL1': '🇩🇪',
    'FL1': '🇫🇷',
    'CL': '🏆',
    'EL': '🏆',
    'ECL': '🏆',
    'EC': '🏆',
    'WC': '🌍',
    'ED': '🇳🇱',
    'PPL': '🇵🇹',
    'BPL': '🇧🇪',
    'SPL': '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
  },

  getCompetitionCode(name) {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    return this.COMPETITION_CODES[lower] || null;
  },

  getCompetitionName(code) {
    return this.COMPETITION_NAMES[code] || code || 'Unknown Competition';
  },

  getCompetitionEmoji(code) {
    return this.COMPETITION_EMOJIS[code] || '⚽';
  },

  isValidCompetition(code) {
    return code in this.COMPETITION_NAMES;
  },

  getAllCompetitions() {
    return Object.keys(this.COMPETITION_NAMES);
  },

  getAliases(code) {
    const aliases = [];
    for (const [alias, compCode] of Object.entries(this.COMPETITION_CODES)) {
      if (compCode === code) {
        aliases.push(alias);
      }
    }
    return aliases;
  },

  findCompetitionByPartialName(partialName) {
    if (!partialName) return null;
    const lower = partialName.toLowerCase().trim();
    
    // Try exact match first
    const exactMatch = this.getCompetitionCode(lower);
    if (exactMatch) return exactMatch;
    
    // Try partial match on aliases
    for (const [alias, code] of Object.entries(this.COMPETITION_CODES)) {
      if (alias.includes(lower) || lower.includes(alias)) {
        return code;
      }
    }
    
    // Try partial match on names
    for (const [code, name] of Object.entries(this.COMPETITION_NAMES)) {
      if (name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) {
        return code;
      }
    }
    
    return null;
  },

  getDomesticLeagues() {
    return ['PL', 'PD', 'SA', 'BL1', 'FL1', 'ED', 'PPL', 'BPL', 'SPL'];
  },

  getInternationalLeagues() {
    return ['CL', 'EL', 'ECL', 'EC', 'WC'];
  }
};
