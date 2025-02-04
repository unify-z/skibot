interface BotStatus {
    good: boolean;
    online: boolean;
    app_initialized: boolean;
    app_enabled: boolean;
    app_good: boolean;
}

interface MessageSender {
    user_id: number;
    nickname?: string;
    sex?: string;
    age?: number;
    area?: string;
    level?: string;
    role?: string;
    title?: string;
    card?: string;
}

interface MessageAnonymous {
    id: number;
    name: string;
    flag: string;
}

interface GroupUploadFile {
    id: string;
    name: string;
    size: number;
    busid: number;
}

import { Message } from "./messages.js";
import { get_bot,SendMessage } from "./bot.js"
export class BotEvent {
    time: number;
    self_id: number;

    constructor(time: number, self_id: number) {
        this.time = time;
        this.self_id = self_id;
    }

    get_bot(id:number) {
        return get_bot(this.self_id);
    }

    toString(): string {
        const keys = Object.keys(this);
        const params = keys.map(key => `${key}=${this[key]}`).join(", ");
        return `${this.constructor.name}(${params})`;
    }
}
export class BotMessageEvent extends BotEvent {
    message_id: number;
    message: Message;
    raw_message: string;
    sender: MessageSender;

    constructor(time: number, self_id: number, message_id: number, message: Message, raw_message: string, sender: MessageSender) {
        super(time, self_id);
        this.message_id = message_id;
        this.message = message;
        this.raw_message = raw_message;
        this.sender = sender;
    }
}

export class NoticeEvent extends BotEvent {}

export class RequestEvent extends BotEvent {}

export class MetaEvent extends BotEvent {}

class BotLifeCycleMetaEvent extends MetaEvent {
    meta_event_type: string = "lifecycle";

    constructor(time: number, self_id: number) {
        super(time, self_id);
    }
}

class BotConnectLifeCycleMetaEvent extends BotLifeCycleMetaEvent {
    sub_type: string = "connect";

    constructor(time: number, self_id: number) {
        super(time, self_id);
    }
}

class BotDisconnectLifeCycleMetaEvent extends BotLifeCycleMetaEvent {
    sub_type: string = "disconnect";

    constructor(time: number, self_id: number) {
        super(time, self_id);
    }
}

class BotHeartBeatMetaEvent extends MetaEvent {
    meta_event_type: string = "heartbeat";
    status: BotStatus;

    constructor(time: number, self_id: number, status: BotStatus) {
        super(time, self_id);
        this.status = status;
    }
}

class FriendRequestEvent extends RequestEvent {
    request_type: string = "friend";
    user_id: number;
    comment: string;
    flag: string;

    constructor(time: number, self_id: number, user_id: number, comment: string, flag: string) {
        super(time, self_id);
        this.user_id = user_id;
        this.comment = comment;
        this.flag = flag;
    }

    async approve(remark: string = "") {
        await SendMessage.approve_friend(this.flag, remark);
    }

    async reject() {
        await SendMessage.reject_friend(this.flag);
    }
}

class GroupRequestEvent extends RequestEvent {
    request_type: string = "group";
    group_id: number;
    user_id: number;
    flag: string;

    constructor(time: number, self_id: number, group_id: number, user_id: number, flag: string) {
        super(time, self_id);
        this.group_id = group_id;
        this.user_id = user_id;
        this.flag = flag;
    }

    async approve() {
        const sub_type = (this.constructor as any).sub_type;
        if (!sub_type) return;
        await SendMessage.approve_group(this.flag, sub_type);
    }

    async reject(reason: string = "") {
        const sub_type = (this.constructor as any).sub_type;
        if (!sub_type) return;
        await SendMessage.reject_group(this.flag, sub_type, reason);
    }
}

class GroupAddRequestEvent extends GroupRequestEvent {
    sub_type: string = "add";
    comment: string;

    constructor(time: number, self_id: number, group_id: number, user_id: number, flag: string, comment: string) {
        super(time, self_id, group_id, user_id, flag);
        this.comment = comment;
    }
}

class GroupInviteRequestEvent extends GroupRequestEvent {
    sub_type: string = "invite";
}

export class PrivateMessageEvent extends BotMessageEvent {
    message_type: string = "private";
    user_id: number;

    constructor(time: number, self_id: number, message_id: number, message: Message, raw_message: string, sender: MessageSender, user_id: number) {
        super(time, self_id, message_id, message, raw_message, sender);
        this.user_id = user_id;
    }
}

class PrivateFriendMessageEvent extends PrivateMessageEvent {
    sub_type: string = "friend";
}

class PrivateGroupMessageEvent extends PrivateMessageEvent {
    sub_type: string = "group";
}

