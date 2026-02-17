/**
 * Development utility to clear expired tokens
 * Add this to your app for easy token management during development
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearExpiredTokens = async () => {
  try {
    console.log(' Clearing all auth tokens...');
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    console.log(' Tokens cleared successfully');
    return true;
  } catch (error) {
    console.error(' Error clearing tokens:', error);
    return false;
  }
};

export const checkStoredTokens = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    console.log(' Stored tokens:', {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });
    
    return { token, refreshToken };
  } catch (error) {
    console.error(' Error checking tokens:', error);
    return { token: null, refreshToken: null };
  }
};

export const debugTokenInfo = async () => {
  const tokens = await checkStoredTokens();
  
  if (tokens.token) {
    try {
      // Decode JWT (only the payload part, without verification)
      const parts = tokens.token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = payload.exp;
        const isExpired = now > expiresAt;
        
        console.log(' Token info:', {
          isExpired,
          expiresAt: new Date(expiresAt * 1000).toISOString(),
          currentTime: new Date(now * 1000).toISOString(),
          timeUntilExpiry: isExpired ? 'EXPIRED' : `${Math.floor((expiresAt - now) / 60)} minutes`,
          subject: payload.sub,
          roles: payload.roles
        });
        
        return { ...payload, isExpired };
      }
    } catch (error) {
      console.error(' Error decoding token:', error);
    }
  }
  
  return null;
};
