/**
 * Google Drive Sync Service
 * 
 * Implements Google Drive integration for MoneyMind backups.
 * 
 * SETUP REQUIRED FOR PRODUCTION:
 * 1. Create Google Cloud Project: https://console.cloud.google.com
 * 2. Enable Google Drive API
 * 3. Create OAuth 2.0 Client ID (Web application)
 * 4. Set Authorized redirect URIs:
 *    - http://localhost:5173 (dev)
 *    - https://yourdomain.com (production)
 * 5. Set REACT_APP_GOOGLE_CLIENT_ID in .env file
 */

import { Store } from "@/hooks/useStore";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

export interface GoogleDriveBackup {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  size: number;
}

/**
 * Get the stored Google Drive access token
 */
export const getGoogleAccessToken = (): string | null => {
  return localStorage.getItem("moneymind-google-access-token");
};

/**
 * Check if Google Drive is connected
 */
export const isGoogleDriveConnected = (): boolean => {
  return !!getGoogleAccessToken();
};

/**
 * Disconnect Google Drive (revoke token)
 */
export const disconnectGoogleDrive = (): void => {
  localStorage.removeItem("moneymind-google-access-token");
  localStorage.removeItem("moneymind-google-refresh-token");
  localStorage.removeItem("moneymind-google-expiry");
};

/**
 * Initiate Google OAuth flow
 * Note: In production, implement proper OAuth backend flow
 */
export const initiateGoogleAuth = (): void => {
  if (!GOOGLE_CLIENT_ID) {
    alert("❌ Google client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env");
    return;
  }

  const redirectUri = window.location.origin + "/auth/google/callback";
  const authUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  authUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", SCOPES.join(" "));
  authUrl.searchParams.append("access_type", "offline");
  authUrl.searchParams.append("prompt", "consent");

  window.location.href = authUrl.toString();
};

/**
 * Upload backup to Google Drive
 */
export const uploadBackupToGoogleDrive = async (
  store: Store,
  fileName: string
): Promise<GoogleDriveBackup> => {
  const accessToken = getGoogleAccessToken();
  if (!accessToken) {
    throw new Error("Google Drive not connected");
  }

  const metadata = {
    name: fileName,
    mimeType: "application/json",
    properties: {
      app: "moneymind",
      version: "2.0",
    },
  };

  const content = JSON.stringify(store);
  const multipartBody = `--boundary
Content-Type: application/json; charset=UTF-8

${JSON.stringify(metadata)}

--boundary
Content-Type: application/json

${content}

--boundary--`;

  try {
    const response = await fetch(`${GOOGLE_DRIVE_API}/files?uploadType=multipart`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/related; boundary=boundary",
      },
      body: multipartBody,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      name: result.name,
      createdTime: result.createdTime,
      modifiedTime: result.modifiedTime,
      size: result.size,
    };
  } catch (error) {
    console.error("Google Drive upload error:", error);
    throw error;
  }
};

/**
 * List all MoneyMind backups on Google Drive
 */
export const listGoogleDriveBackups = async (): Promise<GoogleDriveBackup[]> => {
  const accessToken = getGoogleAccessToken();
  if (!accessToken) {
    throw new Error("Google Drive not connected");
  }

  const query = encodeURIComponent(
    "properties has { key='app' and value='moneymind' } and trashed=false"
  );

  try {
    const response = await fetch(
      `${GOOGLE_DRIVE_API}/files?q=${query}&pageSize=50&orderBy=modifiedTime desc&fields=id,name,createdTime,modifiedTime,size`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`List failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files || [];
  } catch (error) {
    console.error("Google Drive list error:", error);
    throw error;
  }
};

/**
 * Download backup from Google Drive
 */
export const downloadFromGoogleDrive = async (fileId: string): Promise<Store> => {
  const accessToken = getGoogleAccessToken();
  if (!accessToken) {
    throw new Error("Google Drive not connected");
  }

  try {
    const response = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Google Drive download error:", error);
    throw error;
  }
};

/**
 * Delete backup from Google Drive
 */
export const deleteFromGoogleDrive = async (fileId: string): Promise<void> => {
  const accessToken = getGoogleAccessToken();
  if (!accessToken) {
    throw new Error("Google Drive not connected");
  }

  try {
    const response = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Google Drive delete error:", error);
    throw error;
  }
};

/**
 * IMPORTANT: For production deployment, implement this on your backend:
 * 
 * POST /api/auth/google/exchange-code
 * - Receives authorization code from OAuth flow
 * - Exchanges code for access token
 * - Returns access token + refresh token
 * - Stores securely (backend session/db)
 * 
 * This prevents exposing client credentials on frontend
 */
