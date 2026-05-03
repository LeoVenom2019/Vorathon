import runesData from '../data/runes.json';
import relicsData from '../data/relics.json';

export enum EventType {
  HORDE = 'HORDE',
  NONE = 'NONE'
}

export class EventSystem {
  currentEvent: EventType = EventType.NONE;
  eventTimer: number = 0;
  eventDuration: number = 0;
  cooldownTimer: number = 30; // 30 seconds between events
  activationChance: number = 0.05; // 5% chance every second to trigger if not in cooldown
  
  // Horde specific
  hordeSpawnMultiplier: number = 3.0;
  hordeAgressionMultiplier: number = 1.6;
  
  messageTimer: number = 0;
  message: string = '';
  pendingFinalReward: boolean = false;

  reset() {
    this.currentEvent = EventType.NONE;
    this.eventTimer = 0;
    this.eventDuration = 0;
    this.cooldownTimer = 30;
    this.message = '';
    this.messageTimer = 0;
    this.pendingFinalReward = false;
  }

  update(delta: number) {
    if (this.messageTimer > 0) {
      this.messageTimer -= delta;
    }

    if (this.currentEvent !== EventType.NONE) {
      this.eventTimer += delta;
      if (this.eventTimer >= this.eventDuration) {
        this.endEvent();
      }
    } else {
      if (this.cooldownTimer > 0) {
        this.cooldownTimer -= delta;
      } else {
        // Simple chance based activation
        if (Math.random() < this.activationChance * delta) {
          this.startHorde();
        }
      }
    }
  }

  startHorde() {
    this.currentEvent = EventType.HORDE;
    this.eventTimer = 0;
    this.eventDuration = 10 + Math.random() * 2; // 10 to 12 seconds
    this.message = 'HORDA INIMIGA INICIADA';
    this.messageTimer = 3;
  }

  endEvent() {
    if (this.currentEvent === EventType.HORDE) {
        this.pendingFinalReward = true;
    }
    
    this.currentEvent = EventType.NONE;
    this.cooldownTimer = 45; // Longer cooldown after a horde
    this.message = 'HORDA FINALIZADA';
    this.messageTimer = 2;
  }

  getSpawnMultiplier(): number {
    return this.currentEvent === EventType.HORDE ? this.hordeSpawnMultiplier : 1.0;
  }

  getAgressionMultiplier(): number {
    return this.currentEvent === EventType.HORDE ? this.hordeAgressionMultiplier : 1.0;
  }
  
  isHordeActive(): boolean {
    return this.currentEvent === EventType.HORDE;
  }
}

export const eventSystem = new EventSystem();
