export type SpaceSound = "launch" | "collect" | "hit" | "shield" | "end";

/** Original synthesized soundtrack and effects; no downloads or autoplay. */
export class SpaceAudio {
  private context: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private effectsBus: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private musicNodes = new Set<OscillatorNode>();
  private effectNodes = new Set<OscillatorNode>();
  private nextBeat = 0;
  private step = 0;
  private flying = false;
  private music = true;
  private effects = true;

  unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.musicBus = this.context.createGain();
        this.effectsBus = this.context.createGain();
        this.musicBus.gain.value = this.music ? 0.22 : 0;
        this.effectsBus.gain.value = this.effects ? 0.28 : 0;
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -8;
        this.musicBus.connect(limiter); this.effectsBus.connect(limiter); limiter.connect(this.context.destination);
      }
      void this.context.resume().catch(() => undefined);
      if (this.flying && !this.timer) this.startMusic();
    } catch { /* Browsers without audio support can still play the game. */ }
  }

  setOptions(music: boolean, effects: boolean) {
    this.music = music; this.effects = effects;
    if (this.context) {
      this.musicBus?.gain.setTargetAtTime(music ? 0.22 : 0, this.context.currentTime, 0.03);
      this.effectsBus?.gain.setTargetAtTime(effects ? 0.28 : 0, this.context.currentTime, 0.03);
    }
  }

  setFlight(active: boolean) {
    if (active === this.flying) return;
    this.flying = active;
    if (active) this.startMusic();
    else {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      for (const node of [...this.musicNodes, ...this.effectNodes]) { try { node.stop(); } catch {} }
      this.musicNodes.clear(); this.effectNodes.clear();
    }
  }

  private tone(frequency: number, when: number, duration: number, volume: number, music: boolean, endFrequency?: number) {
    const ctx = this.context;
    const bus = music ? this.musicBus : this.effectsBus;
    if (!ctx || !bus) return;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = music ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, when);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, when + duration);
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(volume, when + Math.min(0.03, duration / 4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(envelope); envelope.connect(bus);
    const nodes = music ? this.musicNodes : this.effectNodes;
    nodes.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); nodes.delete(oscillator); };
    oscillator.start(when); oscillator.stop(when + duration + 0.02);
  }

  private startMusic() {
    if (!this.context || this.timer || !this.flying) return;
    this.nextBeat = this.context.currentTime + 0.05; this.step = 0;
    const schedule = () => {
      const ctx = this.context;
      if (!ctx || ctx.state !== "running") return;
      if (this.nextBeat < ctx.currentTime) this.nextBeat = ctx.currentTime + 0.03;
      const chords = [[220, 261.63, 329.63, 440], [174.61, 220, 261.63, 349.23], [130.81, 164.81, 196, 261.63], [196, 246.94, 293.66, 392]];
      while (this.nextBeat < ctx.currentTime + 0.18) {
        const chord = chords[Math.floor(this.step / 16) % chords.length];
        const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
        this.tone(chord[pattern[this.step % 8]], this.nextBeat, 0.8, 0.22, true);
        if (this.step % 8 === 0) this.tone(chord[0] / 2, this.nextBeat, 2.3, 0.2, true);
        this.step++; this.nextBeat += 60 / 92 / 2;
      }
    };
    this.timer = setInterval(schedule, 40); schedule();
  }

  play(sound: SpaceSound) {
    if (!this.context || this.context.state !== "running" || !this.effects) return;
    const now = this.context.currentTime;
    if (sound === "launch") this.tone(70, now, 0.8, 0.6, false, 500);
    if (sound === "collect") [660, 880, 1320].forEach((f, i) => this.tone(f, now + i * 0.055, 0.23, 0.32, false));
    if (sound === "hit") { this.tone(170, now, 0.28, 0.8, false, 35); this.tone(87, now, 0.4, 0.5, false, 24); }
    if (sound === "shield") [440, 554.37, 659.25, 880].forEach((f, i) => this.tone(f, now + i * 0.09, 0.45, 0.3, false));
    if (sound === "end") [330, 261.63, 220, 110].forEach((f, i) => this.tone(f, now + i * 0.15, 0.6, 0.4, false));
  }

  dispose() {
    this.setFlight(false);
    if (this.timer) clearInterval(this.timer);
    if (this.context) void this.context.close().catch(() => undefined);
    this.context = null; this.timer = null;
  }
}
