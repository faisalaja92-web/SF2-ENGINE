/**
 * ID3v2 APIC Cover Art Extractor for MP3 files
 * Extracts embedded JPEG / PNG artwork from standard ID3 tags or magic byte signatures
 */
export async function extractMp3CoverArt(file: File): Promise<string | undefined> {
  try {
    const chunk = file.slice(0, 512 * 1024);
    const buffer = await chunk.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 1. Scan for ID3v2 'APIC' frame
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      for (let i = 10; i < bytes.length - 30; i++) {
        if (
          bytes[i] === 0x41 && // 'A'
          bytes[i + 1] === 0x50 && // 'P'
          bytes[i + 2] === 0x49 && // 'I'
          bytes[i + 3] === 0x43    // 'C'
        ) {
          const frameSize =
            (bytes[i + 4] << 24) |
            (bytes[i + 5] << 16) |
            (bytes[i + 6] << 8) |
            bytes[i + 7];

          let offset = i + 10; // skip header (4b) + flags (2b) + size (4b)
          offset++; // skip text encoding (1b)

          // Read MIME string
          let mime = '';
          while (offset < bytes.length && bytes[offset] !== 0) {
            mime += String.fromCharCode(bytes[offset]);
            offset++;
          }
          offset++; // skip null terminator
          offset++; // skip picture type (1b)

          // Skip description null-terminated
          while (offset < bytes.length && bytes[offset] !== 0) {
            offset++;
          }
          offset++;
          if (offset < bytes.length && bytes[offset] === 0) offset++;

          // Scan for image start magic: JPEG (0xFF 0xD8) or PNG (0x89 0x50 0x4E 0x47)
          while (offset < bytes.length - 4) {
            if (bytes[offset] === 0xff && bytes[offset + 1] === 0xd8) {
              const maxEnd = Math.min(bytes.length, i + 10 + frameSize);
              const imgData = bytes.slice(offset, maxEnd);
              const blob = new Blob([imgData], { type: mime || 'image/jpeg' });
              return URL.createObjectURL(blob);
            }
            if (
              bytes[offset] === 0x89 &&
              bytes[offset + 1] === 0x50 &&
              bytes[offset + 2] === 0x4e
            ) {
              const maxEnd = Math.min(bytes.length, i + 10 + frameSize);
              const imgData = bytes.slice(offset, maxEnd);
              const blob = new Blob([imgData], { type: mime || 'image/png' });
              return URL.createObjectURL(blob);
            }
            offset++;
          }
        }
      }
    }

    // 2. Direct magic byte signature scan (JPEG 0xFF, 0xD8, 0xFF)
    for (let i = 0; i < bytes.length - 200; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
        for (let j = i + 50; j < bytes.length - 2; j++) {
          if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
            const imgData = bytes.slice(i, j + 2);
            const blob = new Blob([imgData], { type: 'image/jpeg' });
            return URL.createObjectURL(blob);
          }
        }
        break;
      }
    }
  } catch {
    // Graceful fallback if file read or tag parsing fails
  }
  return undefined;
}
