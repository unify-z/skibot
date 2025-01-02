import * as fs from 'fs';
import * as yaml from 'js-yaml';

class Config {
    private config: any;
    private configFile: string;

    constructor(configFile: string) {
        this.configFile = configFile;
        console.log(`Loading config from: ${this.configFile}`);  
        this.loadConfig();
    }

    public get(key: string, defaultValue: any = null): any {
        if (typeof key !== 'string') {
            throw new Error(`The key must be a string,receive key: ${key}`);
        }
    
        const keys = key.split('.');
        let config = this.config;
        for (const k of keys) {
            if (k in config) {
                config = config[k];
            } else {
                return defaultValue;
            }
        }
        return config;
    }
    
    public set(key: string, value: any): void {
        if (typeof key !== 'string') {
            throw new Error(`The key must be a string,receive key: ${key}`);
        }
    
        const keys = key.split('.');
        let config = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in config)) {
                config[k] = {};
            }
            config = config[k];
        }
        config[keys[keys.length - 1]] = value;
        this.saveConfig();
    }
    

    private loadConfig(): void {
        const fileContents = fs.readFileSync(this.configFile, 'utf8');
        this.config = yaml.load(fileContents);
    }

    private saveConfig(): void {
        const fileContents = yaml.dump(this.config);
        fs.writeFileSync(this.configFile, fileContents, 'utf8');
    }
}

const config = new Config('./config/config.yml');
export default config;
