import axios from 'axios';
import { BotEvent, BotMessageEvent, messageevent, metaevent, requestevent, noticeevent, GroupMessageEvent } from "./events.js";
import { Message } from "./messages.js";
import  config  from "./config.js";
import logger from './log.js';
async function send_request(path: string, body: object) {
    const res = await axios.post(`${config.get('onebot.url')}${path}`, body);
    return res.data;
}

const BOTS: { [key: number]: Bot } = {};

export function get_bot(id: number): Bot {
    if (!(id in BOTS)) {
        BOTS[id] = new Bot(id);
    }
    return BOTS[id];
}
export class SendMessage {
    static async send_group_msg(group_id: number, message: any) {
        await send_request(`/send_group_msg`,{
            'group_id': group_id,
            'message': message.json()
        })
    }
    static async send_private_msg(user_id: number, message: any) {
        await send_request(`/send_private_msg`,{
            'user_id': user_id,
           'message': message.json()
        })
    }
    static async approve_group(flag: any, sub_type: any) {
    }

    static async reject_group(flag: any, sub_type: any, reason: any = "") {
    }

    static async approve_friend(flag: any, remark: any = "") {
    }

    static async reject_friend(flag: any) {
    }
}
export class Bot {
    public self_id: number;
    private messageevent: any;
    private noticeevent: any;
    private requestevent: any;
    private metaevent: any;
    private eventHandlers: { [eventName: string]: Function[] } = {};
    private eventQueue = [];
    public commands: Array<any>;
    constructor(self_id: number) {
        this.messageevent = "";
        this.noticeevent = "";
        this.requestevent = "";
        this.metaevent = "";
        this.self_id = self_id;
        this.startEventLoop();
        this.commands = [];
        BOTS[self_id] = this;
    }

    resiger_command(command: string, description: string) {
        const data = {
            command: command,
            description: description,
        };
        if (this.commands.some(cmd => cmd.command === command)) {
            throw new Error("Command already registered");
        }
        this.commands.push(data);
    }

    on(event: string, callback: (event: BotEvent,handler:Handler,reply_msg:Message) => void) {
        const eventName = event.toLowerCase();
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(callback);
        this.eventQueue.push(event);
    }

    command(command: string, description: string, callback: (arg: string,handler:Handler,reply_msg:Message) => void) {
        this.resiger_command(command, description);

        const handler = (event: any,handler:any,reply_msg:any) => {
            if (event.raw_message.startsWith(config.get("prefix") + command)) {
                const args = event.raw_message.split(" ")[1];
                callback(args,handler,reply_msg);
            }
        };

        this.on('message', handler);
    }

    private invokeCallbacks(eventName: string, event: BotEvent) {
        return new Promise<void>((resolve, reject) => {
            if (this.eventHandlers[eventName]) {
                const handlers = this.eventHandlers[eventName];
                //console.time(`Invoke ${eventName} callbacks`)
                Promise.all(handlers.map(handler => handler(event, new Handler(event), new Message())))
                    .then(() => resolve())
                    .catch((error) => {
                        console.error(`Error in handler for event ${eventName}:`, error);
                        reject(error);
                    });
                //console.timeEnd(`Invoke ${eventName} callbacks`)
            } else {
                resolve();
            }
        });
    }

    private startEventLoop() {
        const eventHandlers = new Map<string, (event: any) => void>([
            ['message', async (event) => {
                if (messageevent != null && messageevent !== this.messageevent) {
                    await this.invokeCallbacks(event, messageevent);
                    this.messageevent = messageevent;
                }
            }],
            ['notice', async (event) => {
                if (noticeevent != null && noticeevent !== this.noticeevent) {
                    await this.invokeCallbacks(event, noticeevent);
                    this.noticeevent = noticeevent;
                }
            }],
            ['request', async (event) => {
                if (requestevent != null && requestevent !== this.requestevent) {
                    await this.invokeCallbacks(event, requestevent);
                    this.requestevent = requestevent;
                }
            }],
            ['meta_event', async (event) => {
                if (metaevent != null && metaevent !== this.metaevent) {
                    await this.invokeCallbacks(event, metaevent);
                    this.metaevent = metaevent;
                }
            }],
        ]);

        setInterval(async () => {
            for (const event of this.eventQueue) {
                const handler = eventHandlers.get(event);
                if (handler) {
                    await handler(event);
                }
            }
        }, 0);
    }
    


}

export class Handler{
    private _event: any;
    private _send: Function;
    constructor(event: any) {
        this._event = event;
        this._send = null
    }
    async finish(message: Message){
        if (this._event instanceof GroupMessageEvent){
            this._send = SendMessage.send_group_msg;
            this._send(this._event.group_id, message);
        }
    }
}