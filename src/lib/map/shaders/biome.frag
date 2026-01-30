
// biome.frag
varying vec2 vTextureCoord;
uniform sampler2D uSampler; // The Texture being rendered (usually transparent in this case if we use filter on container)

uniform sampler2D uTexture1; // Biome A
uniform sampler2D uTexture2; // Biome B
uniform sampler2D uNoise;    // Noise Map

uniform float uBlendThreshold; // 0.0 - 1.0 (Where the transition happens)
uniform float uSmoothness;     // 0.01 - 0.5 (Softness of edge)
uniform vec2 uDimensions;      // Chunk Dimensions in pixels

void main(void) {
    // Sample textures
    vec4 color1 = texture2D(uTexture1, vTextureCoord);
    vec4 color2 = texture2D(uTexture2, vTextureCoord);
    vec4 noise = texture2D(uNoise, vTextureCoord);
    
    // Calculate blend factor based on noise red channel
    // smoothstep(edge0, edge1, x)
    float alpha = smoothstep(uBlendThreshold - uSmoothness, uBlendThreshold + uSmoothness, noise.r);
    
    // Mix colors
    gl_FragColor = mix(color1, color2, alpha);
}
