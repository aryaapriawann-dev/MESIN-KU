// Audio synthesizer for operational alarm and warnings compliant with browser autoplay policies

class TelemetryAudio {
  private ctx: AudioContext | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isMuted: boolean = false;

  public init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public playAlarm(onTick?: () => void) {
    if (this.isMuted) return;
    this.init();
    if (this.intervalId) return; // already active

    // Immediately play tone
    this.playTone(880, 0.25, "sawtooth");
    onTick?.();

    // Pulse every 1 second
    let high = false;
    this.intervalId = setInterval(() => {
      if (this.isMuted) return;
      high = !high;
      this.playTone(high ? 960 : 720, 0.22, "sawtooth");
      onTick?.();
    }, 900);
  }

  public stopAlarm() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAlarm();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private playTone(freq: number, durationSec: number, type: OscillatorType = "sine") {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + durationSec);
    } catch {
      // Audio playback blocked or failed
    }
  }
}

export const telemetryAudio = new TelemetryAudio();
