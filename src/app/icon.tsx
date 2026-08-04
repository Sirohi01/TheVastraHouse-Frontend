import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          border: "3px solid #caa14e",
          borderRadius: "6px",
          fontFamily: "Georgia, serif",
          fontSize: 38,
          color: "#f4e3b2",
        }}
      >
        V
      </div>
    ),
    size,
  );
}
