import express from 'express';
import routers from './routers/message.js'; 
import { Bot } from './bot/bot.js';
import { PrivateMessageEvent, BotMessageEvent, GroupMessageEvent } from './bot/events.js';
import  config  from './bot/config.js';
import {logger} from './bot/log.js'
import { Plugin } from './bot/plugin.js';
import { Message,MessageSegment } from './bot/messages.js';
const app = express();
const port = 3000;
const bot = new Bot(config.get('self_id'));


function initialize(){
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', routers); 

  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
  const plugin = new Plugin('./plugins')
  plugin.load_plugins()
}

bot.on('message', async(event: BotMessageEvent,handler:any,reply_msg:Message) => {
  logger.info(event.toString())
});
bot.on('meta_event',(event: any,handler:any,reply_msg:Message)=>{
  logger.info(event.toString())
})
bot.on('request',(event: any,handler:any,reply_msg:Message)=>{
  logger.info(event.toString())
})
bot.on('notice',(event: any,handler:any,reply_msg:Message)=>{
  logger.info(event.toString())
})
initialize();