// plugins/football.js
const FootballAPI = require('../lib/footballApi');
const leagueCodes = require('../lib/leagueCodes');

class FootballPlugin {
  constructor() {
    this.api = new FootballAPI();
    this.name = 'Football Plugin';
    this.description = 'Real football scores, standings, and stats';
    this.version = '1.0.0';
  }

  async handle(sock, message) {
    const { remoteJid, text } = message;
    const args = text.split(' ').slice(1);
    const subCommand = args[0]?.toLowerCase() || '';

    try {
      let response = '';

      if (subCommand === 'live') {
        response = await this.handleLive();
      } else if (subCommand === 'today') {
        response = await this.handleToday();
      } else if (subCommand === 'tomorrow') {
        response = await this.handleTomorrow();
      } else if (subCommand === 'fixtures') {
        const league = args[1]?.toLowerCase() || '';
        response = await this.handleFixtures(league);
      } else if (subCommand === 'standings') {
        const league = args[1]?.toLowerCase() || '';
        response = await this.handleStandings(league);
      } else if (subCommand === 'scorers') {
        const league = args[1]?.toLowerCase() || '';
        response = await this.handleScorers(league);
      } else if (subCommand === 'team') {
        const teamName = args.slice(1).join(' ');
        response = await this.handleTeam(teamName);
      } else if (subCommand === 'matches') {
        const teamName = args.slice(1).join(' ');
        response = await this.handleTeamMatches(teamName);
      } else if (subCommand === 'help') {
        response = this.handleHelp();
      } else {
        response = await this.handleLive();
      }

      if (response.length > 4096) {
        const chunks = this.splitMessage(response);
        for (const chunk of chunks) {
          await sock.sendMessage(remoteJid, { text: chunk });
        }
      } else {
        await sock.sendMessage(remoteJid, { text: response });
      }
    } catch (error) {
      console.error('Football plugin error:', error);
      await sock.sendMessage(remoteJid, { 
        text: `❌ Error: ${error.message}\n\nPlease try again later or check your API key.` 
      });
    }
  }

  splitMessage(text) {
    const chunks = [];
    let currentChunk = '';
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > 4096) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      currentChunk += line + '\n';
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  formatMatch(match) {
    const homeTeam = match.homeTeam?.name || 'Unknown';
    const awayTeam = match.awayTeam?.name || 'Unknown';
    const homeScore = match.score?.fullTime?.home !== undefined ? match.score.fullTime.home : match.score?.halfTime?.home;
    const awayScore = match.score?.fullTime?.away !== undefined ? match.score.fullTime.away : match.score?.halfTime?.away;
    
    let status = match.status || 'UNKNOWN';
    let statusDisplay = '';
    
    switch(status) {
      case 'LIVE':
      case 'IN_PLAY':
        statusDisplay = '🔴 LIVE';
        break;
      case 'PAUSED':
        statusDisplay = '⏸ PAUSED';
        break;
      case 'FINISHED':
        statusDisplay = '✅ FINISHED';
        break;
      case 'SCHEDULED':
        statusDisplay = '📅 SCHEDULED';
        break;
      case 'POSTPONED':
        statusDisplay = '📅 POSTPONED';
        break;
      case 'CANCELED':
        statusDisplay = '❌ CANCELED';
        break;
      default:
        statusDisplay = `📋 ${status}`;
    }
    
    let result = `${homeTeam} ${homeScore !== undefined && homeScore !== null ? homeScore : '?'} - ${awayScore !== undefined && awayScore !== null ? awayScore : '?'} ${awayTeam}`;
    
    if (status === 'FINISHED') {
      result = `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`;
    }
    
    return { result, statusDisplay };
  }

