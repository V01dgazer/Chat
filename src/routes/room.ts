import { Router, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { clearTimeout } from "timers";
import { createRoom, getRooms, getEmptyRooms } from "../index";
const router = Router();

router.post("/create", (req: Request, res: Response) => {
  let { userName } = req.body;

  if (userName) {
    const roomId = uuid();
    createRoom(roomId);
    res.json({ roomId });
  } else {
    res.json({ error: "You have to specify username" });
  }
});

router.post("/join", (req: Request, res: Response) => {
  const { room } = req.body;
  let { userName } = req.body;

  const rooms = getRooms();
  const emptyRooms = getEmptyRooms();

  if (rooms[room]) {
    if (!userName) userName = "Guest";

    if (emptyRooms && emptyRooms[room]) {
      clearTimeout(emptyRooms[room]);
      delete emptyRooms[room];
    }

    res.json({
      roomId: room,
      users: [...Object.values(rooms[room].getUsers()), userName],
      messages: rooms[room].getMessages()
    });
  } else {
    res.json({ error: "The room doesn't exist" });
  }
});

export default router;
