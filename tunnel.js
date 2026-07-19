// ============================================
// TUNNEL - Wheel-based scroll control
// ============================================

(function() {
    'use strict';
    
    const tunnelWrapper = document.getElementById('tunnelWrapper');
    const tunnelCanvas = document.getElementById('tunnelCanvas');
    const skipBtn = document.getElementById('tunnelSkip');
    
    if (!tunnelCanvas) return;
    
    console.log('Initializing tunnel...');
    
    let ww = window.innerWidth;
    let wh = window.innerHeight;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: tunnelCanvas,
        antialias: true
    });
    renderer.setSize(ww, wh);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    
    // Scene
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, ww / wh, 0.1, 2000);
    
    // ============================================
    // TUNNEL PATH
    // ============================================
    const tunnelPoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -100),
        new THREE.Vector3(15, 8, -200),
        new THREE.Vector3(0, 0, -300),
        new THREE.Vector3(-15, -8, -400),
        new THREE.Vector3(0, 0, -500),
        new THREE.Vector3(10, 5, -600),
        new THREE.Vector3(0, 0, -700),
        new THREE.Vector3(0, 0, -800)
    ];
    
    const tunnelPath = new THREE.CatmullRomCurve3(tunnelPoints);
    tunnelPath.tension = 0.3;
    
    // Blue tube background - transparent
    const tubeGeometry = new THREE.TubeGeometry(tunnelPath, 300, 30, 32, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        color: 0x0000ff,  // Blue
        transparent: true,
        opacity: 0.2  // 20% opacity
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tube);
    
    // ============================================
    // JAMES BOND GUN BARREL EFFECT
    // ============================================
    
    // Create spiral rifling lines (gun barrel interior) - THICK
    const riflingCount = 12;
    
    for (let i = 0; i < riflingCount; i++) {
        const angle = (i / riflingCount) * Math.PI * 2;
        const linePoints = [];
        
        for (let j = 0; j <= 200; j++) {
            const t = j / 200;
            const point = tunnelPath.getPointAt(t);
            
            // Create spiral effect
            const spiralAngle = angle + (t * Math.PI * 4);
            const radius = 28;
            const offsetX = Math.cos(spiralAngle) * radius;
            const offsetY = Math.sin(spiralAngle) * radius;
            
            linePoints.push(
                new THREE.Vector3(
                    point.x + offsetX,
                    point.y + offsetY,
                    point.z
                )
            );
        }
        
        // Create thick line using TubeGeometry
        const lineCurve = new THREE.CatmullRomCurve3(linePoints);
        const tubeGeometry = new THREE.TubeGeometry(lineCurve, 200, 0.2, 8, false); // 0.2 radius - thinner
        const tubeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.9
        });
        const thickLine = new THREE.Mesh(tubeGeometry, tubeMaterial);
        
        scene.add(thickLine);
    }
    
    // ============================================
    // MUSIC NOTES
    // ============================================
    const musicNotes = [];
    const noteCount = 1000;
    
    // Create music note shapes
    function createMusicNote() {
        const group = new THREE.Group();
        
        // Note head (circle)
        const headGeometry = new THREE.CircleGeometry(0.3, 16);
        const noteMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        const head = new THREE.Mesh(headGeometry, noteMaterial);
        group.add(head);
        
        // Note stem (line)
        const stemGeometry = new THREE.BoxGeometry(0.08, 1.2, 0.08);
        const stem = new THREE.Mesh(stemGeometry, noteMaterial);
        stem.position.set(0.25, 0.6, 0);
        group.add(stem);
        
        return group;
    }
    
    // Place music notes along tunnel
    for (let i = 0; i < noteCount; i++) {
        const note = createMusicNote();
        const t = Math.random() * 0.9; // Don't place at the very end
        const point = tunnelPath.getPointAt(t);
        const radius = 8 + Math.random() * 18;
        const angle = Math.random() * Math.PI * 2;
        
        note.position.x = point.x + Math.cos(angle) * radius;
        note.position.y = point.y + Math.sin(angle) * radius;
        note.position.z = point.z;
        
        // Random rotation for variety
        note.rotation.z = Math.random() * Math.PI * 2;
        
        // Store for animation
        note.userData = {
            angle: angle,
            radius: radius,
            t: t,
            rotationSpeed: 0.01 + Math.random() * 0.02
        };
        
        musicNotes.push(note);
        scene.add(note);
    }
    
    // ============================================
    // WHITE LIGHT AT END OF TUNNEL
    // ============================================
    const endPoint = tunnelPath.getPointAt(0.95);
    
    // Bright white point light
    const endLight = new THREE.PointLight(0xffffff, 2, 100);
    endLight.position.copy(endPoint);
    scene.add(endLight);
    
    // Glowing sphere at the end
    const glowGeometry = new THREE.SphereGeometry(8, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    glowSphere.position.copy(endPoint);
    scene.add(glowSphere);

    // ============================================
    // RENDER LOOP
    // ============================================
    let progress = 0;
    let targetProgress = 0;
    let tunnelComplete = false;
    
    function onWheel(e) {
        if (tunnelComplete) return;
        
        e.preventDefault();
        const delta = e.deltaY * 0.0003;
        targetProgress = Math.min(Math.max(targetProgress + delta, 0), 0.95);
    }
    
    window.addEventListener('wheel', onWheel, { passive: false });
    
    // Skip button
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            targetProgress = 0.95;
        });
    }
    
    // ============================================
    // RENDER LOOP
    // ============================================
    function render() {
        // Smooth progress
        progress += (targetProgress - progress) * 0.05;
        
        // Camera follows tunnel
        const camPos = tunnelPath.getPointAt(progress);
        const lookPos = tunnelPath.getPointAt(Math.min(progress + 0.05, 0.95));
        
        camera.position.copy(camPos);
        camera.lookAt(lookPos);
        
        // Animate music notes - gentle rotation
        musicNotes.forEach(note => {
            note.rotation.y += note.userData.rotationSpeed;
        });
        
        // Pulse the end light
        const pulse = Math.sin(Date.now() * 0.002) * 0.3 + 1.2;
        endLight.intensity = pulse;
        glowSphere.scale.setScalar(0.9 + Math.sin(Date.now() * 0.002) * 0.1);
        
        // Check if tunnel complete
        if (progress > 0.93 && !tunnelComplete) {
            tunnelComplete = true;
            completeTunnel();
        }
        
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    
    // Initialize camera
    camera.position.copy(tunnelPath.getPointAt(0));
    camera.lookAt(tunnelPath.getPointAt(0.05));
    
    requestAnimationFrame(render);
    
    // ============================================
    // COMPLETE TUNNEL
    // ============================================
    function completeTunnel() {
        console.log('Tunnel complete, showing hero...');
        
        // Fade out tunnel
        tunnelWrapper.classList.add('hidden');
        
        // Show navigation
        const mMenu = document.querySelector('.mMenu');
        if (mMenu) {
            setTimeout(() => {
                mMenu.classList.add('visible');
            }, 400);
        }
        
        // Initialize hero WebGL after fade
        setTimeout(() => {
            if (window.initHeroWebGL) {
                window.initHeroWebGL();
            }
            
            // Remove tunnel from DOM
            setTimeout(() => {
                tunnelWrapper.classList.add('removed');
            }, 800);
        }, 400);
    }
    
    // ============================================
    // RESIZE
    // ============================================
    window.addEventListener('resize', () => {
        ww = window.innerWidth;
        wh = window.innerHeight;
        camera.aspect = ww / wh;
        camera.updateProjectionMatrix();
        renderer.setSize(ww, wh);
    });
    
    console.log('%c🌀 Tunnel Ready! Scroll to explore', 'color: #888; font-size: 14px;');
    
})();
