export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'weapon' | 'armor' | 'speed' | 'skin';
  bonus: number; // Phần trăm tăng hoặc giá trị cụ thể
}

export interface PlayerStats {
  credits: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  fireRate: number;
  skinColor: string;
  purchasedItems: Set<string>;
}

export class StoreSystem {
  private items: Map<string, StoreItem> = new Map();
  private playerStats: PlayerStats;

  constructor() {
    this.playerStats = {
      credits: 0,
      health: 100,
      maxHealth: 100,
      damage: 1,
      speed: 20,
      fireRate: 0.3,
      skinColor: '#00f0ff',
      purchasedItems: new Set()
    };

    this.initializeItems();
  }

  private initializeItems(): void {
    const items: StoreItem[] = [
      {
        id: 'weapon_1',
        name: 'Plasma Cannon Upgrade',
        description: 'Tăng sát thương lên 50%',
        price: 500,
        category: 'weapon',
        bonus: 1.5
      },
      {
        id: 'weapon_2',
        name: 'Quantum Blaster',
        description: 'Tăng sát thương lên 100%',
        price: 1500,
        category: 'weapon',
        bonus: 2.0
      },
      {
        id: 'armor_1',
        name: 'Shield Generator',
        description: 'Tăng máu lên 50',
        price: 800,
        category: 'armor',
        bonus: 50
      },
      {
        id: 'armor_2',
        name: 'Reinforced Plating',
        description: 'Tăng máu lên 100',
        price: 2000,
        category: 'armor',
        bonus: 100
      },
      {
        id: 'speed_1',
        name: 'Turbo Engines',
        description: 'Tăng tốc độ lên 30%',
        price: 600,
        category: 'speed',
        bonus: 1.3
      },
      {
        id: 'speed_2',
        name: 'Hyperdrive System',
        description: 'Tăng tốc độ lên 60%',
        price: 1800,
        category: 'speed',
        bonus: 1.6
      },
      {
        id: 'skin_1',
        name: 'Crimson Warrior',
        description: 'Skin màu đỏ',
        price: 300,
        category: 'skin',
        bonus: 0
      },
      {
        id: 'skin_2',
        name: 'Golden Titan',
        description: 'Skin màu vàng',
        price: 400,
        category: 'skin',
        bonus: 0
      },
      {
        id: 'skin_3',
        name: 'Neon Phantom',
        description: 'Skin màu tím',
        price: 500,
        category: 'skin',
        bonus: 0
      }
    ];

    items.forEach(item => this.items.set(item.id, item));
  }

  public addCredits(amount: number): void {
    this.playerStats.credits += amount;
  }

  public purchaseItem(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    if (this.playerStats.credits < item.price) return false;
    if (this.playerStats.purchasedItems.has(itemId)) return false;

    this.playerStats.credits -= item.price;
    this.playerStats.purchasedItems.add(itemId);

    this.applyItemBonus(item);
    return true;
  }

  private applyItemBonus(item: StoreItem): void {
    switch (item.category) {
      case 'weapon':
        this.playerStats.damage *= item.bonus;
        break;
      case 'armor':
        this.playerStats.maxHealth += item.bonus;
        this.playerStats.health = this.playerStats.maxHealth;
        break;
      case 'speed':
        this.playerStats.speed *= item.bonus;
        break;
      case 'skin':
        // Xử lý thay đổi skin
        const skinMap: { [key: string]: string } = {
          'skin_1': '#ff0000',
          'skin_2': '#ffaa00',
          'skin_3': '#aa00ff'
        };
        this.playerStats.skinColor = skinMap[item.id] || '#00f0ff';
        break;
    }
  }

  public getItems(): StoreItem[] {
    return Array.from(this.items.values());
  }

  public getPlayerStats(): PlayerStats {
    return this.playerStats;
  }

  public getItem(itemId: string): StoreItem | undefined {
    return this.items.get(itemId);
  }

  public hasPurchased(itemId: string): boolean {
    return this.playerStats.purchasedItems.has(itemId);
  }

  public resetStats(): void {
    this.playerStats = {
      credits: 0,
      health: 100,
      maxHealth: 100,
      damage: 1,
      speed: 20,
      fireRate: 0.3,
      skinColor: '#00f0ff',
      purchasedItems: new Set()
    };
  }
}
