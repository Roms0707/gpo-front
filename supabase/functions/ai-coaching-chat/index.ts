import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import OpenAI from "npm:openai@4.52.0";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CoachingRequest {
  session_id?: string;
  message: string;
  game_id: string;
  game_name: string;
  performance_context?: {
    matches?: any[];
    stats?: any;
    rank?: string;
    region?: string;
  };
}

interface TournamentStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentForm: string[];
}

interface ManualProfile {
  self_reported_rank: string | null;
  external_stats_url: string | null;
  external_stats_platform: string | null;
  main_characters: string[];
  playstyle_notes: string | null;
  hours_played_estimate: number | null;
  external_stats_validated: boolean;
  external_stats_cached_data: any | null;
}

interface UniversalPerformanceContext {
  tournamentStats: TournamentStats | null;
  manualProfile: ManualProfile | null;
  apiData: any | null;
  gameCategory: string;
}

const GAME_CATEGORIES: Record<string, { category: string; topics: string[] }> = {
  'league of legends': { category: 'moba', topics: ['laning', 'farming', 'vision', 'teamfighting', 'macro', 'builds', 'champions'] },
  'dota 2': { category: 'moba', topics: ['laning', 'farming', 'vision', 'teamfighting', 'macro', 'items', 'heroes'] },
  'valorant': { category: 'fps', topics: ['aim', 'positioning', 'utility', 'economy', 'communication', 'agents', 'maps'] },
  'counter-strike': { category: 'fps', topics: ['aim', 'positioning', 'utility', 'economy', 'communication', 'maps'] },
  'cs2': { category: 'fps', topics: ['aim', 'positioning', 'utility', 'economy', 'communication', 'maps'] },
  'fortnite': { category: 'battle_royale', topics: ['building', 'aim', 'positioning', 'looting', 'rotations', 'endgame'] },
  'apex legends': { category: 'battle_royale', topics: ['movement', 'aim', 'positioning', 'looting', 'rotations', 'legends'] },
  'rocket league': { category: 'sports', topics: ['mechanics', 'positioning', 'rotation', 'aerials', 'teamplay'] },
  'fifa': { category: 'sports', topics: ['dribbling', 'passing', 'defending', 'tactics', 'skill moves'] },
  'fc 24': { category: 'sports', topics: ['dribbling', 'passing', 'defending', 'tactics', 'skill moves'] },
  'street fighter': { category: 'fighting', topics: ['combos', 'neutral', 'matchups', 'execution', 'mindgames'] },
  'tekken': { category: 'fighting', topics: ['combos', 'movement', 'matchups', 'punishment', 'okizeme'] },
  'teamfight tactics': { category: 'autobattler', topics: ['economy', 'positioning', 'compositions', 'augments', 'items'] },
  'tft': { category: 'autobattler', topics: ['economy', 'positioning', 'compositions', 'augments', 'items'] },
};

interface ContentRecommendation {
  content_id: string;
  title: string;
  reason: string;
}

interface TopicDetectionResult {
  topics: string[];
  primaryCategory: string;
}

interface AIConfig {
  emphasisAreas: string[];
  topicPriorities: string[];
  customPromptSections: string[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TOPIC_KEYWORDS: Record<string, string[]> = {
  farming: ['cs', 'farm', 'minion', 'last hit', 'gold', 'creep', 'wave clear'],
  vision: ['ward', 'vision', 'pink', 'control ward', 'sweeper', 'oracle', 'fog of war', 'map awareness'],
  teamfighting: ['teamfight', 'team fight', 'group', 'engage', 'disengage', 'frontline', 'backline', 'peel', 'focus'],
  laning: ['lane', 'trading', 'poke', 'harass', 'freeze', 'slow push', 'fast push', 'recall timing', 'back timing'],
  macro: ['macro', 'rotation', 'objective', 'dragon', 'baron', 'herald', 'tower', 'split push', 'pressure'],
  builds: ['build', 'item', 'rune', 'mythic', 'legendary', 'boots', 'component', 'power spike'],
  champions: ['champion', 'counter', 'matchup', 'ability', 'combo', 'mechanics', 'skill order'],
  mental: ['tilt', 'mental', 'toxic', 'troll', 'feed', 'lose streak', 'win streak', 'attitude', 'mindset', 'focus']
};

const detectTopics = (message: string): TopicDetectionResult => {
  const lowerMessage = message.toLowerCase();
  const detectedTopics: string[] = [];
  const topicScores: Record<string, number> = {};

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        score++;
        if (!detectedTopics.includes(topic)) {
          detectedTopics.push(topic);
        }
      }
    }
    if (score > 0) {
      topicScores[topic] = score;
    }
  }

  let primaryCategory = 'general';
  if (Object.keys(topicScores).length > 0) {
    primaryCategory = Object.entries(topicScores)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  return {
    topics: detectedTopics,
    primaryCategory
  };
};

