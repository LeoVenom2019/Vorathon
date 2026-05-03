export interface StatusEffect {
  type: 'BURN' | 'FREEZE' | 'SLOW' | 'MARK';
  duration: number;
  intensity: number;
}

export class StatusSystem {
  private enemyStatuses: Map<string, StatusEffect[]> = new Map();

  applyStatus(enemyId: string, effect: StatusEffect) {
    if (!this.enemyStatuses.has(enemyId)) {
      this.enemyStatuses.set(enemyId, []);
    }
    const statuses = this.enemyStatuses.get(enemyId)!;
    // Overwrite same type or stack? Let's refresh duration for now
    const existing = statuses.find(s => s.type === effect.type);
    if (existing) {
      existing.duration = Math.max(existing.duration, effect.duration);
      existing.intensity = Math.max(existing.intensity, effect.intensity);
    } else {
      statuses.push(effect);
    }
  }

  update(delta: number, enemies: any[], applyDamage: (id: string, dmg: number) => void) {
    enemies.forEach(enemy => {
      const statuses = this.enemyStatuses.get(enemy.id);
      if (!statuses) return;

      for (let i = statuses.length - 1; i >= 0; i--) {
        const s = statuses[i];
        s.duration -= delta;

        if (s.type === 'BURN') {
           applyDamage(enemy.id, s.intensity * delta);
        }

        if (s.duration <= 0) {
          statuses.splice(i, 1);
        }
      }
      
      if (statuses.length === 0) {
        this.enemyStatuses.delete(enemy.id);
      }
    });
  }

  getStatuses(enemyId: string): StatusEffect[] {
    return this.enemyStatuses.get(enemyId) || [];
  }
  
  clear() {
      this.enemyStatuses.clear();
  }
}

export const statusSystem = new StatusSystem();
