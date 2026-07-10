// lib/footballApi.js
const config = require('../config');

class FootballAPI {
  constructor() {
    this.baseURL = `https://${config.RAPID_API_HOST}`;
    this.headers = {
      'x-rapidapi-key': config.RAPID_API_KEY,
      'x-rapidapi-host': config.RAPID_API_HOST,
      'User-Agent': config.USER_AGENT || 'WhatsApp-Bot/1.0'
    };
    this.cache = new Map();
  }

  async fetch(endpoint, params = {}, retries = config.MAX_RETRIES || 3) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    const cacheKey = url.toString();
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < (config.CACHE_TTL || 300000)) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUT || 10000);

      const response = await fetch(url.toString(), {
        headers: this.headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.errors && Object.keys(data.errors).length > 0) {
        const errorMsg = Object.values(data.errors)[0];
        throw new Error(typeof errorMsg === 'string' ? errorMsg : 'API returned an error');
      }

      if (data.response === undefined) {
        throw new Error('Invalid API response structure');
      }

      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - API took too long to respond');
      }
      
      if (retries > 0) {
        console.log(`Retrying request... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (config.MAX_RETRIES - retries + 1)));
        return this.fetch(endpoint, params, retries - 1);
      }
      throw error;
    }
  }

  async getLiveMatches(leagueId = null) {
    const params = {
      live: 'all',
      timezone: 'Africa/Nairobi'
    };
    if (leagueId) {
      params.league = leagueId;
    }
    const data = await this.fetch('/v3/fixtures', params);
    return data.response || [];
  }

  async getFixtures(leagueId, date = null) {
    const params = {
      league: leagueId,
      season: new Date().getFullYear(),
      timezone: 'Africa/Nairobi'
    };
    if (date) {
      params.date = date;
    }
    const data = await this.fetch('/v3/fixtures', params);
    return data.response || [];
  }

  async getStandings(leagueId) {
    const params = {
      league: leagueId,
      season: new Date().getFullYear()
    };
    const data = await this.fetch('/v3/standings', params);
    return data.response || [];
  }

  async searchTeams(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const data = await this.fetch('/v3/teams', { search: query.trim() });
    return data.response || [];
  }

  async searchPlayers(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const data = await this.fetch('/v3/players', { 
      search: query.trim(),
      season: new Date().getFullYear()
    });
    return data.response || [];
  }

  async getTopScorers(leagueId) {
    const params = {
      league: leagueId,
      season: new Date().getFullYear()
    };
    const data = await this.fetch('/v3/players/topscorers', params);
    return data.response || [];
  }

  async getHeadToHead(team1Id, team2Id) {
    if (!team1Id || !team2Id) {
      return [];
    }
    const data = await this.fetch('/v3/fixtures/headtohead', {
      h2h: `${team1Id}-${team2Id}`,
      last: 10
    });
    return data.response || [];
  }

  async getTeamById(teamId) {
    if (!teamId) {
      return null;
    }
    const data = await this.fetch('/v3/teams', { id: teamId });
    return data.response && data.response.length > 0 ? data.response[0] : null;
  }

  async getPlayerById(playerId) {
    if (!playerId) {
      return null;
    }
    const data = await this.fetch('/v3/players', { 
      id: playerId,
      season: new Date().getFullYear()
    });
    return data.response && data.response.length > 0 ? data.response[0] : null;
  }

  async getTransfers() {
    const data = await this.fetch('/v3/transfers', { 
      date: new Date().toISOString().split('T')[0]
    });
    return data.response || [];
  }

  clearCache() {
    this.cache.clear();
    console.log('Football API cache cleared');
  }

  getCacheSize() {
    return this.cache.size;
  }
}

module.exports = FootballAPI;
