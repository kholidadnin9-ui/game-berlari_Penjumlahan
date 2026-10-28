import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LaneIndex, MathQuestion } from '../types/game';

interface SubwayRunnerCanvasProps {
  lane: LaneIndex;
  question?: MathQuestion;
  questionDuration: number;
  isGateActive: boolean;
  jumpTrigger: number;
  celebrateTrigger: number;
  stumbleTrigger: number;
  isRunning: boolean;
  baseSpeed: number;
  runnerOutfit: 'red' | 'blue' | 'emerald' | 'amber';
  onGateTimeUpdate: (timeLeft: number) => void;
  onHitAnswerGate: (hitLane: LaneIndex) => void;
  onCollectTrackCoin: () => void;
  onSwipeLane: (direction: 'LEFT' | 'RIGHT') => void;
  onSwipeJump: () => void;
}

// 4 parallel railway tracks matching the user's screenshot (A, B, C, D)
const LANE_X: Record<LaneIndex, number> = {
  0: -3.3, // Track A (Red)
  1: -1.1, // Track B (Blue)
  2: 1.1,  // Track C (Green)
  3: 3.3,  // Track D (Yellow)
};

const GATE_SPAWN_Z = -78;
const RUNNER_Z = 1.2;

const GATE_HEX_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const GATE_LABELS = ['A', 'B', 'C', 'D'];

const OUTFIT_COLORS: Record<'red' | 'blue' | 'emerald' | 'amber', { primary: number; cap: number; accent: number }> = {
  red: { primary: 0xf8fafc, cap: 0xef4444, accent: 0x3b82f6 },
  blue: { primary: 0xe0f2fe, cap: 0x2563eb, accent: 0x38bdf8 },
  emerald: { primary: 0xd1fae5, cap: 0x10b981, accent: 0x059669 },
  amber: { primary: 0xfef3c7, cap: 0xf59e0b, accent: 0xd97706 },
};

// Pre-allocated math helpers outside render loop
const _dummyObj = new THREE.Object3D();
const _targetCameraPos = new THREE.Vector3();
const _lookAtPos = new THREE.Vector3();

