import { Server } from "./server";

const server = new Server();
server.listen(port => {
  console.log(`Server is listening on port http://localhost:${port}`);
});

export const io = server.getIO();
export const getRooms = server.getRooms;
export const getEmptyRooms = server.getEmptyRooms;
export const createRoom = server.createRoom;