  async handleLive() {
    const matches = await this.api.getLiveMatches();
    
    if (!matches || matches.length === 0) {
      return '⚽ No live matches available right now.';
    }

    let response = '⚽ LIVE MATCHES\n━━━━━━━━━━━━━━━━━━━━━━\n';
    
    for (const match of matches.slice(0, 10)) {
      const { result, statusDisplay } = this.formatMatch(match);
      const competition = match.competition?.name || 'Unknown';
      const emoji = leagueCodes.getCompetitionEmoji(match.competition?.code);
      
      response += `\n${emoji} ${competition}`;
      response += `\n${result}`;
      response += `\n${statusDisplay}`;
      
      if (match.venue) {
        response += `\n🏟 ${match.venue}`;
      }
      
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleToday() {
    const matches = await this.api.getTodayMatches();
    
    if (!matches || matches.length === 0) {
      return '📋 No matches scheduled for today.';
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    let response = `📅 TODAY'S MATCHES\n${today}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    const sortedMatches = matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    for (const match of sortedMatches.slice(0, 15)) {
      const time = new Date(match.utcDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const competition = match.competition?.name || 'Unknown';
      const emoji = leagueCodes.getCompetitionEmoji(match.competition?.code);
      const homeTeam = match.homeTeam?.name || 'Unknown';
      const awayTeam = match.awayTeam?.name || 'Unknown';
      
      response += `\n${time} ${emoji} ${competition}`;
      response += `\n${homeTeam} vs ${awayTeam}`;
      
      if (match.venue) {
        response += `\n🏟 ${match.venue}`;
      }
      
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleTomorrow() {
    const matches = await this.api.getTomorrowMatches();
    
    if (!matches || matches.length === 0) {
      return '📋 No matches scheduled for tomorrow.';
    }

    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    let response = `📅 TOMORROW'S MATCHES\n${tomorrow}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    const sortedMatches = matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    for (const match of sortedMatches.slice(0, 15)) {
      const time = new Date(match.utcDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const competition = match.competition?.name || 'Unknown';
      const emoji = leagueCodes.getCompetitionEmoji(match.competition?.code);
      const homeTeam = match.homeTeam?.name || 'Unknown';
      const awayTeam = match.awayTeam?.name || 'Unknown';
      
      response += `\n${time} ${emoji} ${competition}`;
      response += `\n${homeTeam} vs ${awayTeam}`;
      
      if (match.venue) {
        response += `\n🏟 ${match.venue}`;
      }
      
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleFixtures(league) {
    const competitionCode = leagueCodes.getCompetitionCode(league);
    if (!competitionCode) {
      return '❌ Invalid league. Available: epl, laliga, serie-a, bundesliga, ligue1, ucl\n\nUsage: .football fixtures [league]';
    }

    const matches = await this.api.getCompetitionMatches(competitionCode);
    const upcoming = matches.filter(m => m.status === 'SCHEDULED').slice(0, 10);
    
    if (upcoming.length === 0) {
      return `📋 No upcoming fixtures for ${leagueCodes.getCompetitionName(competitionCode)}`;
    }

    const emoji = leagueCodes.getCompetitionEmoji(competitionCode);
    let response = `📋 UPCOMING FIXTURES\n${emoji} ${leagueCodes.getCompetitionName(competitionCode)}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    for (const match of upcoming) {
      const date = new Date(match.utcDate);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const homeTeam = match.homeTeam?.name || 'Unknown';
      const awayTeam = match.awayTeam?.name || 'Unknown';
      const venue = match.venue || 'TBD';
      
      response += `\n📅 ${dateStr} at ${time}`;
      response += `\n${homeTeam} vs ${awayTeam}`;
      response += `\n🏟 ${venue}`;
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleStandings(league) {
    const competitionCode = leagueCodes.getCompetitionCode(league);
    if (!competitionCode) {
      return '❌ Invalid league. Available: epl, laliga, serie-a, bundesliga, ligue1, ucl\n\nUsage: .football standings [league]';
    }

    const standingsData = await this.api.getCompetitionStandings(competitionCode);
    
    if (!standingsData || standingsData.length === 0) {
      return `📊 No standings available for ${leagueCodes.getCompetitionName(competitionCode)}`;
    }

    const standings = standingsData[0]?.table || [];
    if (standings.length === 0) {
      return `📊 No standings available for ${leagueCodes.getCompetitionName(competitionCode)}`;
    }

    const emoji = leagueCodes.getCompetitionEmoji(competitionCode);
    let response = `🏆 ${leagueCodes.getCompetitionName(competitionCode)}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    for (const team of standings.slice(0, 10)) {
      const position = team.position;
      const name = team.team?.name || 'Unknown';
      const points = team.points || 0;
      const played = team.playedGames || 0;
      const wins = team.won || 0;
      const draws = team.draw || 0;
      const losses = team.lost || 0;
      const goalsFor = team.goalsFor || 0;
      const goalsAgainst = team.goalsAgainst || 0;
      const goalDiff = team.goalDifference || 0;
      
      let prefix = '';
      if (position <= 4) {
        prefix = '🔵 ';
      } else if (position <= 7) {
        prefix = '🟢 ';
      } else if (position >= standings.length - 2) {
        prefix = '🔴 ';
      }
      
      response += `\n${prefix}${position}. ${name}`;
      response += `\n   P:${played} W:${wins} D:${draws} L:${losses}`;
      response += `\n   GF:${goalsFor} GA:${goalsAgainst} +/-:${goalDiff}`;
      response += `\n   ${points} PTS`;
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleScorers(league) {
    const competitionCode = leagueCodes.getCompetitionCode(league);
    if (!competitionCode) {
      return '❌ Invalid league. Available: epl, laliga, serie-a, bundesliga, ligue1, ucl\n\nUsage: .football scorers [league]';
    }

    const scorers = await this.api.getCompetitionScorers(competitionCode, 20);
    
    if (!scorers || scorers.length === 0) {
      return `⚽ No top scorers data for ${leagueCodes.getCompetitionName(competitionCode)}`;
    }

    const emoji = leagueCodes.getCompetitionEmoji(competitionCode);
    let response = `⚽ TOP SCORERS\n${emoji} ${leagueCodes.getCompetitionName(competitionCode)}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    for (const scorer of scorers.slice(0, 20)) {
      const name = scorer.player?.name || 'Unknown';
      const team = scorer.team?.name || 'Unknown';
      const goals = scorer.goals || 0;
      const assists = scorer.assists || 0;
      const position = scorer.player?.position || 'N/A';
      
      response += `\n${scorers.indexOf(scorer) + 1}. ${name}`;
      response += `\n   ⚽ ${goals} goals`;
      if (assists > 0) {
        response += ` | 🎯 ${assists} assists`;
      }
      response += `\n   🏟 ${team}`;
      response += `\n   📍 ${position}`;
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleTeam(teamName) {
    if (!teamName) {
      return '❌ Please specify a team name.\n\nUsage: .football team [team name]';
    }

    const team = await this.api.getTeamByName(teamName);
    if (!team) {
      return `❌ Team "${teamName}" not found. Please try a different search.`;
    }

    let response = `🏟️ TEAM INFO\n${team.name}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (team.crest) {
      response += `\n🖼 Crest: ${team.crest}`;
    }
    
    response += `\n📍 ${team.address || 'N/A'}`;
    response += `\n📅 Founded: ${team.founded || 'N/A'}`;
    response += `\n🌍 Country: ${team.area?.name || 'N/A'}`;
    response += `\n🏟 Stadium: ${team.venue || 'N/A'}`;
    
    if (team.coach) {
      response += `\n👨‍🏫 Coach: ${team.coach.name || 'N/A'}`;
    }
    
    if (team.competitions) {
      response += '\n\n🏆 Competitions:';
      for (const comp of team.competitions.slice(0, 3)) {
        response += `\n• ${comp.name}`;
      }
    }
    
    return response;
  }

  async handleTeamMatches(teamName) {
    if (!teamName) {
      return '❌ Please specify a team name.\n\nUsage: .football matches [team name]';
    }

    const team = await this.api.getTeamByName(teamName);
    if (!team) {
      return `❌ Team "${teamName}" not found. Please try a different search.`;
    }

    const matches = await this.api.getTeamMatches(team.id, null, 10);
    
    if (!matches || matches.length === 0) {
      return `📋 No matches found for ${team.name}`;
    }

    let response = `📋 ${team.name}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    for (const match of matches.slice(0, 10)) {
      const { result, statusDisplay } = this.formatMatch(match);
      const date = new Date(match.utcDate);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      response += `\n${dateStr}: ${result}`;
      response += `\n${statusDisplay}`;
      if (match.competition?.name) {
        response += `\n${match.competition.name}`;
      }
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  handleHelp() {
    return `⚽ FOOTBALL COMMANDS\n━━━━━━━━━━━━━━━━━━━━━━\n
📋 Available Commands:
\n🔴 Live Matches
.football live
\n📅 Today's Matches
.football today
\n📅 Tomorrow's Matches
.football tomorrow
\n📋 Fixtures
.football fixtures [league]
\n📊 Standings
.football standings [league]
\n⚽ Top Scorers
.football scorers [league]
\n🏟️ Team Info
.football team [name]
\n📋 Team Matches
.football matches [name]
\nℹ️ Help
.football help

Available Leagues:
epl, premier, laliga, serie-a, bundesliga, ligue1, ucl, champions

Examples:
.football live
.football standings epl
.football team Arsenal
.football fixtures laliga
.football scorers bundesliga
.football matches Barcelona

Powered by Football-Data.org ⚽`;
  }
}

module.exports = FootballPlugin; team of standings.slice(0, 10)) {
      const position = team.rank;
      const name = team.team.name;
      const points = team.points;
      const played = team.all.played;
      const wins = team.all.win;
      const draws = team.all.draw;
      const losses = team.all.lose;
      const goalsFor = team.all.goals.for;
      const goalsAgainst = team.all.goals.against;
      const goalDiff = team.goalsDiff;
      
      let prefix = '';
      let suffix = '';
      if (position <= 4) {
        prefix = '🔵 ';
        suffix = ' (CL)';
      } else if (position <= 6) {
        prefix = '🟢 ';
        suffix = ' (EL)';
      } else if (position <= 7) {
        prefix = '🟡 ';
        suffix = ' (ECL)';
      } else if (position >= standings.length - 2) {
        prefix = '🔴 ';
        suffix = ' ⬇️';
      }
      
      response += `\n${prefix}${position}. ${name}${suffix}`;
      response += `\n   P:${played} W:${wins} D:${draws} L:${losses}`;
      response += `\n   GF:${goalsFor} GA:${goalsAgainst} +/-:${goalDiff}`;
      response += `\n   ${points} PTS`;
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleTeam(teamName) {
    if (!teamName) {
      return '❌ Please specify a team name.\n\nUsage: .football team [team name]';
    }

    const teams = await this.api.searchTeams(teamName);
    if (!teams || teams.length === 0) {
      return `❌ Team "${teamName}" not found. Please try a different search.`;
    }

    const team = teams[0];
    const venue = team.venue || {};
    
    let response = `🏟️ TEAM INFO\n${team.team.name}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `\n📍 ${venue.city || 'N/A'}`;
    response += `\n🏟 ${venue.name || 'N/A'}`;
    response += `\n📅 Founded: ${team.team.founded || 'N/A'}`;
    response += `\n🌍 Country: ${team.team.country || 'N/A'}`;
    response += `\n🏆 League: ${team.team.league || 'N/A'}`;
    
    if (team.team.logo) {
      response += `\n🖼 Logo: ${team.team.logo}`;
    }
    
    if (venue.capacity) {
      response += `\n👥 Capacity: ${venue.capacity.toLocaleString()}`;
    }
    
    // Get recent form
    try {
      const fixtures = await this.api.getFixtures(team.team.id, null);
      if (fixtures && fixtures.length > 0) {
        const recent = fixtures.filter(f => f.fixture.status.short === 'FT').slice(-5);
        if (recent.length > 0) {
          response += '\n\n📊 Recent Form:';
          for (const f of recent.reverse()) {
            const home = f.teams.home.name === team.team.name;
            const result = home ? (f.goals.home > f.goals.away ? '✅' : (f.goals.home < f.goals.away ? '❌' : '➖')) 
                               : (f.goals.away > f.goals.home ? '✅' : (f.goals.away < f.goals.home ? '❌' : '➖'));
            response += `\n${result} ${f.teams.home.name} ${f.goals.home}-${f.goals.away} ${f.teams.away.name}`;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching team fixtures:', error.message);
    }
    
    return response;
  }

  async handlePlayer(playerName) {
    if (!playerName) {
      return '❌ Please specify a player name.\n\nUsage: .football player [player name]';
    }

    const players = await this.api.searchPlayers(playerName);
    if (!players || players.length === 0) {
      return `❌ Player "${playerName}" not found. Please try a different search.`;
    }

    const player = players[0];
    const stats = player.statistics?.[0] || {};
    
    let response = `👤 PLAYER INFO\n${player.player.name}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `\n📍 Age: ${player.player.age || 'N/A'}`;
    response += `\n🌍 Nationality: ${player.player.nationality || 'N/A'}`;
    response += `\n⚽ Position: ${stats.games?.position || 'N/A'}`;
    response += `\n🏟 Club: ${stats.team?.name || 'N/A'}`;
    response += `\n📊 Appearances: ${stats.games?.appearences || 0}`;
    response += `\n⚽ Goals: ${stats.goals?.total || 0}`;
    response += `\n🎯 Assists: ${stats.goals?.assists || 0}`;
    response += `\n🟨 Yellow Cards: ${stats.cards?.yellow || 0}`;
    response += `\n🟥 Red Cards: ${stats.cards?.red || 0}`;
    
    if (player.player.photo) {
      response += `\n🖼 Photo: ${player.player.photo}`;
    }
    
    return response;
  }

  async handleTopScorers(league) {
    const leagueId = leagueCodes.getLeagueId(league);
    if (!leagueId) {
      return '❌ Invalid league. Available: epl, laliga, serie-a, bundesliga, ligue1, ucl\n\nUsage: .football top [league]';
    }

    const scorers = await this.api.getTopScorers(leagueId);
    if (!scorers || scorers.length === 0) {
      return `📊 No top scorers data for ${leagueCodes.getLeagueName(leagueId)}`;
    }

    const emoji = leagueCodes.getLeagueEmoji(leagueId);
    let response = `⚽ TOP 20 SCORERS\n${emoji} ${leagueCodes.getLeagueName(leagueId)}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    for (const scorer of scorers.slice(0, 20)) {
      const player = scorer.player;
      const stats = scorer.statistics[0];
      const goals = stats.goals.total || 0;
      const assists = stats.goals.assists || 0;
      const team = stats.team.name;
      
      response += `\n${scorer.rank}. ${player.name}`;
      response += `\n   ⚽ ${goals} goals`;
      if (assists > 0) {
        response += ` | 🎯 ${assists} assists`;
      }
      response += `\n   🏟 ${team}`;
      response += `\n   📊 ${stats.games.appearences || 0} apps`;
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleNews() {
    return '📰 Football News\n━━━━━━━━━━━━━━━━━━━━━━\n\n' +
           '⚠️ News integration requires a news API.\n' +
           'To enable news, replace this placeholder with an actual news API endpoint.\n\n' +
           'Recommended APIs:\n' +
           '• NewsAPI (newsapi.org)\n' +
           '• Football-API (football-api.com/news)\n' +
           '• Sportsdata.io (sportsdata.io)\n\n' +
           'Contact your developer to configure news support.';
  }

  async handleTransfers() {
    const transfers = await this.api.getTransfers();
    if (!transfers || transfers.length === 0) {
      return '📋 No recent transfers found.';
    }

    let response = '📋 RECENT TRANSFERS\n━━━━━━━━━━━━━━━━━━━━━━\n';
    
    for (const transfer of transfers.slice(0, 10)) {
      const player = transfer.player;
      const transferData = transfer.transfers[0];
      const from = transferData.from;
      const to = transferData.to;
      const fee = transferData.fee || 'Free';
      const date = new Date(transferData.date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      response += `\n${player.name}`;
      response += `\n   ➡️ ${from.name} → ${to.name}`;
      response += `\n   💰 ${fee}`;
      response += `\n   📅 ${dateStr}`;
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleInjuries(teamName) {
    if (!teamName) {
      return '❌ Please specify a team name.\n\nUsage: .football injuries [team name]';
    }

    return '📋 Injury Reports\n━━━━━━━━━━━━━━━━━━━━━━\n\n' +
           '⚠️ Injury reports require a sports injury API.\n' +
           'To enable injuries, replace this placeholder with an actual injury API endpoint.\n\n' +
           'Recommended APIs:\n' +
           '• Football-API (football-api.com/injuries)\n' +
           '• Sportsdata.io (sportsdata.io/injuries)\n\n' +
           `Team: ${teamName}\n` +
           'Contact your developer to configure injury support.';
  }

  async handleH2H(teams) {
    if (!teams) {
      return '❌ Please specify two teams.\n\nUsage: .football h2h team1 vs team2';
    }

    const teamNames = teams.split(' vs ').map(t => t.trim());
    if (teamNames.length !== 2) {
      return '❌ Please use format: team1 vs team2\n\nExample: .football h2h Arsenal vs Chelsea';
    }

    const team1 = await this.api.searchTeams(teamNames[0]);
    const team2 = await this.api.searchTeams(teamNames[1]);
    
    if (!team1 || team1.length === 0) {
      return `❌ Team "${teamNames[0]}" not found. Please check the team name.`;
    }
    if (!team2 || team2.length === 0) {
      return `❌ Team "${teamNames[1]}" not found. Please check the team name.`;
    }

    const h2h = await this.api.getHeadToHead(team1[0].team.id, team2[0].team.id);
    if (!h2h || h2h.length === 0) {
      return `📋 No head-to-head matches found between ${teamNames[0]} and ${teamNames[1]}.`;
    }

    let response = `📋 HEAD TO HEAD\n${teamNames[0]} vs ${teamNames[1]}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    const team1Wins = h2h.filter(f => 
      (f.teams.home.id === team1[0].team.id && f.goals.home > f.goals.away) ||
      (f.teams.away.id === team1[0].team.id && f.goals.away > f.goals.home)
    ).length;
    
    const team2Wins = h2h.filter(f => 
      (f.teams.home.id === team2[0].team.id && f.goals.home > f.goals.away) ||
      (f.teams.away.id === team2[0].team.id && f.goals.away > f.goals.home)
    ).length;
    
    const draws = h2h.filter(f => f.goals.home === f.goals.away).length;
    
    let totalGoals1 = 0;
    let totalGoals2 = 0;
    for (const f of h2h) {
      if (f.teams.home.id === team1[0].team.id) {
        totalGoals1 += f.goals.home;
        totalGoals2 += f.goals.away;
      } else if (f.teams.away.id === team1[0].team.id) {
        totalGoals1 += f.goals.away;
        totalGoals2 += f.goals.home;
      }
    }
    
    response += `\n📊 Overall Statistics:`;
    response += `\n✅ ${teamNames[0]}: ${team1Wins} wins`;
    response += `\n✅ ${teamNames[1]}: ${team2Wins} wins`;
    response += `\n➖ Draws: ${draws}`;
    response += `\n📋 Total matches: ${h2h.length}`;
    response += `\n⚽ ${teamNames[0]} goals: ${totalGoals1}`;
    response += `\n⚽ ${teamNames[1]} goals: ${totalGoals2}`;
    
    response += '\n\n📅 Recent Meetings:';
    for (const fixture of h2h.slice(0, 5)) {
      const date = new Date(fixture.fixture.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const result = fixture.goals.home > fixture.goals.away ? 
        `${fixture.teams.home.name} won` : 
        (fixture.goals.home < fixture.goals.away ? 
          `${fixture.teams.away.name} won` : 'Draw');
      response += `\n${date}: ${fixture.teams.home.name} ${fixture.goals.home}-${fixture.goals.away} ${fixture.teams.away.name} (${result})`;
    }
    
    return response;
  }

  async handleMatch(teams) {
    if (!teams) {
      return '❌ Please specify two teams.\n\nUsage: .football match team1 vs team2';
    }

    const teamNames = teams.split(' vs ').map(t => t.trim());
    if (teamNames.length !== 2) {
      return '❌ Please use format: team1 vs team2\n\nExample: .football match Arsenal vs Chelsea';
    }

    const team1 = await this.api.searchTeams(teamNames[0]);
    const team2 = await this.api.searchTeams(teamNames[1]);
    
    if (!team1 || team1.length === 0) {
      return `❌ Team "${teamNames[0]}" not found. Please check the team name.`;
    }
    if (!team2 || team2.length === 0) {
      return `❌ Team "${teamNames[1]}" not found. Please check the team name.`;
    }

    const h2h = await this.api.getHeadToHead(team1[0].team.id, team2[0].team.id);
    if (!h2h || h2h.length === 0) {
      return `📋 No matches found between ${teamNames[0]} and ${teamNames[1]}.`;
    }

    const latestMatch = h2h[0];
    const emoji = leagueCodes.getLeagueEmoji(latestMatch.league.id);
    
    let response = `⚽ MATCH RESULT\n${emoji} ${latestMatch.league.name}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    response += `\n${latestMatch.teams.home.name} vs ${latestMatch.teams.away.name}`;
    response += `\n📅 ${new Date(latestMatch.fixture.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
    response += `\n⏱ ${new Date(latestMatch.fixture.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    response += `\n🏟 ${latestMatch.fixture.venue.name || 'Unknown'}`;
    response += `\n👨‍⚖️ Referee: ${latestMatch.fixture.referee || 'Unknown'}`;
    
    response += `\n\n📊 FINAL SCORE`;
    response += `\n${latestMatch.teams.home.name}: ${latestMatch.goals.home || 0}`;
    response += `\n${latestMatch.teams.away.name}: ${latestMatch.goals.away || 0}`;
    
    if (latestMatch.fixture.status.short === 'FT' || latestMatch.fixture.status.short === 'AET' || latestMatch.fixture.status.short === 'PEN') {
      response += `\n✅ ${latestMatch.fixture.status.long || 'Full Time'}`;
    }
    
    // Try to get additional match stats
    try {
      // Note: API may require additional endpoints for detailed stats
      response += `\n\n📋 Match Stats:`;
      response += `\n⚽ Scorers: Check live matches for scorer details`;
      response += `\n🟨 Cards: Check live matches for card details`;
    } catch (error) {
      console.error('Error fetching match stats:', error.message);
    }
    
    return response;
  }

  handleHelp() {
    return `⚽ FOOTBALL COMMANDS\n━━━━━━━━━━━━━━━━━━━━━━\n
📋 Available Commands:
\n🔴 Live Matches
.football live [league]
.football livescore [league]
\n📅 Fixtures
.football fixtures [league]
.football today
.football tomorrow
\n📊 Standings
.football standings [league]
\n👥 Teams & Players
.football team [name]
.football player [name]
\n⚽ Top Scorers
.football top [league]
\n🔄 Head to Head
.football h2h team1 vs team2
\n🏟 Match Result
.football match team1 vs team2
\n📰 News & Transfers
.football news
.football transfers
.football injuries [team]
\nℹ️ Help
.football help

Available Leagues:
epl, premier, laliga, serie-a, bundesliga, ligue1, ucl, champions

Examples:
.football live epl
.football standings laliga
.football team Arsenal
.football h2h Real Madrid vs Barcelona
.football match Liverpool vs Manchester United

Powered by API-Football ⚽`;
  }

  handleCache() {
    const size = this.api.getCacheSize();
    return `📊 Cache Status\n━━━━━━━━━━━━━━━━━━━━━━\n
Cache Size: ${size} entries
TTL: ${config.CACHE_TTL / 1000} seconds

To clear cache, restart the bot.`;
  }
}

module.exports = FootballPlugin;
