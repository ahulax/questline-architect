import { Container, Graphics } from 'pixi.js';
import type { MapNode, QuestPath } from '@/lib/map/lovable/types/map';

interface PathColors {
  active: number;
  completed: number;
  locked: number;
}

const COLORS: PathColors = {
  active: 0xffdd44,    // Solar Gold
  completed: 0xffd700, // Gold
  locked: 0x666666,    // Gray
};

const PATH_WIDTH = 4;
const GLOW_WIDTH = 12;
const BEZIER_SEGMENTS = 50;

export class BezierPathRenderer {
  private container: Container;
  private pathGraphics: Graphics;
  private glowGraphics: Graphics;
  private nodes: Map<string, MapNode> = new Map();
  private paths: QuestPath[] = [];
  private time: number = 0;

  constructor(parentContainer: Container) {
    this.container = new Container();
    this.container.label = 'path-layer';

    // Glow layer (behind paths)
    this.glowGraphics = new Graphics();
    this.glowGraphics.label = 'path-glow';
    this.container.addChild(this.glowGraphics);

    // Main path layer
    this.pathGraphics = new Graphics();
    this.pathGraphics.label = 'path-lines';
    this.container.addChild(this.pathGraphics);

    parentContainer.addChild(this.container);
  }

  setData(nodes: MapNode[], paths: QuestPath[]): void {
    this.nodes.clear();
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }
    this.paths = paths;
    this.redraw();
  }

  private getControlPoints(from: MapNode, to: MapNode): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point offset based on distance
    const offset = Math.min(distance * 0.3, 200);

    // Create curved paths by offsetting control points perpendicular to the line
    const perpX = -dy / distance;
    const perpY = dx / distance;

    // Add some variance based on node positions for organic feel
    const variance = ((from.x * 13 + from.y * 7) % 100) / 100 - 0.5;
    const curveOffset = offset * variance * 0.5;

    return {
      cp1x: from.x + dx * 0.33 + perpX * curveOffset,
      cp1y: from.y + dy * 0.33 + perpY * curveOffset,
      cp2x: from.x + dx * 0.66 - perpX * curveOffset,
      cp2y: from.y + dy * 0.66 - perpY * curveOffset,
    };
  }

  private cubicBezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }

  private drawPath(g: Graphics, from: MapNode, to: MapNode, segments: number = BEZIER_SEGMENTS): void {
    const { cp1x, cp1y, cp2x, cp2y } = this.getControlPoints(from, to);

    g.moveTo(from.x, from.y);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = this.cubicBezierPoint(t, from.x, cp1x, cp2x, to.x);
      const y = this.cubicBezierPoint(t, from.y, cp1y, cp2y, to.y);
      g.lineTo(x, y);
    }
  }

  private redraw(): void {
    this.pathGraphics.clear();
    this.glowGraphics.clear();

    for (const path of this.paths) {
      const fromNode = this.nodes.get(path.fromNodeId);
      const toNode = this.nodes.get(path.toNodeId);

      if (!fromNode || !toNode) continue;

      const color = COLORS[path.status];
      const alpha = path.status === 'locked' ? 0.3 : 1;

      // Draw glow for active/completed paths
      if (path.status !== 'locked') {
        this.glowGraphics.setStrokeStyle({
          width: GLOW_WIDTH,
          color,
          alpha: 0.3,
          cap: 'round',
          join: 'round',
        });
        this.drawPath(this.glowGraphics, fromNode, toNode);
        this.glowGraphics.stroke();
      }

      // Draw main path
      if (path.status === 'locked') {
        // Dashed line for locked paths
        this.drawDashedPath(fromNode, toNode, color, alpha);
      } else {
        this.pathGraphics.setStrokeStyle({
          width: PATH_WIDTH,
          color,
          alpha,
          cap: 'round',
          join: 'round',
        });
        this.drawPath(this.pathGraphics, fromNode, toNode);
        this.pathGraphics.stroke();
      }
    }
  }

  private drawDashedPath(from: MapNode, to: MapNode, color: number, alpha: number): void {
    const { cp1x, cp1y, cp2x, cp2y } = this.getControlPoints(from, to);
    const dashLength = 15;
    const gapLength = 10;
    const totalSegments = 100;

    let drawing = true;
    let distanceInCurrentSegment = 0;
    let lastX = from.x;
    let lastY = from.y;

    this.pathGraphics.setStrokeStyle({
      width: PATH_WIDTH,
      color,
      alpha,
      cap: 'round',
    });

    for (let i = 1; i <= totalSegments; i++) {
      const t = i / totalSegments;
      const x = this.cubicBezierPoint(t, from.x, cp1x, cp2x, to.x);
      const y = this.cubicBezierPoint(t, from.y, cp1y, cp2y, to.y);

      const dx = x - lastX;
      const dy = y - lastY;
      const segmentDist = Math.sqrt(dx * dx + dy * dy);
      distanceInCurrentSegment += segmentDist;

      if (drawing) {
        if (i === 1 || distanceInCurrentSegment <= dashLength) {
          if (i === 1) {
            this.pathGraphics.moveTo(lastX, lastY);
          }
          this.pathGraphics.lineTo(x, y);
        }

        if (distanceInCurrentSegment >= dashLength) {
          this.pathGraphics.stroke();
          drawing = false;
          distanceInCurrentSegment = 0;
        }
      } else {
        if (distanceInCurrentSegment >= gapLength) {
          this.pathGraphics.moveTo(x, y);
          drawing = true;
          distanceInCurrentSegment = 0;
        }
      }

      lastX = x;
      lastY = y;
    }

    if (drawing) {
      this.pathGraphics.stroke();
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    // Animate glow for active paths
    const pulseAlpha = 0.2 + Math.sin(this.time * 3) * 0.15;
    this.glowGraphics.alpha = pulseAlpha + 0.3;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
