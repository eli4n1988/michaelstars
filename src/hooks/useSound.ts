import { useCallback } from 'react';

export function useSound() {
  const playSound = useCallback((type: 'earn' | 'claim') => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.15;

      if (type === 'earn') {
        osc.frequency.value = 600;
        osc.type = 'sine';
        osc.start();
        osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.15);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.value = 523;
        osc.type = 'sine';
        osc.start();
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24);
        osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.36);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // ignore
    }
  }, []);

  return playSound;
}
