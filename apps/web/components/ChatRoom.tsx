import axios from "axios"
import { BACKEND_URL } from "../app/config"

async function getChats(roomId: string){
  const response = axios.get(`${BACKEND_URL}/chats/${roomId}`)
  return (await response).data.messages;
}


export async function ChatRoom({id}: {
  id: string
}){
  const messages = await getChats(id);
};