class PrivateOtherMessageEvent extends PrivateMessageEvent {
    sub_type: string = "other";
}

export class GroupMessageEvent extends BotMessageEvent {
    message_type: string = "group";
    sub_type: string = "normal";
    group_id: number;
    user_id: number;

    constructor(time: number, self_id: number, message_id: number, message: Message, raw_message: string, sender: MessageSender, group_id: number, user_id: number) {
        super(time, self_id, message_id, message, raw_message, sender);
        this.group_id = group_id;
        this.user_id = user_id;
    }
}

class GroupNoticeMessageEvent extends GroupMessageEvent {
    sub_type: string = "notice";
}

class GroupAnonymousMessageEvent extends GroupMessageEvent {
    sub_type: string = "anonymous";
    anonymous: MessageAnonymous;

    constructor(time: number, self_id: number, message_id: number, message: Message, raw_message: string, sender: MessageSender, group_id: number, user_id: number, anonymous: MessageAnonymous) {
        super(time, self_id, message_id, message, raw_message, sender, group_id, user_id);
        this.anonymous = anonymous;
    }
}

class GroupNoticeEvent extends NoticeEvent {
    group_id: number;
    user_id: number;

    constructor(time: number, self_id: number, group_id: number, user_id: number) {
        super(time, self_id);
        this.group_id = group_id;
        this.user_id = user_id;
    }
}

class GroupUploadNoticeEvent extends GroupNoticeEvent {
    notice_type: string = "group_upload";
    file: GroupUploadFile;

    constructor(time: number, self_id: number, group_id: number, user_id: number, file: GroupUploadFile) {
        super(time, self_id, group_id, user_id);
        this.file = file;
    }
}

class GroupAdminNoticeEvent extends GroupNoticeEvent {
    notice_type: string = "group_admin";
}

class GroupAdminSetNoticeEvent extends GroupAdminNoticeEvent {
    sub_type: string = "set";
}

class GroupAdminUnsetNoticeEvent extends GroupAdminNoticeEvent {
    sub_type: string = "unset";
}

class GroupMemberNoticeEvent extends GroupNoticeEvent {
    operator_id: number;

    constructor(time: number, self_id: number, group_id: number, user_id: number, operator_id: number) {
        super(time, self_id, group_id, user_id);
        this.operator_id = operator_id;
    }
}

class GroupDecreaseNoticeEvent extends GroupMemberNoticeEvent {
    notice_type: string = "group_decrease";
}

class GroupDecreaseLeaveNoticeEvent extends GroupDecreaseNoticeEvent {
    sub_type: string = "leave";
}

class GroupDecreaseKickNoticeEvent extends GroupDecreaseNoticeEvent {
    sub_type: string = "kick";
}

class GroupDecreaseKickMeNoticeEvent extends GroupDecreaseNoticeEvent {
    sub_type: string = "kick_me";
}

class GroupIncreaseNoticeEvent extends GroupMemberNoticeEvent {
    notice_type: string = "group_increase";
}

class GroupIncreaseApproveNoticeEvent extends GroupIncreaseNoticeEvent {
    sub_type: string = "approve";
}

class GroupIncreaseInviteNoticeEvent extends GroupIncreaseNoticeEvent {
    sub_type: string = "invite";
}

class GroupBanNoticeEvent extends GroupMemberNoticeEvent {
    notice_type: string = "group_ban";
    duration: number;

    constructor(time: number, self_id: number, group_id: number, user_id: number, operator_id: number, duration: number) {
        super(time, self_id, group_id, user_id, operator_id);
        this.duration = duration;
    }
}

class GroupBanMemberNoticeEvent extends GroupBanNoticeEvent {
    sub_type: string = "ban";
}

class GroupiftBanLiftMemberNoticeEvent extends GroupBanNoticeEvent {
    sub_type: string = "lift_ban";
}

class MessageRecallNoticeEvent extends NoticeEvent {
    user_id: number;
    message_id: number;

    constructor(time: number, self_id: number, user_id: number, message_id: number) {
        super(time, self_id);
        this.user_id = user_id;
        this.message_id = message_id;
    }
}

class GroupMessageRecallNoticeEvent extends MessageRecallNoticeEvent {
    notice_type: string = "group_recall";
    operator_id: number;
    group_id: number;

    constructor(time: number, self_id: number, user_id: number, message_id: number, group_id: number, operator_id: number) {
        super(time, self_id, user_id, message_id);
        this.operator_id = operator_id;
        this.group_id = group_id;
    }
}

class FriendMessageRecallNoticeEvent extends MessageRecallNoticeEvent {
    notice_type: string = "friend-recall";
    target_id: number;

