const cache = new Map();

/**
 * Simple in-memory cache with TTL
 */
class Cache {
    constructor() {
        this.cache = new Map();
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    set(key, value, ttlSeconds = 60) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
    }

    del(key) {
        this.cache.delete(key);
    }

    delByPrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    flush() {
        this.cache.clear();
    }

    middleware(duration) {
        return (req, res, next) => {
            // Only cache GET requests
            if (req.method !== 'GET') {
                return next();
            }

            const key = `__express__${req.originalUrl || req.url}`;
            const cachedBody = this.get(key);

            if (cachedBody) {
                res.set('X-Cache', 'HIT');
                return res.send(cachedBody);
            }

            res.set('X-Cache', 'MISS');
            res.originalSend = res.send;
            res.send = (body) => {
                this.set(key, body, duration);
                res.originalSend(body);
            };
            next();
        };
    }
}

module.exports = new Cache();
