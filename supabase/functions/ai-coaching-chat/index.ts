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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const buildLoLSystemPrompt = (performanceContext: any, gameName: string): string => {
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

${contextSection}

## Important Guidelines:
- Keep responses concise but helpful (2-4 paragraphs typically)
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

    const { data: apiConfig, error: configError } = await supabase
      .from('platform_api_integrations')
      .select('api_key')
      .eq('api_name', 'OpenAI API')
      .eq('is_active', true)
      .maybeSingle();

    if (configError || !apiConfig?.api_key) {
      console.error('[AI Coach] OpenAI API key not configured:', configError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({ apiKey: apiConfig.api_key });

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

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    conversationHistory.push(userMessage);

    const systemPrompt = buildLoLSystemPrompt(
      currentSession.performance_context || performance_context,
      game_name || 'League of Legends'
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
        tokens_used: response.usage?.completion_tokens || 0
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