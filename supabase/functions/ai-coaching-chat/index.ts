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
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: CoachingRequest = await req.json();
    const { session_id, message, game_id, game_name, performance_context } = requestData;

    if (!message || !game_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message and game_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI Coach] Processing request for user ${user.id}, game: ${game_name}`);

    const topicDetection = detectTopics(message);
    console.log(`[AI Coach] Detected topics: ${topicDetection.topics.join(', ')} | Primary: ${topicDetection.primaryCategory}`);

    const [apiConfigResult, aiConfig] = await Promise.all([
      supabase
        .from('platform_api_integrations')
        .select('api_key')
        .eq('api_name', 'OpenAI API')
        .eq('is_active', true)
        .maybeSingle(),
      loadAIConfig(supabase, game_id)
    ]);

    if (apiConfigResult.error || !apiConfigResult.data?.api_key) {
      console.error('[AI Coach] OpenAI API key not configured:', apiConfigResult.error?.message);
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

    console.log(`[AI Coach] Sending request to OpenAI with ${openaiMessages.length - 1} conversation messages`);

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

    console.log(`[AI Coach] Response generated successfully for session ${currentSession.id}`);

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

  } catch (error) {
    console.error('[AI Coach] Error:', error.message, error.stack);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});