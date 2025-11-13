# ML Tech Spec

## Approach

- Face landmarks via MediaPipe Face Mesh or TFLite model (on-device)

- Heuristics + simple regressions → subscores

- No face images leave device; analyses run frame-by-frame locally

## Subscore Heuristics (illustrative, tune later)

- Posture: head pitch/roll variance; neck angle from landmarks

- Symmetry: left/right landmark distances normalized by interpupillary distance

- Skin: basic brightness/contrast uniformity; simple blemish estimate from high-frequency noise (no diagnosis)

- Hair: edge density around hairline for volume proxy

## Output

```json
{
  "score": 78,
  "subscores": {"posture": 80, "symmetry": 74, "skin": 70, "hair": 88},
  "tips": ["Stand tall: align ears over shoulders", "Hydrate: 600ml water now", "SPF before leaving"]
}
```

