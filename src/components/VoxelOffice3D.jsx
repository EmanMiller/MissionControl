import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VoxelOffice3D = ({ user, agents }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0F0F0F); // Dark background matching theme
    
    // Isometric camera setup - pulled back to show entire room
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const frustumSize = 16; // Increased from 10 to show more of the room
    const camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, // left
      frustumSize * aspect / 2,  // right
      frustumSize / 2,           // top
      frustumSize / -2,          // bottom
      1,                         // near
      1000                       // far
    );
    
    // Position camera for isometric view - pulled back further
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting - much brighter with warm overhead light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2); // Increased from 0.6 to 1.2
    scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(15, 15, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Warm overhead light above center of room
    const overheadLight = new THREE.PointLight(0xffaa44, 0.8, 30);
    overheadLight.position.set(0, 8, 0);
    scene.add(overheadLight);

    // Create voxel office environment
    createOfficeEnvironment(scene);
    
    // Create characters
    createCharacters(scene, user, agents);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      const aspect = width / height;
      const currentFrustumSize = 16; // Match the frustumSize used above
      
      camera.left = currentFrustumSize * aspect / -2;
      camera.right = currentFrustumSize * aspect / 2;
      camera.top = currentFrustumSize / 2;
      camera.bottom = currentFrustumSize / -2;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [user, agents]);

  return (
    <div 
      ref={mountRef} 
      className="w-full border border-[#333333] rounded-lg overflow-hidden"
      style={{ height: '400px', minHeight: '400px' }}
    />
  );
};

function createOfficeEnvironment(scene) {
  // Floor - larger and fully visible
  const floorGeometry = new THREE.BoxGeometry(18, 0.2, 18);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown floor
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, -0.1, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall only - no side walls to avoid clipping
  const wallGeometry = new THREE.BoxGeometry(16, 6, 0.2);
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x2A2A2A }); // Dark gray wall
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 3, -8);
  scene.add(backWall);

  // Windows on back wall
  createWindow(scene, -3, 4, -7.9);
  createWindow(scene, 0, 4, -7.9);
  createWindow(scene, 3, 4, -7.9);
}

function createWindow(scene, x, y, z) {
  const windowGeometry = new THREE.BoxGeometry(1.5, 1.2, 0.1);
  const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x1E40AF }); // Blue window
  const window = new THREE.Mesh(windowGeometry, windowMaterial);
  window.position.set(x, y, z);
  scene.add(window);

  // Window frame
  const frameGeometry = new THREE.BoxGeometry(1.7, 1.4, 0.05);
  const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.set(x, y, z - 0.05);
  scene.add(frame);
}

function createDesk(scene, x, y, z, color) {
  // Desk surface
  const deskGeometry = new THREE.BoxGeometry(2.5, 0.1, 1.5);
  const deskMaterial = new THREE.MeshLambertMaterial({ color });
  const desk = new THREE.Mesh(deskGeometry, deskMaterial);
  desk.position.set(x, y, z);
  desk.castShadow = true;
  desk.receiveShadow = true;
  scene.add(desk);

  // Desk legs
  const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
  const legMaterial = new THREE.MeshLambertMaterial({ color: color - 0x111111 });
  
  const positions = [
    [-1.1, 0, -0.6], [1.1, 0, -0.6], 
    [-1.1, 0, 0.6], [1.1, 0, 0.6]
  ];
  
  positions.forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x + lx, ly, z + lz);
    leg.castShadow = true;
    scene.add(leg);
  });

  // Monitor on desk
  createMonitor(scene, x, y + 0.05, z - 0.3);
  
  // Keyboard
  createKeyboard(scene, x, y + 0.05, z + 0.4);
  
  // Phone (occasionally)
  if (Math.random() > 0.5) {
    createPhone(scene, x - 0.8, y + 0.05, z + 0.2);
  }
}

function createMonitor(scene, x, y, z) {
  // Monitor screen
  const screenGeometry = new THREE.BoxGeometry(1, 0.6, 0.05);
  const screenMaterial = new THREE.MeshLambertMaterial({ color: 0x001122 }); // Dark blue screen
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.set(x, y + 0.8, z);
  scene.add(screen);

  // Monitor base
  const baseGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
  const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(x, y + 0.3, z);
  scene.add(base);

  // Monitor stand
  const standGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.05);
  const stand = new THREE.Mesh(standGeometry, baseMaterial);
  stand.position.set(x, y + 0.5, z);
  scene.add(stand);
}

function createKeyboard(scene, x, y, z) {
  const keyboardGeometry = new THREE.BoxGeometry(0.8, 0.02, 0.3);
  const keyboardMaterial = new THREE.MeshLambertMaterial({ color: 0xE5E7EB }); // Light gray
  const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
  keyboard.position.set(x, y + 0.06, z);
  scene.add(keyboard);
}

function createPhone(scene, x, y, z) {
  const phoneGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.25);
  const phoneMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const phone = new THREE.Mesh(phoneGeometry, phoneMaterial);
  phone.position.set(x, y + 0.08, z);
  scene.add(phone);
}

