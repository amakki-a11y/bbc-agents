// Turns the mixed meeting audio into 100 ms chunks of 16-bit PCM.
// The AudioContext runs at 16 kHz, so no resampling is needed here.
class PcmWorklet extends AudioWorkletProcessor {
    constructor() {
        super();
        this.chunk = new Int16Array(1600); // 100 ms at 16 kHz
        this.pos = 0;
    }

    process(inputs) {
        const channel = inputs[0] && inputs[0][0];
        if (!channel) return true;
        for (let i = 0; i < channel.length; i++) {
            const s = Math.max(-1, Math.min(1, channel[i]));
            this.chunk[this.pos++] = s < 0 ? s * 0x8000 : s * 0x7fff;
            if (this.pos === this.chunk.length) {
                this.port.postMessage(this.chunk.buffer, [this.chunk.buffer]);
                this.chunk = new Int16Array(1600);
                this.pos = 0;
            }
        }
        return true;
    }
}

registerProcessor('pcm-worklet', PcmWorklet);
