export class AssetLoader {
  private images: Map<string, HTMLImageElement> = new Map();
  private sounds: Map<string, HTMLAudioElement> = new Map();

  async loadImage(key: string, url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = reject;
    });
  }

  async loadSound(key: string, url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.oncanplaythrough = () => {
        this.sounds.set(key, audio);
        resolve(audio);
      };
      audio.onerror = reject;
    });
  }

  getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  playSound(key: string) {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }
}

export const assetLoader = new AssetLoader();
