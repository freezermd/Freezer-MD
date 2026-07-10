// lib/footballApi.js
const config = require('../config');
const Cache = require('./cache');
const { COMPETITION_NAMES } = require('./leagueCodes');

class FootballAPI {
  constructor() {
    this.baseURL = 'https://api.football-data.org/v4';
    this.headers = {
      'X-Auth-Token': config.FOOTBALL_API_KEY,
      'Content-Type': 'application/json'
    };
    this.cache = new Cache(300000); // 5 minutes
    this.retryCount = 3;
    this.timeout = 10000;
  }

  async fetch(endpoint, params = {}, retries = this.retryCount) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    const cacheKey = url.toString();
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url.toString(), {
        headers: this.headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        console.log(`Rate limited. Retrying after ${retryAfter} seconds`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.fetch(endpoint, params, retries - 1);
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your FOOTBALL_API_KEY');
        }
        if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API key permissions');
        }
        if (response.status === 404) {
          throw new Error('Resource not found');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for API errors
      if (data.error) {
        throw new Error(data.error);
      }

      // Cache successful responses
      this.cache.set(cacheKey, data);

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - API took too long to respond');
      }

      if (retries > 0 && !error.message.includes('API key')) {
        console.log(`Retrying request... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (this.retryCount - retries + 1)));
        return this.fetch(endpoint, params, retries - 1);
      }
      
      throw error;
    }
  }

  async getCompetitionMatches(competitionCode, matchday = null) {
    const endpoint = `/competitions/${competitionCode}/matches`;
    const params = {};
    if (matchday) {
      params.matchday = matchday;
    }
    const data = await this.fetch(endpoint, params);
    return data.matches || [];
  }

  async getCompetitionStandings(competitionCode) {
    const endpoint = `/competitions/${competitionCode}/standings`;
    const data = await this.fetch(endpoint);
    return data.standings || [];
  }

  async getCompetitionScorers(competitionCode, limit = 20) {
    const endpoint = `/competitions/${competitionCode}/scorers`;
    const data = await this.fetch(endpoint, { limit });
    return data.scorers || [];
  }

  async getTeamMatches(teamId, status = null, limit = 10) {
    const endpoint = `/teams/${teamId}/matches`;
    const params = { limit };
    if (status) {
      params.status = status;
    }
    const data = await this.fetch(endpoint, params);
    return data.matches || [];
  }

  async getTeamInfo(teamId) {
    const endpoint = `/teams/${teamId}`;
    const data = await this.fetch(endpoint);
    return data;
  }

  async searchTeams(query) {
    const endpoint = `/teams`;
    const data = await this.fetch(endpoint, { search: query });
    return data.teams || [];
  }

  async getAvailableMatches() {
    // Get matches from all competitions
    const matches = [];
    const competitions = ['PL', 'PD', 'SA', 'BL1', 'FL1', 'CL'];
    
    for (const code of competitions) {
      try {
        const data = await this.getCompetitionMatches(code);
        matches.push(...data);
      } catch (error) {
        console.error(`Error fetching ${code} matches:`, error.message);
      }
    }
    
    return matches;
  }

  async getLiveMatches() {
    const matches = await this.getAvailableMatches();
    return matches.filter(m => m.status === 'LIVE' || m.status === 'IN_PLAY');
  }

  async getMatchesByDate(date) {
    const matches = await this.getAvailableMatches();
    const matchDate = new Date(date).toISOString().split('T')[0];
    return matches.filter(m => m.utcDate.startsWith(matchDate));
  }

  async getTodayMatches() {
    const today = new Date().toISOString().split('T')[0];
    return this.getMatchesByDate(today);
  }

  async getTomorrowMatches() {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return this.getMatchesByDate(tomorrow);
  }

  async getTeamByName(teamName) {
    const teams = await this.searchTeams(teamName);
    if (teams.length === 0) return null;
    return teams[0];
  }

  clearCache() {
    this.cache.clear();
    console.log('Football API cache cleared');
  }
}

module.exports = FootballAPI;
