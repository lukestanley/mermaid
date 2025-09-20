import { describe, expect, it } from 'vitest';
import { computeDragPosition } from './manual-positioning-drag-utils.js';

describe('computeDragPosition', () => {
  it('preserves manual origin when pointer coordinates include a global offset', () => {
    const start = { x: 100, y: 100 };
    const startPoint = { x: 420, y: 360 };
    const next = computeDragPosition(start, startPoint, { x: 421, y: 359 });
    expect(next).toEqual({ x: 101, y: 99 });
  });

  it('returns absolute coordinates when no start pointer is available', () => {
    const start = { x: 40, y: 60 };
    const next = computeDragPosition(start, null, { x: 200, y: 300 });
    expect(next).toEqual({ x: 200, y: 300 });
  });

  it('guards against invalid pointer readings', () => {
    const start = { x: 12, y: 34 };
    expect(computeDragPosition(start, { x: 0, y: 0 }, null)).toBeNull();
    expect(computeDragPosition(start, { x: 0, y: 0 }, { x: Number.NaN, y: 10 })).toBeNull();
    expect(computeDragPosition(start, { x: 0, y: 0 }, { x: 10, y: Number.POSITIVE_INFINITY })).toBeNull();
  });

  it('moves by a single pixel without jumping to the origin', () => {
    const start = { x: 150, y: 80 };
    const startPoint = { x: 512, y: 256 };
    const point = { x: 513, y: 257 };
    const result = computeDragPosition(start, startPoint, point);
    expect(result).toEqual({ x: 151, y: 81 });
  });
});
