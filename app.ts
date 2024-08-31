import express from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { WebsocketUtils } from './src/utils/WebsocketUtils';
import { WebsocketMessage } from './src/interfaces/WebsocketMessage';

// read .env
const dotenv = require('dotenv');
dotenv.config();

// create an instance of express
const app = express();

// create an HTTP server using the express app
const server = createServer(app);

// initialize websocket server instance and utils handler
export const wss = new WebSocketServer({ server });
export const wsUtils = new WebsocketUtils();

// handle incoming new websocket connection
wss.on('connection', (ws) => {
  console.log('New client connected');
  const newClientUUID = wsUtils.addNewConnection(ws);

  // messages received from the client handling
  ws.on('message', (message) => {
    console.log(`Server received message: ${message}`);
    const msg = (message.toString()) as WebsocketMessage;    
    wsUtils.handleMessage(newClientUUID, msg);
    ws.send(msg === 'PING' ? 'PONG' : 'ACK');
  });

  // heartbeat mechanism - does not work automatically for now with Angular, maybe can be investigated more
  // ws.on('pong', () => {
  //   if(wsUtils.updateHeartbeat(newClientUUID)) {
  //     ws.ping();
  //   } else {
  //     console.error(`Could not update heartbeat for ${newClientUUID}! Terminating connection!`);
  //     wsUtils.removeClient(newClientUUID);
  //     ws.terminate();
  //   }
  // })

  // disconnection
  ws.on('close', () => {
    console.log(`Client ${newClientUUID} disconnected.`);
    wsUtils.removeClient(newClientUUID);
    ws.terminate();
  });

  // error handler
  ws.on('error', (err) => {
    console.error(`Error has occured during connection. ${err.name}: ${err.message}.`);
    wsUtils.removeClient(newClientUUID);
    ws.terminate();
  });

});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
  autoClientCheck();
});

function autoClientCheck() {
  setTimeout(() => {
    const map = wsUtils.getWholeClientMap();

    if(map.size > 0) {
      console.log(`SERVER has connected ${map.size} clients:`);
      
      for (const [key, val] of map) {
        console.log(key, val.heartbeat);
      }
    }

    autoClientCheck();
  }, 1000);
}