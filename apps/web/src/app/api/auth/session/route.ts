import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("platform_access_token")?.value;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        email: payload.email,
        isSuperAdmin: payload.isSuperAdmin,
        roles: payload.roles || [],
        tenantId: payload.tenantId,
      }
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
