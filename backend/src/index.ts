import { WebSocket, WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  roomId: string;
}

interface MessagePayload {
  type: 'join' | 'chat';
  payload: {
    roomId?: string;
    message?: string;
  };
}

let userCount = 0;
let allSockets: User[] = [];

wss.on('connection', (socket) => {
  console.log('New client connected');
  userCount++;

  socket.on('message', (msg: Buffer) => {
    try {
      console.log('Raw message received:', msg.toString());
      const parsedMsg: MessagePayload = JSON.parse(msg.toString());
      console.log('Parsed message:', parsedMsg);

      if (parsedMsg.type === 'join') {
        if (parsedMsg.payload.roomId) {
          allSockets.push({
            socket,
            roomId: parsedMsg.payload.roomId,
          });
          console.log(`User joined room: ${parsedMsg.payload.roomId}`);
          console.log(`Total users: ${allSockets.length}`);
        }
      }

      if (parsedMsg.type === 'chat') {
        let currentUserRoom: string | null = null;

        // Find current user's room
        for (let i = 0; i < allSockets.length; i++) {
          const user = allSockets[i];
          if (user && user.socket === socket) {
            currentUserRoom = user.roomId;
            break;
          }
        }

        console.log(`Current user room: ${currentUserRoom}`);

        // Send message to all OTHER users in the same room (exclude sender)
        if (currentUserRoom && parsedMsg.payload.message) {
          for (let i = 0; i < allSockets.length; i++) {
            const user = allSockets[i];
            if (
              user &&
              user.roomId === currentUserRoom &&
              user.socket !== socket
            ) {
              user.socket.send(
                JSON.stringify({
                  type: 'chat',
                  message: parsedMsg.payload.message,
                  timestamp: new Date().toISOString(),
                  roomId: currentUserRoom,
                })
              );
            }
          }
          console.log(
            `Message sent to room ${currentUserRoom} (excluding sender)`
          );
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');
    userCount--;
    // Remove user from allSockets array
    allSockets = allSockets.filter((user) => user.socket !== socket);
    console.log(`Remaining users: ${allSockets.length}`);
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`🚀 WebSocket server running on port 8080`);
console.log(`📡 Waiting for connections...`);
