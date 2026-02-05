// Re-export all authentication functionality from focused services
export { loginUser, type LoginCredentials, type AuthResult } from './loginService';
export { signupUser, type SignupData } from './signupService';
export { logoutUser } from './logoutService';

// Re-export common types for backwards compatibility
export type { AuthResult as AuthServiceResult } from './loginService';