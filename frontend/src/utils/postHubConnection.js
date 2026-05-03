import * as signalR from "@microsoft/signalr";

let connection = null;
let isConnecting = false;
let handlersBound = false;

function bindRealtimeHandlers(conn) {
  if (handlersBound) return;
  handlersBound = true;
  conn.on("PostCreated", (payload) => {
    window.dispatchEvent(new CustomEvent("signalr:post-created", { detail: payload }));
  });
}

export const startConnection = async () => {
  if (isConnecting || (connection && connection.state === signalR.HubConnectionState.Connected)) {
    console.log('PostHub: Already connected or connecting, skipping');
    return connection;
  }

  isConnecting = true;

  try {
    console.log('[PostHub] 🔗 Starting connection...');
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn('[PostHub] ⚠️ No token found, cannot connect');
      isConnecting = false;
      return null;
    }

    connection = new signalR.HubConnectionBuilder()
      .withUrl("/postHub", {
        accessTokenFactory: () => token,
        withCredentials: true
      })
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    bindRealtimeHandlers(connection);

    console.log('[PostHub] 📡 Calling connection.start()...');
    await connection.start();
    console.log('[PostHub] ✅ Connected successfully!');

    console.log('[PostHub] 👥 Joining feed group...');
    await connection.invoke("JoinFeed");
    console.log('[PostHub] ✅ Joined feed group');

    isConnecting = false;
    return connection;
  } catch (err) {
    console.error('[PostHub] ❌ Connection error:', err);
    isConnecting = false;
    connection = null;
    handlersBound = false;
    return null;
  }
};

export function resetPostHubConnection() {
  if (connection) {
    connection.stop().catch(() => {});
  }
  connection = null;
  handlersBound = false;
}

export const getConnection = () => {
  console.log('[PostHub] 🔍 getConnection() called, state:', connection?.state);
  return connection;
};
