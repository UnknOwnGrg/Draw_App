import express  from "express";
import jwt from 'jsonwebtoken';
import { middleware } from "./middleware/middleware.js";
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateUserSchema, SigninSchema, CreateRoomSchema} from "@repo/common/types";
import { prisma } from "@repo/db/prisma";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/signup", async (req, res) => {

  const data = CreateUserSchema.safeParse(req.body);
  if(!data.success) {
    return res.json({
      message: "Incorrect Inputs"
    })
  }

  try{
     const user = await prisma.user.create({
      data: {
        email: data.data.email,
        //Todo: Hash the pw
        password: data.data.password,
        name: data.data.name
      }
    });

    return res.status(201).send({
      userId: user.id
    });
  } catch(e) {
    console.log(e);
  }

});

app.post("/signin", async (req,res) => {

  const data = SigninSchema.safeParse(req.body);
  if(!data.success) {
    return res.json({
      message: "Incorrect Inputs"
    })
  }

  //Todo: Compare the hashed password here
  const user = await prisma.user.findFirst({
    where: { 
      email: data.data.email,
      password: data.data.password
    }
  })

  if(!user) {
    res.status(403).json({
      message: "Not authorize"
    })
  }

  const token = jwt.sign({userId:user?.id}, 
    JWT_SECRET); 

  return res.json(token);
});

app.post('/room', middleware, async (req, res) => {
  const data = CreateRoomSchema.safeParse(req.body);
  if(!data.success) {
    return res.json({
      message: "Incorrect Inputs"
    })
  }

  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }
  const adminId = userId.toString();

  try {
    const room = await prisma.room.create({
      data: {
        slug: data.data.name,
        adminId: adminId
      }
    })

    res.json({
      roomId: room.id
    })
  }catch(err){
    res.status(411).json({
      messasge: "Room already exsts with this name"
    });
  }

})

//to get the chats
app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  const messages = await prisma.chat.findMany({
    where:{
      roomId: roomId
    }, 
    orderBy: {
      id: "desc"
    },
    take: 50
  });

  res.json({
    messages
  })
});

app.listen(3001,()=> {
  console.log('Server is connected in the port 3001');
});