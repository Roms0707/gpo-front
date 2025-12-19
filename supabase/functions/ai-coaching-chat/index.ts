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

    console.log(`[AI Coach] SUPABASE_URL: ${supabaseUrl ? `SET (${supabaseUrl.substring(0, 30)}...)` : 'NOT SET'}`);
    console.log(`[AI Coach] SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? `SET (length: ${serviceRoleKey.length}, starts: ${serviceRoleKey.substring(0, 10)}...)` : 'NOT SET'}`);
    console.log(`[AI Coach] SUPABASE_ANON_KEY: ${anonKey ? `SET (length: ${anonKey.length}, starts: ${anonKey.substring(0, 10)}...)` : 'NOT SET'}`);

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('[AI Coach] CRITICAL: Missing required environment variables!');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error - missing environment variables',
          debug: {
            supabaseUrl: !!supabaseUrl,
            serviceRoleKey: !!serviceRoleKey,
            anonKey: !!anonKey
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Coach] --- Authorization Check ---');
    const authHeader = req.headers.get('Authorization');
    console.log(`[AI Coach] Authorization header: ${authHeader ? `Present (length: ${authHeader.length}, starts: ${authHeader.substring(0, 20)}...)` : 'NOT PRESENT'}`);

    if (!authHeader) {
      console.error('[AI Coach] Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Coach] --- Creating Supabase Clients ---');
    let supabase;
    let userSupabase;

    try {
      console.log('[AI Coach] Creating service role client...');
      supabase = createClient(supabaseUrl, serviceRoleKey);
      console.log('[AI Coach] Service role client created successfully');
    } catch (clientError) {
      console.error('[AI Coach] Failed to create service role client:', clientError);
      throw clientError;
    }

    try {
      console.log('[AI Coach] Creating user client with auth header...');
      userSupabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      console.log('[AI Coach] User client created successfully');
    } catch (clientError) {
      console.error('[AI Coach] Failed to create user client:', clientError);
      throw clientError;
    }

    console.log('[AI Coach] --- Authenticating User ---');
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    console.log(`[AI Coach] Auth result - User: ${user ? user.id : 'null'}, Error: ${authError ? authError.message : 'none'}`);

    if (authError || !user) {
      console.error('[AI Coach] Authentication failed:', authError?.message || 'No user returned');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', authError: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI Coach] User authenticated: ${user.id} (${user.email})`);

    const requestData: CoachingRequest = await req.json();
    const { session_id, message, game_id, game_name, performance_context } = requestData;
    console.log(`[AI Coach] Request data - game_id: ${game_id}, game_name: ${game_name}, session_id: ${session_id || 'new'}, message length: ${message?.length || 0}`);

    if (!message || !game_id) {
      console.error('[AI Coach] Missing required fields: message or game_id');
      return new Response(
        JSON.stringify({ success: false, error: 'Message and game_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI Coach] Processing request for user ${user.id}, game: ${game_name}`);

    const topicDetection = detectTopics(message);
    console.log(`[AI Coach] Detected topics: ${topicDetection.topics.join(', ')} | Primary: ${topicDetection.primaryCategory}`);

    console.log('[AI Coach] --- Fetching OpenAI API Configuration ---');
    console.log('[AI Coach] Querying platform_api_integrations table...');
    console.log('[AI Coach] Query: SELECT api_key FROM platform_api_integrations WHERE api_name = "OpenAI API" AND is_active = true');

    const [apiConfigResult, aiConfig] = await Promise.all([
      supabase
        .from('platform_api_integrations')
        .select('api_key, api_name, is_active')
        .eq('api_name', 'OpenAI API')
        .eq('is_active', true)
        .maybeSingle(),
      loadAIConfig(supabase, game_id)
    ]);

    console.log('[AI Coach] --- API Config Query Result ---');
    console.log(`[AI Coach] Error: ${apiConfigResult.error ? JSON.stringify(apiConfigResult.error) : 'none'}`);
    console.log(`[AI Coach] Status: ${apiConfigResult.status || 'unknown'}`);
    console.log(`[AI Coach] Status Text: ${apiConfigResult.statusText || 'unknown'}`);
    console.log(`[AI Coach] Data: ${apiConfigResult.data ? 'FOUND' : 'NULL/UNDEFINED'}`);

    if (apiConfigResult.data) {
      console.log(`[AI Coach] Data fields present: ${Object.keys(apiConfigResult.data).join(', ')}`);
      console.log(`[AI Coach] api_name in result: ${apiConfigResult.data.api_name}`);
      console.log(`[AI Coach] is_active in result: ${apiConfigResult.data.is_active}`);
      console.log(`[AI Coach] api_key exists: ${!!apiConfigResult.data.api_key}`);
      console.log(`[AI Coach] api_key length: ${apiConfigResult.data.api_key?.length || 0}`);
      if (apiConfigResult.data.api_key) {
        console.log(`[AI Coach] api_key starts with: ${apiConfigResult.data.api_key.substring(0, 10)}...`);
      }
    } else {
      console.log('[AI Coach] No data returned from query - checking all records...');
      const { data: allRecords, error: allError } = await supabase
        .from('platform_api_integrations')
        .select('api_name, is_active')
        .limit(10);
      console.log(`[AI Coach] All records query error: ${allError ? JSON.stringify(allError) : 'none'}`);
      console.log(`[AI Coach] All records found: ${allRecords ? allRecords.length : 0}`);
      if (allRecords && allRecords.length > 0) {
        console.log('[AI Coach] Available records:');
        allRecords.forEach((r, i) => {
          console.log(`[AI Coach]   ${i + 1}. api_name="${r.api_name}", is_active=${r.is_active}`);
        });
      }
    }

    if (apiConfigResult.error || !apiConfigResult.data?.api_key) {
      console.error('[AI Coach] FAILED: OpenAI API key not configured or not found');
      console.error('[AI Coach] Error details:', apiConfigResult.error?.message || 'No error message');
      console.error('[AI Coach] Data received:', JSON.stringify(apiConfigResult.data));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI service not configured',
          debug: {
            hasError: !!apiConfigResult.error,
            errorMessage: apiConfigResult.error?.message,
            hasData: !!apiConfigResult.data,
            hasApiKey: !!apiConfigResult.data?.api_key
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Coach] SUCCESS: OpenAI API key retrieved successfully');

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

    trackQuestionAnalytics(
      supabase,
      user.id,
      game_id,
      currentSession.id,
      message,
      topicDetection
    );

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    conversationHistory.push(userMessage);

    const systemPrompt = buildLoLSystemPrompt(
      currentSession.performance_context || performance_context,
      game_name || 'League of Legends',
      aiConfig
    );

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-20).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    console.log('[AI Coach] --- Sending Request to OpenAI ---');
    console.log(`[AI Coach] Conversation messages: ${openaiMessages.length - 1}`);
    console.log(`[AI Coach] Model: gpt-4o, Max tokens: 1024`);

    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: openaiMessages
      });
      console.log('[AI Coach] OpenAI response received successfully');
      console.log(`[AI Coach] Response ID: ${response.id}`);
      console.log(`[AI Coach] Tokens used - Prompt: ${response.usage?.prompt_tokens}, Completion: ${response.usage?.completion_tokens}`);
    } catch (openaiError: any) {
      console.error('[AI Coach] OpenAI API Error:', openaiError.message);
      console.error('[AI Coach] OpenAI Error Details:', JSON.stringify({
        status: openaiError.status,
        code: openaiError.code,
        type: openaiError.type
      }));
      throw openaiError;
    }

    const assistantContent = response.choices[0]?.message?.content
      || 'I apologize, but I encountered an issue generating a response.';
    console.log(`[AI Coach] Response content length: ${assistantContent.length} characters`);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString()
    };
    conversationHistory.push(assistantMessage);

    const { error: updateError } = await supabase
      .from('ai_coaching_sessions')
      .update({
        messages: conversationHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSession.id);

    if (updateError) {
      console.error('[AI Coach] Error updating session:', updateError.message);
    }

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
      if (assistantContent.toLowerCase().includes('teamfight') || assistantContent.toLowerCase().includes('positioning')) {
        topicKeywords.push('teamfight', 'position', 'fight');
      }
      if (assistantContent.toLowerCase().includes('wave') || assistantContent.toLowerCase().includes('lane')) {
        topicKeywords.push('wave', 'lane', 'trading');
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

          for (const rec of videoRecommendations) {
            await supabase
              .from('coaching_content_recommendations')
              .insert({
                session_id: currentSession.id,
                content_id: rec.content_id,
                reason: rec.reason,
                was_watched: false
              });
          }
        }
      }
    }

    console.log('[AI Coach] ========== REQUEST COMPLETE ==========');
    console.log(`[AI Coach] Session: ${currentSession.id}`);
    console.log(`[AI Coach] Video recommendations: ${videoRecommendations.length}`);
    console.log(`[AI Coach] Tokens used: ${response.usage?.completion_tokens || 0}`);

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
    console.error('[AI Coach] ========== FATAL ERROR ==========');
    console.error('[AI Coach] Error name:', error.name);
    console.error('[AI Coach] Error message:', error.message);
    console.error('[AI Coach] Error stack:', error.stack);
    if (error.cause) {
      console.error('[AI Coach] Error cause:', error.cause);
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        debug: {
          errorName: error.name,
          errorMessage: error.message
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});