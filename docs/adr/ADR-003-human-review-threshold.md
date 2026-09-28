# ADR-003: Human Review Threshold

**Status:** Accepted  
**Date:** 2026-09-28

## Context

Not all tickets can be automatically routed. Some require human review due to:
- Uncertain classification (low AI confidence)
- Suspicious content (high abuse probability)
- Complex issues (high human review probability from Jev)

We need clear thresholds to decide when to escalate.

## Decision

**Two rules trigger manual review:**

1. **Low confidence:** If `categoryConfidence < 0.70`, route to MANUAL_REVIEW
   - Rationale: <70% confidence means the classifier is uncertain; humans should decide
   - Allows 70%+ to auto-route (reasonable confidence)

2. **High human review probability:** If `humanReviewProbability >= 0.60`, route to MANUAL_REVIEW
   - Rationale: Jev's own assessment suggests human review needed; respect it
   - Threshold 0.60 avoids false positives while catching genuine edge cases

**Category routing:** Only if both thresholds pass → route by category queue

## Consequences

✅ **Benefits:**
- Clear, deterministic rules (no ML randomness in routing)
- Easy to adjust thresholds by changing one constant
- Catches edge cases without over-escalating

⚠️ **Costs:**
- May escalate ~15-20% of tickets to manual review initially (depends on Jev quality)
- Thresholds may need tuning based on real data (future work)

## Future Tuning

If manual review queue becomes overloaded:
- Raise `categoryConfidence` threshold to 0.75-0.80
- Lower `humanReviewProbability` threshold to 0.50-0.55

Track metrics: % auto-routed, % manual-routed, % escalated-back, etc.
