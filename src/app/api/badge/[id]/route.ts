import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string,
  );
}

function renderBadgeSvg(name: string, category: string): string {
  const safeName = escapeXml(name.length > 22 ? `${name.slice(0, 21)}…` : name);
  const safeCategory = escapeXml(category);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="Arena Champion badge">
  <rect width="220" height="64" fill="#0d0d0d" stroke="#00b4d8" stroke-width="1.5"/>
  <path d="M12 20l4 3 5-6 5 6 4-3-2 10H14L12 20z" fill="none" stroke="#00b4d8" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="40" y="26" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="12" font-weight="700" letter-spacing="0.5" fill="#ffffff">ARENA CHAMPION</text>
  <text x="16" y="46" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="11" fill="#90e0ef">${safeName} · ${safeCategory}</text>
  <text x="16" y="58" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="9" fill="#6b7280">the-arena.app</text>
</svg>`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminSupabaseClient();
  const { data: product } = await admin.from("products").select("name, category, status").eq("id", id).maybeSingle();

  if (!product || product.status !== "champion") {
    return new NextResponse("Not a champion", { status: 404 });
  }

  const svg = renderBadgeSvg(product.name, product.category);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
