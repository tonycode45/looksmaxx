const MALE_TIERS = [
  { max: 30, label: 'sub3', description: 'Severely below average' },
  { max: 40, label: 'sub4', description: 'Well below average' },
  { max: 50, label: 'sub5', description: 'Below average' },
  { max: 55, label: 'lltn', description: 'Low low-tier normie' },
  { max: 60, label: 'mltn', description: 'Mid low-tier normie' },
  { max: 65, label: 'hltn', description: 'High low-tier normie' },
  { max: 70, label: 'lmtn', description: 'Low mid-tier normie' },
  { max: 75, label: 'mmtn', description: 'Mid mid-tier normie' },
  { max: 80, label: 'hmtn', description: 'High mid-tier normie' },
  { max: 85, label: 'lhtn', description: 'Low high-tier normie' },
  { max: 90, label: 'mhtn', description: 'Mid high-tier normie' },
  { max: 94, label: 'hhtn', description: 'High high-tier normie' },
  { max: 97, label: 'cl', description: 'Chad Lite' },
  { max: 99, label: 'chad', description: 'Chad' },
  { max: 100, label: 'adamlite', description: 'Adam Lite' },
  { max: 101, label: 'adam', description: 'Adam' },
];

const FEMALE_TIERS = [
  { max: 30, label: 'ltb', description: 'Low-tier Becky' },
  { max: 50, label: 'mtb', description: 'Mid-tier Becky' },
  { max: 65, label: 'htb', description: 'High-tier Becky' },
  { max: 75, label: 'sl', description: 'Sub-stacy' },
  { max: 85, label: 'stacy', description: 'Stacy' },
  { max: 94, label: 'evelike', description: 'Eve tier' },
  { max: 101, label: 'eve', description: 'Peak Eve' },
];

const clamp = (value, min = 25, max = 100) => Math.max(min, Math.min(max, value));

