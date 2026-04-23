import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/metrics - Obtener métricas del dashboard
export async function GET() {
  try {
    // Llamar a la API interna para obtener métricas
    const apiRes = await fetch(`${process.env.API_URL || "http://localhost:3001"}/admin/metrics`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!apiRes.ok) {
      // Si la API no tiene el endpoint, devolvemos datos de ejemplo/mock
      return NextResponse.json({
        metrics: {
          totalUsers: 0,
          activeUsers: 0,
          totalTenants: 0,
          activeTenants: 0,
          totalSimulations: 0,
          totalTrainingEnrollments: 0,
          recentActivity: [],
        },
        error: "API metrics endpoint not available",
      });
    }

    const metrics = await apiRes.json();
    return NextResponse.json({ metrics });

  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json({ 
      metrics: {
        totalUsers: 0,
        activeUsers: 0,
        totalTenants: 0,
        activeTenants: 0,
        totalSimulations: 0,
        totalTrainingEnrollments: 0,
        recentActivity: [],
      },
      error: "Error al obtener métricas" 
    }, { status: 500 });
  }
}
