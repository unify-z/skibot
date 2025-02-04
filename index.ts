import express from 'express';
import routers from './routers/message.js'; 
import { Bot,Handler } from './bot/bot.js';
import { BotEvent, BotMessageEvent } from './bot/events.js';
import  config  from './bot/config.js';
import {logger} from './bot/log.js'
import { Plugin } from './bot/plugin.js';
import { Message,MessageSegment } from './bot/messages.js';
const app = express();
const port = config.get('web.port');
const bot = new Bot(config.get('self_id'));
const host = config.get('web.host');
import * as fs from 'fs';
const version = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
function initialize(){
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', routers); 

  app.listen(port, host,() => {
    logger.info(`Server is running on http://${host}:${port}`);
  });
  const plugin = new Plugin('./plugins')
  plugin.load_plugins()
}

bot.on('message', async(event: BotMessageEvent,handler:Handler,reply_msg:Message) => {
  logger.info(event.toString())
});
bot.on('meta_event',(event: BotEvent,handler:Handler,reply_msg:Message)=>{
  logger.info(event.toString())
})
bot.on('request',(event: BotEvent,handler:Handler,reply_msg:Message)=>{
  logger.info(event.toString())
})
bot.on('notice',(event: BotEvent,handler:Handler,reply_msg:Message)=>{
  logger.info(event.toString())
})

bot.command('about','获取关于信息',(args,Handler: Handler,msg: Message)=>{
  msg.addMessage(MessageSegment.text(`SkiBot v${version} \nAuthor: @unify-z \nhttps://github.com/unify-z/skibot`))
  Handler.finish(msg)
})
bot.command('help','获取帮助信息',(args,handler: Handler,msg: Message,event)=>{
  let help_msg = '当前共有以下可用指令: \n'
  for (const _command of bot.commands){
    const command =  _command.command
    const desc = _command.description
    help_msg += `${config.get("prefix")}${command} - ${desc}\n`
  }
  msg.addMessage(MessageSegment.reply(event.message_id))
  msg.addMessage(MessageSegment.text(help_msg))
  handler.finish(msg)

})
initialize();