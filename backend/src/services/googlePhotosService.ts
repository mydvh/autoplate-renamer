import axios from 'axios';

interface GooglePhotosToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface MediaItem {
  id: string;
  description?: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  mediaMetadata?: {
    creationTime: string;
    width: string;
    height: string;
  };
}

const GOOGLE_PHOTOS_API_BASE = 'https://photoslibrary.googleapis.com/v1';
const GOOGLE_OAUTH_ENDPOINT = 'https://oauth2.googleapis.com';

export const googlePhotosService = {
  /**
   * Generate Google OAuth authorization URL
   */
  getAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    state: string
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
      state: state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<GooglePhotosToken> {
    try {
      const response = await axios.post<GooglePhotosToken>(
        `${GOOGLE_OAUTH_ENDPOINT}/token`,
        {
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw new Error('Failed to authenticate with Google Photos');
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<GooglePhotosToken> {
    try {
      const response = await axios.post<GooglePhotosToken>(
        `${GOOGLE_OAUTH_ENDPOINT}/token`,
        {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh Google Photos authentication');
    }
  },

  /**
   * Get list of media items from Google Photos
   */
  async getMediaItems(
    accessToken: string,
    pageSize: number = 50,
    pageToken?: string
  ): Promise<{ items: MediaItem[]; nextPageToken?: string }> {
    try {
      const response = await axios.post(
        `${GOOGLE_PHOTOS_API_BASE}/mediaItems:search`,
        {
          pageSize: pageSize,
          pageToken: pageToken,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        items: response.data.mediaItems || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error('Failed to fetch media items:', error);
      throw new Error('Failed to fetch photos from Google Photos');
    }
  },

  /**
   * Get media items from a specific album
   */
  async getAlbumMediaItems(
    accessToken: string,
    albumId: string,
    pageSize: number = 50,
    pageToken?: string
  ): Promise<{ items: MediaItem[]; nextPageToken?: string }> {
    try {
      const response = await axios.post(
        `${GOOGLE_PHOTOS_API_BASE}/mediaItems:search`,
        {
          albumId: albumId,
          pageSize: pageSize,
          pageToken: pageToken,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        items: response.data.mediaItems || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error('Failed to fetch album media items:', error);
      throw new Error('Failed to fetch album photos from Google Photos');
    }
  },

  /**
   * Get list of user's albums
   */
  async getAlbums(
    accessToken: string,
    pageSize: number = 50,
    pageToken?: string
  ): Promise<{ albums: any[]; nextPageToken?: string }> {
    try {
      const response = await axios.get(
        `${GOOGLE_PHOTOS_API_BASE}/albums`,
        {
          params: {
            pageSize: pageSize,
            pageToken: pageToken,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        albums: response.data.albums || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error('Failed to fetch albums:', error);
      throw new Error('Failed to fetch albums from Google Photos');
    }
  },

  /**
   * Download image from Google Photos URL
   */
  async downloadMediaItem(mediaItem: MediaItem): Promise<Buffer> {
    try {
      // Google Photos API returns base URLs that need parameters
      const imageUrl = `${mediaItem.baseUrl}=d`;
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Failed to download media item:', error);
      throw new Error('Failed to download photo from Google Photos');
    }
  },

  /**
   * Check if access token is expired
   */
  isTokenExpired(expiresAt: number): boolean {
    // Add 5 minute buffer before expiration
    return Date.now() > expiresAt - 5 * 60 * 1000;
  },

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await axios.post(
        `${GOOGLE_OAUTH_ENDPOINT}/revoke`,
        { token: accessToken }
      );
    } catch (error) {
      console.error('Failed to revoke token:', error);
      throw new Error('Failed to disconnect Google Photos');
    }
  },
};
