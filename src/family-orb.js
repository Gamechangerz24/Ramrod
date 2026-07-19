import * as THREE from "/node_modules/three/build/three.module.js";

const vertexShader = `
  uniform float uTime;
  uniform float uEnergy;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  float field(vec3 p) {
    float a = sin(p.x * 4.1 + uTime * 1.3);
    float b = sin(p.y * 5.3 - uTime * 1.05);
    float c = sin(p.z * 6.2 + uTime * 0.8);
    float d = sin((p.x + p.y + p.z) * 3.4 - uTime * 1.7);
    return (a + b + c + d) * 0.25;
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vNoise = field(position);
    float pulse = 0.025 + uEnergy * 0.095;
    vec3 displaced = position + normal * vNoise * pulse;
    vPosition = displaced;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uPhase;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, normalize(vNormal))), 2.35);
    float scan = 0.5 + 0.5 * sin(vPosition.y * 21.0 - uTime * 3.2);
    vec3 deep = vec3(0.025, 0.055, 0.14);
    vec3 cyan = vec3(0.16, 0.94, 1.0);
    vec3 violet = vec3(0.46, 0.28, 1.0);
    vec3 mint = vec3(0.22, 1.0, 0.72);
    vec3 phaseColor = mix(cyan, violet, smoothstep(0.0, 2.0, uPhase));
    phaseColor = mix(phaseColor, mint, smoothstep(2.2, 3.0, uPhase));
    vec3 color = mix(deep, phaseColor, 0.3 + fresnel * 0.72);
    color += phaseColor * scan * (0.025 + uEnergy * 0.075);
    color += vec3(0.8, 0.96, 1.0) * max(vNoise, 0.0) * (0.05 + uEnergy * 0.12);
    float alpha = 0.92 + fresnel * 0.08;
    gl_FragColor = vec4(color, alpha);
  }
`;

const glowFragmentShader = `
  uniform float uEnergy;
  uniform float uPhase;
  varying vec3 vNormal;

  void main() {
    float intensity = pow(0.58 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    vec3 cyan = vec3(0.1, 0.86, 1.0);
    vec3 violet = vec3(0.42, 0.24, 1.0);
    vec3 mint = vec3(0.15, 1.0, 0.66);
    vec3 color = mix(cyan, violet, smoothstep(0.0, 2.0, uPhase));
    color = mix(color, mint, smoothstep(2.2, 3.0, uPhase));
    gl_FragColor = vec4(color, intensity * (0.18 + uEnergy * 0.2));
  }
`;

export function mountHermesOrb(container, options = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 5.6);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const uniforms = {
    uTime: { value: 0 },
    uEnergy: { value: 0.12 },
    uPhase: { value: 0 }
  };

  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.02, 6),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true
    })
  );
  scene.add(orb);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.28, 72, 72),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: glowFragmentShader,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  scene.add(glow);

  const ringGroup = new THREE.Group();
  const ringColors = [0x5cf1ff, 0x8a72ff, 0x5cf1ff, 0xff70b2];
  for (let index = 0; index < 4; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.42 + index * 0.2, 0.008 + index * 0.002, 8, 180),
      new THREE.MeshBasicMaterial({
        color: ringColors[index],
        transparent: true,
        opacity: 0.34 - index * 0.045,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.rotation.x = Math.PI * (0.5 + index * 0.055);
    ring.rotation.y = index * 0.27;
    ring.userData.speed = (index % 2 === 0 ? 1 : -1) * (0.09 + index * 0.025);
    ringGroup.add(ring);
  }
  scene.add(ringGroup);

  const particleCount = 900;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);
  for (let index = 0; index < particleCount; index += 1) {
    const radius = 1.2 + Math.random() * 1.3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particlePositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[index * 3 + 2] = radius * Math.cos(phi) * 0.55;
    particleSizes[index] = 0.4 + Math.random() * 0.8;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0x6cefff,
      size: 0.018,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  scene.add(particles);

  const startedAt = performance.now();
  let frame = 0;
  let destroyed = false;
  let analyser = null;
  let audioContext = null;
  let sourceNode = null;
  let frequencyData = null;
  let energy = 0.12;

  const getPhase = () => options.getPhase?.() || "idle";
  const phaseValue = {
    idle: 0,
    listening: 1,
    thinking: 2,
    speaking: 3
  };

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function readEnergy(time, phase) {
    if (analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData);
      let sum = 0;
      const limit = Math.min(frequencyData.length, 96);
      for (let index = 2; index < limit; index += 1) sum += frequencyData[index];
      return Math.min(1, sum / Math.max(1, (limit - 2) * 118));
    }

    if (phase === "listening") return 0.42 + Math.sin(time * 12) * 0.13 + Math.sin(time * 23) * 0.08;
    if (phase === "thinking") return 0.32 + Math.sin(time * 4.5) * 0.1;
    if (phase === "speaking") return 0.5 + Math.sin(time * 15) * 0.2 + Math.sin(time * 31) * 0.08;
    return 0.12 + Math.sin(time * 1.6) * 0.035;
  }

  function animate() {
    if (destroyed) return;
    const time = (performance.now() - startedAt) / 1000;
    const phase = getPhase();
    const targetEnergy = Math.max(0.04, readEnergy(time, phase));
    energy += (targetEnergy - energy) * 0.12;

    uniforms.uTime.value = time;
    uniforms.uEnergy.value = energy;
    uniforms.uPhase.value += ((phaseValue[phase] ?? 0) - uniforms.uPhase.value) * 0.08;

    orb.rotation.y = time * (phase === "thinking" ? 0.32 : 0.08);
    orb.rotation.x = Math.sin(time * 0.42) * 0.08;
    orb.scale.setScalar(1 + energy * 0.045);
    glow.scale.setScalar(1 + energy * 0.08);
    particles.rotation.z = time * 0.025;
    particles.rotation.y = -time * 0.035;
    particles.material.opacity = 0.28 + energy * 0.34;

    ringGroup.children.forEach((ring, index) => {
      ring.rotation.z += ring.userData.speed * 0.012 * (phase === "thinking" ? 4 : 1);
      ring.rotation.y += ring.userData.speed * 0.006;
      ring.material.opacity = 0.2 + energy * 0.28 - index * 0.025;
    });

    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }

  async function attachStream(stream) {
    try {
      disconnectAudio();
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
    } catch (_error) {
      disconnectAudio();
    }
  }

  async function attachAudioElement(audio) {
    try {
      disconnectAudio();
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.68;
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      sourceNode = audioContext.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (_error) {
      disconnectAudio();
    }
  }

  function disconnectAudio() {
    try {
      sourceNode?.disconnect();
      analyser?.disconnect();
      audioContext?.close();
    } catch (_error) {
      // Audio nodes may already be disconnected.
    }
    sourceNode = null;
    analyser = null;
    audioContext = null;
    frequencyData = null;
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(frame);
    disconnectAudio();
    renderer.dispose();
    orb.geometry.dispose();
    orb.material.dispose();
    glow.geometry.dispose();
    glow.material.dispose();
    ringGroup.children.forEach((ring) => {
      ring.geometry.dispose();
      ring.material.dispose();
    });
    particleGeometry.dispose();
    particles.material.dispose();
    renderer.domElement.remove();
    window.removeEventListener("resize", resize);
  }

  resize();
  window.addEventListener("resize", resize);
  animate();

  return {
    attachStream,
    attachAudioElement,
    destroy,
    resize
  };
}
