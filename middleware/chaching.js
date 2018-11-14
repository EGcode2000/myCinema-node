const memcache = require('memory-cache');

let cache = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + req.url;
        let cachedBody = memcache.get(key);

        if (cachedBody) {
            res.send(cachedBody);
            //res.json(cachedBody);                        
        }
        else {
            res.origSend = res.send;
            res.send = (body) => {
                memcache.put(key, body, duration * 1000);
                res.origSend(body);
            }
            next();
        }
    }
}
module.exports = cache;