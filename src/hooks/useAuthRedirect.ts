import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';

interface LocationState {
  from?: {
    pathname: string;
  };
}

interface UseAuthRedirectProps {
  user: User | null;
  isLoading: boolean;
}

export const useAuthRedirect = ({ user, isLoading }: UseAuthRedirectProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get query params
  const params = new URLSearchParams(location.search);
  const redirectPath = params.get('redirect');
  const teamId = params.get('teamId');

  useEffect(() => {
    if (user && !isLoading) {
      console.log('User is logged in, redirecting...');
      const locationState = location.state as LocationState;
      
      // Handle team invitation flow
      if (teamId && redirectPath) {
        const fullRedirectUrl = `${decodeURIComponent(redirectPath)}?teamId=${teamId}`;
        console.log('Redirecting to team invitation:', fullRedirectUrl);
        navigate(fullRedirectUrl, { replace: true });
      } else if (redirectPath) {
        const from = decodeURIComponent(redirectPath);
        console.log('Redirecting to:', from);
        navigate(from, { replace: true });
      } else {
        const from = locationState?.from?.pathname || '/';
        console.log('Redirecting to home or from:', from);
        navigate(from, { replace: true });
      }
    }
  }, [user, isLoading, navigate, redirectPath, teamId, location.state]);

  return {
    redirectPath,
    teamId,
    shouldShowLoadingSpinner: user && !isLoading
  };
};