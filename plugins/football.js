// plugins/football.js
const FootballAPI = require('../lib/footballApi');
const leagueCodes = require('../lib/leagueCodes');

class FootballPlugin {
  constructor() {
    this.api = new FootballAPI();
    this.commands = [
      '.football', 'footy', 'soccer', 'match', 'livescore'
    ];
    this.name = 'Football Plugin';
    this.description = 'Real football scores, standings, and stats';
    this.version = '1.0.0';
  }

  async handle(sock, message) {
    const { remoteJid, text, from } = message;
    const args = text.split(' ').slice(1);
    const subCommand = args[0]?.toLowerCase() || '';

    try {
      let response = '';

      if (subCommand === 'live' || subCommand === 'livescore') {
        const league = args[1]?.toLowerCase() || '';
        response = await this.handleLive(league);
      } else if (subCommand === 'fixtures') {
        const league = args[1]?.toLowerCase() || '';
        response = await this.handleFixtures(league);
      } else if (subCommand === 'today') {
        response = await this.handleToday();
      } else if (subCommand === 'tomorrow') {
        response = await this.handleTomorrow();
      } else if (subCommand === 'standings') {
        const league = args[1]?.toLowerCase() || '';
        response = await this.handleStandings(league);
      } else if (subCommand === 'team') {
        const teamName = args.slice(1).join(' ');
        response = await this.handleTeam(teamName);
      } else if (subCommand === 'player') {
        const playerName = args.slice(1).join(' ');
        response = await this.handlePlayer(playerName);
      } else if (subCommand === 'top') {
        const league = args[1]?.toLowerCase() || '';
        response = await this.handleTopScorers(league);
      } else if (subCommand === 'news') {
        response = await this.handleNews();
      } else if (subCommand === 'transfers') {
        response = await this.handleTransfers();
      } else if (subCommand === 'injuries') {
        const teamName = args.slice(1).join(' ');
        response = await this.handleInjuries(teamName);
      } else if (subCommand === 'h2h') {
        const teams = args.slice(1).join(' ');
        response = await this.handleH2H(teams);
      } else if (subCommand === 'match') {
        const teams = args.slice(1).join(' ');
        response = await this.handleMatch(teams);
      } else if (subCommand === 'help') {
        response = this.handleHelp();
      } else if (subCommand === 'cache') {
        response = this.handleCache();
      } else {
        response = await this.handleLive('');
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
        text: '❌ Error: Unable to fetch football data. Please try again later.\n\nError: ' + error.message 
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

  async handleLive(league) {
    const leagueId = league ? leagueCodes.getLeagueId(league) : null;
    if (league && !leagueId) {
      return `❌ Invalid league. Available: epl, laliga, serie-a, bundesliga, ligue1, ucl\n\nUsage: .football live [league]`;
    }

    const matches = await this.api.getLiveMatches(leagueId);

    if (!matches || matches.length === 0) {
      if (leagueId) {
        return `⚽ No live matches available right now for ${leagueCodes.getLeagueName(leagueId)}.`;
      }
      return '⚽ No live matches available right now.';
    }

    let response = '⚽ LIVE MATCHES\n━━━━━━━━━━━━━━━━━━━━━━\n';
    
    for (const match of matches.slice(0, 10)) {
      const homeTeam = match.teams.home.name;
      const awayTeam = match.teams.away.name;
      const homeScore = match.goals.home !== null ? match.goals.home : 0;
      const awayScore = match.goals.away !== null ? match.goals.away : 0;
      const elapsed = match.fixture.status.elapsed || 0;
      const venue = match.fixture.venue.name || 'Unknown';
      const competition = match.league.name || 'Unknown';
      const emoji = leagueCodes.getLeagueEmoji(match.league.id);
      
      response += `\n${emoji} ${competition}`;
      response += `\n🔴 ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`;
      response += `\n⏱ ${elapsed}'`;
      
      if (match.fixture.status.short === 'HT') {
        response += ` (Half Time)`;
      } else if (match.fixture.status.short === 'FT') {
        response += ` (Full Time)`;
      }
      
      const scorers = match.goals?.home_scorers || match.goals?.away_scorers || [];
      if (scorers.length > 0) {
        response += '\n⚽ Scorers:';
        for (const scorer of scorers.slice(0, 3)) {
          response += `\n  • ${scorer.name} (${scorer.minute}')`;
        }
        if (scorers.length > 3) {
          response += `\n  • +${scorers.length - 3} more`;
        }
      }
      
      const cards = match.cards || [];
      const yellows = cards.filter(c => c.type === 'Yellow');
      const reds = cards.filter(c => c.type === 'Red');
      if (yellows.length > 0) {
        response += `\n🟨 ${yellows.map(c => c.player.name).join(', ')}`;
      }
      if (reds.length > 0) {
        response += `\n🟥 ${reds.map(c => c.player.name).join(', ')}`;
      }
      
      response += `\n🏟 ${venue}`;
      if (match.fixture.referee) {
        response += `\n👨‍⚖️ ${match.fixture.referee}`;
      }
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleFixtures(league) {
    const leagueId = leagueCodes.getLeagueId(league);
    if (!leagueId) {
      return '❌ Invalid league. Available: epl, laliga, serie-a, bundesliga, ligue1, ucl\n\nUsage: .football fixtures [league]';
    }

    const fixtures = await this.api.getFixtures(leagueId);
    if (!fixtures || fixtures.length === 0) {
      return `📋 No upcoming fixtures for ${leagueCodes.getLeagueName(leagueId)}`;
    }

    const upcoming = fixtures.filter(f => f.fixture.status.short === 'NS').slice(0, 10);
    if (upcoming.length === 0) {
      return `📋 No upcoming fixtures for ${leagueCodes.getLeagueName(leagueId)}`;
    }

    const emoji = leagueCodes.getLeagueEmoji(leagueId);
    let response = `📋 UPCOMING FIXTURES\n${emoji} ${leagueCodes.getLeagueName(leagueId)}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    for (const fixture of upcoming) {
      const date = new Date(fixture.fixture.date);
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      response += `\n📅 ${dateStr} at ${time}`;
      response += `\n⚔️ ${fixture.teams.home.name} vs ${fixture.teams.away.name}`;
      response += `\n🏟 ${fixture.fixture.venue.name || 'TBD'}`;
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleToday() {
    const date = new Date().toISOString().split('T')[0];
    return this.handleFixturesByDate(date, 'today');
  }

  async handleTomorrow() {
    const date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return this.handleFixturesByDate(date, 'tomorrow');
  }

  async handleFixturesByDate(date, dayLabel) {
    const matches = [];
    const popularLeagues = [39, 140, 135, 78, 61, 2];
    
    for (const leagueId of popularLeagues) {
      try {
        const fixtures = await this.api.getFixtures(leagueId, date);
        matches.push(...fixtures);
      } catch (error) {
        console.error(`Error fetching fixtures for league ${leagueId}:`, error.message);
      }
    }

    if (matches.length === 0) {
      return `📋 No matches scheduled for ${dayLabel || new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`;
    }

    const dayName = dayLabel || new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    let response = `📋 MATCHES ON ${dayName}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    const sortedMatches = matches.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
    
    for (const match of sortedMatches.slice(0, 15)) {
      const time = new Date(match.fixture.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const emoji = leagueCodes.getLeagueEmoji(match.league.id);
      
      response += `\n${time} ${emoji} ${match.league.name}`;
      response += `\n${match.teams.home.name} vs ${match.teams.away.name}`;
      response += `\n🏟 ${match.fixture.venue.name || 'TBD'}`;
      response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }

  async handleStandings(league) {
    const leagueId = leagueCodes.getLeagueId(league);
    if (!leagueId) {
      return '❌ Invalid league. Available: epl, laliga, serie-a, bundesliga, ligue1, ucl\n\nUsage: .football standings [league]';
    }

    const standingsData = await this.api.getStandings(leagueId);
    if (!standingsData || standingsData.length === 0) {
      return `📊 No standings available for ${leagueCodes.getLeagueName(leagueId)}`;
    }

    const standings = standingsData[0].league.standings[0];
    const emoji = leagueCodes.getLeagueEmoji(leagueId);
    const country = leagueCodes.getLeagueCountry(leagueId);
    
    let response = `📊 STANDINGS\n${emoji} ${leagueCodes.getLeagueName(leagueId)} (${country})\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    for (const team of standings.slice(0, 10)) {
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
