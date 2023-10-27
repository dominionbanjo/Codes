// const express = require("express");
// const net = require("net");
// const http = require("http");
// const WebSocket = require("ws");
// const cors = require("cors");
// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// app.use(cors());
// // Initialize an array to store the data
// const voltageData = [];
// let idCounter = 0; // Initialize the ID counter

// // Create a TCP server using the 'net' module
// const tcpServer = net.createServer((socket) => {
//   console.log("A client has connected.");

//   // Buffer to accumulate incoming data
//   let buffer = Buffer.from([]);
//   let lastProcessedTime = 0; // Initialize the last processed time

//   socket.on("data", (data) => {
//     // Append incoming data to the buffer
//     buffer = Buffer.concat([buffer, data]);

//     // Check if the buffer contains at least 3 values
//     while (buffer.length >= 3 * 8) {
//       const currentTime = new Date().getTime();

//       // Process data only once per second
//       if (currentTime - lastProcessedTime >= 1000) {
//         // Extract 8 bytes (64 bits) for each of the three values
//         const value1 = buffer.readDoubleLE(0);
//         const value2 = buffer.readDoubleLE(8);
//         const value3 = buffer.readDoubleLE(16);

//         // Log the received data immediately
//         console.log("Received data:", { value1, value2, value3 });

//         // Check if all three values are non-zero; if not, skip storing the data
//         if (value1 !== 0 || value2 !== 0 || value3 !== 0) {
//           idCounter++; // Increment the ID counter
//           const currentTime = new Date();
//           const formattedTime = currentTime.toLocaleTimeString("en-US", {
//             hour12: false,
//           });
//           voltageData.push({
//             id: idCounter,
//             time: formattedTime,
//             value1,
//             value2,
//             value3,
//           });

//           // Send the new data to connected WebSocket clients
//           const newData = voltageData[voltageData.length - 1];
//           wss.clients.forEach((client) => {
//             if (client.readyState === WebSocket.OPEN) {
//               client.send(JSON.stringify(newData));
//             }
//           });
//         }

//         lastProcessedTime = currentTime; // Update the last processed time
//       }

//       // Remove the processed data from the buffer
//       buffer = buffer.slice(24); // 3 values * 8 bytes each
//     }
//   });

//   socket.on("end", () => {
//     console.log("Client disconnected.");
//   });

//   socket.on("error", (err) => {
//     console.error("Error:", err);
//   });
// });

// // Start the TCP server on a specific port
// const tcpPort = 443;
// tcpServer.listen(tcpPort, "0.0.0.0", () => {
//   console.log(`TCP server is listening on port ${tcpPort}`);
// });

// // Start the Express.js server on a different port
// const httpPort = 3000;
// server.listen(httpPort, () => {
//   console.log(`Express.js server is running on port ${httpPort}`);
// });

const express = require("express");
const net = require("net");
const http = require("http");
const WebSocket = require("ws");
// const cors = require("cors");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// app.use(cors());

// Initialize an array to store the data
const voltageData = [];
let idCounter = 0; // Initialize the ID counter

// Create a TCP server using the 'net' module
const tcpServer = net.createServer((socket) => {
  console.log("A client has connected.");

  // Buffer to accumulate incoming data
  let buffer = Buffer.from([]);
  let lastProcessedTime = 0; // Initialize the last processed time

  socket.on("data", (data) => {
    // Append incoming data to the buffer
    buffer = Buffer.concat([buffer, data]);

    // Check if the buffer contains at least 3 values
    while (buffer.length >= 3 * 8) {
      const currentTime = new Date().getTime();

      // Process data only once per second
      if (currentTime - lastProcessedTime >= 1000) {
        // Extract 8 bytes (64 bits) for each of the three values
        const value1 = buffer.readDoubleLE(0);
        const value2 = buffer.readDoubleLE(8);
        const value3 = buffer.readDoubleLE(16);

        // Log the received data immediately
        console.log("Received data:", { value1, value2, value3 });

        // Check if all three values are non-zero; if not, skip storing the data
        if (value1 !== 0 || value2 !== 0 || value3 !== 0) {
          idCounter++; // Increment the ID counter
          const currentTime = new Date();
          const formattedTime = currentTime.toLocaleTimeString("en-US", {
            hour12: false,
          });
          voltageData.push({
            id: idCounter,
            time: formattedTime,
            value1,
            value2,
            value3,
          });

          // Send the new data to connected WebSocket clients
          const newData = voltageData[voltageData.length - 1];
          sendToWebSocketClients(newData);

          lastProcessedTime = currentTime; // Update the last processed time
        }

        // Remove the processed data from the buffer
        buffer = buffer.slice(24); // 3 values * 8 bytes each
      }
    }
  });

  socket.on("end", () => {
    console.log("Client disconnected.");
  });

  socket.on("error", (err) => {
    console.error("Error:", err);
  });
});

// Function to send data to connected WebSocket clients
async function sendToWebSocketClients(data) {
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      await new Promise((resolve, reject) => {
        client.send(JSON.stringify(data), (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }
}

// Start the TCP server on a specific port
const tcpPort = 12345;
tcpServer.listen(tcpPort, "0.0.0.0", () => {
  console.log(`TCP server is listening on port ${tcpPort}`);
});

// Start the Express.js server on a different port
const httpPort = 3000;
server.listen(httpPort, () => {
  console.log(`Express.js server is running on port ${httpPort}`);
});

// Create an Express.js route to view the stored data
app.get("/viewVoltageData", (req, res) => {
  res.json(voltageData);
});

app.get("/", (req, res) => {
  res.status(200).send({ message: "good" });
});
// WebSocket server to handle real-time updates
wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  // Send the initial data when a client connects
  ws.send(JSON.stringify(voltageData));
});

// Serve WebSocket client HTML page
// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/websocket_client.html");
// });
