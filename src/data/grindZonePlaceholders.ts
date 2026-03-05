import { GrindPlaylist, GrindVideo, GrindQuizQuestion, FeaturedGrindSlide } from '../types/grindZone';

const PLACEHOLDER_COVERS = {
  lol: [
    'https://images.pexels.com/photos/7915498/pexels-photo-7915498.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
    'https://images.pexels.com/photos/7862657/pexels-photo-7862657.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
    'https://images.pexels.com/photos/9072388/pexels-photo-9072388.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
    'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
  ],
  valorant: [
    'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
    'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
    'https://images.pexels.com/photos/7862657/pexels-photo-7862657.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
    'https://images.pexels.com/photos/9072388/pexels-photo-9072388.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
  ],
  default: [
    'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
    'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
    'https://images.pexels.com/photos/7915498/pexels-photo-7915498.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
    'https://images.pexels.com/photos/9072388/pexels-photo-9072388.jpeg?auto=compress&cs=tinysrgb&w=390&h=520&fit=crop',
  ],
};

const THUMBNAIL = 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=300';

const VIDEO_TITLES = {
  lol: [
    ['Wave Management Basics', 'Trading Patterns', 'Freeze & Slow Push', 'Recall Timing', 'Lane Priority'],
    ['Efficient Clear Routes', 'Gank Timing Windows', 'Objective Sequencing', 'Counter Jungling'],
    ['Spacing in Fights', 'Target Selection', 'Cooldown Tracking', 'Flanking Setups', 'Cleanup Positioning'],
    ['Ward Placement Guide', 'Sweeper Patterns', 'Information Plays', 'Map Rotations'],
  ],
  valorant: [
    ['Pre-aim Fundamentals', 'Headshot Angles', 'Peeking Techniques', 'Spray Transfer', 'Flick Training'],
    ['Smoke Lineups', 'Flash Timings', 'Utility Combos', 'Agent Synergy'],
    ['Eco Round Strategy', 'Force Buy Decisions', 'Save Round Discipline', 'Team Economy'],
    ['A Site Executes', 'B Site Executes', 'Mid Control Strats', 'Retake Setups', 'Post-plant Plays'],
  ],
  default: [
    ['Core Mechanics', 'Movement Basics', 'Resource Management', 'First Steps'],
    ['Advanced Combos', 'Positioning Guide', 'Timing Windows', 'Counter Strategies', 'Meta Analysis'],
    ['Ranked Mindset', 'VOD Review Guide', 'Pro Strats Breakdown', 'Tournament Prep'],
  ],
};

