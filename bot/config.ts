import * as fs from 'fs';
import * as yaml from 'js-yaml';

type ConfigObject = Record<string, any>;
type KeyPath = string[];
interface CacheEntry {
    path: KeyPath;
    lastAccessed: number;
}

class Config {
    private config: ConfigObject;
    private readonly configFile: string;
    private keyPathCache = new Map<string, CacheEntry>();
    private maxCacheAge: number;
    private cacheCleanupInterval: number;
    private saveScheduled = false;

    constructor(
        configFile: string,
        options: { maxCacheAge?: number; cleanupInterval?: number } = {}
    ) {
        this.configFile = configFile;
        this.maxCacheAge = options.maxCacheAge * 60 * 1000 || 10 * 60 * 1000;
        this.cacheCleanupInterval = options.cleanupInterval * 60 * 1000|| 5 * 60 * 1000;
        console.log(`Loading config from: ${configFile}`);
        this.config = this.loadConfig();
        this.startCacheJanitor();
    }

    public get<T = any>(key: string, defaultValue?: T): T {
        const entry = this.getCachedEntry(key);
        const result = entry.path.reduce<unknown>((current, segment) => {
            return this.isTraversable(current) ? current[segment] : undefined;
        }, this.config);
        entry.lastAccessed = Date.now();
        return result !== undefined ? result as T : defaultValue!;
    }

    public set(key: string, value: any): void {
        const entry = this.getCachedEntry(key);
        if (entry.path.length === 0) return;
        const [finalKey, ancestors] = [entry.path[entry.path.length - 1], entry.path.slice(0, -1)];
        ancestors.reduce<ConfigObject>((acc, segment) => {
            if (!this.isTraversable(acc[segment])) {
                acc[segment] = {};
            }
            return acc[segment];
        }, this.config)[finalKey] = value;
        entry.lastAccessed = Date.now();
        this.scheduleSave();
    }

    private getCachedEntry(key: string): CacheEntry {
        if (!this.keyPathCache.has(key)) {
            this.keyPathCache.set(key, {
                path: key.split('.'),
                lastAccessed: Date.now()
            });
        }
        return this.keyPathCache.get(key)!;
    }

    private startCacheJanitor(): void {
        setInterval(() => {
            const now = Date.now();
            this.keyPathCache.forEach((entry, key) => {
                if (now - entry.lastAccessed > this.maxCacheAge) {
                    this.keyPathCache.delete(key);
                }
            });
        }, this.cacheCleanupInterval);
    }

    private isTraversable(obj: unknown): obj is ConfigObject {
        return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
    }

    private loadConfig(): ConfigObject {
        try {
            return yaml.load(fs.readFileSync(this.configFile, 'utf8')) || {};
        } catch (error) {
            console.error('Config load failed:', error);
            return {};
        }
    }

    private scheduleSave(): void {
        if (this.saveScheduled) return;
        this.saveScheduled = true;
        setImmediate(() => {
            try {
                fs.writeFileSync(this.configFile, yaml.dump(this.config));
            } catch (error) {
                console.error('Config save failed:', error);
            }
            this.saveScheduled = false;
        });
    }
}

const config = new Config('./config/config.yml', {
    maxCacheAge: 20,
    cleanupInterval: 10
});

export default config;
