import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import ScoreRing from '../../components/ScoreRing';
import MultiAngleCamera from '../../components/MultiAngleCamera';
import MetricChip from '../../components/MetricChip';
import DetailedMetrics from '../../components/DetailedMetrics';
import { scoreImage } from '../scan/scoring';
import { toast } from '../../components/Toast';

export default function HomePage() {
  const { scans, addScan } = useStore((s) => ({
    scans: s.scans,
    addScan: s.addScan,
  }));
  const latest = scans[0];
  const [showCam, setShowCam] = useState(false);

  const onMultiAngleComplete = async (capturedImages) => {
    try {
      // Use front view as primary image for scoring
      const frontImage = capturedImages.front;
      if (!frontImage) {
        toast('Front view is required', 'error');
        return;
      }

      // Score the front image
      const scores = scoreImage(frontImage.blob);
      // Create scan with all angles and enhanced metrics
      const scan = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        imageBlobUrl: frontImage.url, // Primary image
        images: capturedImages, // All angles
        scores: {
          overall: scores.overall,
          smv: scores.smv,
          facialBalance: scores.facialBalance,
          eyeAesthetics: scores.eyeAesthetics,
          midfaceHarmony: scores.midfaceHarmony,
          jawStructure: scores.jawStructure,
          zygomaticProfile: scores.zygomaticProfile,
          softTissue: scores.softTissue,
          featureFlags: scores.featureFlags,
        },
      };
      
      await addScan(scan);
      setShowCam(false);
      toast('Multi-angle scan saved!', 'success');
    } catch (error) {
      console.error('Error saving scan:', error);
      toast('Failed to save scan', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Main Score Card - More Prominent */}
      <Card className="p-12 text-center glow">
        <div className="flex flex-col items-center gap-6 mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Your Look Score</h1>
          <div className="flex-shrink-0">
            <ScoreRing value={latest?.scores?.overall ?? 0} size={240} stroke={20} />
          </div>
          <p className="text-lg text-slate-400 max-w-md">
            {latest
              ? `Composite SMV score derived from facial balance, eye aesthetics, zygos, midface harmony, and jaw structure.`
              : `Take your first scan to unlock a full facial aesthetics breakdown.`
            }
          </p>
        </div>

        {/* Metrics Grid - Cleaner Layout */}
        {latest && latest.scores ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { key: 'smv', label: 'SMV Score', value: latest.scores.smv?.score },
              { key: 'eyes', label: 'Eye Area', value: latest.scores.eyeAesthetics?.score },
              { key: 'midface', label: 'Midface', value: latest.scores.midfaceHarmony?.score },
              { key: 'jaw', label: 'Jawline', value: latest.scores.jawStructure?.score },
            ].map((metric) => (
              <MetricChip key={metric.key} label={metric.label} value={Number(metric.value ?? 0)} />
            ))}
          </div>
        ) : null}
      </Card>

      {/* SMV Classification */}
      {latest?.scores?.smv && (
        <Card className="p-6 glass-strong border border-white/10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold gradient-text">SMV Classification</h2>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                Categorisation aligned with looksmaxxing tiers. Focus on weak zones to climb to the next bracket.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-500/20 border border-purple-400/30 px-6 py-4 text-center">
              <div className="text-xs uppercase tracking-wide text-slate-300">Current Tier</div>
              <div className="text-3xl font-black text-purple-200 mt-1">
                {latest.scores.smv.maleTier.toUpperCase()}
              </div>
              <div className="text-xs text-slate-400 mt-2">{latest.scores.smv.maleDescription}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl glass border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Male Ladder</h3>
              <p className="text-sm text-slate-400">{latest.scores.smv.summary}</p>
            </div>
            <div className="rounded-xl glass border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Female Mirror Tier</h3>
              <div className="text-xl font-semibold text-pink-200">
                {latest.scores.smv.femaleTier.toUpperCase()}
              </div>
              <p className="text-sm text-slate-400 mt-1">{latest.scores.smv.femaleDescription}</p>
            </div>
          </div>

          {latest.scores.featureFlags && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wide">Key Flags</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(latest.scores.featureFlags).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/15 text-xs uppercase tracking-wide text-slate-200"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Detailed Metrics - Expandable */}
      {latest && latest.scores && (
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-4">Detailed Analysis</h2>
          <DetailedMetrics scan={latest} />
        </div>
      )}

      {/* Scan Button - More Prominent */}
      {!showCam ? (
        <Button
          variant="primary"
          className="w-full py-6 text-xl font-bold shadow-2xl"
          onClick={() => setShowCam(true)}
        >
          📸 New Scan
        </Button>
      ) : (
        <Card className="p-6">
          <MultiAngleCamera 
            onComplete={onMultiAngleComplete} 
            onCancel={() => setShowCam(false)} 
          />
        </Card>
      )}
    </div>
  );
}