const GAME_PLAYLISTS: Record<string, Omit<GrindPlaylist, 'id' | 'game_id'>[]> = {
  _lol: [
    {
      title: 'Lane Control Fundamentals',
      description: 'Master the basics of wave management, trading patterns, and lane dominance.',
      cover_image_url: PLACEHOLDER_COVERS.lol[0],
      difficulty: 'beginner',
      category: 'Laning',
      game_name: 'League of Legends',
      video_count: 5,
      estimated_duration_minutes: 42,
      sort_order: 1,
      tags: ['wave management', 'trading', 'laning'],
      preview_videos: VIDEO_TITLES.lol[0].map(t => ({ title: t })),
    },
    {
      title: 'Jungle Pathing Mastery',
      description: 'Learn efficient jungle routes, gank timing, and objective control.',
      cover_image_url: PLACEHOLDER_COVERS.lol[1],
      difficulty: 'intermediate',
      category: 'Jungle',
      game_name: 'League of Legends',
      video_count: 4,
      estimated_duration_minutes: 38,
      sort_order: 2,
      tags: ['jungle', 'pathing', 'ganking'],
      preview_videos: VIDEO_TITLES.lol[1].map(t => ({ title: t })),
    },
    {
      title: 'Teamfight Positioning',
      description: 'Elevate your teamfight impact through spacing, target selection, and cooldown management.',
      cover_image_url: PLACEHOLDER_COVERS.lol[2],
      difficulty: 'advanced',
      category: 'Teamfighting',
      game_name: 'League of Legends',
      video_count: 5,
      estimated_duration_minutes: 55,
      sort_order: 3,
      tags: ['teamfight', 'positioning', 'macro'],
      preview_videos: VIDEO_TITLES.lol[2].map(t => ({ title: t })),
    },
    {
      title: 'Vision & Map Awareness',
      description: 'Control the map through deep wards, sweeping patterns, and information-based plays.',
      cover_image_url: PLACEHOLDER_COVERS.lol[3],
      difficulty: 'beginner',
      category: 'Macro',
      game_name: 'League of Legends',
      video_count: 4,
      estimated_duration_minutes: 30,
      sort_order: 4,
      tags: ['vision', 'wards', 'map awareness'],
      preview_videos: VIDEO_TITLES.lol[3].map(t => ({ title: t })),
    },
  ],
  _valorant: [
    {
      title: 'Crosshair Placement Mastery',
      description: 'Train your aim fundamentals with pre-aiming, headshot angles, and peeking techniques.',
      cover_image_url: PLACEHOLDER_COVERS.valorant[0],
      difficulty: 'beginner',
      category: 'Aim',
      game_name: 'Valorant',
      video_count: 5,
      estimated_duration_minutes: 35,
      sort_order: 1,
      tags: ['aim', 'crosshair', 'peeking'],
      preview_videos: VIDEO_TITLES.valorant[0].map(t => ({ title: t })),
    },
    {
      title: 'Agent Utility Deep Dive',
      description: 'Maximize agent impact with lineups, timing, and synergy combos.',
      cover_image_url: PLACEHOLDER_COVERS.valorant[1],
      difficulty: 'intermediate',
      category: 'Utility',
      game_name: 'Valorant',
      video_count: 4,
      estimated_duration_minutes: 40,
      sort_order: 2,
      tags: ['utility', 'lineups', 'agents'],
      preview_videos: VIDEO_TITLES.valorant[1].map(t => ({ title: t })),
    },
    {
      title: 'Economy & Buy Rounds',
      description: 'Understand eco fundamentals, force-buy scenarios, and team economy management.',
      cover_image_url: PLACEHOLDER_COVERS.valorant[2],
      difficulty: 'beginner',
      category: 'Economy',
      game_name: 'Valorant',
      video_count: 4,
      estimated_duration_minutes: 28,
      sort_order: 3,
      tags: ['economy', 'buying', 'strategy'],
      preview_videos: VIDEO_TITLES.valorant[2].map(t => ({ title: t })),
    },
    {
      title: 'Advanced Site Executes',
      description: 'Coordinate team pushes with smokes, flashes, and trade fragging.',
      cover_image_url: PLACEHOLDER_COVERS.valorant[3],
      difficulty: 'advanced',
      category: 'Strategy',
      game_name: 'Valorant',
      video_count: 5,
      estimated_duration_minutes: 50,
      sort_order: 4,
      tags: ['executes', 'strategy', 'coordination'],
      preview_videos: VIDEO_TITLES.valorant[3].map(t => ({ title: t })),
    },
  ],
  _default: [
    {
      title: 'Getting Started',
      description: 'Learn the core mechanics and fundamentals to build a solid foundation.',
      cover_image_url: PLACEHOLDER_COVERS.default[0],
      difficulty: 'beginner',
      category: 'Basics',
      video_count: 4,
      estimated_duration_minutes: 30,
      sort_order: 1,
      tags: ['basics', 'fundamentals', 'intro'],
      preview_videos: VIDEO_TITLES.default[0].map(t => ({ title: t })),
    },
    {
      title: 'Intermediate Techniques',
      description: 'Step up your game with advanced techniques and deeper strategies.',
      cover_image_url: PLACEHOLDER_COVERS.default[1],
      difficulty: 'intermediate',
      category: 'Techniques',
      video_count: 5,
      estimated_duration_minutes: 45,
      sort_order: 2,
      tags: ['techniques', 'strategy', 'improvement'],
      preview_videos: VIDEO_TITLES.default[1].map(t => ({ title: t })),
    },
    {
      title: 'Competitive Edge',
      description: 'Sharpen your competitive play with pro-level insights and match analysis.',
      cover_image_url: PLACEHOLDER_COVERS.default[2],
      difficulty: 'advanced',
      category: 'Competitive',
      video_count: 4,
      estimated_duration_minutes: 40,
      sort_order: 3,
      tags: ['competitive', 'pro', 'analysis'],
      preview_videos: VIDEO_TITLES.default[2].map(t => ({ title: t })),
    },
  ],
};

function getPlaylistsForGame(gameName: string): Omit<GrindPlaylist, 'id' | 'game_id'>[] {
  const normalized = gameName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.includes('league') || normalized.includes('lol')) return GAME_PLAYLISTS._lol;
  if (normalized.includes('valorant') || normalized.includes('valo')) return GAME_PLAYLISTS._valorant;
  return GAME_PLAYLISTS._default;
}

export function getMockPlaylists(gameId: string, gameName: string): GrindPlaylist[] {
  const templates = getPlaylistsForGame(gameName);
  return templates.map((template, i) => ({
    ...template,
    id: `grind-playlist-${gameId}-${i}`,
    game_id: gameId,
  }));
}

