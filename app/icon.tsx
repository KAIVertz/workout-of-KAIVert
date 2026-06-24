import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="#080808"/>
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="132" y2="0">
      <stop offset="0%" stop-color="#CC3A00"/>
      <stop offset="100%" stop-color="#FF9000"/>
    </linearGradient>
  </defs>
  <path d="M 60 139 A 56 56 0 1 1 132 139"
    fill="none" stroke="url(#g)" stroke-width="20" stroke-linecap="round"/>
  <circle cx="96" cy="40" r="11" fill="#F7BC18"/>
</svg>`;

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/svg+xml,${encodeURIComponent(svg)}`} width={192} height={192} alt="" />
    </div>,
    { ...size }
  );
}
