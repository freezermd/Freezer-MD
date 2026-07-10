// commands/football.js
const FootballAPI = require('../lib/footballApi');
const leagueCodes = require('../lib/leagueCodes');

module.exports = {
    name: 'football',
    aliases: ['footy', 'soccer'],
    description: 'Football scores, standings, fixtures, and team info',
    
    async execute({ sock, msg, from, args, config }) {
        try {
            const api = new FootballAPI();
            const subCommand = args[0]?.toLowerCase() || '';
            const leagueOrTeam = args.slice(1).join(' ');
            
            let response = '';

            if (subCommand === 'help' || (subCommand === '' && args.length === 0)) {
                response = getHelpMessage();
            } else if (subCommand === 'live') {
                response = await handleLive(api);
            } else if (subCommand === 'today') {
                response = await handleToday(api);
            } else if (subCommand === 'tomorrow') {
                response = await handleTomorrow(api);
            } else if (subCommand === 'fixtures') {
                response = await handleFixtures(api, leagueOrTeam);
            } else if (subCommand === 'standings') {
                response = await handleStandings(api, leagueOrTeam);
            } else if (subCommand === 'scorers') {
                response = await handleScorers(api, leagueOrTeam);
            } else if (subCommand === 'team') {
                response = await handleTeam(api, leagueOrTeam);
            } else if (subCommand === 'matches') {
                response = await handleTeamMatches(api, leagueOrTeam);
            } else {
                response = getHelpMessage();
            }

            // Split message if too long
            if (response.length > 4096) {
                const chunks = splitMessage(response);
                for (const chunk of chunks) {
                    await sock.sendMessage(from, { text: chunk });
                }
            } else {
                await sock.sendMessage(from, { text: response });
            }
        } catch (error) {
            console.error('Football command error:', error);
            await sock.sendMessage(from, { 
                text: `❌ Error: ${error.message || 'Failed to fetch football data'}\n\nPlease try again later or check your API key.` 
            });
        }
    }
};

// Helper Functions

