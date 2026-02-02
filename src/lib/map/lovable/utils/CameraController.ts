import { Container } from 'pixi.js';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3.0;
const ZOOM_SENSITIVITY = 0.001;
const INERTIA_FRICTION = 0.92;
const INERTIA_THRESHOLD = 0.01;

export class CameraController {
  private worldContainer: Container;
  private canvas: HTMLCanvasElement;
  
  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  
  private velocityX = 0;
  private velocityY = 0;
  
  private _zoom = 1;
  private _x = 0;
  private _y = 0;
  
  private viewportWidth: number;
  private viewportHeight: number;
  
  private onUpdateCallback: ((x: number, y: number, zoom: number) => void) | null = null;
  
  // Bound event handlers for cleanup
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;
  private boundWheel: (e: WheelEvent) => void;

  constructor(
    worldContainer: Container,
    canvas: HTMLCanvasElement,
    viewportWidth: number,
    viewportHeight: number
  ) {
    this.worldContainer = worldContainer;
    this.canvas = canvas;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    // Bind event handlers
    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);
    this.boundWheel = this.onWheel.bind(this);

    // Add event listeners
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    this.canvas.addEventListener('pointermove', this.boundPointerMove);
    this.canvas.addEventListener('pointerup', this.boundPointerUp);
    this.canvas.addEventListener('pointerleave', this.boundPointerUp);
    this.canvas.addEventListener('wheel', this.boundWheel, { passive: false });
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get zoom(): number {
    return this._zoom;
  }

  setOnUpdate(callback: (x: number, y: number, zoom: number) => void): void {
    this.onUpdateCallback = callback;
  }

  setViewportSize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  centerOn(worldX: number, worldY: number): void {
    this._x = worldX - this.viewportWidth / (2 * this._zoom);
    this._y = worldY - this.viewportHeight / (2 * this._zoom);
    this.applyTransform();
  }

  private onPointerDown(e: PointerEvent): void {
    this.isDragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.canvas.setPointerCapture(e.pointerId);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;

    // Store velocity for inertia
    this.velocityX = dx;
    this.velocityY = dy;

    // Update camera position (inverted because we're moving the world)
    this._x -= dx / this._zoom;
    this._y -= dy / this._zoom;

    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    this.applyTransform();
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.canvas.releasePointerCapture(e.pointerId);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // World position under mouse before zoom
    const worldXBefore = this._x + mouseX / this._zoom;
    const worldYBefore = this._y + mouseY / this._zoom;

    // Apply zoom
    const zoomDelta = -e.deltaY * ZOOM_SENSITIVITY;
    this._zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this._zoom * (1 + zoomDelta)));

    // World position under mouse after zoom
    const worldXAfter = this._x + mouseX / this._zoom;
    const worldYAfter = this._y + mouseY / this._zoom;

    // Adjust position to keep mouse point stable
    this._x += worldXBefore - worldXAfter;
    this._y += worldYBefore - worldYAfter;

    this.applyTransform();
  }

  private applyTransform(): void {
    this.worldContainer.scale.set(this._zoom);
    this.worldContainer.x = -this._x * this._zoom;
    this.worldContainer.y = -this._y * this._zoom;

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this._x, this._y, this._zoom);
    }
  }

  update(): void {
    // Apply inertia when not dragging
    if (!this.isDragging && (Math.abs(this.velocityX) > INERTIA_THRESHOLD || Math.abs(this.velocityY) > INERTIA_THRESHOLD)) {
      this._x -= this.velocityX / this._zoom;
      this._y -= this.velocityY / this._zoom;

      this.velocityX *= INERTIA_FRICTION;
      this.velocityY *= INERTIA_FRICTION;

      this.applyTransform();
    }
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    this.canvas.removeEventListener('pointerup', this.boundPointerUp);
    this.canvas.removeEventListener('pointerleave', this.boundPointerUp);
    this.canvas.removeEventListener('wheel', this.boundWheel);
  }
}
