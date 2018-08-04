koa2-session-ioredis
===================

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]
[![David deps][david-image]][david-url]
[![David devDeps][david-dev-image]][david-dev-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]
[![license][license-image]][license-url]

[npm-image]: https://img.shields.io/npm/v/koa2-session-ioredis.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa2-session-ioredis
[travis-image]: https://img.shields.io/travis/ortoo/koa-ioredis.svg?style=flat-square
[travis-url]: https://travis-ci.org/ortoo/koa-ioredis
[coveralls-image]: https://img.shields.io/coveralls/ortoo/koa-ioredis.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/ortoo/koa-ioredis?branch=master
[david-image]: https://img.shields.io/david/ortoo/koa-ioredis.svg?style=flat-square&label=deps
[david-url]: https://david-dm.org/ortoo/koa-ioredis
[david-dev-image]: https://img.shields.io/david/dev/ortoo/koa-ioredis.svg?style=flat-square&label=devDeps
[david-dev-url]: https://david-dm.org/ortoo/koa-ioredis#info=devDependencies
[david-opt-image]: https://img.shields.io/david/optional/ortoo/koa-ioredis.svg?style=flat-square&label=optDeps
[david-opt-url]: https://david-dm.org/ortoo/koa-ioredis#info=devDependencies
[node-image]: https://img.shields.io/node/v/koa2-session-ioredis.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/koa2-session-ioredis.svg?style=flat-square
[download-url]: https://npmjs.org/package/koa2-session-ioredis
[gittip-image]: https://img.shields.io/gittip/dead-horse.svg?style=flat-square
[gittip-url]: https://www.gittip.com/dead-horse/
[license-image]: https://img.shields.io/npm/l/koa2-session-ioredis.svg?style=flat-square
[license-url]: https://github.com/ortoo/koa-ioredis/blob/master/LICENSE

Redis storage for koa session middleware/cache using ioredis.

[![NPM](https://nodei.co/npm/koa2-session-ioredis.svg?downloads=true)](https://nodei.co/npm/koa2-session-ioredis/)

## Installation

```
npm i koa2-session-ioredis ioredis --save
```

## Usage

`koa2-session-ioredis` works with [koa-session](https://github.com/koajs/session) (a session middleware for koa v2).

### Example

```js
const session = require('koa-session');
const RedisStore = require('koa2-session-ioredis');
const Koa = require('koa');

const app = new Koa();
app.keys = ['keys', 'keykeys'];
app.use(session({
  key: 'koa:sess', /** (string) cookie key (default is koa:sess) */
  /** (number || 'session') maxAge in ms (default is 1 days) */
  /** 'session' will result in a cookie that expires when session/browser is closed */
  /** Warning: If a session cookie is stolen, this cookie will never expire */
  maxAge: 86400000,
  overwrite: true, /** (boolean) can overwrite or not (default true) */
  httpOnly: true, /** (boolean) httpOnly or not (default true) */
  signed: true, /** (boolean) signed or not (default true) */
  rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
  renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
  store: new RedisStore({
    // Options specified here
    // all `ioredis` options
  })
}, app));

app.use(async ctx => {
  switch (ctx.path) {
  case '/get':
    get.call(this);
    break;
  case '/remove':
    remove.call(this);
    break;
  case '/regenerate':
    await regenerate.call(this);
    break;
  }
});

function get() {
  var session = this.session;
  session.count = session.count || 0;
  session.count++;
  this.body = session.count;
}

function remove() {
  this.session = null;
  this.body = 0;
}

async function regenerate() {
  get.call(this);
  await this.regenerateSession();
  get.call(this);
}

app.listen(8080);
```
For more examples, please see the [examples folder of `koa-session`](https://github.com/koajs/session/blob/master/example.js).

### Options

 - *all [`ioredis`](https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options) options*
 - Useful things include `host`, `port`, and `path` to the server. Defaults to `127.0.0.1:6379`
 - `client` (object) - supply your own client, all other options are ignored unless `duplicate` is also supplied
 - `duplicate` (boolean) - When true, it will run `client.duplicate(options)` on the supplied `client` and use all other options supplied. This is useful if you want to select a different DB for sessions but also want to base from the same client object.

### Events
See the [`ioredis` docs](https://www.npmjs.com/package/ioredis#connection-events) for more info.
 - `ready`
 - `connect`
 - `reconnecting`
 - `error`
 - `end`
 - `close`
 - `idle`

### API
These are some the funcitons that `koa-session` uses that you can use manually. You will need to inintialize differently than the example above:
```js
const session = require('koa-session');
const redisStore = require('koa2-session-ioredis')({
  // Options specified here
});
const app = require('koa')();

app.keys = ['keys', 'keykeys'];
app.use(session({
  //... other options
  store: new redisStore()
}, app));
```

#### module([options])
Initialize the Redis connection with the optionally provided options (see above). *The variable `session` below references this*.

#### session.get(sid)
Generator that gets a session by ID. Returns parsed JSON is exists, `null` if it does not exist, and nothing upon error.

#### session.set(sid, sess, ttl)
Generator that sets a JSON session by ID with an optional time-to-live (ttl) in milliseconds. Yields `ioredis`'s `client.set()` or `client.setex()`.

#### session.destroy(sid)
Generator that destroys a session (removes it from Redis) by ID. Yields `ioredis`'s `client.del()`.

#### session.quit()
Generator that stops a Redis session after everything in the queue has completed. Yields `ioredis`'s `client.quit()`.

#### session.end()
Alias to `session.quit()`. It is not safe to use the real end function, as it cuts of the queue.

#### session.status
String giving the connection status updated using `client.status` after any of the events above is fired.
- `connecting`
- `connect`
- `ready`
- `reconnecting`
- `end`
- `monitoring`

#### session.client
Direct access to the `ioredis` client.

## Benchmark

|Server|Transaction rate|Response time|
|------|----------------|-------------|
|connect without session|**6763.56 trans/sec**|**0.01 secs**|
|koa without session|**5684.75 trans/sec**|**0.01 secs**|
|connect with session|**2759.70 trans/sec**|**0.02 secs**|
|koa with session|**2355.38 trans/sec**|**0.02 secs**|

Detailed benchmark report [here](https://github.com/ortoo/koa-ioredis/tree/master/benchmark)

## Testing
1. Start a Redis server on `localhost:6379`. You can use [`redis-windows`](https://github.com/ServiceStack/redis-windows) if you are on Windows or just want a quick VM-based server.
2. Clone the repository and run `npm i` in it (Windows should work fine).
3. If you want to see debug output, turn on the prompt's `DEBUG` flag.
4. Run `npm test` to run the tests and generate coverage. To run the tests without generating coverage, run `npm run-script test-only`.

## Authors
See the [contributing tab](https://github.com/ortoo/koa-ioredis/graphs/contributors)

## Licences
(The MIT License)

Copyright (c) 2015 dead-horse and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
