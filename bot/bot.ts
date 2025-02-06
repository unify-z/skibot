import axios from 'axios';
import { BotEvent, BotMessageEvent, messageevent, metaevent, requestevent, noticeevent, RequestEvent,NoticeEvent,MetaEvent, GroupMessageEvent, } from "./events.js";
import { Message, MessageSegment } from "./messages.js";
import  config  from "./config.js";
import { PrivateMessageEvent } from './events.js';
import logger from './log.js';
async function call_api(path: string, body: object) {
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
        await call_api(`/send_group_msg`,{
            'group_id': group_id,
            'message': message.json()
        })
    }
    static async send_private_msg(user_id: number, message: any) {
        await call_api(`/send_private_msg`,{
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
    private messageevent: BotMessageEvent;
    private noticeevent: NoticeEvent;
    private requestevent: RequestEvent;
    private metaevent: MetaEvent;
    private eventHandlers: { [eventName: string]: Function[] } = {};
    private eventQueue = [];
    public commands: Array<any>;
    constructor(self_id: number) {
        this.messageevent = null;
        this.noticeevent = null;
        this.requestevent = null;
        this.metaevent = null;
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

    command(command: string, description: string, callback: (arg: string,handler:Handler,reply_msg:Message,event: BotMessageEvent) => void) {
        this.resiger_command(command, description);

        const handler = async (event: any,handler:any,reply_msg:any) => {
            if (event.raw_message.startsWith(config.get("prefix") + command)) {
                const args = event.raw_message.split(" ").slice(1);
                try{
                await callback(args,handler,reply_msg,event);
                return
                }
                catch(e){
                    logger.error(`error when handling command ${command}, ${e}`)
                    await this.handleError(e, event);
                    return;                }
            }
        };

        this.on('message', handler);
    }
    private async handleError(error: Error,event: BotEvent){
        const message = new Message()
        const handler = new Handler(event)
        message.addMessage(MessageSegment.text(`在响应消息事件时出错: ${error}`))
        handler.finish(message)
    }
    private invokeCallbacks(eventName: string, event: BotEvent) {
        return new Promise<void>((resolve, reject) => {
            if (this.eventHandlers[eventName]) {
                const handlers = this.eventHandlers[eventName];
                Promise.all(handlers.map(async handler => await handler(event, new Handler(event), new Message())))
                    .then(() => resolve())
                    .catch(async (error) => {
                        console.error(`Error in handler for event ${eventName}:`, error);
                        await this.handleError(error, event);
                        return;
                    });
            } else {
                resolve();
            }
        });
    }
    private startEventLoop() {
        const eventHandlers = new Map<string, (event: any) => void>([
            ['message', async (event) => {
                if (messageevent != null && messageevent !== this.messageevent) {
                    this.messageevent = messageevent;
                    await this.invokeCallbacks(event, messageevent);
                    
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
        if (this._event instanceof PrivateMessageEvent){
            this._send = SendMessage.send_private_msg;
            this._send(this._event.user_id, message);
        }
    }
}