function splitMessage(text) {
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

function getHelpMessage() {
    return `⚽ FOOTBALL COMMANDS
━━━━━━━━━━━━━━━━━━━━━━

📋 Available Commands:

🔴 Live Matches
.football live

📅 Today's Matches
.football today

📅 Tomorrow's Matches
.football tomorrow

📋 Fixtures
.football fixtures [league]

📊 Standings
.football standings [league]

⚽ Top Scorers
.football scorers [league]

🏟️ Team Info
.football team [name]

📋 Team Matches
.football matches [name]

ℹ️ Help
.football help

Available Leagues:
epl, premier, laliga, serie-a, bundesliga, ligue1, ucl

Examples:
.football live
.football standings epl
.football team Arsenal
.football fixtures laliga
.football scorers bundesliga
.football matches Barcelona

Powered by Football-Data.org ⚽`;
}

function formatMatch(match) {
    const homeTeam = match.homeTeam?.name || 'Unknown';
    const awayTeam = match.awayTeam?.name || 'Unknown';
    const homeScore = match.score?.fullTime?.home !== undefined && match.score?.fullTime?.home !== null 
        ? match.score.fullTime.home 
        : (match.score?.halfTime?.home !== undefined && match.score?.halfTime?.home !== null 
            ? match.score.halfTime.home 
            : '?');
    const awayScore = match.score?.fullTime?.away !== undefined && match.score?.fullTime?.away !== null 
        ? match.score.fullTime.away 
        : (match.score?.halfTime?.away !== undefined && match.score?.halfTime?.away !== null 
            ? match.score.halfTime.away 
            : '?');
    
    let status = match.status || 'UNKNOWN';
    let statusDisplay = '';
    let emoji = '';
    
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
    
    let result = `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`;
    
    return { result, statusDisplay };
}

function getStatusEmoji(status) {
    switch(status) {
        case 'LIVE':
        case 'IN_PLAY':
            return '🔴';
        case 'PAUSED':
            return '⏸';
        case 'FINISHED':
            return '✅';
        case 'SCHEDULED':
            return '📅';
        case 'POSTPONED':
            return '📅';
        case 'CANCELED':
            return '❌';
        default:
            return '📋';
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { 
        timeZone: 'Africa/Nairobi',
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    return date.toLocaleDateString('en-US', options);
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    const options = { 
        timeZone: 'Africa/Nairobi',
        month: 'short', 
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

// Command Handlers

async function handleLive(api) {
    const matches = await api.getLiveMatches();
    
    if (!matches || matches.length === 0) {
        return '⚽ No live matches available right now.';
    }

    let response = '⚽ LIVE MATCHES\n━━━━━━━━━━━━━━━━━━━━━━\n';
    
    for (const match of matches.slice(0, 10)) {
        const { result, statusDisplay } = formatMatch(match);
        const competition = match.competition?.name || 'Unknown';
        const emoji = leagueCodes.getCompetitionEmoji(match.competition?.code);
        const venue = match.venue || 'Unknown';
        
        response += `\n${emoji} ${competition}`;
        response += `\n${result}`;
        response += `\n${statusDisplay}`;
        if (venue !== 'Unknown') {
            response += `\n🏟 ${venue}`;
        }
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
}

async function handleToday(api) {
    const matches = await api.getTodayMatches();
    
    if (!matches || matches.length === 0) {
        return '📋 No matches scheduled for today.';
    }

    const today = new Date().toLocaleDateString('en-US', { 
        timeZone: 'Africa/Nairobi',
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });
    let response = `📅 TODAY'S MATCHES\n${today}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    const sortedMatches = matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    for (const match of sortedMatches.slice(0, 15)) {
        const date = new Date(match.utcDate);
        const time = date.toLocaleTimeString('en-US', { 
            timeZone: 'Africa/Nairobi',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
        const competition = match.competition?.name || 'Unknown';
        const emoji = leagueCodes.getCompetitionEmoji(match.competition?.code);
        const homeTeam = match.homeTeam?.name || 'Unknown';
        const awayTeam = match.awayTeam?.name || 'Unknown';
        const venue = match.venue || 'TBD';
        
        response += `\n${time} ${emoji} ${competition}`;
        response += `\n${homeTeam} vs ${awayTeam}`;
        if (venue !== 'TBD') {
            response += `\n🏟 ${venue}`;
        }
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
}

async function handleTomorrow(api) {
    const matches = await api.getTomorrowMatches();
    
    if (!matches || matches.length === 0) {
        return '📋 No matches scheduled for tomorrow.';
    }

    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-US', { 
        timeZone: 'Africa/Nairobi',
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });
    let response = `📅 TOMORROW'S MATCHES\n${tomorrow}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    const sortedMatches = matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    for (const match of sortedMatches.slice(0, 15)) {
        const date = new Date(match.utcDate);
        const time = date.toLocaleTimeString('en-US', { 
            timeZone: 'Africa/Nairobi',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
        const competition = match.competition?.name || 'Unknown';
        const emoji = leagueCodes.getCompetitionEmoji(match.competition?.code);
        const homeTeam = match.homeTeam?.name || 'Unknown';
        const awayTeam = match.awayTeam?.name || 'Unknown';
        const venue = match.venue || 'TBD';
        
        response += `\n${time} ${emoji} ${competition}`;
        response += `\n${homeTeam} vs ${awayTeam}`;
        if (venue !== 'TBD') {
            response += `\n🏟 ${venue}`;
        }
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
}

async function handleFixtures(api, league) {
    if (!league) {
        return '❌ Please specify a league.\n\nUsage: .football fixtures [league]\n\nAvailable: epl, laliga, serie-a, bundesliga, ligue1, ucl';
    }

    const competitionCode = leagueCodes.getCompetitionCode(league);
    if (!competitionCode) {
        return `❌ Invalid league "${league}".\n\nAvailable: epl, laliga, serie-a, bundesliga, ligue1, ucl`;
    }

    const matches = await api.getCompetitionMatches(competitionCode);
    
    if (!matches || matches.length === 0) {
        return `📋 No fixtures available for ${leagueCodes.getCompetitionName(competitionCode)}`;
    }

    const upcoming = matches.filter(m => m.status === 'SCHEDULED').slice(0, 10);
    
    if (upcoming.length === 0) {
        return `📋 No upcoming fixtures for ${leagueCodes.getCompetitionName(competitionCode)}`;
    }

    const emoji = leagueCodes.getCompetitionEmoji(competitionCode);
    let response = `📋 UPCOMING FIXTURES\n${emoji} ${leagueCodes.getCompetitionName(competitionCode)}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    for (const match of upcoming) {
        const homeTeam = match.homeTeam?.name || 'Unknown';
        const awayTeam = match.awayTeam?.name || 'Unknown';
        const venue = match.venue || 'TBD';
        const formattedDate = formatDate(match.utcDate);
        
        response += `\n${formattedDate}`;
        response += `\n${homeTeam} vs ${awayTeam}`;
        if (venue !== 'TBD') {
            response += `\n🏟 ${venue}`;
        }
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
}

async function handleStandings(api, league) {
    if (!league) {
        return '❌ Please specify a league.\n\nUsage: .football standings [league]\n\nAvailable: epl, laliga, serie-a, bundesliga, ligue1, ucl';
    }

    const competitionCode = leagueCodes.getCompetitionCode(league);
    if (!competitionCode) {
        return `❌ Invalid league "${league}".\n\nAvailable: epl, laliga, serie-a, bundesliga, ligue1, ucl`;
    }

    const standingsData = await api.getCompetitionStandings(competitionCode);
    
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

async function handleScorers(api, league) {
    if (!league) {
        return '❌ Please specify a league.\n\nUsage: .football scorers [league]\n\nAvailable: epl, laliga, serie-a, bundesliga, ligue1, ucl';
    }

    const competitionCode = leagueCodes.getCompetitionCode(league);
    if (!competitionCode) {
        return `❌ Invalid league "${league}".\n\nAvailable: epl, laliga, serie-a, bundesliga, ligue1, ucl`;
    }

    const scorers = await api.getCompetitionScorers(competitionCode, 20);
    
    if (!scorers || scorers.length === 0) {
        return `⚽ No top scorers data for ${leagueCodes.getCompetitionName(competitionCode)}`;
    }

    const emoji = leagueCodes.getCompetitionEmoji(competitionCode);
    let response = `⚽ TOP SCORERS\n${emoji} ${leagueCodes.getCompetitionName(competitionCode)}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    let rank = 1;
    for (const scorer of scorers.slice(0, 20)) {
        const name = scorer.player?.name || 'Unknown';
        const team = scorer.team?.name || 'Unknown';
        const goals = scorer.goals || 0;
        const assists = scorer.assists || 0;
        const position = scorer.player?.position || 'N/A';
        
        response += `\n${rank}. ${name}`;
        response += `\n   ⚽ ${goals} goals`;
        if (assists > 0) {
            response += ` | 🎯 ${assists} assists`;
        }
        response += `\n   🏟 ${team}`;
        response += `\n   📍 ${position}`;
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
        rank++;
    }
    
    return response;
}

async function handleTeam(api, teamName) {
    if (!teamName) {
        return '❌ Please specify a team name.\n\nUsage: .football team [team name]';
    }

    const team = await api.getTeamByName(teamName);
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
    
    if (team.competitions && team.competitions.length > 0) {
        response += '\n\n🏆 Competitions:';
        for (const comp of team.competitions.slice(0, 3)) {
            response += `\n• ${comp.name}`;
        }
        if (team.competitions.length > 3) {
            response += `\n• +${team.competitions.length - 3} more`;
        }
    }
    
    return response;
}

async function handleTeamMatches(api, teamName) {
    if (!teamName) {
        return '❌ Please specify a team name.\n\nUsage: .football matches [team name]';
    }

    const team = await api.getTeamByName(teamName);
    if (!team) {
        return `❌ Team "${teamName}" not found. Please try a different search.`;
    }

    const matches = await api.getTeamMatches(team.id, null, 10);
    
    if (!matches || matches.length === 0) {
        return `📋 No matches found for ${team.name}`;
    }

    let response = `📋 ${team.name}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    const sortedMatches = matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    for (const match of sortedMatches.slice(0, 10)) {
        const { result, statusDisplay } = formatMatch(match);
        const dateShort = formatDateShort(match.utcDate);
        const competition = match.competition?.name || 'Unknown';
        const emoji = getStatusEmoji(match.status);
        
        response += `\n${dateShort}: ${result}`;
        response += `\n${statusDisplay}`;
        if (competition !== 'Unknown') {
            response += `\n${emoji} ${competition}`;
        }
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }
    
    return response;
  }
