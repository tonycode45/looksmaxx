/**
 * Performance monitoring utilities for tracking operation durations
 * and collecting performance metrics.
 */

import { logger } from './logger';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  context?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics
  private timers: Map<string, number> = new Map();

  /**
   * Starts a performance timer for an operation.
   * 
   * @param operation - Name of the operation to time
   * @returns Timer ID for stopping the timer
   * 
   * @example
   * ```typescript
   * const timerId = startTimer('scanProcessing');
   * // ... do work ...
   * stopTimer(timerId, 'scanProcessing');
   * ```
   */
  startTimer(operation: string): string {
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    this.timers.set(timerId, performance.now());
    return timerId;
  }

  /**
   * Stops a performance timer and records the metric.
   * 
   * @param timerId - Timer ID returned from startTimer
   * @param operation - Name of the operation (should match startTimer)
   * @param context - Optional context to attach to the metric
   * @returns Duration in milliseconds, or null if timer not found
   */
  stopTimer(timerId: string, operation: string, context?: Record<string, unknown>): number | null {
    const startTime = this.timers.get(timerId);
    if (!startTime) {
      logger.warn(`Timer ${timerId} not found`, { operation });
      return null;
    }

    this.timers.delete(timerId);
    const duration = performance.now() - startTime;
    
    this.recordMetric(operation, duration, context);
    return duration;
  }

  /**
   * Records a performance metric.
   * 
   * @param operation - Name of the operation
   * @param duration - Duration in milliseconds
   * @param context - Optional context object
   */
  recordMetric(operation: string, duration: number, context?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log if duration exceeds threshold
    const SLOW_OPERATION_THRESHOLD = 1000; // 1 second
    if (duration > SLOW_OPERATION_THRESHOLD) {
      logger.warn(`Slow operation detected: ${operation}`, { duration, context });
    } else {
      logger.performance(operation, duration, context);
    }
  }

  /**
   * Gets all recorded metrics.
   * 
   * @returns Array of performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Gets metrics for a specific operation.
   * 
   * @param operation - Name of the operation
   * @returns Array of metrics for the operation
   */
  getMetricsForOperation(operation: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operation);
  }

  /**
   * Gets average duration for an operation.
   * 
   * @param operation - Name of the operation
   * @returns Average duration in milliseconds, or null if no metrics found
   */
  getAverageDuration(operation: string): number | null {
    const operationMetrics = this.getMetricsForOperation(operation);
    if (operationMetrics.length === 0) return null;

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  /**
   * Clears all recorded metrics.
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Gets a summary of performance metrics.
   * 
   * @returns Summary object with operation statistics
   */
  getSummary(): Record<string, { count: number; avgDuration: number; minDuration: number; maxDuration: number }> {
    const summary: Record<string, { count: number; avgDuration: number; minDuration: number; maxDuration: number }> = {};

    // Group metrics by operation
    const grouped = new Map<string, PerformanceMetric[]>();
    for (const metric of this.metrics) {
      const existing = grouped.get(metric.operation) || [];
      existing.push(metric);
      grouped.set(metric.operation, existing);
    }

    // Calculate statistics for each operation
    for (const [operation, metrics] of grouped.entries()) {
      const durations = metrics.map(m => m.duration);
      summary[operation] = {
        count: metrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
      };
    }

    return summary;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator function to measure performance of an async function.
 * 
 * @param operation - Name of the operation
 * @returns Decorator function
 * 
 * @example
 * ```typescript
 * const processScan = measurePerformance('processScan')(async (data) => {
 *   // ... async work ...
 * });
 * ```
 */
export function measurePerformance<T extends (...args: unknown[]) => Promise<unknown>>(
  operation: string
): (fn: T) => T {
  return (fn: T) => {
    return (async (...args: Parameters<T>) => {
      const timerId = performanceMonitor.startTimer(operation);
      try {
        const result = await fn(...args);
        return result;
      } finally {
        performanceMonitor.stopTimer(timerId, operation);
      }
    }) as T;
  };
}

/**
 * Synchronous version of measurePerformance.
 * 
 * @param operation - Name of the operation
 * @returns Decorator function
 */
export function measurePerformanceSync<T extends (...args: unknown[]) => unknown>(
  operation: string
): (fn: T) => T {
  return (fn: T) => {
    return ((...args: Parameters<T>) => {
      const timerId = performanceMonitor.startTimer(operation);
      try {
        const result = fn(...args);
        return result;
      } finally {
        performanceMonitor.stopTimer(timerId, operation);
      }
    }) as T;
  };
}

