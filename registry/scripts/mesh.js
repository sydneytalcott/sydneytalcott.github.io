// Interactive 3D Mesh Engine for Sydney Talcott Portfolio
// Built with WebGL / Three.js (loaded from the work template)

document.addEventListener('DOMContentLoaded', () => {
  // Each [data-mesh] container renders one mesh; data-shape picks the geometry
  document.querySelectorAll('[data-mesh]').forEach(initInteractiveMesh);
});

// One WebGL renderer is shared by every mesh on the page (browsers cap the number of live WebGL contexts, and the
// Work page shows 16 meshes). Each mesh renders into the shared canvas, then copies the result to its own 2D canvas.
let sharedRenderer = null;
let sharedSize = { w: 0, h: 0 };
function getSharedRenderer() {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    sharedRenderer.setClearColor(0x000000, 0);
  }
  return sharedRenderer;
}

// How each shape moves: 'height' waves a flat sheet, 'radial' pulses a closed solid, 'twist' ripples a tube
const DEFORM = {
  terrain: 'height', waveplane: 'height', saddle: 'height', disc: 'height',
  geosphere: 'radial', uvsphere: 'radial', cylinder: 'radial', cone: 'radial', cube: 'radial',
  octahedron: 'radial', dodecahedron: 'radial', tetrahedron: 'radial',
  torusknot: 'twist', torus: 'twist', helix: 'twist', trefoil: 'twist'
};

