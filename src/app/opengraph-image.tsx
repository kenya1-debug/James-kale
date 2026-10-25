import { ImageResponse } from "next/og";

export const alt = "James Kale & Co. Advocates, Kabarnet, Baringo County";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#0e241c", color: "#f7f3ea" }}>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 8, color: "#b8924a", textTransform: "uppercase" }}>{"Advocates · Kabarnet"}</div>
        <div style={{ display: "flex", fontSize: 92, marginTop: 28, fontWeight: 700 }}>{"James Kale & Co."}</div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 28, color: "#d6d1c4" }}>{"Clear counsel. Careful representation."}</div>
        <div style={{ display: "flex", width: 140, height: 4, marginTop: 48, background: "#b8924a" }} />
      </div>
    ),
    size,
  );
}
