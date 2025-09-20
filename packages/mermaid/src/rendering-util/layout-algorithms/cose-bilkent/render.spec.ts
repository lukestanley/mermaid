import { describe, expect, it } from 'vitest';
import type { LayoutData } from 'mermaid';
import { applyManualLayoutAdjustments } from './render.js';

describe('applyManualLayoutAdjustments', () => {
  it('applies manual coordinates and shifts edge points accordingly', () => {
    const layoutResult = {
      nodes: [
        { id: 'a', x: 10, y: 20 },
        { id: 'b', x: 80, y: 100 },
      ],
      edges: [
        {
          id: 'edge-ab',
          source: 'a',
          target: 'b',
          startX: 10,
          startY: 20,
          midX: 45,
          midY: 60,
          endX: 80,
          endY: 100,
        },
      ],
    };

    const layoutData = {
      nodes: [
        { id: 'a', manualPosition: { x: 0, y: 0 } },
        { id: 'b', manualPosition: { x: 120, y: 140 } },
      ],
      edges: [{ id: 'edge-ab', start: 'a', end: 'b' }],
    } as unknown as LayoutData;

    const adjusted = applyManualLayoutAdjustments(layoutResult, layoutData);

    expect(adjusted.nodes.find((node) => node.id === 'a')).toMatchObject({ x: 0, y: 0 });
    expect(adjusted.nodes.find((node) => node.id === 'b')).toMatchObject({ x: 120, y: 140 });

    const edge = adjusted.edges[0];
    expect(edge.startX).toBe(0);
    expect(edge.startY).toBe(0);
    expect(edge.endX).toBe(120);
    expect(edge.endY).toBe(140);
    expect(edge.midX).toBeCloseTo(60);
    expect(edge.midY).toBeCloseTo(70);
  });

  it('leaves layout output unchanged when manual data is missing or invalid', () => {
    const layoutResult = {
      nodes: [{ id: 'a', x: 30, y: 40 }],
      edges: [
        {
          id: 'self',
          source: 'a',
          target: 'a',
          startX: 30,
          startY: 40,
          midX: 30,
          midY: 40,
          endX: 30,
          endY: 40,
        },
      ],
    };

    const layoutData = {
      nodes: [{ id: 'a', manualPosition: { x: 'nope', y: NaN } }],
      edges: [{ id: 'self', start: 'a', end: 'a' }],
    } as unknown as LayoutData;

    const adjusted = applyManualLayoutAdjustments(layoutResult, layoutData);

    expect(adjusted.nodes[0]).toMatchObject({ x: 30, y: 40 });
    expect(adjusted.edges[0]).toMatchObject({
      startX: 30,
      startY: 40,
      endX: 30,
      endY: 40,
    });
  });
});
