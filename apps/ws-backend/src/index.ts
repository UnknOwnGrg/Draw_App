import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from "@repo/backend-common/config";
import { prisma } from "@repo/db/prisma";

const wss = new WebSocketServer({ port : 8080 });

interface User {
  ws: WebSocket,
  rooms:string[],
  userId: string
}

const users: User[] = [];


function checkUser ( token: string ) : string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
  
    if(typeof decoded === "string") {
      return null;
    }
  
    if(!decoded || !decoded.userId){
      return null; 
    }
  
    return decoded.userId;
  } catch (err) {
    throw new Error("Jwt token must be provided: ");
  }
};

wss.on('connection', function connection(ws, request) {

  const url = request.url;
  if(!url) {
    return;
  } 
 
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const userId = checkUser(token);

  if(userId == null) {
    ws.close();
    return;
  } 

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on('message', async function message(data) {
    const parsedData = JSON.parse(data as unknown as string);
   
    if(parsedData.type === "join_room"){
      const user = users.find(x => x.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    if(parsedData.type === "leave_room"){
      const user = users.find(x => x === parsedData.room);
      if(!user) {
        return;
      };

      user.rooms = user?.rooms.filter(x => x === parsedData.room);
    }

    if(parsedData.type === "chat"){
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      //This is the dumb approach
      //And it can be slow tooo
      
      await prisma.chat.create({
        data:{
          roomId,
          message,
          userId
        }
      });

      users.forEach(user => {
        if(user.rooms.includes(roomId)){
          user.ws.send(JSON.stringify({
            type: "chat",
            message: message,
            roomId
          }))
        }
      });

    }
  });

});