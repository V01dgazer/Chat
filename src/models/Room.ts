interface Message {
  user: string;
  date: string;
  message: string;
}

interface UserData {
  name: string;
  socketId: string;
}

interface Users {
  [key: string]: string;
}

export class Room {
  private id: string;
  private users: Users;
  private messages: Message[];

  constructor(id: string) {
    this.id = id;
    this.users = {};
    this.messages = [];
  }

  public addUser = (user: UserData) => {
    this.users[user.socketId] = user.name;
  };

  public deleteUser = (socketId: string) => {
    delete this.users[socketId];
  };

  public addMessage = (message: Message) => {
    this.messages.push(message);
  };

  public getUsers = (socketId?: string) =>
    socketId ? this.users[socketId] : this.users;

  public getMessages = () => this.messages;

  public isEmpty = () => !Object.keys(this.users).length;
}
