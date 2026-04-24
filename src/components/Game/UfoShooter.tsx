import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface UfoShooterProps {
  isPaused: boolean;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onMissUpdate: (misses: number) => void;
}

export default function UfoShooter({ isPaused, onGameOver, onScoreUpdate, onMissUpdate }: UfoShooterProps) {
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
    ufos: THREE.Group[];
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
  } | null>(null);

  useEffect(() => {
    // Detect mobile touch at runtime
    const checkMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    setIsMobile(checkMobile);
    
    if (!containerRef.current) return;

    // --- INITIALIZATION ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0033);
    scene.fog = new THREE.Fog(0x1a0033, 40, 250);

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
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xff7c00, 0x00f0ff, 0.4);
    scene.add(hemiLight);

    // --- ENVIRONMENT ---
    const groundGeo = new THREE.PlaneGeometry(350, 350);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x0d0d1a, 
      roughness: 0.1, 
      metalness: 0.8 
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(350, 50, 0xff007f, 0x1a0033);
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    // Glow Sun
    const sunGeo = new THREE.SphereGeometry(100, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xff7c00 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(0, -20, -400); 
    scene.add(sun);

    // Stars
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 400;
      starPos[i * 3 + 1] = Math.random() * 200;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // --- TANK PLAYER ---
    const tank = new THREE.Group();
    const baseGroup = new THREE.Group();
    const turretGroup = new THREE.Group();
    
    // Base
    const baseGeo = new THREE.BoxGeometry(2, 0.8, 3);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.2, metalness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.4;
    base.castShadow = true;
    baseGroup.add(base);

    // Turret
    const turretGeo = new THREE.BoxGeometry(1.2, 0.6, 1.2);
    const turretMat = new THREE.MeshStandardMaterial({ color: 0xff007f, roughness: 0.2, metalness: 0.7 });
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.y = 1.1;
    turret.castShadow = true;
    turretGroup.add(turret);

    // Cannon
    const cannonGeo = new THREE.BoxGeometry(0.3, 0.3, 2);
    const cannonLoaderMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
    const cannon = new THREE.Mesh(cannonGeo, cannonLoaderMat);
    cannon.position.set(0, 1.1, -1.5);
    cannon.castShadow = true;
    turretGroup.add(cannon);

    tank.add(baseGroup);
    tank.add(turretGroup);
    scene.add(tank);

    // --- STATE ---
    const keys: { [key: string]: boolean } = {};
    gameRef.current = {
      scene, camera, renderer, tank, baseGroup, turretGroup, cannon,
      bullets: [], ufos: [], score: 0, misses: 0, lastShotTime: 0, keys,
      frameId: 0, clock: new THREE.Clock(), isGameOverTriggered: false,
      input: { isFiring: false, moveDir: new THREE.Vector2(), yaw: 0, pitch: 0.2 },
      touch: { leftId: -1, rightId: -1, startX: 0, startY: 0, lastRightX: 0, lastRightY: 0 }
    };

    const g = gameRef.current;

    // --- HANDLERS (Desktop) ---
    const handleKeyDown = (e: KeyboardEvent) => (keys[e.code] = true);
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
            g.input.pitch = THREE.MathUtils.clamp(g.input.pitch, -Math.PI/2 + 0.1, Math.PI/2 - 0.1);
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

    // --- WINDOW EVENT LISTENERS ---
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('click', requestPointerLock);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // --- GAME LOOP ---
    const lastSpawnTime = { time: 0 };
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
      const time = tg.clock.getElapsedTime();

      // Keyboard movement (Desktop override)
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

      // Camera Follow & Orbit
      const camDist = 14;
      const camX = tg.tank.position.x + Math.sin(tg.input.yaw) * Math.cos(tg.input.pitch) * camDist;
      const camY = tg.tank.position.y + 2 + Math.sin(tg.input.pitch) * camDist;
      const camZ = tg.tank.position.z + Math.cos(tg.input.yaw) * Math.cos(tg.input.pitch) * camDist;
      
      const idealPos = new THREE.Vector3(camX, camY, camZ);
      
      // Screen shake
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
          const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0), tg.input.yaw);
          const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), tg.input.yaw);
          
          const moveDelta = new THREE.Vector3()
              .add(right.multiplyScalar(tg.input.moveDir.x))
              .add(forward.multiplyScalar(-tg.input.moveDir.y));
          
          const speed = 20 * delta;
          moveDelta.normalize().multiplyScalar(speed);
          tg.tank.position.add(moveDelta);
          
          tg.tank.position.x = THREE.MathUtils.clamp(tg.tank.position.x, -145, 145);
          tg.tank.position.z = THREE.MathUtils.clamp(tg.tank.position.z, -145, 145);

          const targetRot = Math.atan2(moveDelta.x, moveDelta.z);
          // lerp for base
          let diff = targetRot - tg.baseGroup.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          tg.baseGroup.rotation.y += diff * 10 * delta;
      }

      // Turret rotation follows camera
      tg.turretGroup.rotation.y = tg.input.yaw;
      tg.cannon.rotation.x = tg.input.pitch;

      // Shooting
      if (tg.input.isFiring && time - tg.lastShotTime > 0.15) {
        const bulletGeo = new THREE.BoxGeometry(0.2, 0.2, 1);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);
        
        bullet.position.copy(tg.tank.position);
        bullet.position.y += 1.1; // cannon height
        
        // Direction based on turret
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(new THREE.Euler(tg.input.pitch, tg.input.yaw, 0));
        
        bullet.position.add(dir.clone().multiplyScalar(2)); // spawn slightly ahead
        bullet.userData.dir = dir;
        
        // Bullet light trail effect could be added here
        
        tg.scene.add(bullet);
        tg.bullets.push(bullet);
        tg.lastShotTime = time;
      }

      // Update Bullets
      const bulletSpeed = 100 * delta;
      for (let i = tg.bullets.length - 1; i >= 0; i--) {
        const b = tg.bullets[i];
        b.position.add(b.userData.dir.clone().multiplyScalar(bulletSpeed));
        if (b.position.distanceTo(tg.tank.position) > 150) {
          tg.scene.remove(b);
          tg.bullets.splice(i, 1);
        }
      }

      // Spawn UFOs (360 degrees around player)
      const ufoSpawnRate = Math.max(0.6, 2.0 - (tg.score / 100) * 0.05);
      if (time - lastSpawnTime.time > ufoSpawnRate) {
        const ufo = createUFO();
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 40;
        ufo.position.set(
            tg.tank.position.x + Math.cos(angle) * dist,
            Math.random() * 15 + 5,
            tg.tank.position.z + Math.sin(angle) * dist
        );
        tg.scene.add(ufo);
        tg.ufos.push(ufo);
        lastSpawnTime.time = time;
      }

      // Update UFOs and Collision
      const ufoMoveSpeed = (12 + (tg.score / 100) * 0.5) * delta;
      for (let i = tg.ufos.length - 1; i >= 0; i--) {
        const u = tg.ufos[i];
        
        // Move towards player
        const dir = new THREE.Vector3().subVectors(tg.tank.position, u.position).normalize();
        u.position.add(dir.multiplyScalar(ufoMoveSpeed));
        u.position.y += Math.sin(time * 3 + i) * 0.05; // bobbing
        u.rotation.y += delta * 2;

        let destroyed = false;
        
        // Collision with player
        if (u.position.distanceTo(tg.tank.position) < 5) {
            destroyed = true;
            tg.misses += 1;
            onMissUpdate(tg.misses);
            shakeIntensity = 2.0;
            
            if (tg.misses >= 5 && !tg.isGameOverTriggered) {
                tg.isGameOverTriggered = true;
                onGameOver(tg.score);
            }
        }

        // Collision with Bullets
        if (!destroyed) {
            for (let j = tg.bullets.length - 1; j >= 0; j--) {
              const b = tg.bullets[j];
              if (u.position.distanceTo(b.position) < 3.5) {
                destroyed = true;
                tg.score += 100;
                onScoreUpdate(tg.score);
                tg.scene.remove(b);
                tg.bullets.splice(j, 1);
                break;
              }
            }
        }

        if (destroyed) {
          spawnExplosion(u.position, tg.scene);
          tg.scene.remove(u);
          tg.ufos.splice(i, 1);
          if (tg.score % 500 === 0 && tg.score > 0) shakeIntensity = 0.5; // slight satisfaction shake
        }
      }

      tg.renderer.render(tg.scene, tg.camera);
    };

    animate();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (gameRef.current) {
        cancelAnimationFrame(gameRef.current.frameId);
        gameRef.current.renderer.dispose();
      }
    };
  }, [isPaused]);

  // --- TOUCH HANDLERS (Mobile overlay) ---
  const handlePointerDown = (e: React.PointerEvent) => {
      const g = gameRef.current;
      if (!g) return;

      // Use setPointerCapture to ensure move events are tracked even outside the element
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      // Left side: Joystick (Touch only usually, but let's check for proximity to a virtual joystick if we want)
      // For now, let's keep joystick only if it feels like touch (or just always allow it on left third)
      const joystickAreaWidth = window.innerWidth * 0.35;
      
      if (e.pointerType === 'touch' && e.clientX < joystickAreaWidth && g.touch.leftId === -1) {
          g.touch.leftId = e.pointerId;
          g.touch.startX = e.clientX;
          g.touch.startY = e.clientY;
          const base = document.getElementById('joystick-base');
          const knob = document.getElementById('joystick-knob');
          if (base && knob) {
              base.style.display = 'block';
              base.style.left = `${e.clientX}px`;
              base.style.top = `${e.clientY}px`;
              knob.style.transform = `translate(-50%, -50%)`;
          }
      } else if (g.touch.rightId === -1) {
          // Right side or anywhere else: Camera Look
          g.touch.rightId = e.pointerId;
          g.touch.lastRightX = e.clientX;
          g.touch.lastRightY = e.clientY;
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      const g = gameRef.current;
      if (!g) return;

      if (e.pointerId === g.touch.leftId) {
          const dx = e.clientX - g.touch.startX;
          const dy = e.clientY - g.touch.startY;
          const dist = Math.hypot(dx, dy);
          const maxDist = 50;
          const angle = Math.atan2(dy, dx);
          
          const cappedDist = Math.min(dist, maxDist);
          g.input.moveDir.set(Math.cos(angle) * cappedDist / maxDist, Math.sin(angle) * cappedDist / maxDist);
          
          const knob = document.getElementById('joystick-knob');
          if (knob) {
              knob.style.transform = `translate(calc(-50% + ${Math.cos(angle)*cappedDist}px), calc(-50% + ${Math.sin(angle)*cappedDist}px))`;
          }
      } else if (e.pointerId === g.touch.rightId) {
          const dx = e.clientX - g.touch.lastRightX;
          const dy = e.clientY - g.touch.lastRightY;
          g.touch.lastRightX = e.clientX;
          g.touch.lastRightY = e.clientY;

          const sensitivity = 0.005;
          g.input.yaw -= dx * sensitivity;
          g.input.pitch -= dy * sensitivity;
          g.input.pitch = THREE.MathUtils.clamp(g.input.pitch, -Math.PI/2 + 0.1, Math.PI/2 - 0.1);
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      const g = gameRef.current;
      if (!g) return;

      if (e.pointerId === g.touch.leftId) {
          g.touch.leftId = -1;
          g.input.moveDir.set(0, 0);
          const base = document.getElementById('joystick-base');
          if (base) base.style.display = 'none';
      } else if (e.pointerId === g.touch.rightId) {
          g.touch.rightId = -1;
      }
      
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Helper: Create UFO Model
  function createUFO() {
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(2, 2, 0.5, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.1, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    const cockpitGeo = new THREE.SphereGeometry(0.8, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMat = new THREE.MeshPhongMaterial({ color: 0xff007f, transparent: true, opacity: 0.6, shininess: 100 });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.y = 0.2;
    group.add(cockpit);

    for (let i = 0; i < 8; i++) {
        const lightGeo = new THREE.SphereGeometry(0.12, 4, 4);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const light = new THREE.Mesh(lightGeo, lightMat);
        const angle = (i / 8) * Math.PI * 2;
        light.position.set(Math.cos(angle) * 1.8, -0.1, Math.sin(angle) * 1.8);
        group.add(light);
    }
    return group;
  }

  // Helper: Simple Particle Explosion
  function spawnExplosion(pos: THREE.Vector3, scene: THREE.Scene) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const pGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const pMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff007f : 0x00f0ff });
        const p = new THREE.Mesh(pGeo, pMat);
        p.position.copy(pos);
        const velocity = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        scene.add(p);

        let life = 1.0;
        const tick = () => {
            life -= 0.04;
            p.position.add(velocity);
            p.scale.set(life, life, life);
            p.rotation.x += 0.1;
            p.rotation.y += 0.1;
            if (life > 0) requestAnimationFrame(tick);
            else scene.remove(p);
        };
        tick();
    }
  }

  return (
    <>
      <div 
        ref={containerRef} 
        className="absolute inset-0 cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {/* Mobile Controls Overlay */}
      {isMobile && !isPaused && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Joystick Area */}
          <div 
            id="joystick-base" 
            className="absolute w-24 h-24 bg-white/5 border-2 border-[#00f0ff]/30 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            style={{ display: 'none', transform: 'translate(-50%, -50%)' }}
          >
            <div 
              id="joystick-knob" 
              className="absolute w-10 h-10 bg-[#00f0ff]/40 rounded-full top-1/2 left-1/2 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              style={{ transform: 'translate(-50%, -50%)' }}
            />
          </div>
          
          {/* Fire Button - Positioned specifically for landscape and portrait */}
          <button
            id="fire-button"
            className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 w-20 h-20 sm:w-24 sm:h-24 bg-[#ff007f]/10 border-2 border-[#ff007f] rounded-full flex items-center justify-center pointer-events-auto active:bg-[#ff007f]/40 touch-none select-none text-[#ff007f] font-black italic tracking-tighter text-lg sm:text-xl shadow-[0_0_30px_rgba(255,0,127,0.3)] transition-all hover:scale-105 active:scale-95"
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); if (gameRef.current) gameRef.current.input.isFiring = true; }}
            onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); if (gameRef.current) gameRef.current.input.isFiring = false; }}
            onPointerLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (gameRef.current) gameRef.current.input.isFiring = false; }}
            onContextMenu={(e) => { e.preventDefault() }}
          >
            FIRE
          </button>
        </div>
      )}
    </>
  );
}
