// main.js - Three.js 3D Universe Setup

const initThreeJS = () => {
    const canvas = document.querySelector('#bg-canvas');
    
    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 500;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Fog for depth
    scene.fog = new THREE.FogExp2(0x03010a, 0.001);

    // --- STARS PARALLAX ---
    const createStarField = (count, size, colorHex) => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for(let i=0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 2000;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            size: size,
            color: colorHex,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        return new THREE.Points(geometry, material);
    };

    const starsFar = createStarField(3000, 1.5, 0xffffff); // White stars
    const starsMid = createStarField(1500, 2.5, 0x00f0ff); // Cyan stars
    const starsNear = createStarField(800, 3.5, 0xff007f); // Pink stars

    scene.add(starsFar);
    scene.add(starsMid);
    scene.add(starsNear);

    // --- FALLING METEORS ---
    const meteors = [];
    const meteorCount = 15;
    
    const meteorMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.9 
    });

    for(let i=0; i < meteorCount; i++) {
        // A thin long cylinder represents a meteor streak
        const length = Math.random() * 80 + 20;
        const geometry = new THREE.CylinderGeometry(0.2, 0.2, length, 4);
        // Rotate to make it point along Z axis for movement
        geometry.rotateX(Math.PI / 2);
        
        const meteor = new THREE.Mesh(geometry, meteorMaterial);
        
        // Random starting position
        meteor.position.x = (Math.random() - 0.5) * 2000;
        meteor.position.y = (Math.random() - 0.5) * 2000;
        meteor.position.z = (Math.random() - 0.5) * 2000;
        
        // Random speed
        meteor.userData = {
            speed: Math.random() * 5 + 5,
            length: length
        };
        
        // Point meteors diagonally down and towards camera
        meteor.rotation.x = Math.PI / 4;
        meteor.rotation.y = -Math.PI / 4;
        
        scene.add(meteor);
        meteors.push(meteor);
    }

    // --- MOUSE PARALLAX INTERACTION ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // --- RESIZE HANDLER ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        
        // Target easing for smooth parallax
        targetX = mouseX * 0.05;
        targetY = mouseY * 0.05;
        
        // Move camera slightly based on mouse
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (-targetY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        // Slow rotation of starfields
        starsFar.rotation.y += 0.0001;
        starsMid.rotation.y += 0.0002;
        starsNear.rotation.y += 0.0003;
        starsNear.rotation.z += 0.0001;

        // Meteor animation
        meteors.forEach(meteor => {
            // Move meteor diagonally
            meteor.position.x -= meteor.userData.speed;
            meteor.position.y -= meteor.userData.speed;
            meteor.position.z += meteor.userData.speed;

            // Reset meteor if it goes out of bounds
            if (meteor.position.y < -1000 || meteor.position.z > 1000) {
                meteor.position.x = (Math.random() - 0.5) * 2000 + 500;
                meteor.position.y = Math.random() * 1000 + 500;
                meteor.position.z = Math.random() * -1000;
            }
        });

        renderer.render(scene, camera);
    };

    animate();
};

window.addEventListener('DOMContentLoaded', initThreeJS);
