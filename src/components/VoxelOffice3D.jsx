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
    
    // Isometric camera setup
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const frustumSize = 10;
    const camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, // left
      frustumSize * aspect / 2,  // right
      frustumSize / 2,           // top
      frustumSize / -2,          // bottom
      1,                         // near
      1000                       // far
    );
    
    // Position camera for isometric view
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

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
      
      camera.left = frustumSize * aspect / -2;
      camera.right = frustumSize * aspect / 2;
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
      className="w-full h-64 border border-[#333333] rounded-lg overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  );
};

function createOfficeEnvironment(scene) {
  // Floor
  const floorGeometry = new THREE.BoxGeometry(12, 0.2, 12);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown floor
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, -0.1, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall
  const wallGeometry = new THREE.BoxGeometry(12, 6, 0.2);
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x2A2A2A }); // Dark gray wall
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 3, -6);
  scene.add(backWall);

  // Side walls
  const leftWall = new THREE.Mesh(wallGeometry.clone(), wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-6, 3, 0);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeometry.clone(), wallMaterial);
  rightWall.rotation.y = Math.PI / 2;
  rightWall.position.set(6, 3, 0);
  scene.add(rightWall);

  // Windows on back wall
  createWindow(scene, -2, 4, -5.9);
  createWindow(scene, 2, 4, -5.9);

  // Central desk
  createDesk(scene, 0, 0.5, -2, 0x654321);
  
  // Side desks
  createDesk(scene, -3.5, 0.5, 1, 0x654321);
  createDesk(scene, 3.5, 0.5, 1, 0x654321);
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
  // User character at central desk
  createVoxelCharacter(scene, 0, 1, -1, 0xF59E0B, user.name); // Orange for user
  
  // AI agents at side desks
  if (agents.length > 0) {
    createVoxelCharacter(scene, -3.5, 1, 2, agents[0].color, agents[0].name, agents[0].status);
  }
  
  if (agents.length > 1) {
    createVoxelCharacter(scene, 3.5, 1, 2, agents[1].color, agents[1].name, agents[1].status);
  }
  
  // Additional agents at back positions
  if (agents.length > 2) {
    createVoxelCharacter(scene, -2, 1, -3.5, agents[2].color, agents[2].name, agents[2].status);
  }
}

function createVoxelCharacter(scene, x, y, z, color, name, status = 'active') {
  const group = new THREE.Group();
  
  // Body
  const bodyGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0.3, 0);
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const headMaterial = new THREE.MeshLambertMaterial({ 
    color: color === 0xF59E0B ? 0xFDE68A : new THREE.Color(color).multiplyScalar(1.2).getHex() 
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 0.75, 0);
  head.castShadow = true;
  group.add(head);

  // Arms
  const armGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
  const armMaterial = new THREE.MeshLambertMaterial({ color });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.3, 0.3, 0);
  leftArm.castShadow = true;
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.3, 0.3, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // Status indicator (small colored dot on head)
  if (status) {
    const statusGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const statusColor = status === 'active' ? 0x10B981 : 0x6B7280; // Green for active, gray for idle
    const statusMaterial = new THREE.MeshLambertMaterial({ color: statusColor });
    const statusDot = new THREE.Mesh(statusGeometry, statusMaterial);
    statusDot.position.set(0.15, 0.9, 0.15);
    group.add(statusDot);
  }

  // Position the character group
  group.position.set(x, y, z);
  scene.add(group);

  // Add name label (3D text would be complex, so we'll handle this in the UI layer)
  group.userData = { name, status, position: { x, y, z } };
  
  return group;
}

export default VoxelOffice3D;