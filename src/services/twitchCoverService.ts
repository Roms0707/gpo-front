const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const fetchTwitchGameCover = async (gameName: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/fetch-twitch-game-cover?game=${encodeURIComponent(gameName)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.success && data.coverUrl) {
      return data.coverUrl;
    }

    return null;
  } catch {
    return null;
  }
};
