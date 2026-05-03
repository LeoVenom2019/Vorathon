import { getPlayerState, updatePlayerState } from '../core/Store';

export class OverloadSystem {
    private isOverloaded: boolean = false;

    update() {
        const state = getPlayerState();
        const relicCount = state.equippedRelics.filter(Boolean).length;
        const runeCount = state.equippedRunes.filter(Boolean).length;

        const shouldOverload = relicCount >= 4 && runeCount >= 4;

        if (shouldOverload !== this.isOverloaded) {
            this.isOverloaded = shouldOverload;
            updatePlayerState(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    // We can add gameplay buffs here later if requested
                    isOverloaded: this.isOverloaded
                }
            }));
        }
    }

    get isActive(): boolean {
        return this.isOverloaded;
    }
}

export const overloadSystem = new OverloadSystem();
