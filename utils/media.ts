import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';

/**
 * Capture a photo with consistent framing
 */
export async function captureGuidedSelfie(
  cameraRef: React.RefObject<Camera>
): Promise<string | null> {
  try {
    if (!cameraRef.current) {
      throw new Error('Camera ref not available');
    }

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      base64: false,
    });

    if (!photo) {
      return null;
    }

    // Save to media library
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (permission.granted) {
      await MediaLibrary.createAssetAsync(photo.uri);
    }

    return photo.uri;
  } catch (error) {
    console.error('Error capturing photo:', error);
    return null;
  }
}

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    return false;
  }
}

/**
 * Get aligned photo URI for consistent framing
 */
export function getAlignedPhotoUri(originalUri: string): string {
  // In a real implementation, this would apply alignment/rotation
  // For now, return the original URI
  return originalUri;
}

