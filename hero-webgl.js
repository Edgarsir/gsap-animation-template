/**
 * Ripple Distortion Slider
 * Hero slider with ripple/distortion transition effect
 */

class HeroWebGL {
    constructor(options = {}) {
        this.canvas = document.getElementById(options.canvasId || 'hero-canvas');
        this.images = options.images || [
            'hero-1.jpg',
            'hero-2.jpg',
            'hero-3.jpg',
            'hero-4.jpg',
            'hero-5.jpg'
        ];
        this.textImage = options.textImage || 'catch_copy_mobile.png';  // Vertical text
        this.autoPlayInterval = options.autoPlayInterval || 5500;
        this.currentIndex = 0;
        this.isAnimating = false;
        this.textures = [];
        this.textTexture = null;  // Vertical scrolling text texture
        this.imageSizes = [];
        this.uniforms = null;
        this.mesh = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.scrollY = 0;
        this.time = 0;  // For animation
        
        // Store tween references for cleanup
        this.tweenZoomRatioCurrent = null;
        this.tweenZoomRatioNext = null;
        this.tweenProgress = null;
        this.tweenFadeProgress = null;
        this.tweenDistortionProgress = null;
        
        this.init();
    }

    // Vertex Shader
    get vertexShader() {
        return `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    // Fragment Shader - With vertical scrolling text
    get fragmentShader() {
        return `
            precision mediump float;
            
            const float PI = 3.1415926535897932384626433832795;
            
            vec2 rotation2d(vec2 v, float a) {
                float s = sin(a);
                float c = cos(a);
                mat2 m = mat2(c, -s, s, c);
                return m * v;
            }
            
            vec2 scale2d(vec2 _uv, float ratio) {
                _uv -= 0.5;
                _uv /= ratio;
                _uv += 0.5;
                return _uv;
            }
            
            vec2 scale2dWide(vec2 _uv, float ratioX, float ratioY) {
                _uv -= 0.5;
                _uv.x /= ratioX;
                _uv.y /= ratioY;
                _uv += 0.5;
                return _uv;
            }
            
            varying vec2 vUv;
            
            uniform vec2 uMeshSize;
            uniform vec2 uImageSize;
            uniform vec2 uTextSize;
            uniform float uTime;
            uniform float uOpacity;
            uniform float uScrollY;
            uniform float uIsStarted;
            uniform float uSlideTransitionProgress;
            uniform float uSlideTransitionFadeProgress;
            uniform float uTransitionDistortionProgress;
            uniform float uZoomRatioCurrent;
            uniform float uZoomRatioNext;
            uniform sampler2D uTextureCurrent;
            uniform sampler2D uTextureNext;
            uniform sampler2D uTextureText;
            uniform float uTextScrollSpeed;  // Dynamic scroll speed
            uniform float uMaskIn;  // 1.0 at start, animates to 0.0
            uniform float uTransitionProgressIn;  // Cumulative progress for scroll boost
            uniform vec3 uTextColor;  // Text tint color
            
            const float RSQ_LIMIT_RATIO = 0.;
            const float UV_DISTORTION_RATIO = -4.25;
            
            // Wave effect constants (stronger)
            const float TRANSITION_WAVE_RATIO = 8.0;  // Was 4.0
            const float WAVE_TIME_RATIO = 1.6667;
            const vec2 WAVE_TRANSITION_AMPLITUDE_RATIO = vec2(0.025, 0.01);  // Was (0.0125, 0.005)
            const float TIME_TRANSLATE_RATIO = 0.008333;  // Continuous scroll speed
            
            float checkScale(float distortion, float rsqLimit) {
                float distPluse = 1. + distortion * rsqLimit;
                float distMinus = 1. / (1. - distortion * rsqLimit);
                return mix(distPluse, distMinus, step(distortion, 0.));
            }
            
            void main(void) {
                float meshAspectXY = uMeshSize.x / uMeshSize.y;
                float meshAspectYX = uMeshSize.y / uMeshSize.x;
                float uvSizeAspectRatio = min(meshAspectXY, meshAspectYX);
                
                // Dynamic aspect ratio from actual image dimensions
                float imageAspect = uImageSize.x / uImageSize.y;
                float TEX_ASPECT = imageAspect;
                
                vec4 cBlack = vec4(0., 0., 0., 1.);
                
                vec2 uvNormal = vec2(vUv - 0.5);
                vec2 uvCircle = vUv * 2. - 1.;
                
                // Parallax effect
                uvNormal.y += uScrollY * 0.0005;
                uvNormal /= 1. + uScrollY * 0.000125;
                
                // Aspect ratio correction for distortion
                uvNormal = mix(
                    vec2(uvNormal.x / (meshAspectYX / TEX_ASPECT), uvNormal.y),
                    vec2(uvNormal.x, uvNormal.y / (meshAspectXY * TEX_ASPECT)),
                    step(meshAspectYX, TEX_ASPECT)
                );
                
                float uvNormalx2 = pow(uvNormal.x / TEX_ASPECT, 2.);
                float uvNormaly2 = pow(uvNormal.y, 2.);
                float rsq = uvNormalx2 + uvNormaly2;
                float rsqLimit = RSQ_LIMIT_RATIO;
                
                // Current image UV with distortion
                float uvCurrentDistortion = UV_DISTORTION_RATIO * (uTransitionDistortionProgress * 0.95 + (1. - uZoomRatioCurrent) * 0.05);
                float uvScaleCurrent = checkScale(uvCurrentDistortion, rsqLimit);
                vec2 uvTextureCurrent = vec2(
                    0.5 + uvNormal.x * (1. + uvCurrentDistortion * rsq) / uvScaleCurrent,
                    0.5 + uvNormal.y * (1. + uvCurrentDistortion * rsq) / uvScaleCurrent
                );
                
                // Rotation
                uvTextureCurrent -= 0.5;
                uvTextureCurrent = rotation2d(uvTextureCurrent, 0.3 * uSlideTransitionProgress);
                uvTextureCurrent += 0.5;
                
                // Zoom out - show more of image
                uvTextureCurrent = scale2d(uvTextureCurrent, 0.6);
                
                vec4 cTextureCurrent = texture2D(uTextureCurrent, uvTextureCurrent);
                cTextureCurrent = mix(cBlack, cTextureCurrent, uIsStarted);
                cTextureCurrent = mix(cBlack, cTextureCurrent, 1. - uTransitionDistortionProgress);
                
                // Next image UV with distortion
                float uvNextDistortion = UV_DISTORTION_RATIO - UV_DISTORTION_RATIO * (uTransitionDistortionProgress * 0.95 + uZoomRatioNext * 0.05);
                float uvScaleNext = checkScale(uvNextDistortion, rsqLimit);
                vec2 uvTextureNext = vec2(
                    0.5 + uvNormal.x * (1. + uvNextDistortion * rsq) / uvScaleNext,
                    0.5 + uvNormal.y * (1. + uvNextDistortion * rsq) / uvScaleNext
                );
                
                // Rotation
                uvTextureNext -= 0.5;
                uvTextureNext = rotation2d(uvTextureNext, -0.9 * (1. - uSlideTransitionProgress));
                uvTextureNext += 0.5;
                
                // Zoom out - show more of image
                uvTextureNext = scale2d(uvTextureNext, 0.6);
                
                vec4 cTextureNext = texture2D(uTextureNext, uvTextureNext);
                cTextureNext = mix(cTextureCurrent, cTextureNext, uSlideTransitionFadeProgress);
                
                // Circular wipe
                uvCircle = mix(
                    vec2(uvCircle.x, uvCircle.y / meshAspectXY),
                    vec2(uvCircle.x / meshAspectYX, uvCircle.y),
                    step(uMeshSize.x, uMeshSize.y)
                );
                
                float circleLength = length(uvCircle);
                float circleScaleScrennSizeFixMultipleRatio = sqrt(1. + pow(uvSizeAspectRatio, 2.));
                circleLength /= circleScaleScrennSizeFixMultipleRatio;
                
                vec4 cDist = mix(
                    cTextureCurrent,
                    cTextureNext,
                    smoothstep(
                        circleLength - 1. + 0.9999 * (1. - uSlideTransitionProgress),
                        circleLength,
                        uSlideTransitionProgress
                    )
                );
                
                float progressNext = smoothstep(
                    circleLength - 1. + 0.9999 * (1. - uSlideTransitionProgress),
                    circleLength,
                    uSlideTransitionProgress
                );
                
                cDist = mix(cDist, cTextureNext, progressNext);
                
                // ============================================
                // VERTICAL SCROLLING TEXT - FIXED WAVE EFFECT
                // ============================================
                float textWidth = uTextSize.x / uMeshSize.x * 0.9;  // Text width - thinner
                float textCenterX = 0.5;  // Center of screen
                
                // Check if we're in the text column area
                float textLeftEdge = textCenterX - textWidth * 0.5;
                float textRightEdge = textCenterX + textWidth * 0.5;
                
                // Smooth edge mask for text area
                float textMask = smoothstep(textLeftEdge - 0.01, textLeftEdge + 0.01, vUv.x) * 
                                 smoothstep(textRightEdge + 0.01, textRightEdge - 0.01, vUv.x);
                
                if (textMask > 0.0) {
                    // Calculate UV for text texture
                    vec2 textUV;
                    textUV.x = (vUv.x - textLeftEdge) / textWidth;
                    textUV.y = vUv.y;
                    
                    // ========== WAVE EFFECT - APPLY FIRST! ==========
                    float waveTransitionProgress = mix(uTransitionDistortionProgress, 1.0 - uTransitionDistortionProgress, step(0.5, uTransitionDistortionProgress));
                    
                    vec2 waveTransition = vec2(
                        sin((textUV.y + uTime * WAVE_TIME_RATIO + uTransitionDistortionProgress * 0.35) * 2.0 * PI) * WAVE_TRANSITION_AMPLITUDE_RATIO.x,
                        sin((textUV.y + uTime * WAVE_TIME_RATIO) * 0.5 * PI) * WAVE_TRANSITION_AMPLITUDE_RATIO.y
                    );
                    
                    // KEY FIX: Add uMaskIn to wave intensity!
                    textUV += waveTransition * (waveTransitionProgress + uMaskIn) * TRANSITION_WAVE_RATIO;
                    
                    // ========== NOW DO UV ADJUSTMENTS ==========
                    // Aspect ratio adjustment
                    float textAspect = uTextSize.y / uTextSize.x;
                    float screenTextHeight = textWidth * textAspect * 0.8;
                    
                    // Scrolling - continuous + transition boost
                    textUV.y = textUV.y / screenTextHeight;
                    textUV.y += uTime * TIME_TRANSLATE_RATIO;  // Continuous slow scroll
                    textUV.y += uTransitionProgressIn * 0.1575;  // Boost during transition
                    textUV.y += uScrollY * 0.000125;  // Parallax
                    textUV.y = mod(textUV.y, 1.0);  // Loop
                    
                    // Rotation (synced with background)
                    float textRotation = mix(0.3 * uSlideTransitionProgress, -0.9 * (1.0 - uSlideTransitionProgress), uSlideTransitionProgress);
                    textUV -= 0.5;
                    textUV = rotation2d(textUV, textRotation * 0.3);
                    textUV += 0.5;
                    
                    // Sample text texture
                    vec4 textColor = texture2D(uTextureText, textUV);
                    
                    // Apply tint color to text
                    vec3 tintedText = uTextColor * textColor.a;
                    
                    // Fade text during transition peak
                    float textFade = 1.0 - waveTransitionProgress * 0.3;
                    
                    // Blend text over background
                    cDist = mix(cDist, vec4(tintedText, 1.0), textColor.a * textMask * textFade * 0.95);
                }
                gl_FragColor = cDist;
            }
        `;
    }

    async init() {
        console.log('HeroWebGL init started');
        await this.setupThree();
        console.log('Three.js setup complete');
        await this.loadTextures();
        console.log('Textures loaded, creating mesh');
        this.createMesh();
        console.log('Mesh created');
        this.setupEventListeners();
        this.startAnimation();
        this.animate();
        console.log('HeroWebGL init complete');
    }

    async setupThree() {
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 1;
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 1);
    }

    loadTextures() {
        return new Promise((resolve) => {
            const loader = new THREE.TextureLoader();
            let loaded = 0;
            const totalToLoad = this.images.length + 1;  // +1 for text texture
            
            // Load background images
            this.images.forEach((url, index) => {
                console.log(`Loading texture ${index}: ${url}`);
                loader.load(
                    url, 
                    (texture) => {
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        texture.wrapS = THREE.ClampToEdgeWrapping;
                        texture.wrapT = THREE.ClampToEdgeWrapping;
                        
                        this.imageSizes[index] = {
                            width: texture.image.width,
                            height: texture.image.height
                        };
                        
                        this.textures[index] = texture;
                        loaded++;
                        console.log(`✓ Texture ${index} loaded (${texture.image.width}x${texture.image.height})`);
                        
                        if (loaded === totalToLoad) {
                            console.log('All textures loaded!');
                            resolve();
                        }
                    },
                    undefined,
                    (error) => {
                        console.error(`Failed to load texture ${index}: ${url}`, error);
                        loaded++;
                        if (loaded === totalToLoad) resolve();
                    }
                );
            });
            
            // Load vertical text texture
            console.log(`Loading text texture: ${this.textImage}`);
            loader.load(
                this.textImage,
                (texture) => {
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.RepeatWrapping;  // Repeat vertically for infinite scroll
                    
                    this.textTexture = texture;
                    this.textSize = {
                        width: texture.image.width,
                        height: texture.image.height
                    };
                    
                    loaded++;
                    console.log(`✓ Text texture loaded (${texture.image.width}x${texture.image.height})`);
                    
                    if (loaded === totalToLoad) {
                        console.log('All textures loaded!');
                        resolve();
                    }
                },
                undefined,
                (error) => {
                    console.error(`Failed to load text texture: ${this.textImage}`, error);
                    loaded++;
                    if (loaded === totalToLoad) resolve();
                }
            );
        });
    }

    createMesh() {
        const fov = 45 * (Math.PI / 180);
        const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
        
        const firstImgSize = this.imageSizes[0] || { width: 1280, height: 1280 };
        const textSize = this.textSize || { width: 77, height: 2048 };
        
        this.uniforms = {
            uMeshSize: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uImageSize: { value: new THREE.Vector2(firstImgSize.width, firstImgSize.height) },
            uTextSize: { value: new THREE.Vector2(textSize.width, textSize.height) },
            uTime: { value: 0 },
            uOpacity: { value: 1 },
            uScrollY: { value: 0 },
            uIsStarted: { value: 0 },
            uSlideTransitionProgress: { value: 0 },
            uSlideTransitionFadeProgress: { value: 0 },
            uTransitionDistortionProgress: { value: 0 },
            uZoomRatioCurrent: { value: 1 },
            uZoomRatioNext: { value: 0 },
            uTextureCurrent: { value: this.textures[0] },
            uTextureNext: { value: this.textures[this.textures.length - 1] },
            uTextureText: { value: this.textTexture },
            uTextScrollSpeed: { value: 0.02 },  // Base scroll speed
            uMaskIn: { value: 1.0 },  // For wave intensity at startup
            uTransitionProgressIn: { value: 0 },  // Cumulative progress for scroll boost
            uTextColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) }  // White text (R, G, B)
        };
        
        const material = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            uniforms: this.uniforms,
            transparent: false,
            depthTest: false
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.set(window.innerWidth, window.innerHeight, 1);
        this.scene.add(this.mesh);
        
        this.camera.position.z = window.innerHeight / (2 * Math.tan(fov / 2));
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        
        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
        });
        
        // Navigation dots
        document.querySelectorAll('.hero-nav-dot').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (index !== this.currentIndex && !this.isAnimating) {
                    this.goToSlide(index);
                }
            });
        });
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        const fov = 45 * (Math.PI / 180);
        this.camera.position.z = height / (2 * Math.tan(fov / 2));
        
        this.renderer.setSize(width, height);
        
        if (this.mesh) {
            this.mesh.scale.set(width, height, 1);
        }
        
        if (this.uniforms) {
            this.uniforms.uMeshSize.value.set(width, height);
        }
    }

    startAnimation() {
        // Startup animation - mask slides in (wave effect at start)
        gsap.to(this.uniforms.uMaskIn, {
            value: 0,
            duration: 0.85,
            delay: 0.15,
            ease: "power3.out"
        });
        
        gsap.delayedCall(0.25, () => {
            this.uniforms.uIsStarted.value = 1;
            this.startAutoPlay();
        });
    }

    goToSlide(index) {
        if (this.isAnimating || index === this.currentIndex) return;
        
        this.isAnimating = true;
        this.resetAutoPlay();
        
        // Track cumulative progress for text scroll boost
        this.progressCount = this.progressCount || 0;
        this.progressCount += 1;
        
        const fromIndex = this.currentIndex;
        const toIndex = index;
        
        // Set textures
        this.uniforms.uTextureCurrent.value = this.textures[fromIndex];
        this.uniforms.uTextureNext.value = this.textures[toIndex];
        
        // Update image size uniform for the next image
        const nextImgSize = this.imageSizes[toIndex] || { width: 1920, height: 1080 };
        this.uniforms.uImageSize.value.set(nextImgSize.width, nextImgSize.height);
        
        // Reset progress values
        this.uniforms.uSlideTransitionProgress.value = 0;
        this.uniforms.uTransitionDistortionProgress.value = 0;
        this.uniforms.uZoomRatioNext.value = 0;
        this.uniforms.uSlideTransitionFadeProgress.value = 0;
        
        const startZoom = this.uniforms.uZoomRatioCurrent.value;
        const targetZoom = startZoom - 4;
        
        // Kill existing tweens
        if (this.tweenZoomRatioCurrent) this.tweenZoomRatioCurrent.kill();
        if (this.tweenZoomRatioNext) this.tweenZoomRatioNext.kill();
        if (this.tweenProgress) this.tweenProgress.kill();
        if (this.tweenFadeProgress) this.tweenFadeProgress.kill();
        if (this.tweenDistortionProgress) this.tweenDistortionProgress.kill();
        
        // Zoom out current: 1.6s
        this.tweenZoomRatioCurrent = gsap.to(this.uniforms.uZoomRatioCurrent, {
            value: targetZoom,
            duration: 1.6,
            ease: "power4.inOut"
        });
        
        // Zoom in next: 5.8s
        this.tweenZoomRatioNext = gsap.to(this.uniforms.uZoomRatioNext, {
            value: 1,
            duration: 5.8,
            ease: "none"
        });
        
        // Slide transition: 1.5s
        this.tweenProgress = gsap.to(this.uniforms.uSlideTransitionProgress, {
            value: 1,
            duration: 1.5,
            ease: "power3.inOut"
        });
        
        // Fade progress: 1.5s
        this.tweenFadeProgress = gsap.to(this.uniforms.uSlideTransitionFadeProgress, {
            value: 1,
            duration: 1.5,
            ease: "none"
        });
        
        // Distortion: 1.8s - main ripple effect
        this.tweenDistortionProgress = gsap.to(this.uniforms.uTransitionDistortionProgress, {
            value: 1,
            duration: 1.8,
            ease: "power4.inOut",
            onComplete: () => {
                // Don't pause zoom animations - let them continue
                this.uniforms.uZoomRatioCurrent.value = this.uniforms.uZoomRatioNext.value;
                
                this.currentIndex = toIndex;
                this.uniforms.uIsStarted.value = 1;
                this.isAnimating = false;
                
                // Continue zoom animation smoothly
                if (this.tweenZoomRatioCurrent) this.tweenZoomRatioCurrent.kill();
                
                this.tweenZoomRatioCurrent = gsap.to(this.uniforms.uZoomRatioCurrent, {
                    value: 1,
                    duration: 4,
                    ease: "none"
                });
                
                this.updateNav();
            }
        });
        
        // Text scroll speed - increase during transition, then slow down
        gsap.to(this.uniforms.uTextScrollSpeed, {
            value: 0.15,  // Fast during transition
            duration: 0.8,
            ease: "power2.in"
        });
        
        gsap.to(this.uniforms.uTextScrollSpeed, {
            value: 0.02,  // Back to normal
            duration: 1.0,
            delay: 1.2,
            ease: "power2.out"
        });
        
        // Cumulative progress for scroll boost
        gsap.to(this.uniforms.uTransitionProgressIn, {
            value: this.progressCount,
            duration: 1.6,
            ease: "power3.inOut"
        });
    }

    next() {
        const nextIndex = (this.currentIndex + 1) % this.images.length;
        this.goToSlide(nextIndex);
    }

    prev() {
        const prevIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.goToSlide(prevIndex);
    }

    updateNav() {
        document.querySelectorAll('.hero-nav-dot').forEach((btn, index) => {
            btn.classList.toggle('active', index === this.currentIndex);
        });
    }

    startAutoPlay() {
        this.autoPlayTimer = setInterval(() => {
            if (!this.isAnimating) {
                this.next();
            }
        }, this.autoPlayInterval);
    }

    resetAutoPlay() {
        clearInterval(this.autoPlayTimer);
        this.startAutoPlay();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update time for scrolling text animation
        this.time += 0.016;  // ~60fps
        
        if (this.uniforms) {
            this.uniforms.uScrollY.value = this.scrollY;
            this.uniforms.uTime.value = this.time;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        clearInterval(this.autoPlayTimer);
        if (this.tweenZoomRatioCurrent) this.tweenZoomRatioCurrent.kill();
        if (this.tweenZoomRatioNext) this.tweenZoomRatioNext.kill();
        if (this.tweenProgress) this.tweenProgress.kill();
        if (this.tweenFadeProgress) this.tweenFadeProgress.kill();
        if (this.tweenDistortionProgress) this.tweenDistortionProgress.kill();
        this.renderer.dispose();
        this.textures.forEach(t => t.dispose());
    }
}

// Initialize
let heroWebGL;

function initHeroWebGL() {
    console.log('initHeroWebGL called');
    
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    
    heroWebGL = new HeroWebGL({
        canvasId: 'hero-canvas',
        images: [
            'hero-1.jpg',
            'hero-2.jpg',
            'hero-3.jpg',
            'hero-4.jpg',
            'hero-5.jpg'
        ],
        autoPlayInterval: 5500
    });
    
    window.heroWebGL = heroWebGL;
}

window.initHeroWebGL = initHeroWebGL;
