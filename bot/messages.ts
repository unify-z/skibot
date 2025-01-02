const CQ_TABLES: { [key: string]: string } = {
    "&": "&amp;",
    "[": "&#91;",
    "]": "&#93;",
    ",": "&#44;"
};

interface Data {
    [key: string]: any;
}

class BaseMessage {
    type: string;
    data: Data;

    constructor(type: string, data: Data) {
        this.type = type;
        this.data = data;
    }

    cq(): string {
        if (this.type === "text") {
            return escapeMessage(this.data["text"]);
        } else {
            const parts = Object.entries(this.data).map(([k, v]) => `${k}=${escapeMessage(v)}`);
            return `[CQ:${this.type},${parts.join(",")}]`;
        }
    }

    json(): { type: string; data: Data } {
        return {
            type: this.type,
            data: this.data
        };
    }
}

export class Message extends Array<BaseMessage> {
    json(): { type: string; data: Data }[] {
        return this.map(v => v.json());
    }

    cq(): string {
        return this.map(v => v.cq()).join('');
    }

    append(object: any): this {
        if (object instanceof Message) {
            this.union(object);
            return this;
        }
        super.push(object);
        return this;
    }

    appendMessage(type: string, data: Data): this {
        return this.append(new BaseMessage(type, data));
    }

    union(...s: Message[]): this {
        for (const msg of s) {
            for (const baseMessage of msg) {
                this.append(baseMessage);
            }
        }
        return this;

    }

    static build(): Message {
        return new Message();
    }
}

export class MessageSegment {
    messages: Message;

    constructor() {
        this.messages = Message.build();
    }

    [key: string]: any;

    static text(text: string): Message {
        return Message.build().appendMessage("text", { text });
    }

    static at(qq: number): Message {
        return Message.build().appendMessage("at", { qq });
    }

    static reply(id: number): Message {
        return Message.build().appendMessage("reply", { reply: id });
    }

    static fromJson(msg: { type: string; data: Data }[]): Message {
        const array = Message.build();
        for (const message of msg) {
            array.appendMessage(message.type, message.data);
        }
        return array;
    }

    static get METHODS(): string[] {
        return Object.getOwnPropertyNames(MessageSegment)
            .filter(name => typeof (MessageSegment as any)[name] === 'function' && name !== 'fromJson');
    }
}

function escapeMessage(value: any): string {
    if (typeof value === 'object') {
        value = JSON.stringify(value);  // 将对象转化为JSON字符串
    }
    for (const [k, v] of Object.entries(CQ_TABLES)) {
        value = value.replace(k, v);
    }
    return value;
}

function unescapeMessage(value: string): string {
    for (const [k, v] of Object.entries(CQ_TABLES)) {
        value = value.replace(v, k);
    }
    return value;
}