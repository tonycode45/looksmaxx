import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '@/config/theme';
import { strings } from '@/config/strings';
import { useStore } from '@/state/useStore';
import { ScoreRing } from '@/components/ScoreRing';
import { ActionCard } from '@/components/ActionCard';
import { extractLandmarks } from '@/ml/landmark';
import { computeScores } from '@/ml/scoring';
import { generateActions } from '@/ml/tips';
import * as MediaLibrary from 'expo-media-library';
import * as db from '@/state/db';

export default function HomeScreen() {
  const { currentScan, planItems, addScan, updatePlanItemStatus, isLoading, loadPlanItems } = useStore();
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handleScan = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Please grant camera permission to scan.');
        return;
      }
    }

    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    setIsScanning(true);
    setAnalyzing(true);

    try {
      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      const photoUri = photo.uri;

      // Save to media library
      try {
        const mediaPermission = await MediaLibrary.requestPermissionsAsync();
        if (mediaPermission.granted) {
          await MediaLibrary.createAssetAsync(photoUri);
        }
      } catch (error) {
        console.warn('Failed to save to media library:', error);
      }

      // Extract landmarks (stubbed/fake)
      const landmarks = await extractLandmarks(photoUri);

      // Compute scores
      const scoreResult = computeScores(landmarks);

      // Generate actions
      const actions = generateActions(scoreResult);

      // Create actions in DB
      const actionIds: number[] = [];
      for (const action of actions) {
        const actionId = await db.createAction(action);
        actionIds.push(actionId);
      }

      // Create scan
      const scanData = {
        taken_at: new Date().toISOString(),
        score: scoreResult.score,
        subs_posture: scoreResult.subscores.posture,
        subs_symmetry: scoreResult.subscores.symmetry,
        subs_skin: scoreResult.subscores.skin,
        subs_hair: scoreResult.subscores.hair,
        photo_uri: photoUri,
      };

      await addScan(scanData);

      // Get the created scan to create plan items
      // Use getLatestScan to ensure we have the scan with the correct ID
      const latestScan = await db.getLatestScan();
      if (latestScan) {
        for (const actionId of actionIds) {
          await db.createPlanItem({
            scan_id: latestScan.id,
            action_id: actionId,
            status: 'todo',
          });
        }
        // Reload plan items to update the store
        await loadPlanItems(latestScan.id);
      }

      setShowCamera(false);
      setIsScanning(false);
      setAnalyzing(false);
    } catch (error) {
      console.error('Error during scan:', error);
      Alert.alert('Error', 'Failed to complete scan. Please try again.');
      setShowCamera(false);
      setIsScanning(false);
      setAnalyzing(false);
    }
  };

  const handleActionToggle = async (planItemId: number, currentStatus: 'todo' | 'done') => {
    const newStatus = currentStatus === 'todo' ? 'done' : 'todo';
    await updatePlanItemStatus(planItemId, newStatus);
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        >
          <View style={styles.cameraOverlay}>
            {analyzing ? (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.analyzingText}>Analyzing...</Text>
              </View>
            ) : (
              <>
                <View style={styles.guideFrameContainer}>
                  <View style={styles.guideFrame} />
                </View>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                  disabled={isScanning}
                >
                  <Text style={styles.captureButtonText}>
                    {isScanning ? 'Capturing...' : strings.cta.scan}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : currentScan ? (
        <>
          <View style={styles.scoreSection}>
            <Text style={styles.sectionTitle}>{strings.score.header}</Text>
            <ScoreRing score={currentScan.score} />
            <View style={styles.subscores}>
              <View style={styles.subscore}>
                <Text style={styles.subscoreLabel}>{strings.score.posture}</Text>
                <Text style={styles.subscoreValue}>{currentScan.subs_posture}</Text>
              </View>
              <View style={styles.subscore}>
                <Text style={styles.subscoreLabel}>{strings.score.symmetry}</Text>
                <Text style={styles.subscoreValue}>{currentScan.subs_symmetry}</Text>
              </View>
              <View style={styles.subscore}>
                <Text style={styles.subscoreLabel}>{strings.score.skin}</Text>
                <Text style={styles.subscoreValue}>{currentScan.subs_skin}</Text>
              </View>
              <View style={styles.subscore}>
                <Text style={styles.subscoreLabel}>{strings.score.hair}</Text>
                <Text style={styles.subscoreValue}>{currentScan.subs_hair}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Today's Actions</Text>
            {planItems.length === 0 ? (
              <Text style={styles.emptyText}>No actions yet. Start a new scan!</Text>
            ) : (
              planItems.map((item) => (
                <ActionCard
                  key={item.id}
                  title={item.action.title}
                  tip={item.action.tip_md}
                  minutes={item.action.minutes}
                  status={item.status}
                  onPress={() => handleActionToggle(item.id, item.status)}
                />
              ))
            )}
          </View>

          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            <Text style={styles.scanButtonText}>New Scan</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Welcome to MirrorMe</Text>
          <Text style={styles.emptyStateText}>
            Start your first scan to get personalized looksmax tips!
          </Text>
          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            <Text style={styles.scanButtonText}>{strings.cta.scan}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  subscores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  subscore: {
    alignItems: 'center',
    margin: theme.spacing.sm,
    minWidth: 80,
  },
  subscoreLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  subscoreValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  actionsSection: {
    marginBottom: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  scanButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  scanButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.background,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyStateTitle: {
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrameContainer: {
    position: 'absolute',
    width: '80%',
    maxWidth: 400,
    aspectRatio: 0.75, // 4:3 ratio
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
  },
  captureButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: 'auto',
    marginBottom: theme.spacing.xl,
  },
  captureButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.background,
  },
  cancelButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text,
  },
  analyzingContainer: {
    alignItems: 'center',
  },
  analyzingText: {
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.lg,
  },
});

