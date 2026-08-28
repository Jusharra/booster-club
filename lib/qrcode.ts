import QRCode from 'qrcode';

// Software-generated QR (v1). Encodes the athlete's public profile URL.
// The same URL can back a physical NFC card in v2 without any data model
// change -- see qr_codes.target_url.
export async function generateQrPngBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { type: 'png', width: 640, margin: 2 });
}

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 320, margin: 2 });
}