const fetchTournamentStats = async (supabase: any, userId: string, gameId: string): Promise<TournamentStats | null> => {
  try {
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('game_id', gameId);

    if (tournamentError || !tournaments || tournaments.length === 0) {
      console.log('[AI Coach] No tournaments found for this game');
      return null;
    }

    const tournamentIds = tournaments.map((t: any) => t.id);

    const { data: matches, error: matchError } = await supabase
      .from('tournament_matches')
      .select('winner_id, player1_id, player2_id, created_at')
      .in('tournament_id', tournamentIds)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .not('winner_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (matchError || !matches || matches.length === 0) {
      console.log('[AI Coach] No tournament matches found for user');
      return null;
    }

    const wins = matches.filter((m: any) => m.winner_id === userId).length;
    const totalMatches = matches.length;
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const recentForm = matches.slice(0, 5).map((m: any) =>
      m.winner_id === userId ? 'W' : 'L'
    );

    console.log(`[AI Coach] Tournament stats: ${wins}W-${losses}L (${winRate}%)`);

    return {
      totalMatches,
      wins,
      losses,
      winRate,
      recentForm
    };
  } catch (err) {
    console.error('[AI Coach] Error fetching tournament stats:', err);
    return null;
  }
};

const fetchManualProfile = async (supabase: any, userId: string, gameId: string): Promise<ManualProfile | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('user_game_manual_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .maybeSingle();

    if (error || !profile) {
      console.log('[AI Coach] No manual profile found for this game');
      return null;
    }

    console.log(`[AI Coach] Manual profile found: rank=${profile.self_reported_rank}, validated=${profile.external_stats_validated}`);

    return {
      self_reported_rank: profile.self_reported_rank,
      external_stats_url: profile.external_stats_url,
      external_stats_platform: profile.external_stats_platform,
      main_characters: profile.main_characters || [],
      playstyle_notes: profile.playstyle_notes,
      hours_played_estimate: profile.hours_played_estimate,
      external_stats_validated: profile.external_stats_validated || false,
      external_stats_cached_data: profile.external_stats_cached_data || null
    };
  } catch (err) {
    console.error('[AI Coach] Error fetching manual profile:', err);
    return null;
  }
};

const detectGameCategory = (gameName: string): string => {
  const lowerName = gameName.toLowerCase();

  for (const [game, config] of Object.entries(GAME_CATEGORIES)) {
    if (lowerName.includes(game)) {
      return config.category;
    }
  }

  return 'competitive';
};

const getEloTierGuidance = (rank: string | null | undefined): string => {
  if (!rank) return '';

  const lowerRank = rank.toLowerCase();

  if (lowerRank.includes('iron') || lowerRank.includes('bronze') || lowerRank.includes('silver') ||
      lowerRank.includes('beginner') || lowerRank.includes('rookie') || lowerRank.includes('copper')) {
    return `
## Player Skill Level: Beginner/Intermediate
- Focus on fundamentals and basic mechanics
- Explain concepts clearly without assuming prior knowledge
- Prioritize consistency over flashy plays
- Encourage good habits early (communication, positioning basics)
- Celebrate small improvements to build confidence`;
  }

  if (lowerRank.includes('gold') || lowerRank.includes('platinum') || lowerRank.includes('plat') ||
      lowerRank.includes('intermediate') || lowerRank.includes('adept')) {
    return `
## Player Skill Level: Intermediate/Advanced
- Player has solid fundamentals, focus on decision-making
- Discuss game sense and reading opponents
- Work on consistency and reducing mistakes
- Introduce more advanced concepts and timings
- Focus on efficiency and optimization`;
  }

  if (lowerRank.includes('diamond') || lowerRank.includes('master') || lowerRank.includes('grandmaster') ||
      lowerRank.includes('challenger') || lowerRank.includes('immortal') || lowerRank.includes('radiant') ||
      lowerRank.includes('champion') || lowerRank.includes('elite') || lowerRank.includes('legend')) {
    return `
## Player Skill Level: Advanced/Expert
- Player has strong mechanics, focus on micro-optimizations
- Discuss high-level meta and adaptation strategies
- Analyze edge cases and situational decisions
- Focus on mental game and consistency under pressure
- Discuss team coordination and leadership`;
  }

  return '';
};

