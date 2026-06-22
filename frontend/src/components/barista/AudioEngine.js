class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.noiseBuffer = null;

    this.ambientNode = null;
    this.grinderSource = null;
    this.grinderGain = null;
    this.pumpSource = null;
    this.pumpGain = null;
    this.steamSource = null;
    this.steamGain = null;

    this.servoOsc1 = null;
    this.servoOsc2 = null;
    this.servoGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.createNoiseBuffer();
      this.setupAmbience();
      this.setupServos();
      this.enabled = true;
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.init();
    this.resume();
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (this.ambientGain) this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    } else {
      if (this.ambientGain) this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.servoGain) this.servoGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.stopGrinder();
      this.stopPump();
      this.stopSteam();
    }
    return this.enabled;
  }

  createNoiseBuffer() {
    const size = 2 * this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  setupAmbience() {
    if (!this.ctx) return;
    
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.ambientOsc.connect(this.ambientGain).connect(this.ctx.destination);
    this.ambientOsc.start();
  }

  setupServos() {
    if (!this.ctx) return;

    this.servoOsc1 = this.ctx.createOscillator();
    this.servoOsc1.type = 'triangle';
    this.servoOsc1.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.servoOsc2 = this.ctx.createOscillator();
    this.servoOsc2.type = 'sine';
    this.servoOsc2.frequency.setValueAtTime(240, this.ctx.currentTime);

    this.servoGain = this.ctx.createGain();
    this.servoGain.gain.setValueAtTime(0, this.ctx.currentTime);

    const servoFilter = this.ctx.createBiquadFilter();
    servoFilter.type = 'lowpass';
    servoFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.servoOsc1.connect(servoFilter);
    this.servoOsc2.connect(servoFilter);
    servoFilter.connect(this.servoGain).connect(this.ctx.destination);

    this.servoOsc1.start();
    this.servoOsc2.start();
  }

  updateServos(velocity) {
    if (!this.enabled || !this.ctx || !this.servoGain) return;
    const t = this.ctx.currentTime;
    const speed = Math.min(1.0, velocity * 4.0);
    
    if (speed > 0.01) {
      const targetFreq1 = 120 + speed * 260;
      const targetFreq2 = targetFreq1 * 2;
      this.servoOsc1.frequency.setTargetAtTime(targetFreq1, t, 0.05);
      this.servoOsc2.frequency.setTargetAtTime(targetFreq2, t, 0.05);
      
      const targetVol = speed * 0.07;
      this.servoGain.gain.setTargetAtTime(targetVol, t, 0.04);
    } else {
      this.servoGain.gain.setTargetAtTime(0, t, 0.08);
    }
  }

  startGrinder() {
    if (!this.enabled || !this.ctx || this.grinderSource) return;

    const t = this.ctx.currentTime;
    this.grinderSource = this.ctx.createBufferSource();
    this.grinderSource.buffer = this.noiseBuffer;
    this.grinderSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(2.0, t);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(7, t);
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(150, t);
    
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    this.grinderGain = this.ctx.createGain();
    this.grinderGain.gain.setValueAtTime(0, t);
    this.grinderGain.gain.linearRampToValueAtTime(0.25, t + 0.3);

    this.grinderSource.connect(filter);
    filter.connect(this.grinderGain).connect(this.ctx.destination);
    this.grinderSource.start();

    this.grinderLfo = lfo;
  }

  stopGrinder() {
    if (!this.ctx || !this.grinderSource) return;
    const t = this.ctx.currentTime;
    this.grinderGain.gain.cancelScheduledValues(t);
    this.grinderGain.gain.setValueAtTime(this.grinderGain.gain.value, t);
    this.grinderGain.gain.linearRampToValueAtTime(0, t + 0.3);

    const src = this.grinderSource;
    const lfo = this.grinderLfo;
    setTimeout(() => {
      try {
        src.stop();
        lfo.stop();
      } catch (e) {}
    }, 400);

    this.grinderSource = null;
    this.grinderGain = null;
    this.grinderLfo = null;
  }

  startPump() {
    if (!this.enabled || !this.ctx || this.pumpSource) return;

    const t = this.ctx.currentTime;
    this.pumpOsc = this.ctx.createOscillator();
    this.pumpOsc.type = 'sawtooth';
    this.pumpOsc.frequency.setValueAtTime(55, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, t);

    const vibrato = this.ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(35, t);
    
    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.setValueAtTime(10, t);

    vibrato.connect(vibratoGain).connect(this.pumpOsc.frequency);
    vibrato.start();

    this.pumpGain = this.ctx.createGain();
    this.pumpGain.gain.setValueAtTime(0, t);
    this.pumpGain.gain.linearRampToValueAtTime(0.18, t + 0.4);

    this.pumpOsc.connect(filter).connect(this.pumpGain).connect(this.ctx.destination);
    this.pumpOsc.start();

    this.pumpVibrato = vibrato;
  }

  stopPump() {
    if (!this.ctx || !this.pumpOsc) return;
    const t = this.ctx.currentTime;
    this.pumpGain.gain.cancelScheduledValues(t);
    this.pumpGain.gain.setValueAtTime(this.pumpGain.gain.value, t);
    this.pumpGain.gain.linearRampToValueAtTime(0, t + 0.3);

    const osc = this.pumpOsc;
    const vib = this.pumpVibrato;
    setTimeout(() => {
      try {
        osc.stop();
        vib.stop();
      } catch (e) {}
    }, 400);

    this.pumpOsc = null;
    this.pumpGain = null;
    this.pumpVibrato = null;
  }

  startSteam() {
    if (!this.enabled || !this.ctx || this.steamSource) return;

    const t = this.ctx.currentTime;
    this.steamSource = this.ctx.createBufferSource();
    this.steamSource.buffer = this.noiseBuffer;
    this.steamSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, t);

    const pulse = this.ctx.createOscillator();
    pulse.type = 'sine';
    pulse.frequency.setValueAtTime(1.8, t);
    
    const pulseGain = this.ctx.createGain();
    pulseGain.gain.setValueAtTime(400, t);
    
    pulse.connect(pulseGain).connect(filter.frequency);
    pulse.start();

    this.steamGain = this.ctx.createGain();
    this.steamGain.gain.setValueAtTime(0, t);
    this.steamGain.gain.linearRampToValueAtTime(0.12, t + 0.2);

    this.steamSource.connect(filter).connect(this.steamGain).connect(this.ctx.destination);
    this.steamSource.start();

    this.steamPulse = pulse;
  }

  stopSteam() {
    if (!this.ctx || !this.steamSource) return;
    const t = this.ctx.currentTime;
    this.steamGain.gain.cancelScheduledValues(t);
    this.steamGain.gain.setValueAtTime(this.steamGain.gain.value, t);
    this.steamGain.gain.linearRampToValueAtTime(0, t + 0.2);

    const src = this.steamSource;
    const pulse = this.steamPulse;
    setTimeout(() => {
      try {
        src.stop();
        pulse.stop();
      } catch (e) {}
    }, 300);

    this.steamSource = null;
    this.steamGain = null;
    this.steamPulse = null;
  }

  playClick() {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t0);
    osc.frequency.exponentialRampToValueAtTime(800, t0 + 0.05);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.095);
  }

  playChime() {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 987.77];
    
    freqs.forEach((freq, i) => {
      const triggerTime = t0 + i * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, triggerTime);
      
      gain.gain.setValueAtTime(0.0001, triggerTime);
      gain.gain.exponentialRampToValueAtTime(0.08, triggerTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, triggerTime + 1.2);
      
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(triggerTime);
      osc.stop(triggerTime + 1.5);
    });
  }
}

export const audio = new AudioEngine();
