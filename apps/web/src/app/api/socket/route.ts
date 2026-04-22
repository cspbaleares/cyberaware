import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "./types";

export const config = {
  api: {
    bodyParser: false,
  },
};

let io: SocketIOServer | null = null;

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!io) {
    console.log("Initializing Socket.io server...");
    
    const httpServer: NetServer = (res.socket as any).server;
    io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Unirse a sala de tenant
      socket.on("join-tenant", (tenantId: string) => {
        socket.join(`tenant:${tenantId}`);
        console.log(`Socket ${socket.id} joined tenant ${tenantId}`);
      });

      // Unirse a sala de usuario
      socket.on("join-user", (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined user ${userId}`);
      });

      // Notificación de nuevo evento de seguridad
      socket.on("security-event", (data) => {
        socket.to(`tenant:${data.tenantId}`).emit("security-alert", data);
      });

      // Desconexión
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  res.end();
}

// Helper para emitir eventos desde otros lugares
export function emitToTenant(tenantId: string, event: string, data: any) {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function broadcast(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}
