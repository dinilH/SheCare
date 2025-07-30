import { AuthConfig } from '@asgardeo/nextjs';

const config: AuthConfig = {
  clientID: process.env.ASGARDEO_CLIENT_ID || '',
  clientSecret: process.env.ASGARDEO_CLIENT_SECRET || '',
  baseUrl: process.env.ASGARDEO_BASE_URL || '',
  redirectUri: process.env.ASGARDEO_REDIRECT_URI || 'http://localhost:3000',
  postLogoutRedirectUri: process.env.ASGARDEO_POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000',
  scope: process.env.ASGARDEO_SCOPE?.split(' ') || ['openid', 'profile', 'email'],
  storage: 'sessionStorage', // or 'localStorage'
  resourceServerURLs: [],
  onSignIn: async (response) => {
    console.log('Sign in successful:', response);
  },
  onSignOut: async () => {
    console.log('Sign out successful');
  },
};

export default config;
