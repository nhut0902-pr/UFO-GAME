import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { InfiniteMap } from './game/InfiniteMap';
import { BotSystem, Bot } from './game/BotSystem';
import { StoreSystem } from './game/StoreSystem';
import { GameConfig } from './components/GameSetup';

interface UfoShooterV2Props {
  isPaused: boolean;
  gameConfig: GameConfig;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onCreditsUpdate: (credits: number) => void;
  onOpenStore: () => void;
}

export default function UfoShooterV2({
  isPaused,
  gameConfig,
  onGameOver,
  onScoreUpdate,
  onCreditsUpdate,
  onOpenStore
}: UfoShooterV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const gameRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    tank: THREE.Group;
    baseGroup: THREE.Group;
    turretGroup: THREE.Group;
    cannon: THREE.Mesh;
    bullets: THREE.Mesh[];
    score: number;
    misses: number;
    lastShotTime: number;
    keys: { [key: string]: boolean };
    frameId: number;
    clock: THREE.Clock;
    isGameOverTriggered: boolean;
    input: {
      isFiring: boolean;
      moveDir: THREE.Vector2;
      yaw: number;
      pitch: number;
    };
    touch: {
      leftId: number;
      rightId: number;
      startX: number;
      startY: number;
      lastRightX: number;
      lastRightY: number;
    };
    infiniteMap: InfiniteMap;
    botSystem: BotSystem;
    storeSystem: StoreSystem;
    teams: Bot[][];
  } | null>(null);

  useEffect(() => {
    const checkMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    setIsMobile(checkMobile);

    if (!containerRef.current) return;

    // --- INITIALIZATION ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0033);
    scene.fog = new THREE.Fog(0x1a0033, 100, 500);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xff00ff, 1.2);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xff7c00, 0x00f0ff, 0.4);
    scene.add(hemiLight);

    // --- ENVIRONMENT (Stars) ---
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 1000;
      starPos[i * 3 + 1] = Math.random() * 400;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 1000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // --- INFINITE MAP ---
    const infiniteMap = new InfiniteMap(scene);

    // --- PLAYER TANK ---
    const tank = new THREE.Group();
    const baseGroup = new THREE.Group();
    const turretGroup = new THREE.Group();

    const baseGeo = new THREE.BoxGeometry(2, 0.8, 3);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.2, metalness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.4;
    base.castShadow = true;
    baseGroup.add(base);

    const turretGeo = new THREE.BoxGeometry(1.2, 0.6, 1.2);
    const turretMat = new THREE.MeshStandardMaterial({ color: 0xff007f, roughness: 0.2, metalness: 0.7 });
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.y = 1.1;
    turret.castShadow = true;
    turretGroup.add(turret);

    const cannonGeo = new THREE.BoxGeometry(0.3, 0.3, 2);
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
    const cannon = new THREE.Mesh(cannonGeo, cannonMat);
    cannon.position.set(0, 1.1, -1.5);
    cannon.castShadow = true;
    turretGroup.add(cannon);

    tank.add(baseGroup);
    tank.add(turretGroup);
    tank.position.set(0, 0, 0);
    scene.add(tank);

    // --- BOT SYSTEM ---
    const botSystem = new BotSystem(scene);
    const teams: Bot[][] = [];

    for (let t = 0; t < gameConfig.teamCount; t++) {
      const team: Bot[] = [];
      for (let b = 0; b < gameConfig.botsPerTeam; b++) {
        const angle = (t / gameConfig.teamCount) * Math.PI * 2;
        const radius = 30 + t * 20;
        const pos = new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        const bot = botSystem.createBot(pos, t);
        team.push(bot);
      }
      teams.push(team);
    }

    // --- STORE SYSTEM ---
    const storeSystem = new StoreSystem();

    // --- STATE ---
    const keys: { [key: string]: boolean } = {};
    gameRef.current = {
      scene, camera, renderer, tank, baseGroup, turretGroup, cannon,
      bullets: [], score: 0, misses: 0, lastShotTime: 0, keys,
      frameId: 0, clock: new THREE.Clock(), isGameOverTriggered: false,
      input: { isFiring: false, moveDir: new THREE.Vector2(), yaw: 0, pitch: 0.2 },
      touch: { leftId: -1, rightId: -1, startX: 0, startY: 0, lastRightX: 0, lastRightY: 0 },
      infiniteMap, botSystem, storeSystem, teams
    };

    const g = gameRef.current;

    // --- EVENT HANDLERS ---
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.key === 'Escape') onOpenStore();
    };
    const handleKeyUp = (e: KeyboardEvent) => (keys[e.code] = false);
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const requestPointerLock = () => {
      if (!checkMobile && document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!checkMobile && document.pointerLockElement === renderer.domElement) {
        g.input.yaw -= e.movementX * 0.002;
        g.input.pitch -= e.movementY * 0.002;
        g.input.pitch = THREE.MathUtils.clamp(g.input.pitch, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!checkMobile && document.pointerLockElement === renderer.domElement && e.button === 0) {
        g.input.isFiring = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!checkMobile && e.button === 0) {
        g.input.isFiring = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('click', requestPointerLock);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // --- GAME LOOP ---
    let shakeIntensity = 0;

    const animate = () => {
      if (!gameRef.current) return;
      const tg = gameRef.current;

      tg.frameId = requestAnimationFrame(animate);

      if (isPaused) {
        tg.renderer.render(tg.scene, tg.camera);
        return;
      }

      const delta = tg.clock.getDelta();

      // Keyboard movement
      if (!checkMobile) {
        const moveVec = new THREE.Vector2();
        if (tg.keys['KeyW'] || tg.keys['ArrowUp']) moveVec.y -= 1;
        if (tg.keys['KeyS'] || tg.keys['ArrowDown']) moveVec.y += 1;
        if (tg.keys['KeyA'] || tg.keys['ArrowLeft']) moveVec.x -= 1;
        if (tg.keys['KeyD'] || tg.keys['ArrowRight']) moveVec.x += 1;
        if (moveVec.lengthSq() > 0) moveVec.normalize();
        tg.input.moveDir.copy(moveVec);

        if (document.pointerLockElement === tg.renderer.domElement) {
          tg.input.isFiring = tg.input.isFiring || tg.keys['Space'] || false;
        } else {
          tg.input.isFiring = tg.keys['Space'] || false;
        }
      }

      // Camera Follow
      const camDist = 14;
      const camX = tg.tank.position.x + Math.sin(tg.input.yaw) * Math.cos(tg.input.pitch) * camDist;
      const camY = tg.tank.position.y + 2 + Math.sin(tg.input.pitch) * camDist;
      const camZ = tg.tank.position.z + Math.cos(tg.input.yaw) * Math.cos(tg.input.pitch) * camDist;

      const idealPos = new THREE.Vector3(camX, camY, camZ);

      if (shakeIntensity > 0) {
        idealPos.x += (Math.random() - 0.5) * shakeIntensity;
        idealPos.y += (Math.random() - 0.5) * shakeIntensity;
        idealPos.z += (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.9;
        if (shakeIntensity < 0.01) shakeIntensity = 0;
      }

      tg.camera.position.lerp(idealPos, 0.2);
      tg.camera.lookAt(tg.tank.position.x, tg.tank.position.y + 2, tg.tank.position.z);

      // Tank Movement
      if (tg.input.moveDir.lengthSq() > 0) {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), tg.input.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), tg.input.yaw);

        const moveDelta = new THREE.Vector3()
          .add(right.multiplyScalar(tg.input.moveDir.x))
          .add(forward.multiplyScalar(-tg.input.moveDir.y));

        const speed = tg.storeSystem.getPlayerStats().speed * delta;
        moveDelta.normalize().multiplyScalar(speed);
        tg.tank.position.add(moveDelta);

        const targetRot = Math.atan2(moveDelta.x, moveDelta.z);
        let diff = targetRot - tg.baseGroup.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        tg.baseGroup.rotation.y += diff * 0.1;
      }

      // Update infinite map
      tg.infiniteMap.updateChunks(tg.tank.position);

      // Update bots
      const obstacles = tg.infiniteMap.getObstacles();
      tg.botSystem.updateBots(delta, tg.tank.position, tg.tank, obstacles);

      // Update bullets
      for (let i = tg.bullets.length - 1; i >= 0; i--) {
        const bullet = tg.bullets[i];
        const vel = (bullet as any).velocity as THREE.Vector3;
        bullet.position.add(vel.clone().multiplyScalar(delta));

        (bullet as any).lifetime -= delta;
        if ((bullet as any).lifetime <= 0) {
          tg.scene.remove(bullet);
          tg.bullets.splice(i, 1);
        }
      }

      // Firing
      const now = Date.now() / 1000;
      if (tg.input.isFiring && now - tg.lastShotTime > 0.3) {
        const bulletGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);
        bullet.position.copy(tg.cannon.getWorldPosition(new THREE.Vector3()));

        const direction = new THREE.Vector3(0, 0, -1)
          .applyAxisAngle(new THREE.Vector3(1, 0, 0), tg.input.pitch)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), tg.input.yaw);

        (bullet as any).velocity = direction.multiplyScalar(80);
        (bullet as any).lifetime = 5;

        tg.scene.add(bullet);
        tg.bullets.push(bullet);
        tg.lastShotTime = now;
      }

      tg.renderer.render(tg.scene, tg.camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(gameRef.current?.frameId || 0);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', requestPointerLock);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
      infiniteMap.dispose();
      botSystem.dispose();
    };
  }, [isPaused, gameConfig, onGameOver, onScoreUpdate, onCreditsUpdate, onOpenStore]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair touch-none"
    />
  );
}
