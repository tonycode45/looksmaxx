import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { formatDateTime } from '../lib/format';

const METRIC_CONFIG = [
  {
    key: 'smv',
    label: 'SMV Score',
    getter: (scan) => scan?.scores?.smv?.score ?? null,
  },
  {
    key: 'eyes',
    label: 'Eye Area',
    getter: (scan) => scan?.scores?.eyeAesthetics?.score ?? null,
  },
  {
    key: 'zygomas',
    label: 'Zygos',
    getter: (scan) => scan?.scores?.zygomaticProfile?.score ?? null,
  },
  {
    key: 'midface',
    label: 'Midface',
    getter: (scan) => scan?.scores?.midfaceHarmony?.score ?? null,
  },
  {
    key: 'jaw',
    label: 'Jawline',
    getter: (scan) => scan?.scores?.jawStructure?.score ?? null,
  },
  {
    key: 'soft',
    label: 'Soft Tissue',
    getter: (scan) => scan?.scores?.softTissue?.score ?? null,
  },
];

export default function ProgressTimeline({ scans }) {
  const [comparisonMode, setComparisonMode] = useState(null); // 'oldest', 'first', or null

  if (!scans || scans.length < 2) {
    return (
      <Card className="p-6 text-center">
        <p className="text-slate-400">Need at least 2 scans to compare progress</p>
      </Card>
    );
  }

  const latest = scans[0];
  const oldest = scans[scans.length - 1];
  const first = scans.find((s) => s) || scans[0];

  const getComparisonScan = () => {
    if (comparisonMode === 'oldest') return oldest;
    if (comparisonMode === 'first') return first;
    return null;
  };

  const compare = getComparisonScan();

  const calculateImprovement = (config) => {
    const latestValue = config.getter(latest);
    const compareValue = config.getter(compare);
    if (latestValue == null || compareValue == null || compareValue === 0) return null;
    const diff = latestValue - compareValue;
    return {
      value: diff,
      percent: ((diff / compareValue) * 100).toFixed(1),
      improved: diff > 0,
      latest: latestValue,
      previous: compareValue,
    };
  };

  const improvements = METRIC_CONFIG.map((config) => ({
    metric: config.label,
    key: config.key,
    ...calculateImprovement(config),
  })).filter((item) => item.value !== null);

  return (
    <div className="space-y-6">
      {/* Comparison Controls */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 gradient-text">Progress Comparison</h3>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant={comparisonMode === 'oldest' ? 'primary' : 'secondary'}
            onClick={() => setComparisonMode(comparisonMode === 'oldest' ? null : 'oldest')}
          >
            {comparisonMode === 'oldest' ? '✓' : ''} Compare with Oldest
          </Button>
          <Button
            variant={comparisonMode === 'first' ? 'primary' : 'secondary'}
            onClick={() => setComparisonMode(comparisonMode === 'first' ? null : 'first')}
          >
            {comparisonMode === 'first' ? '✓' : ''} Compare with First
          </Button>
        </div>
      </Card>

      {/* Comparison View */}
      {compare && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Old/Latest Scan Cards */}
          <Card className="p-6">
            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-2">
                {comparisonMode === 'oldest' ? 'Oldest Scan' : 'First Scan'}
              </div>
              <div className="text-xs text-slate-500 mb-4">
                {formatDateTime(compare.createdAt)}
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                <img
                  src={compare.imageBlobUrl}
                  alt="Comparison"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {METRIC_CONFIG.map((config) => (
                  <div key={config.key} className="text-center p-2 rounded-lg glass border border-white/5">
                    <div className="text-xs text-slate-400 mb-1 uppercase">{config.label}</div>
                    <div className="text-lg font-bold text-slate-200">
                      {config.getter(compare) ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-2">Latest Scan</div>
              <div className="text-xs text-slate-500 mb-4">
                {formatDateTime(latest.createdAt)}
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                <img
                  src={latest.imageBlobUrl}
                  alt="Latest"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {METRIC_CONFIG.map((config) => {
                  const improvement = calculateImprovement(config);
                  return (
                    <div key={config.key} className="text-center p-2 rounded-lg glass border border-white/5">
                      <div className="text-xs text-slate-400 mb-1 uppercase">{config.label}</div>
                      <div className="text-lg font-bold text-slate-200">
                        {config.getter(latest) ?? 0}
                      </div>
                      {improvement && (
                        <div
                          className={`text-xs mt-1 ${
                            improvement.improved ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {improvement.improved ? '+' : ''}
                          {improvement.value} ({improvement.percent}%)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Improvement Metrics */}
      {compare && improvements.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 gradient-text">Improvement Summary</h3>
          <div className="space-y-3">
            {improvements.map((imp) => (
              <div key={imp.key} className="flex items-center justify-between p-3 rounded-xl glass border border-white/5">
                <div className="flex-1">
                  <div className="font-semibold text-slate-100 capitalize">{imp.metric}</div>
                  <div className="text-xs text-slate-400">
                    {imp.previous} → {imp.latest}
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${
                    imp.improved ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {imp.improved ? '+' : ''}
                  {imp.value} ({imp.percent}%)
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline Visualization */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 gradient-text">Score Timeline</h3>
        <div className="space-y-4">
          {scans.slice(0, 10).reverse().map((scan, idx) => {
            const progress = ((scan.scores?.overall ?? 0) / 100) * 100;
            return (
              <div key={scan.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{formatDateTime(scan.createdAt)}</span>
                  <span className="font-bold text-purple-400">
                    {scan.scores?.overall ?? 0}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Metric Trends */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 gradient-text">Metric Trends</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRIC_CONFIG.slice(0, 4).map((config) => {
            const firstValue = config.getter(oldest) ?? 0;
            const latestValue = config.getter(latest) ?? 0;
            const trend = latestValue - firstValue;
            const trendPercent = firstValue > 0 ? ((trend / firstValue) * 100).toFixed(1) : '0';

            return (
              <div key={config.key} className="p-4 rounded-xl glass border border-white/5">
                <div className="text-xs text-slate-400 mb-2 uppercase">{config.label}</div>
                <div className="text-2xl font-bold text-slate-200 mb-1">{latestValue}</div>
                <div
                  className={`text-sm font-semibold ${
                    trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {trendPercent}%
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

