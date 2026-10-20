import { NextResponse } from "next/server";
import { verifyAdminSession } from "~/lib/auth-server";

export async function POST(req: Request) {
  try {
    const auth = await verifyAdminSession(req);
    if (!auth.authorized) {
      return NextResponse.json({ isAdmin: false, role: "cliente" });
    }
    return NextResponse.json({ isAdmin: true, role: auth.role ?? "admin" });
  } catch (err) {
    console.error("Error in /api/admin/whoami:", err);
    return NextResponse.json({ isAdmin: false });
  }
}

export async function GET(req: Request) {
  return POST(req);
}