export function getMockFeaturedSlides(): FeaturedGrindSlide[] {
  return [
    {
      id: 'featured-1',
      playlist_id: 'grind-playlist-lol-0',
      title: 'MASTER\nLANE CONTROL',
      subtitle: 'Wave management, trading, and lane dominance',
      category: 'Laning Courses',
      game_name: 'League of Legends',
      cover_image_url: PLACEHOLDER_COVERS.lol[0],
      is_new: true,
    },
    {
      id: 'featured-2',
      playlist_id: 'grind-playlist-val-0',
      title: 'PERFECT\nYOUR AIM',
      subtitle: 'Pre-aim, headshot angles, and peeking techniques',
      category: 'Aim Training',
      game_name: 'Valorant',
      cover_image_url: PLACEHOLDER_COVERS.valorant[0],
      is_new: true,
    },
    {
      id: 'featured-3',
      playlist_id: 'grind-playlist-lol-2',
      title: 'DOMINATE\nTEAMFIGHTS',
      subtitle: 'Spacing, target selection, and cooldown management',
      category: 'Teamfight Academy',
      game_name: 'League of Legends',
      cover_image_url: PLACEHOLDER_COVERS.lol[2],
    },
    {
      id: 'featured-4',
      playlist_id: 'grind-playlist-val-3',
      title: 'EXECUTE\nEVERY SITE',
      subtitle: 'Smokes, flashes, and coordinated team pushes',
      category: 'Strategy Courses',
      game_name: 'Valorant',
      cover_image_url: PLACEHOLDER_COVERS.valorant[3],
    },
    {
      id: 'featured-5',
      playlist_id: 'grind-playlist-lol-1',
      title: 'JUNGLE\nPATHING PRO',
      subtitle: 'Efficient routes, gank timing, and objective control',
      category: 'Jungle Mastery',
      game_name: 'League of Legends',
      cover_image_url: PLACEHOLDER_COVERS.lol[1],
    },
  ];
}

export function getMockVideos(playlistId: string, videoCount: number): GrindVideo[] {
  const titles = [
    'Introduction & Mindset',
    'Core Mechanics Breakdown',
    'Practice Drills',
    'Live Analysis & Examples',
    'Advanced Tips & Summary',
  ];

  return Array.from({ length: videoCount }, (_, i) => ({
    id: `grind-video-${playlistId}-${i}`,
    playlist_id: playlistId,
    position: i + 1,
    title: titles[i] || `Lesson ${i + 1}`,
    description: `Part ${i + 1} of this training playlist.`,
    thumbnail_url: THUMBNAIL,
    streaming_url: '',
    duration_seconds: 300 + Math.floor(Math.random() * 300),
  }));
}

export function getMockQuizQuestions(playlistId: string): GrindQuizQuestion[] {
  const questions: Omit<GrindQuizQuestion, 'id' | 'playlist_id'>[] = [
    {
      question_text: 'What is the primary goal of the techniques covered in this playlist?',
      choices: ['Increase speed only', 'Build consistent fundamentals', 'Learn advanced tricks', 'Memorize patterns'],
      correct_index: 1,
      explanation: 'Building consistent fundamentals is the foundation that all higher-level play depends on.',
    },
    {
      question_text: 'Which approach is recommended for practice sessions?',
      choices: ['Long sessions once a week', 'Short daily focused sessions', 'Only play ranked matches', 'Watch replays only'],
      correct_index: 1,
      explanation: 'Short, focused daily sessions build muscle memory and consistency better than infrequent long sessions.',
    },
    {
      question_text: 'What should you prioritize during live matches?',
      choices: ['Flashy plays', 'Consistent decision making', 'Copying pro players exactly', 'Aggressive plays only'],
      correct_index: 1,
      explanation: 'Consistent decision making leads to more reliable results and steady improvement over time.',
    },
    {
      question_text: 'How should you handle mistakes during gameplay?',
      choices: ['Ignore them', 'Get frustrated and reset', 'Note them and review after the match', 'Blame teammates'],
      correct_index: 2,
      explanation: 'Noting mistakes and reviewing them post-match turns every game into a learning opportunity.',
    },
    {
      question_text: 'What is the best way to track your improvement?',
      choices: ['Only check rank', 'Record and compare key metrics over time', 'Count wins only', 'Ask others to rate you'],
      correct_index: 1,
      explanation: 'Tracking key metrics over time gives objective evidence of improvement beyond just win/loss.',
    },
  ];

  return questions.map((q, i) => ({
    ...q,
    id: `grind-quiz-${playlistId}-${i}`,
    playlist_id: playlistId,
  }));
}