function noise(seed, shift) {
  const x = Math.sin((seed + shift) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function ranged(seed, shift, min, max) {
  const n = noise(seed, shift);
  return min + n * (max - min);
}

function scoreAround(value, ideal, tolerance, hard = 100) {
  const distance = Math.abs(value - ideal);
  const normalized = Math.min(distance / tolerance, 1);
  return clamp(hard - normalized * 40);
}

function selectTier(score, tiers) {
  for (const tier of tiers) {
    if (score <= tier.max) {
      return tier;
    }
  }
  return tiers[tiers.length - 1];
}

function describeProjection(value) {
  if (value >= 78) return 'Maxilla projected';
  if (value >= 64) return 'Maxilla neutral';
  return 'Maxilla recessed';
}

function describeRamus(value) {
  if (value >= 70) return 'Tall ramus';
  if (value >= 55) return 'Average ramus';
  return 'Short ramus';
}

function describeEyes(tilt, upper, lower) {
  if (tilt >= 10 && upper <= 45 && lower >= 55) return 'Hunter eyes';
  if (tilt >= 5) return 'Balanced canthal tilt';
  return 'Consider orbitals / canthal tilt';
}

function weakestAreas(metrics) {
  const sorted = [...metrics]
    .filter((m) => typeof m.score === 'number')
    .sort((a, b) => a.score - b.score);
  return sorted.slice(0, 2).map((m) => m.label);
}

// Main scoring entry
export function scoreImage(blob) {
  const seed = (blob.size % 97) + ((Date.now() / 1000) | 0);

  const facialBalance = computeFacialBalance(seed);
  const eyeAesthetics = computeEyeAesthetics(seed);
  const zygomaticProfile = computeZygomaticProfile(seed);
  const midfaceHarmony = computeMidfaceHarmony(seed);
  const jawStructure = computeJawStructure(seed);
  const softTissue = computeSoftTissue(seed);

  const weighted =
    facialBalance.score * 0.18 +
    eyeAesthetics.score * 0.24 +
    zygomaticProfile.score * 0.16 +
    midfaceHarmony.score * 0.22 +
    jawStructure.score * 0.15 +
    softTissue.score * 0.05;

  const smvScore = Math.round(clamp(weighted));
  const overall = Math.round((facialBalance.score + smvScore) / 2);

  const maleTier = selectTier(smvScore, MALE_TIERS);
  const femaleTier = selectTier(smvScore, FEMALE_TIERS);
  const weaknesses = weakestAreas([
    { label: 'eye area', score: eyeAesthetics.score },
    { label: 'zygomas', score: zygomaticProfile.score },
    { label: 'midface', score: midfaceHarmony.score },
    { label: 'jawline', score: jawStructure.score },
    { label: 'soft tissue', score: softTissue.score },
  ]);

  const featureFlags = {
    maxilla: describeProjection(midfaceHarmony.maxillaProjection),
    ramus: describeRamus(jawStructure.ramusHeight),
    eyes: describeEyes(
      eyeAesthetics.canthalTilt,
      eyeAesthetics.upperEyelidExposure,
      eyeAesthetics.lowerEyelidSupport
    ),
    zygomas: zygomaticProfile.zygomaticProjection >= 75 ? 'Strong zygos' : 'Average zygos',
    brow: eyeAesthetics.browPosition >= 65 ? 'Good brow framing' : 'Brow support needs work',
  };

  const smv = {
    score: smvScore,
    maleTier: maleTier.label,
    maleDescription: maleTier.description,
    femaleTier: femaleTier.label,
    femaleDescription: femaleTier.description,
    summary:
      weaknesses.length > 0
        ? `Improve ${weaknesses.join(' & ')} to climb the next tier.`
        : 'You are balanced across key facial zones.',
  };

  return {
    overall,
    smv,
    facialBalance,
    eyeAesthetics,
    zygomaticProfile,
    midfaceHarmony,
    jawStructure,
    softTissue,
    featureFlags,
  };
}

function computeFacialBalance(seed) {
  const facialWidthHeight = ranged(seed, 1.3, 1.45, 1.78);
  const upperLowerThird = ranged(seed, 2.6, 0.85, 1.25);
  const facialSymmetry = clamp(70 + ranged(seed, 3.8, -12, 18));
  const browToChinRatio = ranged(seed, 4.1, 0.9, 1.2);

  const goldenScore =
    scoreAround(facialWidthHeight, 1.618, 0.18) * 0.4 +
    scoreAround(upperLowerThird, 1, 0.15) * 0.3 +
    scoreAround(browToChinRatio, 1.05, 0.12) * 0.3;

  const score = Math.round((goldenScore + facialSymmetry) / 2);

  return {
    score,
    facialWidthHeight: facialWidthHeight.toFixed(2),
    upperLowerThird: upperLowerThird.toFixed(2),
    facialSymmetry: Math.round(facialSymmetry),
    browToChinRatio: browToChinRatio.toFixed(2),
  };
}

function computeEyeAesthetics(seed) {
  const canthalTilt = Math.round(ranged(seed, 5.2, -5, 14));
  const upperEyelidExposure = Math.round(ranged(seed, 6.4, 30, 70));
  const lowerEyelidSupport = Math.round(ranged(seed, 7.1, 40, 85));
  const palpebralFissure = Math.round(ranged(seed, 8.6, 60, 90));
  const browPosition = Math.round(ranged(seed, 9.9, 45, 85));
  const lashDensity = Math.round(ranged(seed, 10.4, 40, 90));

  const tiltScore = clamp(75 + canthalTilt * 2);
  const exposureScore = clamp(100 - Math.abs(upperEyelidExposure - 45));
  const supportScore = clamp(90 - Math.abs(lowerEyelidSupport - 65));
  const browScore = clamp(100 - Math.abs(browPosition - 68));

  const score = Math.round(
    tiltScore * 0.3 + exposureScore * 0.25 + supportScore * 0.2 + browScore * 0.15 + lashDensity * 0.1
  );

  return {
    score,
    canthalTilt,
    upperEyelidExposure,
    lowerEyelidSupport,
    palpebralFissure,
    browPosition,
    lashDensity,
  };
}

function computeZygomaticProfile(seed) {
  const zygomaticProjection = Math.round(ranged(seed, 11.3, 55, 90));
  const zygomaticHeight = Math.round(ranged(seed, 12.7, 45, 80));
  const malarSupport = Math.round(ranged(seed, 13.5, 40, 85));
  const orbitalRoofing = Math.round(ranged(seed, 14.8, 45, 82));

  const score = Math.round(
    zygomaticProjection * 0.35 + zygomaticHeight * 0.25 + malarSupport * 0.25 + orbitalRoofing * 0.15
  );

  return {
    score,
    zygomaticProjection,
    zygomaticHeight,
    malarSupport,
    orbitalRoofing,
  };
}

function computeMidfaceHarmony(seed) {
  const midfaceRatio = ranged(seed, 15.6, 0.95, 1.35);
  const maxillaProjection = Math.round(ranged(seed, 16.4, 50, 88));
  const nasalBaseAngle = Math.round(ranged(seed, 17.1, 85, 115));
  const philtrumLength = Math.round(ranged(seed, 18.2, 10, 18));
  const infraorbitalSupport = Math.round(ranged(seed, 19.5, 45, 85));

  const ratioScore = scoreAround(midfaceRatio, 1.15, 0.18);
  const philtrumScore = clamp(100 - Math.abs(philtrumLength - 13) * 5);
  const supportScore = clamp(infraorbitalSupport);

  const score = Math.round(
    ratioScore * 0.25 +
      maxillaProjection * 0.3 +
      supportScore * 0.2 +
      (100 - Math.abs(nasalBaseAngle - 100)) * 0.15 +
      philtrumScore * 0.1
  );

  return {
    score,
    midfaceRatio: midfaceRatio.toFixed(2),
    maxillaProjection,
    nasalBaseAngle,
    philtrumLength,
    infraorbitalSupport,
  };
}

function computeJawStructure(seed) {
  const ramusHeight = Math.round(ranged(seed, 20.7, 45, 90));
  const mandibularPlane = Math.round(ranged(seed, 21.4, 20, 40));
  const gonialAngle = Math.round(ranged(seed, 22.9, 118, 138));
  const chinProjection = Math.round(ranged(seed, 23.6, 45, 85));
  const jawWidth = Math.round(ranged(seed, 24.8, 55, 88));

  const ramusScore = clamp(60 + (ramusHeight - 55));
  const gonialScore = clamp(100 - Math.abs(gonialAngle - 128));
  const chinScore = clamp(chinProjection);

  const score = Math.round(
    ramusScore * 0.25 + gonialScore * 0.25 + chinScore * 0.2 + jawWidth * 0.15 + mandibularPlane * 0.15
  );

  return {
    score,
    ramusHeight,
    mandibularPlane,
    gonialAngle,
    chinProjection,
    jawWidth,
  };
}

function computeSoftTissue(seed) {
  const upperLipSupport = Math.round(ranged(seed, 25.7, 45, 85));
  const lowerLipSupport = Math.round(ranged(seed, 26.4, 45, 85));
  const buccalFat = Math.round(ranged(seed, 27.1, 40, 80));
  const skinQuality = Math.round(ranged(seed, 28.3, 50, 90));

  const score = Math.round(
    upperLipSupport * 0.3 + lowerLipSupport * 0.25 + (100 - Math.abs(buccalFat - 55)) * 0.2 + skinQuality * 0.25
  );

  return {
    score,
    upperLipSupport,
    lowerLipSupport,
    buccalFat,
    skinQuality,
  };
}
