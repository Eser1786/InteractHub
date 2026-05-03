import * as signalR from "@microsoft/signalr";

let connection = null;
let isConnecting = false;

export const startConnection = async () => {
  // Avoid multiple connection attempts
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

    console.log('[PostHub] 📡 Calling connection.start()...');
    await connection.start();
    console.log('[PostHub] ✅ Connected successfully!');

    // JOIN GROUP
    console.log('[PostHub] 👥 Joining feed group...');
    await connection.invoke("JoinFeed");
    console.log('[PostHub] ✅ Joined feed group');

    isConnecting = false;
    return connection;
  } catch (err) {
    console.error('[PostHub] ❌ Connection error:', err);
    isConnecting = false;
    connection = null;
    return null;
  }
};

export const getConnection = () => {
  console.log('[PostHub] 🔍 getConnection() called, state:', connection?.state);
  return connection;
};