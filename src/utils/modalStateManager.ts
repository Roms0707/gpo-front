/**
 * Utility functions for managing modal state during Discord OAuth flow
 */

interface ModalState {
  tournamentId: string;
  teamId?: string | null;
  teamName?: string;
  fromDiscordOAuth: boolean;
  timestamp: number;
}

const MODAL_STATE_KEY = 'tournament_registration_modal_state';
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export const modalStateManager = {
  /**
   * Save modal state before redirecting to Discord OAuth
   */
  saveModalState(state: Omit<ModalState, 'fromDiscordOAuth' | 'timestamp'>): void {
    try {
      const stateToSave: ModalState = {
        ...state,
        fromDiscordOAuth: true,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(MODAL_STATE_KEY, JSON.stringify(stateToSave));
      console.log('[ModalStateManager] Modal state saved:', stateToSave);
    } catch (error) {
      console.error('[ModalStateManager] Error saving modal state:', error);
    }
  },

  /**
   * Retrieve and clear modal state after OAuth return
   */
  getAndClearModalState(): ModalState | null {
    try {
      const savedState = sessionStorage.getItem(MODAL_STATE_KEY);
      if (!savedState) {
        return null;
      }

      const state: ModalState = JSON.parse(savedState);

      // Check if state has expired
      if (Date.now() - state.timestamp > STATE_EXPIRY_MS) {
        console.log('[ModalStateManager] Modal state expired');
        sessionStorage.removeItem(MODAL_STATE_KEY);
        return null;
      }

      // Clear the state from storage
      sessionStorage.removeItem(MODAL_STATE_KEY);
      console.log('[ModalStateManager] Modal state retrieved and cleared:', state);

      return state;
    } catch (error) {
      console.error('[ModalStateManager] Error retrieving modal state:', error);
      return null;
    }
  },

  /**
   * Check if there's a saved modal state without clearing it
   */
  hasSavedState(): boolean {
    try {
      const savedState = sessionStorage.getItem(MODAL_STATE_KEY);
      if (!savedState) {
        return false;
      }

      const state: ModalState = JSON.parse(savedState);

      // Check if state has expired
      if (Date.now() - state.timestamp > STATE_EXPIRY_MS) {
        sessionStorage.removeItem(MODAL_STATE_KEY);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[ModalStateManager] Error checking saved state:', error);
      return false;
    }
  },

  /**
   * Clear modal state (useful for cleanup)
   */
  clearModalState(): void {
    try {
      sessionStorage.removeItem(MODAL_STATE_KEY);
      console.log('[ModalStateManager] Modal state cleared');
    } catch (error) {
      console.error('[ModalStateManager] Error clearing modal state:', error);
    }
  },
};
