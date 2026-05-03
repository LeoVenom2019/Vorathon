export interface DamageInfo {
  amount: number;
  isCrit: boolean;
  source: string;
}

export class CombatSystem {
  calculateDamage(base: number, critChance: number, critMult: number): DamageInfo {
    // Damage variance: +5% to +12%
    const variance = 1 + (Math.random() * (0.12 - 0.05) + 0.05);
    let finalAmount = base * variance;
    
    const isCrit = Math.random() * 100 < critChance;
    
    if (isCrit) {
      // Crit variance: 4x to 6x (instead of 3x base)
      const critVarianceMult = Math.random() * (6 - 4) + 4;
      finalAmount = base * critVarianceMult;
    }
    
    return {
      amount: Math.round(finalAmount),
      isCrit,
      source: 'player'
    };
  }

  checkCollision(a: { x: number, y: number, width: number, height: number }, b: { x: number, y: number, width: number, height: number }): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }
}

export const combatSystem = new CombatSystem();
