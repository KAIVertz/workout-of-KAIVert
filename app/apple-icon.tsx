import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="38" fill="#080808"/>
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="56" y1="0" x2="124" y2="0">
      <stop offset="0%" stop-color="#CC3A00"/>
      <stop offset="100%" stop-color="#FF9000"/>
    </linearGradient>
  </defs>
  <path d="M 56 131 A 53 53 0 1 1 124 131"
    fill="none" stroke="url(#g)" stroke-width="19" stroke-linecap="round"/>
  <circle cx="90" cy="37" r="10" fill="#F7BC18"/>
</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/svg+xml,${encodeURIComponent(svg)}`} width={180} height={180} alt="" />
    </div>,
    { ...size }
  );
}
