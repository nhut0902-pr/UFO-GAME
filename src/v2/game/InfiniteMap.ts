import * as THREE from 'three';

interface ChunkData {
  x: number;
  z: number;
  mesh: THREE.Mesh;
  obstacles: THREE.Mesh[];
  trees: THREE.InstancedMesh;
}

export class InfiniteMap {
  private scene: THREE.Scene;
  private chunks: Map<string, ChunkData> = new Map();
  private chunkSize = 100;
  private loadDistance = 200;
  private unloadDistance = 300;
  private treeInstances: THREE.InstancedMesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private getChunkKey(x: number, z: number): string {
    return `${Math.floor(x / this.chunkSize)}_${Math.floor(z / this.chunkSize)}`;
  }

  private createChunk(chunkX: number, chunkZ: number): ChunkData {
    const key = `${chunkX}_${chunkZ}`;
    
    // Tạo ground cho chunk
    const groundGeo = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.3, 0.3, 0.4),
      roughness: 0.3,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(chunkX * this.chunkSize, 0, chunkZ * this.chunkSize);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Tạo vật cản (rocks)
    const obstacles: THREE.Mesh[] = [];
    const obstacleCount = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < obstacleCount; i++) {
      const rockSize = Math.random() * 2 + 1;
      const rockGeo = new THREE.BoxGeometry(rockSize, rockSize * 0.6, rockSize);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8,
        metalness: 0.1
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(
        chunkX * this.chunkSize + Math.random() * this.chunkSize - this.chunkSize / 2,
        rockSize * 0.3,
        chunkZ * this.chunkSize + Math.random() * this.chunkSize - this.chunkSize / 2
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      obstacles.push(rock);
    }

    // Tạo cây xanh (sử dụng InstancedMesh để tối ưu)
    const treeCount = Math.floor(Math.random() * 15) + 10;
    const treeGeo = new THREE.ConeGeometry(1.5, 4, 8);
    const treeMat = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.6,
      metalness: 0.1
    });
    const trees = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
    
    for (let i = 0; i < treeCount; i++) {
      const matrix = new THREE.Matrix4();
      matrix.setPosition(
        chunkX * this.chunkSize + Math.random() * this.chunkSize - this.chunkSize / 2,
        2,
        chunkZ * this.chunkSize + Math.random() * this.chunkSize - this.chunkSize / 2
      );
      trees.setMatrixAt(i, matrix);
    }
    trees.castShadow = true;
    trees.receiveShadow = true;
    this.scene.add(trees);

    return {
      x: chunkX,
      z: chunkZ,
      mesh: ground,
      obstacles,
      trees
    };
  }

  public updateChunks(playerPos: THREE.Vector3): void {
    const playerChunkX = Math.floor(playerPos.x / this.chunkSize);
    const playerChunkZ = Math.floor(playerPos.z / this.chunkSize);

    // Tạo các chunk gần người chơi
    for (let x = playerChunkX - 2; x <= playerChunkX + 2; x++) {
      for (let z = playerChunkZ - 2; z <= playerChunkZ + 2; z++) {
        const key = `${x}_${z}`;
        if (!this.chunks.has(key)) {
          this.chunks.set(key, this.createChunk(x, z));
        }
      }
    }

    // Xóa các chunk ở xa
    for (const [key, chunk] of this.chunks.entries()) {
      const distance = Math.hypot(
        chunk.x * this.chunkSize - playerPos.x,
        chunk.z * this.chunkSize - playerPos.z
      );
      if (distance > this.unloadDistance) {
        this.scene.remove(chunk.mesh);
        chunk.obstacles.forEach(obs => this.scene.remove(obs));
        this.scene.remove(chunk.trees);
        this.chunks.delete(key);
      }
    }
  }

  public getObstacles(): THREE.Mesh[] {
    const obstacles: THREE.Mesh[] = [];
    for (const chunk of this.chunks.values()) {
      obstacles.push(...chunk.obstacles);
    }
    return obstacles;
  }

  public dispose(): void {
    for (const chunk of this.chunks.values()) {
      this.scene.remove(chunk.mesh);
      chunk.obstacles.forEach(obs => this.scene.remove(obs));
      this.scene.remove(chunk.trees);
    }
    this.chunks.clear();
  }
}
