import { Filter, GlProgram, Texture } from 'pixi.js';

const vertex = `
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform vec4 uOutputTexture;

  vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
  }

  vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
  }

  void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
  }
`;

const fragment = `
  precision highp float;

  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform sampler2D uBlendTexture;
  uniform sampler2D uNoiseTexture;
  uniform float uThreshold;
  uniform float uEdgeSoftness;
  uniform float uBlendStrength;
  uniform vec2 uNoiseScale;
  uniform vec2 uNoiseOffset;

  void main(void) {
    vec4 baseColor = texture(uTexture, vTextureCoord);
    vec4 blendColor = texture(uBlendTexture, vTextureCoord);
    
    // Sample noise with offset for chunk-based variation
    vec2 noiseCoord = vTextureCoord * uNoiseScale + uNoiseOffset;
    float noiseValue = texture(uNoiseTexture, noiseCoord).r;
    
    // Organic edge blending using smoothstep for anti-aliased transitions
    float blendFactor = smoothstep(
      uThreshold - uEdgeSoftness,
      uThreshold + uEdgeSoftness,
      noiseValue
    );
    
    // Apply blend strength
    blendFactor *= uBlendStrength;
    
    // Mix the two biome textures
    finalColor = mix(baseColor, blendColor, blendFactor);
  }
`;

export interface BiomeBlendFilterOptions {
  blendTexture: Texture;
  noiseTexture: Texture;
  threshold?: number;
  edgeSoftness?: number;
  blendStrength?: number;
  noiseScale?: { x: number; y: number };
  noiseOffset?: { x: number; y: number };
}

export class BiomeBlendFilter extends Filter {
  private _blendTexture: Texture;
  private _noiseTexture: Texture;

  constructor(options: BiomeBlendFilterOptions) {
    const glProgram = GlProgram.from({
      vertex,
      fragment,
      name: 'biome-blend-filter',
    });

    super({
      glProgram,
      resources: {
        biomeBlendUniforms: {
          uThreshold: { value: options.threshold ?? 0.5, type: 'f32' },
          uEdgeSoftness: { value: options.edgeSoftness ?? 0.15, type: 'f32' },
          uBlendStrength: { value: options.blendStrength ?? 1.0, type: 'f32' },
          uNoiseScale: { value: [options.noiseScale?.x ?? 1.0, options.noiseScale?.y ?? 1.0], type: 'vec2<f32>' },
          uNoiseOffset: { value: [options.noiseOffset?.x ?? 0.0, options.noiseOffset?.y ?? 0.0], type: 'vec2<f32>' },
        },
        uBlendTexture: options.blendTexture.source,
        uNoiseTexture: options.noiseTexture.source,
      },
    });

    this._blendTexture = options.blendTexture;
    this._noiseTexture = options.noiseTexture;
  }

  get threshold(): number {
    return this.resources.biomeBlendUniforms.uniforms.uThreshold;
  }

  set threshold(value: number) {
    this.resources.biomeBlendUniforms.uniforms.uThreshold = value;
  }

  get edgeSoftness(): number {
    return this.resources.biomeBlendUniforms.uniforms.uEdgeSoftness;
  }

  set edgeSoftness(value: number) {
    this.resources.biomeBlendUniforms.uniforms.uEdgeSoftness = value;
  }

  get blendStrength(): number {
    return this.resources.biomeBlendUniforms.uniforms.uBlendStrength;
  }

  set blendStrength(value: number) {
    this.resources.biomeBlendUniforms.uniforms.uBlendStrength = value;
  }

  get noiseOffset(): { x: number; y: number } {
    const offset = this.resources.biomeBlendUniforms.uniforms.uNoiseOffset;
    return { x: offset[0], y: offset[1] };
  }

  set noiseOffset(value: { x: number; y: number }) {
    this.resources.biomeBlendUniforms.uniforms.uNoiseOffset = [value.x, value.y];
  }

  get blendTexture(): Texture {
    return this._blendTexture;
  }

  set blendTexture(value: Texture) {
    this._blendTexture = value;
    this.resources.uBlendTexture = value.source;
  }
}
