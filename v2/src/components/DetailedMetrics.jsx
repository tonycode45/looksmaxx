import React from 'react';
import { Card } from './ui/Card';

const Section = ({ icon, title, score, metrics, highlight }) => (
  <Card className="p-6 glass-strong border border-white/10">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          {score !== undefined && (
            <div className="text-sm font-semibold text-purple-300">Score: {Math.round(score)}</div>
          )}
        </div>
      </div>
      {highlight ? (
        <div className="px-3 py-1 rounded-full text-xs uppercase tracking-wide bg-white/10 text-slate-200 border border-white/20">
          {highlight}
        </div>
      ) : null}
    </div>

    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      {metrics
        .filter((item) => item.value !== undefined && item.value !== null)
        .map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between"
          >
            <span className="text-slate-300">{item.label}</span>
            <span className="text-slate-100 font-semibold">{item.value}</span>
          </div>
        ))}
    </div>
  </Card>
);

export default function DetailedMetrics({ scan }) {
  if (!scan?.scores) return null;

  const { scores } = scan;

  const sections = [
    {
      icon: '🎯',
      title: 'Facial Balance',
      score: scores.facialBalance?.score,
      metrics: [
        { label: 'Face W/H Ratio', value: scores.facialBalance?.facialWidthHeight },
        { label: 'Upper / Lower Third', value: scores.facialBalance?.upperLowerThird },
        { label: 'Facial Symmetry', value: scores.facialBalance?.facialSymmetry },
        { label: 'Brow → Chin Ratio', value: scores.facialBalance?.browToChinRatio },
      ],
    },
    {
      icon: '👁️',
      title: 'Eye Aesthetics',
      score: scores.eyeAesthetics?.score,
      highlight: `${scores.eyeAesthetics?.canthalTilt ?? 0}° canthal tilt`,
      metrics: [
        { label: 'Upper Lid Exposure', value: `${scores.eyeAesthetics?.upperEyelidExposure ?? 0}%` },
        { label: 'Lower Lid Support', value: `${scores.eyeAesthetics?.lowerEyelidSupport ?? 0}%` },
        { label: 'Palpebral Fissure', value: `${scores.eyeAesthetics?.palpebralFissure ?? 0}` },
        { label: 'Brow Position', value: scores.eyeAesthetics?.browPosition },
        { label: 'Lash Density', value: scores.eyeAesthetics?.lashDensity },
      ],
    },
    {
      icon: '💎',
      title: 'Zygomatic Profile',
      score: scores.zygomaticProfile?.score,
      metrics: [
        { label: 'Projection', value: scores.zygomaticProfile?.zygomaticProjection },
        { label: 'Height', value: scores.zygomaticProfile?.zygomaticHeight },
        { label: 'Malar Support', value: scores.zygomaticProfile?.malarSupport },
        { label: 'Orbital Roofing', value: scores.zygomaticProfile?.orbitalRoofing },
      ],
    },
    {
      icon: '🦴',
      title: 'Midface Harmony',
      score: scores.midfaceHarmony?.score,
      highlight: scores.featureFlags?.maxilla,
      metrics: [
        { label: 'Midface Ratio', value: scores.midfaceHarmony?.midfaceRatio },
        { label: 'Maxilla Projection', value: scores.midfaceHarmony?.maxillaProjection },
        { label: 'Infraorbital Support', value: scores.midfaceHarmony?.infraorbitalSupport },
        { label: 'Nasal Base Angle', value: `${scores.midfaceHarmony?.nasalBaseAngle ?? 0}°` },
        { label: 'Philtrum Length', value: `${scores.midfaceHarmony?.philtrumLength ?? 0}mm` },
      ],
    },
    {
      icon: '🗿',
      title: 'Jaw Structure',
      score: scores.jawStructure?.score,
      highlight: scores.featureFlags?.ramus,
      metrics: [
        { label: 'Ramus Height', value: scores.jawStructure?.ramusHeight },
        { label: 'Gonial Angle', value: `${scores.jawStructure?.gonialAngle ?? 0}°` },
        { label: 'Chin Projection', value: scores.jawStructure?.chinProjection },
        { label: 'Jaw Width', value: scores.jawStructure?.jawWidth },
        { label: 'Mandibular Plane', value: `${scores.jawStructure?.mandibularPlane ?? 0}°` },
      ],
    },
    {
      icon: '💆‍♂️',
      title: 'Soft Tissue',
      score: scores.softTissue?.score,
      metrics: [
        { label: 'Upper Lip Support', value: scores.softTissue?.upperLipSupport },
        { label: 'Lower Lip Support', value: scores.softTissue?.lowerLipSupport },
        { label: 'Buccal Fat', value: scores.softTissue?.buccalFat },
        { label: 'Skin Quality', value: scores.softTissue?.skinQuality },
      ],
    },
  ].filter((section) => section.metrics.some((m) => m.value !== undefined));

  if (!sections.length) return null;

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Section key={section.title} {...section} />
      ))}
    </div>
  );
}