const loadAIConfig = async (supabase: any, gameId: string): Promise<AIConfig> => {
  const defaultConfig: AIConfig = {
    emphasisAreas: [],
    topicPriorities: ['farming', 'vision', 'teamfighting', 'laning', 'macro', 'builds', 'champions', 'mental'],
    customPromptSections: []
  };

  try {
    const { data: configs, error } = await supabase
      .from('coaching_ai_config')
      .select('config_key, config_value')
      .or(`game_id.eq.${gameId},game_id.is.null`)
      .eq('is_active', true);

    if (error || !configs) {
      console.log('[AI Coach] No custom config found, using defaults');
      return defaultConfig;
    }

    for (const config of configs) {
      try {
        const value = JSON.parse(config.config_value);
        switch (config.config_key) {
          case 'emphasis_areas':
            defaultConfig.emphasisAreas = value;
            break;
          case 'topic_priorities':
            defaultConfig.topicPriorities = value;
            break;
          case 'custom_prompt_section':
            if (value && typeof value === 'string') {
              defaultConfig.customPromptSections.push(value);
            } else if (Array.isArray(value)) {
              defaultConfig.customPromptSections.push(...value);
            }
            break;
        }
      } catch {
        if (config.config_key === 'custom_prompt_section') {
          defaultConfig.customPromptSections.push(config.config_value);
        }
      }
    }

    return defaultConfig;
  } catch (err) {
    console.error('[AI Coach] Error loading AI config:', err);
    return defaultConfig;
  }
};

const trackQuestionAnalytics = async (
  supabase: any,
  userId: string,
  gameId: string,
  sessionId: string,
  questionText: string,
  detectionResult: TopicDetectionResult
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('coaching_question_analytics')
      .insert({
        user_id: userId,
        game_id: gameId,
        session_id: sessionId,
        question_text: questionText,
        detected_topics: detectionResult.topics,
        category: detectionResult.primaryCategory
      });

    if (error) {
      console.error('[AI Coach] Error tracking question analytics:', error.message);
    } else {
      console.log(`[AI Coach] Question tracked: category=${detectionResult.primaryCategory}, topics=${detectionResult.topics.join(',')}`);
    }
  } catch (err) {
    console.error('[AI Coach] Failed to track question:', err);
  }
};

