import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as AV from 'expo-av';
import type { Scan } from '@/state/db';

/**
 * Compose a timelapse video from scan photos
 */
export async function composeTimelapse(scans: Scan[]): Promise<string | null> {
  try {
    // Filter scans with photos
    const scansWithPhotos = scans.filter((scan) => scan.photo_uri);

    if (scansWithPhotos.length < 2) {
      console.warn('Need at least 2 scans with photos to create timelapse');
      return null;
    }

    // Sort by date
    scansWithPhotos.sort((a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime());

    // For now, return the first photo URI as a placeholder
    // In a real implementation, you would:
    // 1. Load all images
    // 2. Resize/align them to consistent dimensions
    // 3. Use a video encoding library (like expo-av or a native module)
    // 4. Compose frames into an MP4
    // 5. Save and return the video URI

    // TODO: Implement actual video composition
    // This would require a native module or a more sophisticated approach
    console.warn('Timelapse composition not fully implemented - returning placeholder');

    return scansWithPhotos[0]?.photo_uri || null;
  } catch (error) {
    console.error('Error composing timelapse:', error);
    return null;
  }
}

/**
 * Group scans by week
 */
export function groupScansByWeek(scans: Scan[]): Map<string, Scan[]> {
  const weekMap = new Map<string, Scan[]>();

  for (const scan of scans) {
    const date = new Date(scan.taken_at);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(scan);
  }

  return weekMap;
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // Reset time to midnight for consistent grouping
  return d;
}

