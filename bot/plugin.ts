import * as fs from 'fs';
import logger from './log.js';
import { get_bot } from './bot.js';
import config from './config.js';
export class Plugin {
    private _plugin_dir: string;
    constructor(_plugin_dir: string){
        this._plugin_dir = _plugin_dir;
    }
    async load_plugins(){
        const files = fs.readdirSync(this._plugin_dir);
        for(const file of files){
            const fileIndexPath = `../.${this._plugin_dir}/${file}/index.js`;
            const plugininfopath = `${this._plugin_dir}/${file}/plugin.json`;
            try{
                const plugin_main = await import(fileIndexPath);
               const plugin_json = JSON.parse(fs.readFileSync(plugininfopath, 'utf-8'));
                const plugin_except_config = plugin_json.config;
                let plugin_config = config.get(`plugin.${file}`);
                if (plugin_config === null){
                    config.set(`plugin.${file}`, plugin_except_config);
                    plugin_config = config.get(`plugin.${file}`,null)
                }
                if (plugin_config.enabled === true){
                    logger.info(`load plugin ${file}`)
                    plugin_main.init_config(plugin_config)
                    await plugin_main.init(get_bot(config.get('self_id')))
            }}
            catch(e){
                logger.error(`load plugin ${file} error: ${e}`)
            }}

    }
    async unload_plugin(plugin_name: string){

        
    }
    async reload_plugins(){
        
    }
}