function createGlassBuildingTexture(maxAnisotropy: number, tintHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = tintHex;
    ctx.fillRect(0, 0, 128, 256);

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (let y = 8; y < 256; y += 20) {
      for (let x = 8; x < 128; x += 24) {
        ctx.fillRect(x, y, 18, 14);
      }
    }
    ctx.strokeStyle = 'rgba(15,23,42,0.35)';
    ctx.lineWidth = 3;
    for (let y = 0; y < 256; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function drawGateChoiceTexture(
  canvas: HTMLCanvasElement,
  bgHex: string,
  label: string,
  valueText: string,
  isHighlightedLane: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer border (thick white if runner is aligned with this lane!)
  ctx.fillStyle = isHighlightedLane ? '#ffffff' : 'rgba(255,255,255,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const borderThickness = isHighlightedLane ? 14 : 6;
  ctx.fillStyle = bgHex;
  ctx.fillRect(
    borderThickness,
    borderThickness,
    canvas.width - borderThickness * 2,
    canvas.height - borderThickness * 2
  );

  // Inner subtle highlight frame
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 4;
  ctx.strokeRect(
    borderThickness + 6,
    borderThickness + 6,
    canvas.width - (borderThickness + 6) * 2,
    canvas.height - (borderThickness + 6) * 2
  );

  // Left circular letter badge (A, B, C, D)
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.arc(54, canvas.height / 2, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "Fredoka", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 54, canvas.height / 2 + 2);

  // Large Answer Number on the right
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 82px "Fredoka", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(valueText, 152, canvas.height / 2 + 4);
}

function createStripedBarrierTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#dc2626';
    for (let i = -128; i < 256; i += 48) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 24, 0);
      ctx.lineTo(i + 96, 128);
      ctx.lineTo(i + 72, 128);
      ctx.closePath();
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export const SubwayRunnerCanvas: React.FC<SubwayRunnerCanvasProps> = ({
  lane,
  question,
  questionDuration,
  isGateActive,
  jumpTrigger,
  celebrateTrigger,
  stumbleTrigger,
  isRunning,
  baseSpeed,
  runnerOutfit,
  onGateTimeUpdate,
  onHitAnswerGate,
  onCollectTrackCoin,
  onSwipeLane,
  onSwipeJump,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [fallbackGateProgress, setFallbackGateProgress] = useState(0);

  const stateRef = useRef({
    lane,
    question,
    questionDuration,
    isGateActive,
    isRunning,
    baseSpeed,
    runnerOutfit,
    currentX: LANE_X[lane],
    currentY: 0,
    velocityY: 0,
    isJumping: false,
    celebrateTimer: 0,
    stumbleTimer: 0,
    runCycleTime: 0,
    trackDistance: 0,
    gateElapsed: 0,
    gateTriggeredForQuestionId: '',
    lastReportedTenths: -1,
    hitEffectTimer: 0,
    hitLaneIdx: 1 as LaneIndex,
  });

  const callbacksRef = useRef({
    onGateTimeUpdate,
    onHitAnswerGate,
    onCollectTrackCoin,
    onSwipeLane,
    onSwipeJump,
  });

  const gateCanvasesRef = useRef<
    Array<{
      canvas: HTMLCanvasElement;
      texture: THREE.CanvasTexture;
      mesh: THREE.Mesh;
    }>
  >([]);

  useEffect(() => {
    callbacksRef.current = {
      onGateTimeUpdate,
      onHitAnswerGate,
      onCollectTrackCoin,
      onSwipeLane,
      onSwipeJump,
    };
  }, [
    onGateTimeUpdate,
    onHitAnswerGate,
    onCollectTrackCoin,
    onSwipeLane,
    onSwipeJump,
  ]);

  const redrawAllGates = (activeQuestion?: MathQuestion, activeLane?: LaneIndex) => {
    const q = activeQuestion ?? stateRef.current.question;
    const l = activeLane ?? stateRef.current.lane;
    if (!q || gateCanvasesRef.current.length !== 4) return;
    q.choices.forEach((choice, idx) => {
      const item = gateCanvasesRef.current[idx];
      if (item) {
        drawGateChoiceTexture(
          item.canvas,
          GATE_HEX_COLORS[idx],
          GATE_LABELS[idx],
          String(choice.value),
          idx === l
        );
        item.texture.needsUpdate = true;
      }
    });
  };

  useEffect(() => {
    stateRef.current.lane = lane;
    redrawAllGates(stateRef.current.question, lane);
  }, [lane]);

  useEffect(() => {
    stateRef.current.isRunning = isRunning;
  }, [isRunning]);

  useEffect(() => {
    stateRef.current.isGateActive = isGateActive;
  }, [isGateActive]);

  useEffect(() => {
    stateRef.current.baseSpeed = baseSpeed;
  }, [baseSpeed]);

  useEffect(() => {
    stateRef.current.questionDuration = questionDuration;
  }, [questionDuration]);

  // Whenever a new question is loaded, spawn the 4 Answer Gates at the far end of the track
  useEffect(() => {
    stateRef.current.question = question;
    if (question) {
      stateRef.current.gateElapsed = 0;
      stateRef.current.gateTriggeredForQuestionId = '';
      stateRef.current.lastReportedTenths = -1;
      stateRef.current.hitEffectTimer = 0;
      // Reset gate meshes scale & visibility
      gateCanvasesRef.current.forEach((item) => {
        item.mesh.scale.set(1, 1, 1);
        item.mesh.position.y = 1.65;
      });
      redrawAllGates(question, stateRef.current.lane);
    }
  }, [question]);

  useEffect(() => {
    if (jumpTrigger > 0 && !stateRef.current.isJumping) {
      stateRef.current.isJumping = true;
      stateRef.current.velocityY = 11.5;
    }
  }, [jumpTrigger]);

  useEffect(() => {
    if (celebrateTrigger > 0) {
      stateRef.current.celebrateTimer = 0.85;
      if (!stateRef.current.isJumping) {
        stateRef.current.isJumping = true;
        stateRef.current.velocityY = 9.0;
      }
    }
  }, [celebrateTrigger]);

  useEffect(() => {
    if (stumbleTrigger > 0) {
      stateRef.current.stumbleTimer = 0.6;
    }
  }, [stumbleTrigger]);

  const outfitMaterialsRef = useRef<{
    torso?: THREE.MeshStandardMaterial;
    cap?: THREE.MeshStandardMaterial;
    accent?: THREE.MeshStandardMaterial;
  }>({});

  useEffect(() => {
    const palette = OUTFIT_COLORS[runnerOutfit] || OUTFIT_COLORS.red;
    if (outfitMaterialsRef.current.torso) {
      outfitMaterialsRef.current.torso.color.setHex(palette.primary);
    }
    if (outfitMaterialsRef.current.cap) {
      outfitMaterialsRef.current.cap.color.setHex(palette.cap);
    }
    if (outfitMaterialsRef.current.accent) {
      outfitMaterialsRef.current.accent.color.setHex(palette.accent);
    }
  }, [runnerOutfit]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe);
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.009);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // High elevated perspective behind the runner matching the reference image
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 160);
    camera.position.set(0, 7.2, 11.2);
    camera.lookAt(0, 1.2, -18);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x78350f, 0.95);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.7);
    keyLight.position.set(14, 34, 20);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 18;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 80;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    // Ground & 4-Track Brown Ballast Roadbed
    const groundGroup = new THREE.Group();
    scene.add(groundGroup);

    const bedGeo = new THREE.PlaneGeometry(9.6, 200);
    const bedMat = new THREE.MeshStandardMaterial({
      color: 0x6b4c35,
      roughness: 0.9,
      metalness: 0.05,
    });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.set(0, 0, -70);
    bedMesh.receiveShadow = true;
    groundGroup.add(bedMesh);

    const platformGeo = new THREE.BoxGeometry(3.4, 0.5, 200);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.55,
      metalness: 0.1,
    });
    const safetyLineGeo = new THREE.BoxGeometry(0.22, 0.52, 200);
    const safetyLineMat = new THREE.MeshStandardMaterial({
      color: 0xbef264,
      emissive: 0x84cc16,
      emissiveIntensity: 0.45,
      roughness: 0.3,
    });

    [-6.5, 6.5].forEach((px) => {
      const plat = new THREE.Mesh(platformGeo, platformMat);
      plat.position.set(px, 0.25, -70);
      plat.receiveShadow = true;
      groundGroup.add(plat);

      const line = new THREE.Mesh(safetyLineGeo, safetyLineMat);
      line.position.set(px > 0 ? px - 1.58 : px + 1.58, 0.25, -70);
      groundGroup.add(line);
    });

    // 4 Parallel Tracks * 2 Bright Steel Rails = 8 Steel Rails
    const railGeo = new THREE.BoxGeometry(0.11, 0.16, 200);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.85,
      roughness: 0.18,
    });
    ([0, 1, 2, 3] as LaneIndex[]).forEach((laneIdx) => {
      const center = LANE_X[laneIdx];
      [-0.58, 0.58].forEach((offset) => {
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(center + offset, 0.11, -70);
        rail.receiveShadow = true;
        groundGroup.add(rail);
      });
    });

    // Instanced Wooden Sleepers across all 4 tracks
    const SLEEPER_ROWS = 56;
    const SLEEPER_COUNT = SLEEPER_ROWS * 4;
    const sleeperGeo = new THREE.BoxGeometry(1.62, 0.08, 0.32);
    const sleeperMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.88,
      metalness: 0.05,
    });
    const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, sleeperMat, SLEEPER_COUNT);
    sleeperInstanced.receiveShadow = true;
    sleeperInstanced.frustumCulled = false;
    scene.add(sleeperInstanced);

    // Foreground Striped Barriers & Warning Sign
    const stripeTex = createStripedBarrierTexture(maxAnisotropy);
    const barrierBoxMat = new THREE.MeshStandardMaterial({
      map: stripeTex,
      roughness: 0.5,
    });
    [-3.8, 3.8].forEach((bx, idx) => {
      const barrierGroup = new THREE.Group();
      barrierGroup.position.set(bx, 0, 5.2);
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.35, 1.2), barrierBoxMat);
      block.position.y = 0.68;
      barrierGroup.add(block);

      if (idx === 0) {
        const signPost = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        );
        signPost.position.set(-0.6, 1.5, -0.2);
        const signBoard = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.95, 0.1),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
        );
        signBoard.position.set(-0.6, 2.3, -0.2);
        barrierGroup.add(signPost, signBoard);
      }
      scene.add(barrierGroup);
    });

    // 4 Colored 3D Answer Gates positioned directly ON the 4 tracks so the runner collides with them!
    const gateBridgeGroup = new THREE.Group();
    gateBridgeGroup.position.set(0, 0, GATE_SPAWN_Z);
    scene.add(gateBridgeGroup);

    const gantrySteelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.7,
      roughness: 0.35,
    });
    const gateCrossbar = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.2, 0.2), gantrySteelMat);
    gateCrossbar.position.set(0, 2.75, 0);
    const gateLeftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.0, 0.22), gantrySteelMat);
    gateLeftPillar.position.set(-4.8, 1.5, 0);
    const gateRightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.0, 0.22), gantrySteelMat);
    gateRightPillar.position.set(4.8, 1.5, 0);
    gateBridgeGroup.add(gateCrossbar, gateLeftPillar, gateRightPillar);

    const initialValues = stateRef.current.question
      ? stateRef.current.question.choices.map((c) => String(c.value))
      : ['15', '14', '24', '16'];

    gateCanvasesRef.current = [];
    ([0, 1, 2, 3] as LaneIndex[]).forEach((laneIdx) => {
      const c = document.createElement('canvas');
      c.width = 240;
      c.height = 150;
      drawGateChoiceTexture(
        c,
        GATE_HEX_COLORS[laneIdx],
        GATE_LABELS[laneIdx],
        initialValues[laneIdx] || '',
        laneIdx === stateRef.current.lane
      );
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAnisotropy;

      const signMat = new THREE.MeshBasicMaterial({ map: tex });
      // Positioned at y = 1.65 directly over each track so the character runs straight through it and numbers are clearly legible!
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(2.04, 1.72, 0.28), signMat);
      signMesh.position.set(LANE_X[laneIdx], 1.65, 0);
      gateBridgeGroup.add(signMesh);

      gateCanvasesRef.current.push({ canvas: c, texture: tex, mesh: signMesh });
    });

    // Original 3D Cartoon Runner Character
    const palette = OUTFIT_COLORS[stateRef.current.runnerOutfit] || OUTFIT_COLORS.red;
    const runnerGroup = new THREE.Group();
    runnerGroup.position.set(LANE_X[stateRef.current.lane], 0, RUNNER_Z);
    runnerGroup.scale.set(0.88, 0.88, 0.88);
    scene.add(runnerGroup);

    const shadowGeo = new THREE.CircleGeometry(0.65, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(LANE_X[stateRef.current.lane], 0.03, RUNNER_Z);
    scene.add(contactShadow);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.55 });
    const torsoMat = new THREE.MeshStandardMaterial({ color: palette.primary, roughness: 0.4 });
    const capMat = new THREE.MeshStandardMaterial({ color: palette.cap, roughness: 0.35 });
    const accentMat = new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.3 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    outfitMaterialsRef.current = {
      torso: torsoMat,
      cap: capMat,
      accent: accentMat,
    };

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.78, 0.4), torsoMat);
    torsoMesh.position.set(0, 1.15, 0);
    torsoMesh.castShadow = true;
    runnerGroup.add(torsoMesh);

    const packMain = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.28), backpackMat);
    packMain.position.set(0, 1.18, 0.3);
    runnerGroup.add(packMain);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 18), skinMat);
    headMesh.position.set(0, 1.85, 0);
    headMesh.castShadow = true;
    runnerGroup.add(headMesh);

    const capDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.37, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      capMat
    );
    capDome.position.set(0, 1.88, 0);
    runnerGroup.add(capDome);

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.46, 1.44, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.58, 0.2), skinMat);
    leftArmMesh.position.set(0, -0.24, 0);
    leftArmGroup.add(leftArmMesh);
    runnerGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.46, 1.44, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.58, 0.2), skinMat);
    rightArmMesh.position.set(0, -0.24, 0);
    rightArmGroup.add(rightArmMesh);
    runnerGroup.add(rightArmGroup);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.18, 0.74, 0);
    const leftShorts = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.25), shortsMat);
    leftShorts.position.set(0, -0.15, 0);
    const leftShin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 0.18), skinMat);
    leftShin.position.set(0, -0.42, 0);
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.4), shoeMat);
    leftShoe.position.set(0, -0.62, -0.05);
    leftLegGroup.add(leftShorts, leftShin, leftShoe);
    runnerGroup.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.18, 0.74, 0);
    const rightShorts = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.25), shortsMat);
    rightShorts.position.set(0, -0.15, 0);
    const rightShin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 0.18), skinMat);
    rightShin.position.set(0, -0.42, 0);
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.4), shoeMat);
    rightShoe.position.set(0, -0.62, -0.05);
    rightLegGroup.add(rightShorts, rightShin, rightShoe);
    runnerGroup.add(rightLegGroup);

    // Scenery: Potted Bushes, Side Trains, Catenary Portals & Glass Buildings
    const buildingTextures = [
      createGlassBuildingTexture(maxAnisotropy, '#94a3b8'),
      createGlassBuildingTexture(maxAnisotropy, '#64748b'),
      createGlassBuildingTexture(maxAnisotropy, '#7dd3fc'),
    ];

    const potMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.55 });
    const trainWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.2 });
    const trainGreenStripeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const trainWindowMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.85 });

    const sceneryItems: Array<{ group: THREE.Group; speedMultiplier: number; spanZ: number }> = [];

    for (let i = 0; i < 14; i++) {
      const zPos = 8 - i * 11;

      [-1, 1].forEach((side) => {
        const sideChunk = new THREE.Group();
        sideChunk.position.set(0, 0, zPos);

        const planterGroup = new THREE.Group();
        planterGroup.position.set(side * 5.6, 0.5, 0);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.36, 0.55, 12), potMat);
        pot.position.y = 0.27;
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 14), bushMat);
        bush.position.y = 0.78;
        planterGroup.add(pot, bush);
        sideChunk.add(planterGroup);

        const outerTrain = new THREE.Group();
        outerTrain.position.set(side * 8.4, 0.5, 0);
        const coachBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.2, 9.8), trainWhiteMat);
        coachBody.position.y = 1.1;
        const coachStripe = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.28, 9.82), trainGreenStripeMat);
        coachStripe.position.y = 0.85;
        const coachWindows = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 8.8), trainWindowMat);
        coachWindows.position.y = 1.45;
        outerTrain.add(coachBody, coachStripe, coachWindows);
        sideChunk.add(outerTrain);

        const bHeight = 14 + ((i + (side > 0 ? 1 : 0)) % 4) * 3;
        const bMat = new THREE.MeshStandardMaterial({
          map: buildingTextures[(i + (side > 0 ? 1 : 0)) % buildingTextures.length],
          roughness: 0.35,
          metalness: 0.25,
        });
        const building = new THREE.Mesh(new THREE.BoxGeometry(5.5, bHeight, 8.5), bMat);
        building.position.set(side * 13.5, bHeight / 2, 0);
        sideChunk.add(building);

        scene.add(sideChunk);
        sceneryItems.push({ group: sideChunk, speedMultiplier: 1, spanZ: 154 });
      });

      if (i % 2 === 0) {
        const portalGroup = new THREE.Group();
        portalGroup.position.set(0, 0, zPos);

        const leftMast = new THREE.Mesh(new THREE.BoxGeometry(0.24, 6.4, 0.24), gantrySteelMat);
        leftMast.position.set(-5.2, 3.2, 0);
        const rightMast = new THREE.Mesh(new THREE.BoxGeometry(0.24, 6.4, 0.24), gantrySteelMat);
        rightMast.position.set(5.2, 3.2, 0);
        const topBeam = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.22, 0.22), gantrySteelMat);
        topBeam.position.set(0, 6.2, 0);
        const lowerWireBeam = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.1, 0.1), gantrySteelMat);
        lowerWireBeam.position.set(0, 5.5, 0);

        portalGroup.add(leftMast, rightMast, topBeam, lowerWireBeam);
        scene.add(portalGroup);
        sceneryItems.push({ group: portalGroup, speedMultiplier: 1, spanZ: 154 });
      }
    }

    // Collectible 3D Gold Coins on the 4 tracks
    interface TrackCoin {
      group: THREE.Group;
      laneIdx: LaneIndex;
      z: number;
      collected: boolean;
    }

    const trackCoins: TrackCoin[] = [];
    const coinGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.85,
      roughness: 0.18,
      emissive: 0xca8a04,
      emissiveIntensity: 0.2,
    });

    for (let i = 0; i < 12; i++) {
      const coinGroup = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 18), coinGoldMat);
      disc.rotation.z = Math.PI / 2;
      coinGroup.add(disc);

      const laneChoices: LaneIndex[] = [0, 1, 2, 3];
      const laneIdx = laneChoices[i % 4];
      const z = -12 - i * 9;
      coinGroup.position.set(LANE_X[laneIdx], 0.95, z);
      scene.add(coinGroup);
      trackCoins.push({ group: coinGroup, laneIdx, z, collected: false });
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const rawDelta = clock.getDelta();
      const dt = Math.min(rawDelta, 0.08);
      const st = stateRef.current;

      const targetX = LANE_X[st.lane];
      st.currentX = THREE.MathUtils.damp(st.currentX, targetX, 14, dt);
      const dx = targetX - st.currentX;

      const activeSpeed = st.isRunning ? st.baseSpeed : 8.0;
      st.trackDistance += activeSpeed * dt;
      st.runCycleTime += dt * (st.isRunning ? 14 : 9);

      if (st.isJumping) {
        st.currentY += st.velocityY * dt;
        st.velocityY -= 28.0 * dt;
        if (st.currentY <= 0) {
          st.currentY = 0;
          st.velocityY = 0;
          st.isJumping = false;
        }
      }

      if (st.celebrateTimer > 0) {
        st.celebrateTimer = Math.max(0, st.celebrateTimer - dt);
      }
      if (st.stumbleTimer > 0) {
        st.stumbleTimer = Math.max(0, st.stumbleTimer - dt);
      }

      const runBob = st.isJumping ? 0 : Math.abs(Math.sin(st.runCycleTime)) * 0.12;
      runnerGroup.position.set(st.currentX, st.currentY + runBob, RUNNER_Z);
      runnerGroup.rotation.z = THREE.MathUtils.clamp(-dx * 0.16, -0.3, 0.3);

      if (st.celebrateTimer > 0) {
        runnerGroup.rotation.y = st.celebrateTimer * Math.PI * 2.2;
      } else if (st.stumbleTimer > 0) {
        runnerGroup.rotation.y = Math.sin(st.stumbleTimer * 28) * 0.25;
      } else {
        runnerGroup.rotation.y = THREE.MathUtils.damp(runnerGroup.rotation.y, 0, 10, dt);
      }

      const swingAngle = st.isJumping ? 0.65 : Math.sin(st.runCycleTime) * 0.82;
      leftArmGroup.rotation.x = swingAngle;
      rightArmGroup.rotation.x = -swingAngle;
      leftLegGroup.rotation.x = -swingAngle;
      rightLegGroup.rotation.x = swingAngle;

      contactShadow.position.set(st.currentX, 0.03, RUNNER_Z);
      const shadowScale = THREE.MathUtils.clamp(1 - st.currentY * 0.16, 0.45, 1);
      contactShadow.scale.set(shadowScale, shadowScale, 1);

      // Update Instanced Wooden Sleepers across all 4 lanes
      const sleeperSpacing = 2.2;
      const offsetZ = st.trackDistance % sleeperSpacing;
      let instanceIdx = 0;
      for (let row = 0; row < SLEEPER_ROWS; row++) {
        const z = 12 - row * sleeperSpacing + offsetZ;
        ([0, 1, 2, 3] as LaneIndex[]).forEach((laneIdx) => {
          _dummyObj.position.set(LANE_X[laneIdx], 0.04, z);
          _dummyObj.rotation.set(0, 0, 0);
          _dummyObj.scale.set(1, 1, 1);
          _dummyObj.updateMatrix();
          sleeperInstanced.setMatrixAt(instanceIdx++, _dummyObj.matrix);
        });
      }
      sleeperInstanced.instanceMatrix.needsUpdate = true;

      // Scroll Scenery
      for (const item of sceneryItems) {
        item.group.position.z += activeSpeed * item.speedMultiplier * dt;
        if (item.group.position.z > 14) {
          item.group.position.z -= item.spanZ;
        }
      }

      // Advance the 4 Colored Answer Gates toward the runner and trigger collision when hit!
      if (st.isRunning && st.question) {
        if (st.isGateActive) {
          st.gateElapsed += dt;
          const duration = Math.max(2, st.questionDuration);
          const progressRatio = Math.min(1, st.gateElapsed / duration);
          const currentGateZ = THREE.MathUtils.lerp(GATE_SPAWN_Z, RUNNER_Z, progressRatio);
          gateBridgeGroup.position.z = currentGateZ;

          const remainingTime = Math.max(0, duration - st.gateElapsed);
          const tenths = Math.round(remainingTime * 10);
          if (tenths !== st.lastReportedTenths) {
            st.lastReportedTenths = tenths;
            callbacksRef.current.onGateTimeUpdate(tenths / 10);
          }

          // Check if the character has collided with the Answer Gate!
          if (
            progressRatio >= 1 &&
            st.gateTriggeredForQuestionId !== st.question.id
          ) {
            st.gateTriggeredForQuestionId = st.question.id;
            st.hitEffectTimer = 0.45;
            st.hitLaneIdx = st.lane;
            callbacksRef.current.onHitAnswerGate(st.lane);
          }
        } else if (st.hitEffectTimer > 0) {
          // Animate the gate that the character just smashed through!
          st.hitEffectTimer = Math.max(0, st.hitEffectTimer - dt);
          gateBridgeGroup.position.z += activeSpeed * 0.65 * dt;
          const hitGate = gateCanvasesRef.current[st.hitLaneIdx];
          if (hitGate) {
            const burstScale = 1 + (0.45 - st.hitEffectTimer) * 1.4;
            hitGate.mesh.scale.set(burstScale, burstScale, 1);
            hitGate.mesh.position.y = 1.45 + (0.45 - st.hitEffectTimer) * 3.2;
          }
        }
      } else {
        // Preview mode on Main Menu
        gateBridgeGroup.position.z = -28;
      }

      // Spin & Collect Track Coins
      for (const coin of trackCoins) {
        coin.z += activeSpeed * dt;
        coin.group.rotation.y += dt * 3.2;

        if (
          st.isRunning &&
          !coin.collected &&
          Math.abs(st.currentX - LANE_X[coin.laneIdx]) < 0.95 &&
          Math.abs(coin.z - RUNNER_Z) < 1.1
        ) {
          coin.collected = true;
          coin.group.visible = false;
          callbacksRef.current.onCollectTrackCoin();
        }

        if (coin.z > 11) {
          coin.z = -95 - Math.random() * 14;
          const lanes: LaneIndex[] = [0, 1, 2, 3];
          coin.laneIdx = lanes[Math.floor(Math.random() * lanes.length)];
          coin.collected = false;
          coin.group.visible = true;
          coin.group.position.x = LANE_X[coin.laneIdx];
        }
        coin.group.position.z = coin.z;
      }

      // High elevated camera tracking behind the character
      _targetCameraPos.set(st.currentX * 0.22, 7.2 + st.currentY * 0.15, 11.2);
      camera.position.lerp(_targetCameraPos, 1 - Math.exp(-8 * dt));
      _lookAtPos.set(st.currentX * 0.12, 1.1, -18);
      camera.lookAt(_lookAtPos);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // 2D Fallback Gate Loop if WebGL is unavailable
  useEffect(() => {
    if (!webglFailed || !isRunning || !isGateActive || !question) return;
    const start = performance.now();
    const durationMs = Math.max(2000, questionDuration * 1000);

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const ratio = Math.min(1, elapsed / durationMs);
      setFallbackGateProgress(ratio);
      const rem = Math.max(0, (durationMs - elapsed) / 1000);
      callbacksRef.current.onGateTimeUpdate(Number(rem.toFixed(1)));

      if (ratio >= 1) {
        clearInterval(interval);
        callbacksRef.current.onHitAnswerGate(stateRef.current.lane);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [webglFailed, isRunning, isGateActive, question, questionDuration]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 24) {
        callbacksRef.current.onSwipeLane('RIGHT');
      } else if (dx < -24) {
        callbacksRef.current.onSwipeLane('LEFT');
      }
    } else if (dy < -24) {
      callbacksRef.current.onSwipeJump();
    }
  };

  if (webglFailed) {
    const lanePercent =
      lane === 0 ? '20%' : lane === 1 ? '40%' : lane === 2 ? '60%' : '80%';
    const gateTopPercent = 32 + fallbackGateProgress * 48;
    return (
      <div
        className="relative w-full h-full bg-gradient-to-b from-sky-200 via-slate-300 to-amber-900 overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-x-0 bottom-0 h-[68%] bg-amber-950 border-t-4 border-lime-400 flex justify-around px-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="w-1/5 h-full border-x-4 border-slate-200 bg-amber-900/80 relative"
            />
          ))}
        </div>
        {/* Approaching 2D Answer Gates */}
        {question && (
          <div
            style={{ top: `${gateTopPercent}%` }}
            className="absolute inset-x-6 flex justify-around pointer-events-none transition-all duration-75"
          >
            {question.choices.map((ch, idx) => (
              <div
                key={ch.label}
                style={{ backgroundColor: GATE_HEX_COLORS[idx] }}
                className={`w-1/5 py-2 rounded-xl text-center font-display font-extrabold text-white shadow-lg border-2 ${
                  lane === idx ? 'border-white scale-110' : 'border-white/40'
                }`}
              >
                {ch.label}. {ch.value}
              </div>
            ))}
          </div>
        )}
        <div
          style={{ left: lanePercent }}
          className="absolute bottom-24 -translate-x-1/2 transition-all duration-150 flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-600 border-4 border-white shadow-xl flex items-center justify-center text-2xl font-bold">
            🏃
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full relative overflow-hidden"
    />
  );
};
