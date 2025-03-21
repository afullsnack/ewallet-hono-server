import QRCode from "qrcode";
import { tryCatch } from "./try-catch";
import {
  base,
  baseSepolia,
  mainnet,
  sepolia,
  polygon,
  polygonAmoy,
  arbitrum,
  arbitrumSepolia,
  bsc,
  bscTestnet
} from "viem/chains"

export const generateQR = async (value: string) => {
  const { data: dataUrl, error } = await tryCatch(
    QRCode.toDataURL(value),
    { action: 'generate-qrcode' }
  );

  if (error) throw new Error('Failed to generate QR Code');
  return dataUrl;
}

export const defaultChainIds = [
  base.id,
  baseSepolia.id,
  mainnet.id,
  sepolia.id,
  polygon.id,
  polygonAmoy.id,
  arbitrum.id,
  arbitrumSepolia.id,
  bsc.id,
  bscTestnet.id
]
