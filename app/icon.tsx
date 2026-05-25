import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "#08080d",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20%",
      }}
    >
      <span style={{ color: "#0041C2", fontSize: 110, fontWeight: 900, fontFamily: "system-ui" }}>
        K
      </span>
    </div>,
    { ...size }
  );
}
