// lib/leagueCodes.js
module.exports = {
  // League ID mappings for API-Football
  LEAGUE_IDS: {
    'epl': 39,
    'premier': 39,
    'premier-league': 39,
    'premierleague': 39,
    'english-premier-league': 39,
    'laliga': 140,
    'la-liga': 140,
    'laliga-santander': 140,
    'serie-a': 135,
    'seriea': 135,
    'serie-a-italy': 135,
    'bundesliga': 78,
    'german-bundesliga': 78,
    'ligue1': 61,
    'ligue-1': 61,
    'ligue-1-france': 61,
    'ucl': 2,
    'champions-league': 2,
    'champions': 2,
    'uefa-champions-league': 2,
    'europa-league': 3,
    'europa': 3,
    'uel': 3,
    'conference-league': 848,
    'conference': 848,
    'euro': 4,
    'european-championship': 4,
    'world-cup': 1,
    'worldcup': 1,
    'wc': 1,
    'fifa-world-cup': 1,
    'eredivisie': 88,
    'dutch-league': 88,
    'netherlands': 88,
    'primeira-liga': 94,
    'portuguese-league': 94,
    'portugal': 94,
    'belgian-pro-league': 144,
    'belgium': 144,
    'scottish-premiership': 179,
    'scotland': 179,
    'mls': 253,
    'major-league-soccer': 253,
    'usa': 253,
    'brazilian-serie-a': 71,
    'brazil': 71,
    'argentine-superliga': 128,
    'argentina': 128,
    'mexican-liga-mx': 262,
    'mexico': 262,
    'australian-a-league': 220,
    'australia': 220,
    'aleague': 220,
    'saudi-pro-league': 307,
    'saudi': 307,
    'spl': 307
  },
  
  // League names for display
  LEAGUE_NAMES: {
    39: 'Premier League',
    140: 'La Liga',
    135: 'Serie A',
    78: 'Bundesliga',
    61: 'Ligue 1',
    2: 'UEFA Champions League',
    3: 'UEFA Europa League',
    848: 'UEFA Conference League',
    4: 'European Championship',
    1: 'FIFA World Cup',
    88: 'Eredivisie',
    94: 'Primeira Liga',
    144: 'Belgian Pro League',
    179: 'Scottish Premiership',
    253: 'Major League Soccer',
    71: 'Brazilian Serie A',
    128: 'Argentine Superliga',
    262: 'Liga MX',
    220: 'A-League',
    307: 'Saudi Pro League'
  },
  
  // League flags/emojis
  LEAGUE_EMOJIS: {
    39: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    140: '🇪🇸',
    135: '🇮🇹',
    78: '🇩🇪',
    61: '🇫🇷',
    2: '🏆',
    3: '🏆',
    848: '🏆',
    4: '🏆',
    1: '🌍',
    88: '🇳🇱',
    94: '🇵🇹',
    144: '🇧🇪',
    179: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    253: '🇺🇸',
    71: '🇧🇷',
    128: '🇦🇷',
    262: '🇲🇽',
    220: '🇦🇺',
    307: '🇸🇦'
  },
  
  // League country mapping
  LEAGUE_COUNTRIES: {
    39: 'England',
    140: 'Spain',
    135: 'Italy',
    78: 'Germany',
    61: 'France',
    2: 'Europe',
    3: 'Europe',
    848: 'Europe',
    4: 'Europe',
    1: 'World',
    88: 'Netherlands',
    94: 'Portugal',
    144: 'Belgium',
    179: 'Scotland',
    253: 'United States',
    71: 'Brazil',
    128: 'Argentina',
    262: 'Mexico',
    220: 'Australia',
    307: 'Saudi Arabia'
  },
  
  // League types for categorization
  LEAGUE_TYPES: {
    39: 'domestic',
    140: 'domestic',
    135: 'domestic',
    78: 'domestic',
    61: 'domestic',
    2: 'international',
    3: 'international',
    848: 'international',
    4: 'international',
    1: 'international',
    88: 'domestic',
    94: 'domestic',
    144: 'domestic',
    179: 'domestic',
    253: 'domestic',
    71: 'domestic',
    128: 'domestic',
    262: 'domestic',
    220: 'domestic',
    307: 'domestic'
  },
  
  // Popular leagues for quick access
  POPULAR_LEAGUES: [39, 140, 135, 78, 61, 2],
  
  getLeagueId: function(name) {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    return this.LEAGUE_IDS[lower] || null;
  },
  
  getLeagueName: function(id) {
    return this.LEAGUE_NAMES[id] || 'Unknown League';
  },
  
  getLeagueEmoji: function(id) {
    return this.LEAGUE_EMOJIS[id] || '⚽';
  },
  
  getLeagueCountry: function(id) {
    return this.LEAGUE_COUNTRIES[id] || 'Unknown';
  },
  
  getLeagueType: function(id) {
    return this.LEAGUE_TYPES[id] || 'unknown';
  },
  
  getAllLeagueIds: function() {
    return Object.keys(this.LEAGUE_NAMES).map(Number);
  },
  
  isLeagueValid: function(id) {
    return id in this.LEAGUE_NAMES;
  },
  
  getLeaguesByType: function(type) {
    const leagues = [];
    for (const [id, leagueType] of Object.entries(this.LEAGUE_TYPES)) {
      if (leagueType === type) {
        leagues.push(Number(id));
      }
    }
    return leagues;
  },
  
  getDomesticLeagues: function() {
    return this.getLeaguesByType('domestic');
  },
  
  getInternationalLeagues: function() {
    return this.getLeaguesByType('international');
  },
  
  formatLeagueDisplay: function(id) {
    const name = this.getLeagueName(id);
    const emoji = this.getLeagueEmoji(id);
    const country = this.getLeagueCountry(id);
    return `${emoji} ${name} (${country})`;
  },
  
  getLeagueAliases: function(id) {
    const aliases = [];
    for (const [alias, leagueId] of Object.entries(this.LEAGUE_IDS)) {
      if (leagueId === id) {
        aliases.push(alias);
      }
    }
    return aliases;
  },
  
  findLeagueByPartialName: function(partialName) {
    if (!partialName) return null;
    const lower = partialName.toLowerCase().trim();
    
    // Try exact match first
    const exactMatch = this.getLeagueId(lower);
    if (exactMatch) return exactMatch;
    
    // Try partial match
    for (const [alias, id] of Object.entries(this.LEAGUE_IDS)) {
      if (alias.includes(lower) || lower.includes(alias)) {
        return id;
      }
    }
    
    // Try name match
    for (const [id, name] of Object.entries(this.LEAGUE_NAMES)) {
      if (name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) {
        return Number(id);
      }
    }
    
    return null;
  },
  
  getLeaguesByCountry: function(country) {
    if (!country) return [];
    const lower = country.toLowerCase().trim();
    const leagues = [];
    for (const [id, countryName] of Object.entries(this.LEAGUE_COUNTRIES)) {
      if (countryName.toLowerCase().includes(lower) || lower.includes(countryName.toLowerCase())) {
        leagues.push(Number(id));
      }
    }
    return leagues;
  }
};
