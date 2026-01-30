
import { Filter, GlProgram, GpuProgram, Texture } from 'pixi.js';

// Import the raw shader string (we might need to fetch it or inline it if bundler doesn't support .frag import)
// For simplicity in this environment, I'll inline the simple shader or fetch it.
// Actually, Next.js raw-loader might not be set up. I'll inline the vertex/fragment for safety.

const vertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void) {
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}
`;

const fragment = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler; 
uniform sampler2D uNoise;    

uniform float uBlendThreshold; 
uniform float uSmoothness;    

void main(void) {
    vec4 color = texture2D(uSampler, vTextureCoord);
    vec4 noiseSample = texture2D(uNoise, vTextureCoord);
    
    float noise = noiseSample.r;
    
    // alpha = 0.0 means Grassland (revealed from underneath), alpha = 1.0 means Primary Biome
    float alpha = smoothstep(uBlendThreshold - uSmoothness, uBlendThreshold + uSmoothness, noise);
    
    gl_FragColor = color * alpha;
}
`;

let SHARED_PROGRAM: GlProgram | null = null;

export class BiomeFilter extends Filter {
    constructor(noise: Texture) {
        if (!SHARED_PROGRAM) {
            SHARED_PROGRAM = new GlProgram({
                vertex,
                fragment,
                name: 'biome-filter'
            });
        }

        super({
            glProgram: SHARED_PROGRAM,
            resources: {
                uNoise: noise.source,
                uniforms: {
                    uBlendThreshold: { value: 0.5, type: 'f32' },
                    uSmoothness: { value: 0.1, type: 'f32' }
                }
            }
        });

        this.resources.uNoise = noise.source;
        this.resources.uniforms.uBlendThreshold = 0.5;
        this.resources.uniforms.uSmoothness = 0.1;
    }

    set limit(val: number) { this.resources.uniforms.uBlendThreshold = val; }
    set smoothness(val: number) { this.resources.uniforms.uSmoothness = val; }
}
