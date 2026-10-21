import { NextRequest } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data") ?? "";
  const format = searchParams.get("format") ?? "png";
  const size = Math.min(Math.max(Number(searchParams.get("size")) || 320, 64), 2000);

  if (!data) {
    return new Response("Missing data parameter", { status: 400 });
  }

  if (format === "svg") {
    const svg = await QRCode.toString(data, {
      type: "svg",
      margin: 1,
      width: size,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    });
    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  }

  const buffer = await QRCode.toBuffer(data, {
    margin: 1,
    width: size,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=3600",
    },
  });
}
