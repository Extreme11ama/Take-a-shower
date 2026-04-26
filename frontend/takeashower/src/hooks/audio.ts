let timerAudioCtx: AudioContext | null = null

export function playDoneSound() {
  try {
    const ctx = new AudioContext()

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.frequency.value = 528
    gain1.gain.setValueAtTime(0.3, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 1)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.frequency.value = 660
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.3)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
    osc2.start(ctx.currentTime + 0.3)
    osc2.stop(ctx.currentTime + 1.2)
  } catch (e) {
    console.warn('Audio failed:', e)
  }
}

export function playTimerDoneSound() {
  try {

        // cancel any existing sound first
    if (timerAudioCtx) {
      timerAudioCtx.close()
      timerAudioCtx = null
    }

    const ctx = new AudioContext()
    timerAudioCtx = ctx
    const duration = 10 // seconds

    for (let i = 0; i < duration; i += 1.2) {
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.frequency.value = 528
      gain1.gain.setValueAtTime(0, ctx.currentTime + i)
      gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i + 0.1)
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i + 0.9)
      osc1.start(ctx.currentTime + i)
      osc1.stop(ctx.currentTime + i + 1)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.frequency.value = 660
      gain2.gain.setValueAtTime(0, ctx.currentTime + i + 0.15)
      gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i + 0.25)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i + 0.9)
      osc2.start(ctx.currentTime + i + 0.15)
      osc2.stop(ctx.currentTime + i + 1)
    }
  } catch (e) {
    console.warn('Audio failed:', e)
  }
}

export async function sendNotification(message: string) {
  try {
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    if (Notification.permission === 'granted') {
      new Notification('Rinse', {
        body: message,
        icon: '/favicon.svg',
      })
    }
  } catch (e) {
    console.warn('Notification failed:', e)
  }
}

export function stopTimerSound() {
  if (timerAudioCtx) {
    timerAudioCtx.close()
    timerAudioCtx = null
  }
}