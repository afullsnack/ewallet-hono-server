import {Redis} from '@upstash/redis';

class RedisCache {
    private static instance: Redis | null = null;
    private static isInitialized = false;

    private constructor() {
        if (RedisCache.instance) {
            throw new Error('Use RedisCache.getInstance() instead of new.');
        }
    }

    public static getInstance(): Redis {
        if (!RedisCache.instance || !RedisCache.isInitialized) {
            try {
                const redisUrl = process.env.REDIS_URL;
                const redisToken = process.env.REDIS_TOKEN;
                if (!redisUrl) {
                    throw new Error('Redis connection URL is not defined in environment variables');
                }
                RedisCache.instance = new Redis({
                   url: redisUrl,
                   token: redisToken
                });
                // RedisCache.instance.on('error', (error: Error) => {
                //     console.error('Redis connection error:', error);
                // });
                // RedisCache.instance.on('end', ()=>{
                //     console.log('Ended connection...')
                // })
                // RedisCache.instance.on('connect', () => {
                //     console.log('Successfully connected to Redis');
                //     RedisCache.isInitialized = true;
                // });
            }
            catch (error) {
                console.error('Failed to initialize Redis connection:', error);
                throw error;
            }
        }

        return RedisCache.instance;
    }

    public static async closeConnection(): Promise<void> {
        console.log('Close called')
        if (RedisCache.instance) {
            RedisCache.instance = null;
            RedisCache.isInitialized = false;
        }
    }

    public static isConnected(): boolean {
        return RedisCache.isInitialized && RedisCache.instance !== null;
    }
}


const redis = RedisCache.getInstance();
export default redis;