const buildLoLSystemPrompt = (
  performanceContext: any,
  gameName: string,
  aiConfig: AIConfig
): string => {
  let contextSection = '';

  if (performanceContext?.matches && performanceContext.matches.length > 0) {
    const matches = performanceContext.matches;
    const wins = matches.filter((m: any) => m.stats?.win).length;
    const losses = matches.length - wins;
    const winRate = ((wins / matches.length) * 100).toFixed(1);

    const totalKills = matches.reduce((sum: number, m: any) => sum + (m.stats?.kills || 0), 0);
    const totalDeaths = matches.reduce((sum: number, m: any) => sum + (m.stats?.deaths || 0), 0);
    const totalAssists = matches.reduce((sum: number, m: any) => sum + (m.stats?.assists || 0), 0);
    const avgKDA = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : 'Perfect';

    const totalCS = matches.reduce((sum: number, m: any) => sum + (m.stats?.creepScore || 0), 0);
    const totalDuration = matches.reduce((sum: number, m: any) => sum + (m.gameDuration || 0), 0);
    const avgCSPerMin = totalDuration > 0 ? ((totalCS / (totalDuration / 60))).toFixed(1) : '0';

    const champions = matches.map((m: any) => m.champion?.name).filter(Boolean);
    const uniqueChampions = [...new Set(champions)];

    contextSection = `
## Player's Recent Performance (Last ${matches.length} Games)
- Win Rate: ${winRate}% (${wins}W - ${losses}L)
- Average KDA: ${avgKDA}
- Average CS/min: ${avgCSPerMin}
- Champions Played: ${uniqueChampions.join(', ')}

## Recent Match Details:
${matches.slice(0, 5).map((m: any, i: number) => {
  const duration = Math.floor((m.gameDuration || 0) / 60);
  return `${i + 1}. ${m.champion?.name || 'Unknown'} - ${m.stats?.win ? 'WIN' : 'LOSS'} (${m.stats?.kills || 0}/${m.stats?.deaths || 0}/${m.stats?.assists || 0}) - ${duration}min - CS: ${m.stats?.creepScore || 0}`;
}).join('\n')}
`;
  }

  if (performanceContext?.rank) {
    contextSection += `\n## Current Rank: ${performanceContext.rank}\n`;
  }

  let emphasisSection = '';
  if (aiConfig.emphasisAreas.length > 0) {
    emphasisSection = `
## Current Coaching Focus Areas (Prioritize these topics):
${aiConfig.emphasisAreas.map(area => `- ${area}`).join('\n')}

When players ask questions related to these areas, provide extra detailed advice and actionable steps.
`;
  }

  let customSections = '';
  if (aiConfig.customPromptSections.length > 0) {
    customSections = '\n' + aiConfig.customPromptSections.join('\n\n') + '\n';
  }

  return `You are an expert ${gameName} coach with deep knowledge of the game's mechanics, meta, strategies, and improvement techniques. Your role is to help players improve their gameplay through personalized coaching.

## Your Coaching Style:
- Be encouraging but honest about areas needing improvement
- Provide specific, actionable advice based on the player's actual performance data
- Use game-specific terminology appropriately
- Focus on fundamentals before advanced techniques
- Identify patterns in the player's games that indicate strengths and weaknesses
- Recommend specific drills or practice methods when appropriate

## Areas You Can Coach:
- Laning phase (CS, trading, wave management)
- Map awareness and vision control
- Teamfighting and positioning
- Champion mechanics and combos
- Macro decisions (objectives, rotations)
- Mental game and tilt management
- Champion pool recommendations
- Build and rune optimization
${emphasisSection}${customSections}${contextSection}

## Response Formatting Rules:
You MUST format your responses using markdown for better readability:

1. **Use headers** (## or ###) to organize different sections of your advice
2. **Bold key terms** and important concepts using **double asterisks**
3. Use bullet points (-) for lists of tips or items
4. Use numbered lists (1. 2. 3.) for step-by-step instructions or priority actions
5. Use \`code formatting\` for in-game terms, abilities, or key bindings

## IMPORTANT - Key Takeaways Section:
At the END of every response, you MUST include a "## Key Takeaways" section with 2-4 actionable bullet points summarizing the most important advice. Each takeaway should be:
- Specific and actionable (start with action verbs like "Focus on", "Practice", "Try", "Remember")
- Directly relevant to what the player asked
- Something they can immediately work on in their next game

Example format:
## Key Takeaways
- Focus on farming consistently for the first 10 minutes before looking for trades
- Practice tracking the enemy jungler by watching their CS count
- Remember to place a ward at the river brush before 3:00

## Important Guidelines:
- Keep responses clear and well-structured
- When analyzing specific matches, reference the data provided
- If the player asks about a specific champion or role not shown in their recent games, still provide helpful advice
- Be supportive - gaming improvement is a journey
- If you recommend watching tutorial content, mention it naturally (e.g., "You might benefit from watching some wave management tutorials")

Remember: You're talking to a real player who wants to improve. Be their coach, not a textbook.`;
};

