import QRCode from "qrcode";
import { tryCatch } from "./try-catch";

export const generateQR = async (value: string) => {
  const { data: dataUrl, error } = await tryCatch(
    QRCode.toDataURL(value),
    { action: 'generate-qrcode' }
  );

  if (error) throw new Error('Failed to generate QR Code');
  return dataUrl;
}

