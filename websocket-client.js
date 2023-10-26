const io = require("socket.io-client");

// Connect to the WebSocket server
const socket = io("http://localhost:3000:your-ws-port");

// Listen for the "voltageData" event
socket.on("voltageData", (data) => {
  console.log("Received voltage data:", data);
});
