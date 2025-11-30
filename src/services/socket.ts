import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnecting = false;

  lastPhase6Question: string | null = null;


  // ⚙️ Exemple: VITE_API_URL=http://localhost:3001/api  -> http://localhost:3001
  private SOCKET_URL =
    (import.meta.env.VITE_API_URL?.replace("/api", "")) || "http://localhost:3001";

  private DEBUG = true;
  private debug(...args: any[]) {
    if (this.DEBUG) console.log("[Socket]", ...args);
  }

  connect(): Socket {
    if (this.socket?.connected || this.isConnecting) {
      this.debug("Already connected/connecting");
      return this.socket!;
    }

    this.isConnecting = true;
    this.debug("Connecting to", this.SOCKET_URL);

    this.socket = io(this.SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      withCredentials: true,
    }) as Socket;

    this.socket.on("connect", () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.debug("✅ Connected:", this.socket?.id);
    });

    // 🔄 Mise à jour instantanée des échanges
this.socket.on("exchanges:updated", (data) => {
  this.debug("🟢 exchanges:updated received:", data);
  window.dispatchEvent(new CustomEvent("exchangesUpdated", { detail: data }));
});

this.socket.on("phase6:newQuestion", (payload) => {
  this.lastPhase6Question = payload?.question?.text || null;
  this.debug("🔥 Phase6 question updated:", this.lastPhase6Question);
});



    this.socket.on("disconnect", (reason) => {
      this.debug("⚠️ Disconnected:", reason);
      this.isConnecting = false;
      if (reason === "io server disconnect") {
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    });

    this.socket.on("connect_error", (error) => {
      this.debug("❌ Connection error:", error.message || error);
      this.isConnecting = false;
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.debug("Max reconnection attempts reached");
        this.socket?.disconnect();
      }
    });

    return this.socket;
  }

  // 🔕 En dev avec React.StrictMode, on évite les déconnexions inutiles
  disconnect() {
    if (import.meta.env.DEV) {
      this.debug("Skip disconnect in DEV (React.StrictMode double-mount)");
      return;
    }
    this.debug("🔌 Disconnecting socket");
    this.socket?.disconnect();
    this.socket = null;
    this.isConnecting = false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  emit(event: string, data?: any, callback?: (response: any) => void) {
    if (!this.socket?.connected) {
      this.debug("Not connected, reconnect then emit:", event);
      this.connect();
      return;
    }
    this.debug("📤 Emit:", event, data);
    this.socket.emit(event, data, callback);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.debug("📥 Listen:", event);
    this.socket?.on(event, (data: any) => {
      this.debug("🟢 Received:", event, data);
      callback(data);
    });
  }

  off(event: string, callback?: (data: any) => void) {
    if (!this.socket) return;
    this.debug("🚫 Off:", event);
    this.socket.off(event, callback);
  }
}

export const socketService = new SocketService();
export default socketService;
