import {Redis} from "ioredis";
import redis from "./redis";

export class CacheFacade {
    public static redisCache: Redis = redis;
}