const buildUniversalSystemPrompt = (
  universalContext: UniversalPerformanceContext,
  gameName: string,
  aiConfig: AIConfig
): string => {
  const category = universalContext.gameCategory;
  let contextSection = '';
  let rankSection = '';

  if (universalContext.tournamentStats) {
    const stats = universalContext.tournamentStats;
    contextSection += `
## Platform Tournament Performance
- Total Matches: ${stats.totalMatches}
- Win Rate: ${stats.winRate}% (${stats.wins}W - ${stats.losses}L)
- Recent Form: ${stats.recentForm.join(' ')}
${stats.winRate >= 60 ? '- Strong performance! Focus on maintaining consistency.' : ''}
${stats.winRate < 40 ? '- Room for improvement. Let\'s work on fundamentals.' : ''}
`;
  }

  if (universalContext.manualProfile) {
    const profile = universalContext.manualProfile;

    if (profile.self_reported_rank) {
      rankSection = getEloTierGuidance(profile.self_reported_rank);
      contextSection += `\n## Self-Reported Rank: ${profile.self_reported_rank}\n`;
    }

    if (profile.main_characters && profile.main_characters.length > 0) {
      contextSection += `## Main Characters/Agents: ${profile.main_characters.join(', ')}\n`;
    }

    if (profile.playstyle_notes) {
      contextSection += `## Playstyle Notes: ${profile.playstyle_notes}\n`;
    }

    if (profile.hours_played_estimate) {
      contextSection += `## Experience: ~${profile.hours_played_estimate} hours played\n`;
    }

    if (profile.external_stats_validated && profile.external_stats_cached_data) {
      const cachedStats = profile.external_stats_cached_data;
      contextSection += `\n## Verified External Stats (from ${profile.external_stats_platform || 'stats platform'}):\n`;
      if (cachedStats.rank) contextSection += `- Current Rank: ${cachedStats.rank}\n`;
      if (cachedStats.winRate) contextSection += `- Win Rate: ${cachedStats.winRate}%\n`;
      if (cachedStats.kd) contextSection += `- K/D Ratio: ${cachedStats.kd}\n`;
      if (cachedStats.level) contextSection += `- Level: ${cachedStats.level}\n`;
      if (cachedStats.gamesPlayed) contextSection += `- Games Played: ${cachedStats.gamesPlayed}\n`;
      if (cachedStats.additionalStats) {
        for (const [key, value] of Object.entries(cachedStats.additionalStats)) {
          if (key !== 'note' && key !== 'validatedUrl') {
            contextSection += `- ${key}: ${value}\n`;
          }
        }
      }
      contextSection += `- Stats URL validated: Yes\n`;
    } else if (profile.external_stats_url) {
      contextSection += `## External Stats: Available at ${profile.external_stats_platform || 'external site'} (not yet validated)\n`;
    }
  }

  if (universalContext.apiData?.rank) {
    rankSection = getEloTierGuidance(universalContext.apiData.rank);
    contextSection += `\n## Verified Rank: ${universalContext.apiData.rank}\n`;
  }

  let categoryGuidance = '';
  switch (category) {
    case 'moba':
      categoryGuidance = `
## MOBA Coaching Focus Areas:
- Laning phase fundamentals (CS, trading, wave management)
- Map awareness and vision control
- Objective priorities and timing
- Team fighting positioning and target selection
- Champion/hero matchups and counters
- Build paths and itemization`;
      break;
    case 'fps':
      categoryGuidance = `
## FPS Coaching Focus Areas:
- Aim training and crosshair placement
- Map knowledge and callouts
- Utility usage and lineups
- Economy management (if applicable)
- Team communication and coordination
- Positioning and angle holding
- Movement mechanics`;
      break;
    case 'battle_royale':
      categoryGuidance = `
## Battle Royale Coaching Focus Areas:
- Drop locations and early game strategy
- Looting efficiency and inventory management
- Rotations and zone awareness
- Engagement decisions (when to fight vs. avoid)
- Endgame positioning and placement
- Building/movement mechanics (game-specific)`;
      break;
    case 'fighting':
      categoryGuidance = `
## Fighting Game Coaching Focus Areas:
- Combo execution and optimization
- Neutral game and footsies
- Character matchup knowledge
- Frame data fundamentals
- Mental game and adaptation
- Punishment and whiff punishing`;
      break;
    case 'sports':
      categoryGuidance = `
## Sports Game Coaching Focus Areas:
- Core mechanics and controls
- Tactical formations and strategies
- Player/team management
- Set pieces and special situations
- Reading opponent patterns
- Online meta and common strategies`;
      break;
    case 'autobattler':
      categoryGuidance = `
## Auto-battler Coaching Focus Areas:
- Economy management (interest, spending)
- Composition building and pivoting
- Positioning on the board
- Item combinations and priorities
- Meta compositions and flex picks
- Scouting and adaptation`;
      break;
    default:
      categoryGuidance = `
## Competitive Gaming Focus Areas:
- Core mechanics and fundamentals
- Strategic decision-making
- Consistent practice routines
- Mental game and tilt prevention
- Analyzing and learning from mistakes`;
  }

  let emphasisSection = '';
  if (aiConfig.emphasisAreas.length > 0) {
    emphasisSection = `
## Current Coaching Focus Areas (Prioritize these topics):
${aiConfig.emphasisAreas.map(area => `- ${area}`).join('\n')}

When players ask questions related to these areas, provide extra detailed advice and actionable steps.
`;
  }

  let customSections = '';
  if (aiConfig.customPromptSections.length > 0) {
    customSections = '\n' + aiConfig.customPromptSections.join('\n\n') + '\n';
  }

  return `You are an expert ${gameName} coach with deep knowledge of competitive gaming, strategies, and improvement techniques. Your role is to help players improve their gameplay through personalized coaching.

## Your Coaching Style:
- Be encouraging but honest about areas needing improvement
- Provide specific, actionable advice based on available performance data
- Use game-specific terminology appropriately
- Focus on fundamentals before advanced techniques
- Identify patterns that indicate strengths and weaknesses
- Recommend specific drills or practice methods when appropriate
- Adapt your advice to the player's skill level
${categoryGuidance}${rankSection}${emphasisSection}${customSections}${contextSection}

## Response Formatting Rules:
You MUST format your responses using markdown for better readability:

1. **Use headers** (## or ###) to organize different sections of your advice
2. **Bold key terms** and important concepts using **double asterisks**
3. Use bullet points (-) for lists of tips or items
4. Use numbered lists (1. 2. 3.) for step-by-step instructions or priority actions
5. Use \`code formatting\` for in-game terms, abilities, or key bindings

## IMPORTANT - Key Takeaways Section:
At the END of every response, you MUST include a "## Key Takeaways" section with 2-4 actionable bullet points summarizing the most important advice. Each takeaway should be:
- Specific and actionable (start with action verbs like "Focus on", "Practice", "Try", "Remember")
- Directly relevant to what the player asked
- Something they can immediately work on in their next game

## Quest Suggestions:
When you identify a specific area the player should work on, you may suggest a "Coaching Quest" - a focused practice goal. Format quests like this:

**Suggested Quest:** [Quest Title]
- Goal: [What to achieve, e.g., "Play 5 games focusing only on X"]
- Why: [Brief explanation of why this will help]

Only suggest quests when there's a clear, specific skill to practice.

## Important Guidelines:
- Keep responses clear and well-structured
- Reference any available performance data when giving advice
- Be supportive - gaming improvement is a journey
- If you recommend external resources, mention them naturally

Remember: You're talking to a real player who wants to improve. Be their coach, not a textbook.`;
};