    constructor(time: number, self_id: number, user_id: number, message_id: number, target_id: number) {
        super(time, self_id, user_id, message_id);
        this.target_id = target_id;
    }
}
export let botevent: BotEvent = new BotEvent(0, 0);
export let messageevent: BotMessageEvent = null
export let noticeevent: NoticeEvent = null
export let requestevent: RequestEvent = null
export let metaevent: MetaEvent = null
function updateEvent(newEvent: BotEvent): void {
    botevent = newEvent;
    switch (true) {
        case newEvent instanceof BotMessageEvent:
            messageevent = newEvent;
            break;
        case newEvent instanceof NoticeEvent:
            noticeevent = newEvent;
            break;
        case newEvent instanceof RequestEvent:
            requestevent = newEvent;
            break;
        case newEvent instanceof MetaEvent:
            metaevent = newEvent;
            break;
    }

}

const eventConstructors: { [key: string]: any } = {
    "message.private.friend": PrivateFriendMessageEvent,
    "message.private.group": PrivateGroupMessageEvent,
    "message.private.other": PrivateOtherMessageEvent,
    "message.group.normal": GroupMessageEvent,
    "message.group.notice": GroupNoticeMessageEvent,
    "message.group.anonymous": GroupAnonymousMessageEvent,
    "notice.group_upload": GroupUploadNoticeEvent,
    "notice.group_admin.set": GroupAdminSetNoticeEvent,
    "notice.group_admin.unset": GroupAdminUnsetNoticeEvent,
    "notice.group_decrease.leave": GroupDecreaseLeaveNoticeEvent,
    "notice.group_decrease.kick": GroupDecreaseKickNoticeEvent,
    "notice.group_decrease.kick_me": GroupDecreaseKickMeNoticeEvent,
    "notice.group_increase.approve": GroupIncreaseApproveNoticeEvent,
    "notice.group_increase.invite": GroupIncreaseInviteNoticeEvent,
    "notice.group_ban.ban": GroupBanMemberNoticeEvent,
    "notice.group_ban.lift_ban": GroupiftBanLiftMemberNoticeEvent,
    "notice.friend-recall": FriendMessageRecallNoticeEvent,
    "notice.group_recall": GroupMessageRecallNoticeEvent,
    "request.friend": FriendRequestEvent,
    "request.group.add": GroupAddRequestEvent,
    "request.group.invite": GroupInviteRequestEvent,
    "meta_event.lifecycle.connect": BotConnectLifeCycleMetaEvent,
    "meta_event.lifecycle.disconnect": BotDisconnectLifeCycleMetaEvent,
    "meta_event.heartbeat": BotHeartBeatMetaEvent,
};
export function matchEvents(eventData: any): void {
    const postType = eventData.post_type;
    const messageType = eventData.message_type;
    const subType = eventData.sub_type;
    const noticeType = eventData.notice_type;
    const requestType = eventData.request_type;
    const metaEventType = eventData.meta_event_type;

    let key: string;
    switch (postType) {
        case "message":
            key = `${postType}.${messageType}.${subType}`;
            break;
        case "notice":
            key = `${postType}.${noticeType}.${subType || ''}`.replace(/\.$/, '');
            break;
        case "request":
            key = `${postType}.${requestType}.${subType || ''}`.replace(/\.$/, '');
            break;
        case "meta_event":
            key = `${postType}.${metaEventType}.${subType || ''}`.replace(/\.$/, '');
            break;
        default:
            return;
    }

    const EventConstructor = eventConstructors[key];
    if (EventConstructor) {
        const message = formatEventData(eventData.message);
        const sender = formatEventData(eventData.sender);
        
        const constructorArgs = [
            eventData.time,
            eventData.self_id,
        ];

        if (key.startsWith("message.")) {
            constructorArgs.push(
                eventData.message_id,
                message, 
                eventData.raw_message,
                sender,
                eventData.group_id,
                eventData.user_id,
                eventData.anonymous
            );
        } else if (key.startsWith("notice.")) {
            constructorArgs.push(
                eventData.group_id,
                eventData.user_id
            );
            if (eventData.file) {
                constructorArgs.push(eventData.file);
            }
        } else if (key.startsWith("request.")) {
            constructorArgs.push(eventData.group_id, eventData.user_id, eventData.flag, eventData.comment);
        } else if (key.startsWith("meta_event.")) {
            constructorArgs.push(formatEventData(eventData.status))
        }

        const newEvent = new EventConstructor(...constructorArgs);
        updateEvent(newEvent);
    }
}



function formatEventData(data: any): any {
    if (typeof data === 'object') {
        return JSON.stringify(data); 
    }
    return data;
}