function initInteractiveMesh(container) {
  const canvas = container.querySelector('canvas');

  if (!canvas || typeof THREE === 'undefined') return;

  // Visitors who ask for reduced motion get a still mesh
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    if (tightFit && tightPoints) { fitTight(); return; }
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    fitDistance = (radius * 1.05 * fitScale) / Math.sin(Math.min(vHalf, hHalf));
    camera.position.copy(viewDir).multiplyScalar(fitDistance);
    camera.lookAt(0, 0, 0);
  }
  // data-fit="tight": instead of the bounding sphere, find the closest camera distance at which the actual
  // mesh (including wave displacement) stays inside the frame at every rotation, so the mesh is as large as it can be
  const tightFit = container.dataset.fit === 'tight';
  let tightPoints = null;
  function fitTight() {
    const probe = new THREE.PerspectiveCamera(camera.fov, camera.aspect, 0.1, 200);
    const v = new THREE.Vector3();
    const euler = new THREE.Euler();
    const rotations = [];
    // Default tilt plus a little either side, around a full turn
    for (let a = 0; a < 36; a++) {
      for (const tilt of [0.35, 0.5]) rotations.push(new THREE.Euler(tilt, (a / 36) * Math.PI * 2, 0));
    }
    const fits = (d) => {
      probe.position.copy(viewDir).multiplyScalar(d);
      probe.lookAt(0, 0, 0);
      probe.updateMatrixWorld(true);
      probe.updateProjectionMatrix();
      for (const r of rotations) {
        for (let i = 0; i < tightPoints.length; i += 3) {
          v.set(tightPoints[i], tightPoints[i + 1], tightPoints[i + 2]).applyEuler(r).project(probe);
          if (Math.abs(v.x) > 0.96 || Math.abs(v.y) > 0.96) return false;
        }
      }
      return true;
    };
    let lo = 5, hi = 200;
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid; else lo = mid;
    }
    fitDistance = hi;
    camera.position.copy(viewDir).multiplyScalar(fitDistance);
    camera.lookAt(0, 0, 0);
  }
  let boundRadius = 14;
  // Optional per-page tuning: data-fit scales the camera distance, data-wheel-zoom="false" leaves page scroll alone
  const fitScale = parseFloat(container.dataset.fit) || 1;
  const wheelZoom = container.dataset.wheelZoom !== 'false';

  // Renderer setup
  const renderer = getSharedRenderer();
  const ctx = canvas.getContext('2d');
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  const sizeCanvas = () => {
    canvas.width = Math.round(container.clientWidth * pixelRatio);
    canvas.height = Math.round(container.clientHeight * pixelRatio);
  };
  sizeCanvas();

  // Skip updating and drawing a mesh while it is scrolled out of view
  let visible = true;
  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
  }).observe(container);

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
    geometryType: container.dataset.shape || 'terrain', // see buildGeometry for the shape names
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
  if (reduceMotion) state.targetRotationY = state.currentRotationY = 0.6;

  // Mesh objects container
  let meshGroup = new THREE.Group();
  scene.add(meshGroup);

  let solidMesh = null;
  let wireMesh = null;
  let pointCloud = null;
  let basePositions = [];
  let vertexCount = 0;

  // data-detail="low" builds the denser shapes with fewer segments; small tiles can't show the difference
  const detailScale = container.dataset.detail === 'low' ? 0.7 : 1;
  const seg = (n) => Math.max(3, Math.round(n * detailScale));

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
      geom = new THREE.PlaneGeometry(16, 16, seg(52), seg(52));
      geom.rotateX(-Math.PI / 2.3);
    } else if (type === 'geosphere') {
      geom = new THREE.IcosahedronGeometry(4, 4);
    } else if (type === 'torusknot') {
      geom = new THREE.TorusKnotGeometry(3, 0.9, seg(120), seg(24), 2, 3);
    } else if (type === 'waveplane') {
      geom = new THREE.PlaneGeometry(20, 10, seg(60), seg(30));
      geom.rotateX(-Math.PI / 3);
    } else if (type === 'torus') {
      geom = new THREE.TorusGeometry(3, 1.1, seg(24), seg(64));
    } else if (type === 'uvsphere') {
      geom = new THREE.SphereGeometry(4, seg(32), seg(20));
    } else if (type === 'cylinder') {
      geom = new THREE.CylinderGeometry(2.6, 2.6, 7, seg(36), seg(18), true);
    } else if (type === 'cone') {
      geom = new THREE.ConeGeometry(3.6, 7, seg(36), seg(14), true);
    } else if (type === 'cube') {
      geom = new THREE.BoxGeometry(5.5, 5.5, 5.5, seg(10), seg(10), seg(10));
    } else if (type === 'octahedron') {
      geom = new THREE.OctahedronGeometry(4.5, 4);
    } else if (type === 'dodecahedron') {
      geom = new THREE.DodecahedronGeometry(4.2, 3);
    } else if (type === 'tetrahedron') {
      geom = new THREE.TetrahedronGeometry(4.8, 4);
    } else if (type === 'saddle') {
      geom = new THREE.PlaneGeometry(14, 14, seg(40), seg(40));
      const sp = geom.attributes.position;
      for (let i = 0; i < sp.count; i++) {
        sp.setZ(i, (sp.getX(i) * sp.getX(i) - sp.getY(i) * sp.getY(i)) * 0.07);
      }
      geom.rotateX(-Math.PI / 2.6);
    } else if (type === 'disc') {
      geom = new THREE.RingGeometry(0.2, 8, seg(48), seg(18));
      geom.rotateX(-Math.PI / 2.3);
    } else if (type === 'helix') {
      const helix = new THREE.Curve();
      helix.getPoint = (t, target = new THREE.Vector3()) => {
        const a = t * Math.PI * 6;
        return target.set(Math.cos(a) * 2.6, (t - 0.5) * 9, Math.sin(a) * 2.6);
      };
      geom = new THREE.TubeGeometry(helix, seg(220), 0.5, seg(10));
    } else if (type === 'trefoil') {
      // Figure-eight knot
      const knot = new THREE.Curve();
      knot.getPoint = (t, target = new THREE.Vector3()) => {
        const a = t * Math.PI * 2;
        const r = 2 + Math.cos(2 * a);
        return target.set(r * Math.cos(3 * a) * 1.2, r * Math.sin(3 * a) * 1.2, Math.sin(4 * a) * 1.6);
      };
      geom = new THREE.TubeGeometry(knot, seg(240), 0.45, seg(10));
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
    if (tightFit) {
      // Only the outermost vertices set the extent; test each at its highest and lowest wave displacement
      const edge = [];
      let maxX = 0, maxY = 0, maxZ = 0;
      for (let i = 0; i < posAttr.count; i++) {
        maxX = Math.max(maxX, Math.abs(basePositions[i * 3]));
        maxY = Math.max(maxY, Math.abs(basePositions[i * 3 + 1]));
        maxZ = Math.max(maxZ, Math.abs(basePositions[i * 3 + 2]));
      }
      for (let i = 0; i < posAttr.count; i++) {
        const x = basePositions[i * 3], y = basePositions[i * 3 + 1], z = basePositions[i * 3 + 2];
        if (Math.abs(x) > maxX - 1e-3 || Math.abs(y) > maxY - 1e-3 || Math.abs(z) > maxZ - 1e-3) {
          edge.push(x, y, z + 2.2, x, y, z - 2.2);
        }
      }
      tightPoints = new Float32Array(edge);
    }
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
      sizeCanvas();
      fitCamera(boundRadius);
      // A still mesh only redraws when its size changes
      if (reduceMotion) requestAnimationFrame(animate);
    }
  });
  resizeObserver.observe(container);

  // Animation Loop with Procedural Wave Engine
  // data-fps caps the frame rate. Rotation and easing are scaled by the time since the last frame,
  // so the motion keeps the same speed at any frame rate.
  const minFrameMs = container.dataset.fps ? 1000 / parseFloat(container.dataset.fps) - 4 : 0;
  let clock = reduceMotion ? 1.5 : 0;
  let lastDraw = 0;

  function animate(now) {
    if (!reduceMotion) requestAnimationFrame(animate);

    if (!visible && !reduceMotion) {
      state.lastTime = now;
      return;
    }
    if (now - lastDraw < minFrameMs) return;
    lastDraw = now;

    const delta = Math.min((now - state.lastTime) * 0.001, 0.1);
    state.lastTime = now;
    const frames = reduceMotion ? 1 : delta * 60;
    clock += delta * state.speed;

    // Auto-rotation & smooth damping
    if (state.autoRotate && !state.isDragging && !reduceMotion) {
      state.targetRotationY += 0.0035 * state.speed * frames;
    }

    const ease = 1 - Math.pow(0.92, frames);
    state.currentRotationX += (state.targetRotationX - state.currentRotationX) * ease;
    state.currentRotationY += (state.targetRotationY - state.currentRotationY) * ease;

    meshGroup.rotation.x = state.currentRotationX;
    meshGroup.rotation.y = state.currentRotationY;

    // Update vertex wave distortion
    const meshesToUpdate = [solidMesh, wireMesh, pointCloud].filter(m => m !== null && m.parent);

    if (meshesToUpdate.length > 0 && basePositions.length > 0) {
      const targetMesh = meshesToUpdate[0];
      const posAttr = targetMesh.geometry.attributes.position;
      const arr = posAttr.array;
      const count = posAttr.count;

      const deform = DEFORM[state.geometryType] || 'height';
      const px = state.pointerRayX;
      const pz = state.pointerRayY;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const bx = basePositions[i3];
        const by = basePositions[i3 + 1];
        const bz = basePositions[i3 + 2];

        if (deform === 'height') {
          // Harmonic undulating wave function
          const wave1 = Math.sin(bx * 0.6 + clock * 2.2) * Math.cos(bz * 0.6 + clock * 1.8);
          const wave2 = Math.sin((bx + bz) * 0.4 + clock * 1.4) * 0.5;
          const wave3 = Math.cos(Math.sqrt(bx * bx + bz * bz) * 0.8 - clock * 2.8) * 0.4;
          
          // Cursor gravity ripple
          const dist = Math.sqrt((bx - px) * (bx - px) + (bz - pz) * (bz - pz));
          const ripple = Math.exp(-dist * 0.5) * Math.sin(dist * 2.5 - clock * 6) * 0.9;

          const totalZ = (wave1 + wave2 + wave3 + ripple) * state.amplitude;
          arr[i3 + 2] = bz + totalZ;
        } else if (deform === 'radial') {
          // Radial pulsating surface deformation
          const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
          const nx = bx / len;
          const ny = by / len;
          const nz = bz / len;

          const pulse = Math.sin(nx * 3 + clock * 2) * Math.cos(ny * 3 + clock * 2) * Math.sin(nz * 3 + clock * 2);
          const radialDistort = 1.0 + pulse * 0.22 * state.amplitude;

          arr[i3] = bx * radialDistort;
          arr[i3 + 1] = by * radialDistort;
          arr[i3 + 2] = bz * radialDistort;
        } else if (deform === 'twist') {
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
        }
      });

      targetMesh.geometry.attributes.position.needsUpdate = true;
    }

    // Draw into the shared canvas, then copy the frame to this mesh's own canvas
    if (sharedSize.w !== canvas.width || sharedSize.h !== canvas.height) {
      renderer.setPixelRatio(1);
      renderer.setSize(canvas.width, canvas.height, false);
      sharedSize = { w: canvas.width, h: canvas.height };
    }
    renderer.render(scene, camera);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(renderer.domElement, 0, 0);
  }

  requestAnimationFrame(animate);
}