function createCharacters(scene, user, agents) {
  // Generate desk positions dynamically based on number of agents
  // Layout: User center front, agents in semi-circle behind/beside
  const deskPositions = generateDeskPositions(agents.length);

  // Create desk and character for user (always at position 0)
  createDesk(scene, deskPositions[0].x, 0.5, deskPositions[0].z, 0x654321);
  createVoxelCharacter(scene, deskPositions[0].x, 1, deskPositions[0].z + 1, 0xF59E0B, user.name, 'active');
  
  // Create desk and character for each agent
  agents.forEach((agent, index) => {
    const pos = deskPositions[index + 1]; // Skip position 0 (user)
    if (pos) {
      // Vary desk color slightly for visual variety
      const deskColor = 0x654321 + (index * 0x111111); 
      createDesk(scene, pos.x, 0.5, pos.z, deskColor);
      createVoxelCharacter(scene, pos.x, 1, pos.z + 1, agent.color, agent.name, agent.status);
    }
  });
}

// Dynamically generate desk positions based on number of agents
function generateDeskPositions(agentCount) {
  const positions = [{ x: 0, z: -2 }]; // User always center front
  
  // Start with 1 user position, add agents in semi-circle pattern
  // Layout grows outward: start close, expand circle as needed
  
  if (agentCount === 0) {
    return positions; // Just user
  }
  
  if (agentCount === 1) {
    // One agent - position to the side
    positions.push({ x: -5, z: -2 });
  } else if (agentCount === 2) {
    // Two agents - one on each side
    positions.push({ x: -5, z: -2 });
    positions.push({ x: 5, z: -2 });
  } else if (agentCount <= 4) {
    // 3-4 agents: semi-circle behind and beside user
    positions.push({ x: -5, z: -2 });
    positions.push({ x: 5, z: -2 });
    positions.push({ x: -5, z: 3 });
    if (agentCount === 4) {
      positions.push({ x: 5, z: 3 });
    }
  } else {
    // 5+ agents: Expand outward in a larger pattern
    const basePositions = [
      { x: -5, z: -2 },
      { x: 5, z: -2 },
      { x: -5, z: 3 },
      { x: 5, z: 3 },
      { x: 0, z: 3 }
    ];
    positions.push(...basePositions);
    
    // For agents 6+, add to outer ring
    for (let i = 5; i < agentCount; i++) {
      const angle = ((i - 5) / (agentCount - 5)) * Math.PI; // Semi-circle
      const radius = 6;
      const x = -radius * Math.cos(angle); // Left side emphasis
      const z = -2 + radius * Math.sin(angle) * 0.5;
      positions.push({ x, z });
    }
  }
  
  return positions;
}

function createVoxelCharacter(scene, x, y, z, color, name, status = 'active') {
  const group = new THREE.Group();
  
  // Body - made larger
  const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.6);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0.6, 0);
  body.castShadow = true;
  group.add(body);

  // Head - made larger
  const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const headMaterial = new THREE.MeshLambertMaterial({ 
    color: color === 0xF59E0B ? 0xFDE68A : new THREE.Color(color).multiplyScalar(1.2).getHex() 
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 1.5, 0);
  head.castShadow = true;
  group.add(head);

  // Arms - made larger
  const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
  const armMaterial = new THREE.MeshLambertMaterial({ color });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.6, 0.6, 0);
  leftArm.castShadow = true;
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.6, 0.6, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // Status indicator (larger colored dot on head)
  if (status) {
    const statusGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const statusColor = status === 'active' ? 0x10B981 : 0x6B7280; // Green for active, gray for idle
    const statusMaterial = new THREE.MeshLambertMaterial({ color: statusColor });
    const statusDot = new THREE.Mesh(statusGeometry, statusMaterial);
    statusDot.position.set(0.3, 1.8, 0.3);
    group.add(statusDot);
  }

  // Floating name label using canvas texture
  createFloatingNameLabel(group, name);

  // Position the character group
  group.position.set(x, y, z);
  scene.add(group);

  group.userData = { name, status, position: { x, y, z } };
  
  return group;
}

function createFloatingNameLabel(characterGroup, name) {
  // Create canvas for text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = 256;
  canvas.height = 64;
  
  // Configure text style
  context.fillStyle = '#F9FAFB'; // Light text color
  context.font = 'bold 24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Add semi-transparent background
  context.fillStyle = 'rgba(17, 17, 17, 0.8)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw text
  context.fillStyle = '#F9FAFB';
  context.fillText(name, canvas.width / 2, canvas.height / 2);
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // Create sprite material
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    alphaTest: 0.1
  });
  
  // Create sprite
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(2, 0.5, 1); // Make it reasonably sized
  sprite.position.set(0, 2.5, 0); // Float above character head
  
  characterGroup.add(sprite);
  
  return sprite;
}

export default VoxelOffice3D;