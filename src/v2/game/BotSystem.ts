import * as THREE from 'three';

export enum BotState {
  IDLE = 'IDLE',
  WANDER = 'WANDER',
  CHASE = 'CHASE',
  ATTACK = 'ATTACK'
}

export interface Bot {
  group: THREE.Group;
  baseGroup: THREE.Group;
  turretGroup: THREE.Group;
  cannon: THREE.Mesh;
  state: BotState;
  targetPosition: THREE.Vector3;
  targetEnemy: THREE.Object3D | null;
  health: number;
  maxHealth: number;
  speed: number;
  fireRate: number;
  lastFireTime: number;
  teamId: number;
  bullets: THREE.Mesh[];
  yaw: number;
  pitch: number;
}

export class BotSystem {
  private scene: THREE.Scene;
  private bots: Bot[] = [];
  private detectionRange = 50;
  private wanderRange = 100;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createBot(position: THREE.Vector3, teamId: number): Bot {
    const bot: Bot = {
      group: new THREE.Group(),
      baseGroup: new THREE.Group(),
      turretGroup: new THREE.Group(),
      cannon: new THREE.Mesh(),
      state: BotState.WANDER,
      targetPosition: position.clone(),
      targetEnemy: null,
      health: 100,
      maxHealth: 100,
      speed: 15,
      fireRate: 0.5,
      lastFireTime: 0,
      teamId,
      bullets: [],
      yaw: Math.random() * Math.PI * 2,
      pitch: 0.2
    };

    // Tạo tank bot (tương tự tank player)
    const baseGeo = new THREE.BoxGeometry(2, 0.8, 3);
    const baseMat = new THREE.MeshStandardMaterial({
      color: teamId === 0 ? 0x00f0ff : 0xff6600,
      roughness: 0.2,
      metalness: 0.7
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.4;
    base.castShadow = true;
    bot.baseGroup.add(base);

    const turretGeo = new THREE.BoxGeometry(1.2, 0.6, 1.2);
    const turretMat = new THREE.MeshStandardMaterial({
      color: teamId === 0 ? 0xff007f : 0xffaa00,
      roughness: 0.2,
      metalness: 0.7
    });
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.y = 1.1;
    turret.castShadow = true;
    bot.turretGroup.add(turret);

    const cannonGeo = new THREE.BoxGeometry(0.3, 0.3, 2);
    const cannonMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    });
    const cannon = new THREE.Mesh(cannonGeo, cannonMat);
    cannon.position.set(0, 1.1, -1.5);
    cannon.castShadow = true;
    bot.turretGroup.add(cannon);
    bot.cannon = cannon;

    bot.group.add(bot.baseGroup);
    bot.group.add(bot.turretGroup);
    bot.group.position.copy(position);
    this.scene.add(bot.group);

    this.bots.push(bot);
    return bot;
  }

  public updateBots(delta: number, playerPos: THREE.Vector3, playerGroup: THREE.Group, obstacles: THREE.Mesh[]): void {
    for (const bot of this.bots) {
      this.updateBotAI(bot, delta, playerPos, playerGroup, obstacles);
      this.updateBotMovement(bot, delta, obstacles);
      this.updateBotTurret(bot, delta);
    }
  }

  private updateBotAI(bot: Bot, delta: number, playerPos: THREE.Vector3, playerGroup: THREE.Group, obstacles: THREE.Mesh[]): void {
    const distToPlayer = bot.group.position.distanceTo(playerPos);

    if (distToPlayer < this.detectionRange) {
      bot.state = BotState.CHASE;
      bot.targetEnemy = playerGroup;
      bot.targetPosition.copy(playerPos);
    } else if (bot.state === BotState.CHASE) {
      bot.state = BotState.WANDER;
      bot.targetEnemy = null;
    }

    if (bot.state === BotState.WANDER) {
      const distToTarget = bot.group.position.distanceTo(bot.targetPosition);
      if (distToTarget < 5) {
        bot.targetPosition.set(
          bot.group.position.x + (Math.random() - 0.5) * this.wanderRange,
          bot.group.position.y,
          bot.group.position.z + (Math.random() - 0.5) * this.wanderRange
        );
      }
    }
  }

  private updateBotMovement(bot: Bot, delta: number, obstacles: THREE.Mesh[]): void {
    const direction = new THREE.Vector3().subVectors(bot.targetPosition, bot.group.position);
    direction.y = 0;

    if (direction.length() > 0.1) {
      direction.normalize();
      const moveDistance = bot.speed * delta;
      const newPos = bot.group.position.clone().add(direction.multiplyScalar(moveDistance));

      // Kiểm tra va chạm đơn giản
      let canMove = true;
      for (const obstacle of obstacles) {
        const dist = newPos.distanceTo(obstacle.position);
        if (dist < 3) {
          canMove = false;
          break;
        }
      }

      if (canMove) {
        bot.group.position.copy(newPos);
      }

      // Cập nhật yaw (quay)
      const targetYaw = Math.atan2(direction.x, direction.z);
      let diff = targetYaw - bot.yaw;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      bot.yaw += diff * 0.1;

      bot.baseGroup.rotation.y = bot.yaw;
    }
  }

  private updateBotTurret(bot: Bot, delta: number): void {
    if (bot.targetEnemy) {
      const targetPos = (bot.targetEnemy as THREE.Group).position;
      const direction = new THREE.Vector3().subVectors(targetPos, bot.turretGroup.position);
      const distance = direction.length();

      if (distance < 60) {
        const targetYaw = Math.atan2(direction.x, direction.z);
        const targetPitch = -Math.asin(direction.y / distance);

        let diffYaw = targetYaw - bot.yaw;
        while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
        while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
        bot.yaw += diffYaw * 0.05;

        bot.pitch += (targetPitch - bot.pitch) * 0.05;
        bot.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, bot.pitch));

        bot.turretGroup.rotation.y = bot.yaw;
        bot.turretGroup.rotation.x = bot.pitch;

        // Bắn
        const now = Date.now() / 1000;
        if (now - bot.lastFireTime > bot.fireRate) {
          this.fireBotBullet(bot);
          bot.lastFireTime = now;
        }
      }
    }
  }

  private fireBotBullet(bot: Bot): void {
    const bulletGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const bulletMat = new THREE.MeshBasicMaterial({
      color: bot.teamId === 0 ? 0xff007f : 0xffaa00
    });
    const bullet = new THREE.Mesh(bulletGeo, bulletMat);
    bullet.position.copy(bot.cannon.getWorldPosition(new THREE.Vector3()));

    const direction = new THREE.Vector3(0, 0, -1)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), bot.pitch)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), bot.yaw);

    (bullet as any).velocity = direction.multiplyScalar(60);
    (bullet as any).lifetime = 5;

    this.scene.add(bullet);
    bot.bullets.push(bullet);
  }

  public removeBullet(bullet: THREE.Mesh): void {
    for (const bot of this.bots) {
      const idx = bot.bullets.indexOf(bullet);
      if (idx !== -1) {
        bot.bullets.splice(idx, 1);
        break;
      }
    }
    this.scene.remove(bullet);
  }

  public getBots(): Bot[] {
    return this.bots;
  }

  public dispose(): void {
    for (const bot of this.bots) {
      this.scene.remove(bot.group);
      bot.bullets.forEach(b => this.scene.remove(b));
    }
    this.bots = [];
  }
}
