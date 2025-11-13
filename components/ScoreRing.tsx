import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { theme } from '@/config/theme';
import { useStore } from '@/state/useStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

const CIRCLE_LENGTH = 2 * Math.PI * 90; // radius = 90

export function ScoreRing({ score, size = 200, strokeWidth = 12, showLabel = true }: ScoreRingProps) {
  const { reduceMotion } = useStore();
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: reduceMotion ? 0 : 1500,
    });
  }, [score, reduceMotion]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCLE_LENGTH * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const color = getScoreColor(score);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Background circle */}
        <Circle
          cx="100"
          cy="100"
          r="90"
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress circle */}
        <AnimatedCircle
          cx="100"
          cy="100"
          r="90"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={CIRCLE_LENGTH}
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform="rotate(-90 100 100)"
        />
      </Svg>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      )}
    </View>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return theme.colors.success;
  if (score >= 60) return theme.colors.primary;
  if (score >= 40) return theme.colors.warning;
  return theme.colors.error;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: theme.typography.sizes['4xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  scoreLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: -8,
  },
});

