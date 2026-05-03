export class CurrencySystem {
  addGold(current: number, amount: number): number {
    return current + amount;
  }

  addShards(current: number, amount: number): number {
    return current + amount;
  }

  canAfford(cost: number, balance: number): boolean {
    return balance >= cost;
  }
}

export const currencySystem = new CurrencySystem();
