export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export interface Player extends Entity {
  speed: number;
  lives: number;
  invincible: boolean;
  invincibleTimer: number;
  shootCooldown: number;
}

export interface Bullet extends Entity {
  vy: number;
  isEnemy: boolean;
  color: string;
}

export interface Enemy extends Entity {
  type: 'basic' | 'tough' | 'fast' | 'boss';
  hp: number;
  maxHp: number;
  speed: number;
  vx: number;
  vy: number;
  shootCooldown: number;
  shootInterval: number;
  points: number;
  animFrame: number;
  animTimer: number;
  color: string;
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface PowerUp extends Entity {
  type: 'shield' | 'rapid' | 'triple' | 'bomb';
  vy: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelup';
