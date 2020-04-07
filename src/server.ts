import * as express from "express";
import * as socketIO from "socket.io";
import * as path from 'path'
import { createServer, Server as HTTPServer } from "http";
import * as cors from "cors";
import * as dotenv from "dotenv";
import routers from "./routes";
import { Room } from "./models/Room";
import { setTimeout } from "timers";
dotenv.config();

interface Rooms {
  [key: string]: Room;
}

interface EmptyRooms {
  [key: string]: ReturnType<typeof setTimeout>;
}

export class Server {
  private httpServer: HTTPServer;
  private app: express.Application;
  private io: socketIO.Server;
  private rooms: Rooms;
  private emptyRooms: EmptyRooms;

  private readonly DEFAULT_PORT = +process.env.PORT || 5000;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "dist")));

    this.app.get("/*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });

    this.enableCORS();
    this.configureRoutes();

    this.httpServer = createServer(this.app);
    this.io = socketIO(this.httpServer);
    this.handleSocketConnection();

    this.rooms = {};
    this.emptyRooms = {};
  }

  private enableCORS() {
    this.app.use(cors());
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", process.env.CLIENT);
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Content-Length,Authorization,Accept,X-Requested-With,Origin"
      );
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "1728000");

      next();
    });
  }

  private handleSocketConnection() {
    this.io.on("connection", socket => {
      socket.on("join-room", data => {
        const { roomId, userName } = data;
        socket.join(roomId);

        this.rooms[roomId].addUser({
          socketId: socket.id,
          name: userName || "Guest"
        });
        socket.to(roomId).broadcast.emit("user-connected", userName || "Guest");
      });

      socket.on("send-message", message => {
        if (this.rooms[message.roomId]) {
          this.rooms[message.roomId].addMessage(message);
          socket.to(message.roomId).broadcast.emit("new-message", message);
        }
      });

      socket.on("disconnect", () => {
        for (let room in this.rooms) {
          const userName = this.rooms[room].getUsers(socket.id);
          if (userName) {
            socket.to(room).broadcast.emit("user-disconnected", userName);
            this.rooms[room].deleteUser(socket.id);
            if (this.rooms[room].isEmpty() && !this.emptyRooms[room]) {
              this.emptyRooms[room] = setTimeout(() => {
                this.destroyRoom(room);
              }, 600000);
            }
          }
        }
      });
    });
  }

  private configureRoutes() {
    this.app.use("/api/room", routers.room);
  }

  public getIO() {
    return this.io;
  }

  public getRooms = () => {
    return this.rooms;
  };

  public getEmptyRooms = () => {
    return this.emptyRooms;
  };

  public createRoom = (id: string) => {
    this.rooms[id] = new Room(id);
  };

  public destroyRoom = (id: string) => {
    delete this.rooms[id];
  };

  public listen(callback: (port: number) => void) {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}
