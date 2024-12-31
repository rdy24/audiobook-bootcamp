// Helper function to convert AudioBuffer to WAV format
export function audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
    if (!buffer.numberOfChannels) {
        throw new Error('Invalid audio buffer: no channels found');
    }
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    const offset = 44;
    let index = 0;

    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = buffer.getChannelData(channel)[i];
            if (!sample) continue;
            const clampedSample = Math.max(-1, Math.min(1, sample));
            const int16 = clampedSample < 0 
                ? clampedSample * 0x8000 
                : clampedSample * 0x7FFF;
            view.setInt16(offset + index * 2, int16, true);
            index++;
        }
    }

    return Promise.resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}