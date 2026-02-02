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

// Each biome overlay has its own filter with specific visibility logic
const fragment = `
  precision highp float;

  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform sampler2D uTemperatureNoise;
  uniform sampler2D uHumidityNoise;
  uniform vec2 uWorldOffset;
  uniform vec2 uViewportSize;
  uniform float uTextureSize;
  uniform int uBiomeType; // 0=ice, 1=desert, 2=swamp, 3=volcanic
  uniform float uEdgeSoftness;

  void main(void) {
    vec4 biomeColor = texture(uTexture, vTextureCoord);
    
    // Calculate world coordinate for this pixel
    // vTextureCoord is in screen space (0-1), we need world space
    vec2 screenPos = vTextureCoord * uViewportSize;
    vec2 worldPos = screenPos + uWorldOffset;
    
    // Sample noise at world coordinates with appropriate scale for large biome regions
    float noiseScale = 0.0003; // Very large scale for continent-sized biomes
    vec2 noiseCoord = worldPos * noiseScale;
    
    // Use fract to make noise coordinates repeat for seamless tiling
    vec2 tempCoord = fract(noiseCoord);
    vec2 humidCoord = fract(noiseCoord + vec2(0.37, 0.73)); // Offset for different pattern
    
    float temperature = texture(uTemperatureNoise, tempCoord).r;
    float humidity = texture(uHumidityNoise, humidCoord).r;
    
    float visibility = 0.0;
    float softness = uEdgeSoftness;
    
    // Biome visibility based on temperature and humidity
    if (uBiomeType == 0) {
      // ICE: cold areas (low temperature)
      visibility = smoothstep(0.35 + softness, 0.35 - softness, temperature);
    } else if (uBiomeType == 1) {
      // DESERT: hot and dry (high temp, low humidity)
      float hotness = smoothstep(0.65 - softness, 0.65 + softness, temperature);
      float dryness = smoothstep(0.4 + softness, 0.4 - softness, humidity);
      visibility = hotness * dryness;
    } else if (uBiomeType == 2) {
      // SWAMP: wet areas (high humidity), not too cold
      float wetness = smoothstep(0.6 - softness, 0.6 + softness, humidity);
      float warmEnough = smoothstep(0.25 - softness, 0.25 + softness, temperature);
      visibility = wetness * warmEnough;
    } else if (uBiomeType == 3) {
      // VOLCANIC: extreme heat (very high temperature)
      visibility = smoothstep(0.8 - softness, 0.8 + softness, temperature);
    }
    
    // Apply visibility as alpha mask
    finalColor = vec4(biomeColor.rgb, biomeColor.a * visibility);
  }
`;

export type BiomeType = 'ice' | 'desert' | 'swamp' | 'volcanic';

const BIOME_TYPE_MAP: Record<BiomeType, number> = {
  ice: 0,
  desert: 1,
  swamp: 2,
  volcanic: 3,
};

export interface BiomeAlphaFilterOptions {
  temperatureNoise: Texture;
  humidityNoise: Texture;
  biomeType: BiomeType;
  viewportSize: { width: number; height: number };
  textureSize?: number;
  edgeSoftness?: number;
}

export class BiomeAlphaFilter extends Filter {
  private _temperatureNoise: Texture;
  private _humidityNoise: Texture;

  constructor(options: BiomeAlphaFilterOptions) {
    const glProgram = GlProgram.from({
      vertex,
      fragment,
      name: 'biome-alpha-filter',
    });

    super({
      glProgram,
      resources: {
        biomeAlphaUniforms: {
          uWorldOffset: { value: [0, 0], type: 'vec2<f32>' },
          uViewportSize: { value: [options.viewportSize.width, options.viewportSize.height], type: 'vec2<f32>' },
          uTextureSize: { value: options.textureSize ?? 512, type: 'f32' },
          uBiomeType: { value: BIOME_TYPE_MAP[options.biomeType], type: 'i32' },
          uEdgeSoftness: { value: options.edgeSoftness ?? 0.08, type: 'f32' },
        },
        uTemperatureNoise: options.temperatureNoise.source,
        uHumidityNoise: options.humidityNoise.source,
      },
    });

    this._temperatureNoise = options.temperatureNoise;
    this._humidityNoise = options.humidityNoise;
  }

  get worldOffset(): { x: number; y: number } {
    const offset = this.resources.biomeAlphaUniforms.uniforms.uWorldOffset;
    return { x: offset[0], y: offset[1] };
  }

  set worldOffset(value: { x: number; y: number }) {
    this.resources.biomeAlphaUniforms.uniforms.uWorldOffset = [value.x, value.y];
  }

  get viewportSize(): { width: number; height: number } {
    const size = this.resources.biomeAlphaUniforms.uniforms.uViewportSize;
    return { width: size[0], height: size[1] };
  }

  set viewportSize(value: { width: number; height: number }) {
    this.resources.biomeAlphaUniforms.uniforms.uViewportSize = [value.width, value.height];
  }

  get edgeSoftness(): number {
    return this.resources.biomeAlphaUniforms.uniforms.uEdgeSoftness;
  }

  set edgeSoftness(value: number) {
    this.resources.biomeAlphaUniforms.uniforms.uEdgeSoftness = value;
  }
}