Deno.serve(async (req: Request) => {
  console.log('[AI Coach] ========== REQUEST START ==========');
  console.log(`[AI Coach] Method: ${req.method}, URL: ${req.url}`);

  if (req.method === "OPTIONS") {
    console.log('[AI Coach] Handling OPTIONS preflight request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[AI Coach] --- Environment Variables Check ---');
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('[AI Coach] CRITICAL: Missing required environment variables!');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error - missing environment variables'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Coach] --- Authorization Check ---');
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      console.error('[AI Coach] Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Coach] --- Creating Supabase Clients ---');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const userSupabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    console.log('[AI Coach] --- Authenticating User ---');
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();

    if (authError || !user) {
      console.error('[AI Coach] Authentication failed:', authError?.message || 'No user returned');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI Coach] User authenticated: ${user.id}`);

    const requestData: CoachingRequest = await req.json();
    const { session_id, message, game_id, game_name, performance_context } = requestData;

    if (!message || !game_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message and game_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const topicDetection = detectTopics(message);

    const [apiConfigResult, aiConfig] = await Promise.all([
      supabase
        .from('platform_api_integrations')
        .select('api_key, api_name, is_active')
        .eq('api_name', 'OpenAI API')
        .eq('is_active', true)
        .maybeSingle(),
      loadAIConfig(supabase, game_id)
    ]);

    if (apiConfigResult.error || !apiConfigResult.data?.api_key) {
      console.error('[AI Coach] FAILED: OpenAI API key not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({ apiKey: apiConfigResult.data.api_key });

    let currentSession: any = null;
    let conversationHistory: ChatMessage[] = [];

    if (session_id) {
      const { data: existingSession, error: sessionError } = await supabase
        .from('ai_coaching_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!sessionError && existingSession) {
        currentSession = existingSession;
        conversationHistory = existingSession.messages || [];
      }
    }

    if (!currentSession) {
      const sessionTitle = message.length > 50 ? message.substring(0, 50) + '...' : message;
      const { data: newSession, error: createError } = await supabase
        .from('ai_coaching_sessions')
        .insert({
          user_id: user.id,
          game_id: game_id,
          messages: [],
          performance_context: performance_context || {},
          session_title: sessionTitle,
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('[AI Coach] Error creating session:', createError.message);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create coaching session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      currentSession = newSession;
    }

    trackQuestionAnalytics(supabase, user.id, game_id, currentSession.id, message, topicDetection);

    const [tournamentStats, manualProfile] = await Promise.all([
      fetchTournamentStats(supabase, user.id, game_id),
      fetchManualProfile(supabase, user.id, game_id)
    ]);

    const gameCategory = detectGameCategory(game_name || '');

    const universalContext: UniversalPerformanceContext = {
      tournamentStats,
      manualProfile,
      apiData: currentSession.performance_context || performance_context,
      gameCategory
    };

    const hasApiData = performance_context?.matches && performance_context.matches.length > 0;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    conversationHistory.push(userMessage);

    const systemPrompt = hasApiData
      ? buildLoLSystemPrompt(currentSession.performance_context || performance_context, game_name || 'League of Legends', aiConfig)
      : buildUniversalSystemPrompt(universalContext, game_name || 'Unknown Game', aiConfig);

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-20).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: openaiMessages
    });

    const assistantContent = response.choices[0]?.message?.content
      || 'I apologize, but I encountered an issue generating a response.';

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString()
    };
    conversationHistory.push(assistantMessage);

    await supabase
      .from('ai_coaching_sessions')
      .update({
        messages: conversationHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSession.id);

    let videoRecommendations: ContentRecommendation[] = [];
    const contentKeywords = ['watch', 'tutorial', 'video', 'guide', 'learn'];
    const shouldRecommendContent = contentKeywords.some(keyword =>
      assistantContent.toLowerCase().includes(keyword)
    );

    if (shouldRecommendContent) {
      const topicKeywords: string[] = [];
      if (assistantContent.toLowerCase().includes('cs') || assistantContent.toLowerCase().includes('farm')) {
        topicKeywords.push('farming', 'cs', 'minion');
      }
      if (assistantContent.toLowerCase().includes('ward') || assistantContent.toLowerCase().includes('vision')) {
        topicKeywords.push('vision', 'ward', 'map');
      }

      if (topicKeywords.length > 0) {
        const { data: videos } = await supabase
          .from('game_contents')
          .select('id, title, description')
          .eq('game_id', game_id)
          .or(`title.ilike.%${topicKeywords[0]}%,description.ilike.%${topicKeywords[0]}%`)
          .limit(3);

        if (videos && videos.length > 0) {
          videoRecommendations = videos.map(v => ({
            content_id: v.id,
            title: v.title,
            reason: `Recommended based on coaching discussion about ${topicKeywords[0]}`
          }));
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        session_id: currentSession.id,
        message: assistantContent,
        video_recommendations: videoRecommendations,
        tokens_used: response.usage?.completion_tokens || 0,
        detected_topics: topicDetection.topics,
        category: topicDetection.primaryCategory
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[AI Coach] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
