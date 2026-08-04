import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6e1423",
          border: "8px solid #caa14e",
          fontFamily: "Georgia, serif",
          fontSize: 104,
          color: "#f4e3b2",
        }}
      >
        V
      </div>
    ),
    size,
  );
}
