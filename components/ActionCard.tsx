import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '@/config/theme';
import { strings } from '@/config/strings';
import { useStore } from '@/state/useStore';

interface ActionCardProps {
  title: string;
  tip: string;
  minutes: number;
  status: 'todo' | 'done';
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ActionCard({ title, tip, minutes, status, onPress }: ActionCardProps) {
  const { reduceMotion } = useStore();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(status === 'done' ? 0.6 : 1);

  React.useEffect(() => {
    opacity.value = withTiming(status === 'done' ? 0.6 : 1, {
      duration: reduceMotion ? 0 : 300,
    });
  }, [status, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!reduceMotion) {
      scale.value = withSpring(0.95);
    }
  };

  const handlePressOut = () => {
    if (!reduceMotion) {
      scale.value = withSpring(1);
    }
  };

  return (
    <AnimatedTouchable
      style={[styles.card, animatedStyle, status === 'done' && styles.cardDone]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{minutes}m</Text>
        </View>
      </View>
      <Text style={styles.tip}>{tip}</Text>
      <View style={styles.footer}>
        <Text style={styles.statusText}>
          {status === 'done' ? '✓ Completed' : strings.cta.startAction}
        </Text>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardDone: {
    borderColor: theme.colors.success,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.background,
  },
  tip: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
});

