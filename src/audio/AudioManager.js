export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.3;
        this.enabled = true;
        
        this.init();
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Create sound definitions with procedural generation
            this.createSounds();
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.enabled = false;
        }
    }
    
    createSounds() {
        // Engine sound (looping background)
        this.sounds.set('engine', {
            type: 'oscillator',
            frequency: 80,
            volume: 0.2,
            loop: true
        });
        
        // Weapon fire sounds
        this.sounds.set('rocket_fire', {
            type: 'noise',
            duration: 0.3,
            volume: 0.6,
            filter: { type: 'highpass', frequency: 400 }
        });
        
        this.sounds.set('mine_place', {
            type: 'noise',
            duration: 0.2,
            volume: 0.4,
            filter: { type: 'lowpass', frequency: 800 }
        });
        
        // Explosion sound
        this.sounds.set('explosion', {
            type: 'noise',
            duration: 0.8,
            volume: 0.8,
            filter: { type: 'bandpass', frequency: 200, Q: 10 }
        });
        
        // Power-up collection
        this.sounds.set('powerup_collect', {
            type: 'chime',
            frequency: 440,
            duration: 0.3,
            volume: 0.5
        });
        
        // Damage/hit sound
        this.sounds.set('hit', {
            type: 'noise',
            duration: 0.2,
            volume: 0.6,
            filter: { type: 'highpass', frequency: 1000 }
        });
        
        // Speed boost
        this.sounds.set('speed_boost', {
            type: 'sweep',
            startFreq: 200,
            endFreq: 800,
            duration: 0.4,
            volume: 0.5
        });
        
        // Shield activation
        this.sounds.set('shield_activate', {
            type: 'chord',
            frequencies: [261.63, 329.63, 392.00], // C major chord
            duration: 0.5,
            volume: 0.4
        });
    }
    
    play(soundName, options = {}) {
        if (!this.enabled || !this.audioContext) return;
        
        const soundDef = this.sounds.get(soundName);
        if (!soundDef) {
            console.warn(`Sound ${soundName} not found`);
            return;
        }
        
        try {
            this.resumeContext();
            
            switch (soundDef.type) {
                case 'oscillator':
                    this.playOscillatorSound(soundDef, options);
                    break;
                case 'noise':
                    this.playNoiseSound(soundDef, options);
                    break;
                case 'chime':
                    this.playChimeSound(soundDef, options);
                    break;
                case 'sweep':
                    this.playSweepSound(soundDef, options);
                    break;
                case 'chord':
                    this.playChordSound(soundDef, options);
                    break;
            }
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }
    
    playOscillatorSound(soundDef, options) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = options.waveType || 'sawtooth';
        oscillator.frequency.setValueAtTime(
            options.frequency || soundDef.frequency, 
            this.audioContext.currentTime
        );
        
        gainNode.gain.setValueAtTime(
            (options.volume || soundDef.volume) * this.sfxVolume, 
            this.audioContext.currentTime
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        
        if (!soundDef.loop) {
            const duration = options.duration || soundDef.duration || 1;
            gainNode.gain.exponentialRampToValueAtTime(
                0.01, 
                this.audioContext.currentTime + duration
            );
            oscillator.stop(this.audioContext.currentTime + duration);
        }
        
        return oscillator; // Return for stopping if needed
    }
    
    playNoiseSound(soundDef, options) {
        const bufferSize = this.audioContext.sampleRate * (soundDef.duration || 1);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        
        if (soundDef.filter) {
            filterNode.type = soundDef.filter.type;
            filterNode.frequency.setValueAtTime(soundDef.filter.frequency, this.audioContext.currentTime);
            if (soundDef.filter.Q) {
                filterNode.Q.setValueAtTime(soundDef.filter.Q, this.audioContext.currentTime);
            }
            source.connect(filterNode);
            filterNode.connect(gainNode);
        } else {
            source.connect(gainNode);
        }
        
        gainNode.gain.setValueAtTime(
            (options.volume || soundDef.volume) * this.sfxVolume, 
            this.audioContext.currentTime
        );
        gainNode.connect(this.masterGain);
        
        source.start();
    }
    
    playChimeSound(soundDef, options) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(soundDef.frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            (options.volume || soundDef.volume) * this.sfxVolume, 
            this.audioContext.currentTime + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, 
            this.audioContext.currentTime + soundDef.duration
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + soundDef.duration);
    }
    
    playSweepSound(soundDef, options) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(soundDef.startFreq, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(
            soundDef.endFreq, 
            this.audioContext.currentTime + soundDef.duration
        );
        
        gainNode.gain.setValueAtTime(
            (options.volume || soundDef.volume) * this.sfxVolume, 
            this.audioContext.currentTime
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, 
            this.audioContext.currentTime + soundDef.duration
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + soundDef.duration);
    }
    
    playChordSound(soundDef, options) {
        soundDef.frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playOscillatorSound({
                    frequency: freq,
                    duration: soundDef.duration,
                    volume: soundDef.volume / soundDef.frequencies.length
                }, { waveType: 'sine' });
            }, index * 50); // Slight delay for chord effect
        });
    }
    
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
        }
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }
    
    mute() {
        this.enabled = false;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        }
    }
    
    unmute() {
        this.enabled = true;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
        }
    }
}
