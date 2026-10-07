// Interactive 3D Mesh Engine for Sydney Talcott Portfolio
// Built with WebGL / Three.js (loaded from the work template)

document.addEventListener('DOMContentLoaded', () => {
  // Each [data-mesh] container renders one mesh; data-shape picks the geometry
  document.querySelectorAll('[data-mesh]').forEach(initInteractiveMesh);
});

function initInteractiveMesh(container) {
  const canvas = container.querySelector('canvas');

  if (!canvas || typeof THREE === 'undefined') return;

  // Scene setup
  const scene = new THREE.Scene();

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  const viewDir = new THREE.Vector3(0, 0.4, 1).normalize();
  let fitDistance = 30;
  camera.position.copy(viewDir).multiplyScalar(fitDistance);
  camera.lookAt(0, 0, 0);

  // Place the camera far enough that the mesh's bounding sphere (which is what
  // sweeps out as it rotates about its center) always stays inside the frame.
  function fitCamera(radius) {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    fitDistance = (radius * 1.05 * fitScale) / Math.sin(Math.min(vHalf, hHalf));
    camera.position.copy(viewDir).multiplyScalar(fitDistance);
    camera.lookAt(0, 0, 0);
  }
  let boundRadius = 14;
  // Optional per-page tuning: data-fit scales the camera distance, data-wheel-zoom="false" leaves page scroll alone
  const fitScale = parseFloat(container.dataset.fit) || 1;
  const wheelZoom = container.dataset.wheelZoom !== 'false';

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x2a2e3d, 1.2);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(10, 15, 10);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x4466aa, 1.0);
  fillLight.position.set(-10, -5, -8);
  scene.add(fillLight);

  const accentLight = new THREE.PointLight(0xffffff, 2, 20);
  accentLight.position.set(0, 4, 0);
  scene.add(accentLight);

  // State Management
  const state = {
    geometryType: container.dataset.shape || 'terrain', // terrain, geosphere, torusknot, waveplane
    renderMode: container.dataset.render || 'dual', // wireframe, solid, dual, points, dots (white fill + dots)
    speed: 1.0,
    amplitude: 0.8,
    frequency: 0.6,
    autoRotate: true,
    mouseRipple: true,
    mouseX: 0,
    mouseY: 0,
    targetRotationX: 0.35,
    targetRotationY: 0,
    currentRotationX: 0.35,
    currentRotationY: 0,
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    pointerRayX: 0,
    pointerRayY: 0,
    lastTime: performance.now()
  };

  // Mesh objects container
  let meshGroup = new THREE.Group();
  scene.add(meshGroup);

  let solidMesh = null;
  let wireMesh = null;
  let pointCloud = null;
  let basePositions = [];
  let vertexCount = 0;

  // Geometry Generators
  function buildGeometry(type) {
    // Clear old meshes
    while (meshGroup.children.length > 0) {
      const obj = meshGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
      meshGroup.remove(obj);
    }

    let geom;
    if (type === 'terrain') {
      geom = new THREE.PlaneGeometry(16, 16, 52, 52);
      geom.rotateX(-Math.PI / 2.3);
    } else if (type === 'geosphere') {
      geom = new THREE.IcosahedronGeometry(4, 4);
    } else if (type === 'torusknot') {
      geom = new THREE.TorusKnotGeometry(3, 0.9, 120, 24, 2, 3);
    } else if (type === 'waveplane') {
      geom = new THREE.PlaneGeometry(20, 10, 60, 30);
      geom.rotateX(-Math.PI / 3);
    } else {
      geom = new THREE.PlaneGeometry(16, 16, 50, 50);
      geom.rotateX(-Math.PI / 2.2);
    }

    // Cache original vertex positions for procedural deformation
    const posAttr = geom.attributes.position;
    basePositions = new Float32Array(posAttr.array.length);
    basePositions.set(posAttr.array);
    vertexCount = posAttr.count;

    // Furthest vertex from the origin, plus headroom for the wave displacement
    let maxLen = 0;
    for (let i = 0; i < posAttr.count; i++) {
      maxLen = Math.max(maxLen, Math.hypot(basePositions[i * 3], basePositions[i * 3 + 1], basePositions[i * 3 + 2]));
    }
    boundRadius = maxLen + 2.5;
    fitCamera(boundRadius);

    // Materials
    // Flat white fill matches the page so the black wireframe reads as floating line work
    const solidMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      // Push the fill back slightly so dots sitting on the surface aren't z-fought away
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true
    });

    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x000000,
      size: 0.15
    });

    // Create representations based on render mode
    solidMesh = new THREE.Mesh(geom.clone(), solidMaterial);
    wireMesh = new THREE.Mesh(geom.clone(), wireMaterial);
    pointCloud = new THREE.Points(geom.clone(), pointsMaterial);

    updateVisibility();
  }

  function updateVisibility() {
    meshGroup.clear();

    if (state.renderMode === 'wireframe') {
      meshGroup.add(wireMesh);
    } else if (state.renderMode === 'solid') {
      meshGroup.add(solidMesh);
    } else if (state.renderMode === 'dual') {
      meshGroup.add(solidMesh);
      meshGroup.add(wireMesh);
    } else if (state.renderMode === 'dots') {
      meshGroup.add(solidMesh);
      meshGroup.add(pointCloud);
    } else if (state.renderMode === 'points') {
      meshGroup.add(pointCloud);
    }
  }

  // Initial build
  buildGeometry(state.geometryType);

  // Mouse & Touch Controls
  canvas.addEventListener('mousedown', (e) => {
    state.isDragging = true;
    state.prevMouseX = e.clientX;
    state.prevMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    state.isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      // Normalized pointer coordinates (-1 to 1)
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      state.pointerRayX = nx * 8;
      state.pointerRayY = ny * 8;
    }

    if (state.isDragging) {
      const deltaX = e.clientX - state.prevMouseX;
      const deltaY = e.clientY - state.prevMouseY;
      state.targetRotationY += deltaX * 0.008;
      state.targetRotationX += deltaY * 0.008;
      state.prevMouseX = e.clientX;
      state.prevMouseY = e.clientY;
    }
  });

  // Touch handlers
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      state.isDragging = true;
      state.prevMouseX = e.touches[0].clientX;
      state.prevMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    state.isDragging = false;
  });

  window.addEventListener('touchmove', (e) => {
    if (state.isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - state.prevMouseX;
      const deltaY = e.touches[0].clientY - state.prevMouseY;
      state.targetRotationY += deltaX * 0.01;
      state.targetRotationX += deltaY * 0.01;
      state.prevMouseX = e.touches[0].clientX;
      state.prevMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  // Zoom with wheel
  canvas.addEventListener('wheel', (e) => {
    if (!wheelZoom) return;
    e.preventDefault();
    // Zoom out freely, but never in past the point where the mesh would clip
    const d = Math.max(fitDistance, Math.min(fitDistance * 1.6, camera.position.length() + e.deltaY * 0.02));
    camera.position.copy(viewDir).multiplyScalar(d);
  }, { passive: false });

  // Resize Observer
  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      fitCamera(boundRadius);
    }
  });
  resizeObserver.observe(container);

  // Animation Loop with Procedural Wave Engine
  let clock = 0;

  function animate(now) {
    requestAnimationFrame(animate);

    const delta = (now - state.lastTime) * 0.001;
    state.lastTime = now;
    clock += delta * state.speed;

    // Auto-rotation & smooth damping
    if (state.autoRotate && !state.isDragging) {
      state.targetRotationY += 0.0035 * state.speed;
    }

    state.currentRotationX += (state.targetRotationX - state.currentRotationX) * 0.08;
    state.currentRotationY += (state.targetRotationY - state.currentRotationY) * 0.08;

    meshGroup.rotation.x = state.currentRotationX;
    meshGroup.rotation.y = state.currentRotationY;

    // Update vertex wave distortion
    const meshesToUpdate = [solidMesh, wireMesh, pointCloud].filter(m => m !== null && m.parent);

    if (meshesToUpdate.length > 0 && basePositions.length > 0) {
      const targetMesh = meshesToUpdate[0];
      const posAttr = targetMesh.geometry.attributes.position;
      const arr = posAttr.array;
      const count = posAttr.count;

      const px = state.pointerRayX;
      const pz = state.pointerRayY;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const bx = basePositions[i3];
        const by = basePositions[i3 + 1];
        const bz = basePositions[i3 + 2];

        if (state.geometryType === 'terrain' || state.geometryType === 'waveplane') {
          // Harmonic undulating wave function
          const wave1 = Math.sin(bx * 0.6 + clock * 2.2) * Math.cos(bz * 0.6 + clock * 1.8);
          const wave2 = Math.sin((bx + bz) * 0.4 + clock * 1.4) * 0.5;
          const wave3 = Math.cos(Math.sqrt(bx * bx + bz * bz) * 0.8 - clock * 2.8) * 0.4;
          
          // Cursor gravity ripple
          const dist = Math.sqrt((bx - px) * (bx - px) + (bz - pz) * (bz - pz));
          const ripple = Math.exp(-dist * 0.5) * Math.sin(dist * 2.5 - clock * 6) * 0.9;

          const totalZ = (wave1 + wave2 + wave3 + ripple) * state.amplitude;
          arr[i3 + 2] = bz + totalZ;
        } else if (state.geometryType === 'geosphere') {
          // Radial pulsating surface deformation
          const len = Math.sqrt(bx * bx + by * by + bz * bz);
          const nx = bx / len;
          const ny = by / len;
          const nz = bz / len;

          const pulse = Math.sin(nx * 3 + clock * 2) * Math.cos(ny * 3 + clock * 2) * Math.sin(nz * 3 + clock * 2);
          const radialDistort = 1.0 + pulse * 0.22 * state.amplitude;

          arr[i3] = bx * radialDistort;
          arr[i3 + 1] = by * radialDistort;
          arr[i3 + 2] = bz * radialDistort;
        } else if (state.geometryType === 'torusknot') {
          // Twisting harmonic ripple along knot
          const angle = Math.atan2(by, bx);
          const ripple = Math.sin(angle * 5 + clock * 3) * 0.25 * state.amplitude;
          arr[i3] = bx * (1 + ripple);
          arr[i3 + 1] = by * (1 + ripple);
          arr[i3 + 2] = bz * (1 + ripple);
        }
      }

      // Propagate geometry changes across all active modes
      meshesToUpdate.forEach(m => {
        if (m !== targetMesh) {
          m.geometry.attributes.position.array.set(arr);
          m.geometry.attributes.position.needsUpdate = true;
          if (m.geometry.computeVertexNormals) m.geometry.computeVertexNormals();
        }
      });

      targetMesh.geometry.attributes.position.needsUpdate = true;
      if (targetMesh.geometry.computeVertexNormals) {
        targetMesh.geometry.computeVertexNormals();
      }
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
}
