import express from 'express';
const ApiRoutes = express.Router();
import { database } from '../bot/counter.js';
import plugin from '../bot/plugin.js';
import * as fs from 'fs';
import config from '../bot/config.js';
import { get_bot } from '../bot/bot.js';
await import ('express-async-errors')
ApiRoutes.get('/status', async (req, res) => {
  const json_data = {
    "status": "ok",
    "version": "1.0.0",
    "plugins": plugin.get_load_plugins(),
    "today": {
      "hits": database.get('hits').length,
      "users": database.get('userList').length,
      "groups": database.get('groupList').length
    },
    "daily": {
      "hits": database.get('hitsLengthHistory'),
      "groups": database.get('groupListLengthHistory'),
      "users": database.get('userListLengthHistory')
    }
  }
  res.json(json_data);
});

ApiRoutes.get('/plugins/list',async (req,res)=> {
    const json_data = []
    const files = fs.readdirSync('./plugins');
    for (const f of files){
        const plugin_json = JSON.parse(fs.readFileSync('./plugins/'+f+'/plugin.json','utf-8'));
        json_data.push({
            "name": plugin_json.name,
            "description": plugin_json.description,
            "version": plugin_json.version,
            "author": plugin_json.author,
            "isEnabled": config.get(`plugin.${plugin_json.name}.enabled`)
        })
    }
    res.json(json_data)
})

ApiRoutes.get('/commands/list',async (req,res)=>{
    res.json(get_bot(config.get('self_id')).commands)
})

export default ApiRoutes;