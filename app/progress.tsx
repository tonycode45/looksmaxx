import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '@/config/theme';
import { strings } from '@/config/strings';
import { useStore } from '@/state/useStore';
import { Badge } from '@/components/Badge';
import { groupScansByWeek, composeTimelapse } from '@/utils/timelapse';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ProgressScreen() {
  const { scans, badges, refreshScans } = useStore();
  const [composingTimelapse, setComposingTimelapse] = useState(false);
  const weekMap = groupScansByWeek(scans);

  const handlePlayTimelapse = async () => {
    if (scans.length < 2) {
      Alert.alert('Not Enough Scans', 'You need at least 2 scans to create a timelapse.');
      return;
    }

    setComposingTimelapse(true);
    try {
      const timelapseUri = await composeTimelapse(scans);
      if (timelapseUri) {
        // For now, just show the first photo
        // In a real implementation, you'd play the video
        Alert.alert('Timelapse', 'Timelapse created! (Note: Full video composition not yet implemented)');
      }
    } catch (error) {
      console.error('Error creating timelapse:', error);
      Alert.alert('Error', 'Failed to create timelapse.');
    } finally {
      setComposingTimelapse(false);
    }
  };

  const handleExportTimelapse = async () => {
    if (scans.length < 2) {
      Alert.alert('Not Enough Scans', 'You need at least 2 scans to export a timelapse.');
      return;
    }

    try {
      const timelapseUri = await composeTimelapse(scans);
      if (timelapseUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(timelapseUri);
      } else {
        Alert.alert('Export Not Available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error exporting timelapse:', error);
      Alert.alert('Error', 'Failed to export timelapse.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        {scans.length === 0 ? (
          <Text style={styles.emptyText}>{strings.progress.noScans}</Text>
        ) : (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{scans.length}</Text>
                <Text style={styles.statLabel}>Total Scans</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{weekMap.size}</Text>
                <Text style={styles.statLabel}>Weeks</Text>
              </View>
            </View>

            {scans.length >= 2 && (
              <View style={styles.timelapseSection}>
                <TouchableOpacity
                  style={styles.timelapseButton}
                  onPress={handlePlayTimelapse}
                  disabled={composingTimelapse}
                >
                  {composingTimelapse ? (
                    <ActivityIndicator size="small" color={theme.colors.background} />
                  ) : (
                    <Text style={styles.timelapseButtonText}>{strings.progress.playTimelapse}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timelapseButton, styles.timelapseButtonSecondary]}
                  onPress={handleExportTimelapse}
                >
                  <Text style={[styles.timelapseButtonText, styles.timelapseButtonTextSecondary]}>
                    Export Timelapse
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scan History</Text>
        {Array.from(weekMap.entries()).map(([weekKey, weekScans]) => {
          const weekStart = new Date(weekKey);
          return (
            <View key={weekKey} style={styles.weekGroup}>
              <Text style={styles.weekTitle}>
                {strings.progress.weekOf} {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <View style={styles.scanGrid}>
                {weekScans.map((scan) => (
                  <View key={scan.id} style={styles.scanCard}>
                    {scan.photo_uri ? (
                      <Image source={{ uri: scan.photo_uri }} style={styles.scanImage} />
                    ) : (
                      <View style={styles.scanImagePlaceholder}>
                        <Text style={styles.scanImagePlaceholderText}>No Photo</Text>
                      </View>
                    )}
                    <Text style={styles.scanScore}>{scan.score}</Text>
                    <Text style={styles.scanDate}>
                      {new Date(scan.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges</Text>
        {badges.length === 0 ? (
          <Text style={styles.emptyText}>No badges yet. Keep scanning to earn badges!</Text>
        ) : (
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <Badge key={badge.id} title={badge.title} earnedAt={badge.earned_at} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  timelapseSection: {
    marginTop: theme.spacing.md,
  },
  timelapseButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  timelapseButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  timelapseButtonText: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.background,
  },
  timelapseButtonTextSecondary: {
    color: theme.colors.primary,
  },
  weekGroup: {
    marginBottom: theme.spacing.lg,
  },
  weekTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  scanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  scanCard: {
    width: 100,
    marginBottom: theme.spacing.md,
  },
  scanImage: {
    width: 100,
    height: 120,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.border,
  },
  scanImagePlaceholder: {
    width: 100,
    height: 120,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanImagePlaceholderText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  scanScore: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  scanDate: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
});

