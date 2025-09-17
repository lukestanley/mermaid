import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { applyManualNodePositions } from './index.js';

describe('applyManualNodePositions', () => {
  it('moves manual nodes without affecting other nodes', () => {
    const graph = new graphlib.Graph({ multigraph: true, compound: true });
    graph.setGraph({});

    graph.setNode('a', { x: 10, y: 10, manualPosition: { x: 100, y: 100 } });
    graph.setNode('b', { x: 40, y: 60 });
    graph.setEdge('a', 'b', {
      points: [
        { x: 10, y: 10 },
        { x: 40, y: 60 },
      ],
      x: 25,
      y: 35,
    });

    applyManualNodePositions(graph);

    const nodeA = graph.node('a');
    const nodeB = graph.node('b');
    const edge = graph.edge('a', 'b', undefined);

    expect(nodeA.x).toBe(100);
    expect(nodeA.y).toBe(100);
    expect(nodeB.x).toBe(40);
    expect(nodeB.y).toBe(60);
    expect(edge.points[0]).toEqual({ x: 100, y: 100 });
    expect(edge.points[1]).toEqual({ x: 40, y: 60 });
    expect(edge.x).toBe(70);
    expect(edge.y).toBe(80);
  });

  it('interpolates edge points when both endpoints move', () => {
    const graph = new graphlib.Graph({ multigraph: true, compound: true });
    graph.setGraph({});

    graph.setNode('start', { x: 10, y: 10, manualPosition: { x: 0, y: 0 } });
    graph.setNode('end', { x: 40, y: 60, manualPosition: { x: 100, y: 80 } });
    graph.setEdge('start', 'end', {
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 30 },
        { x: 40, y: 60 },
      ],
      x: 30,
      y: 40,
    });

    applyManualNodePositions(graph);

    const edge = graph.edge('start', 'end', undefined);
    expect(edge.points[0]).toEqual({ x: 0, y: 0 });
    expect(edge.points[1]).toEqual({ x: 45, y: 35 });
    expect(edge.points[2]).toEqual({ x: 100, y: 80 });
    expect(edge.x).toBe(55);
    expect(edge.y).toBe(45);
  });
});
