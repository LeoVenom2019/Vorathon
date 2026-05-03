export class InputManager {
  private keys: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  get axisX(): number {
    let x = 0;
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) x -= 1;
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) x += 1;
    return x;
  }

  get axisY(): number {
    let y = 0;
    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) y -= 1;
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) y += 1;
    return y;
  }

  get isAction(): boolean {
    return this.isKeyDown('Space');
  }
}

export const inputManager = new InputManager();
