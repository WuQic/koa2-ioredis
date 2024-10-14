/**!
 * koa-redis - index.js
 * Copyright(c) 2015
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';
const EventEmitter = require('events')
const debug = require('debug')('koa2-session-ioredis')
const Redis = require('ioredis')

module.exports = exports.default = class RedisStore  extends EventEmitter{

  /**
   * Initialize redis session middleware with `opts` (see the README for more info):
   * @param {Object} options
   *   - {Object} client       redis client (overides all other options except db and duplicate)
   *   - {String} socket       redis connect socket (DEPRECATED: use 'path' instead)
   *   - {String} db           redis db
   *   - {Boolean} duplicate   if own client object, will use node redis's duplicate function and pass other options
   *   - {String} pass         redis password (DEPRECATED: use 'auth_pass' instead)
   *   - {Any} [any]           all other options inclduing above are passed to node_redis
   */
  constructor(options = {}) {
    super()
    let client
    if (!options.client) {
      debug('Init redis new client')
      client = new Redis(options)
    } else {
      if (options.duplicate) { // Duplicate client and update with options provided
        debug('Duplicating provided client with new options (if provided)')
        let dupClient = options.client
        delete options.client
        delete options.duplicate
        client = dupClient.duplicate(options) // Useful if you want to use the DB option without adjusting the client DB outside koa-redis
      } else {
        debug('Using provided client')
        client = options.client
      }
    }
    this.client = client
    this._listen()
  }

  _listen() {
    this.client.on('connect', () => this.emit('connect'))
    this.client.on('ready', () => this.emit('ready'))
    this.client.on('reconnecting', () => this.emit('reconnecting'))
    this.client.on('error', () => this.emit('error'))
    this.client.on('end', () => this.emit('end'))
    this.client.on('end', () => this.emit('disconnect')) // For backwards compatibility
    this.client.on('idle', () => this.emit('idle'))

    this.on('connect', () => {
      debug('connected to redis')
      this.status = this.client.status
    })
    this.on('ready', () => {
      debug('redis ready')
      this.status = this.client.status
    })
    this.on('end', () => {
      debug('redis ended')
      this.status = this.client.status
    })
    // No good way to test error
    /* istanbul ignore next */
    this.on('error', () => {
      debug('redis error')
      this.status = this.client.status
    })
    // No good way to test reconnect
    /* istanbul ignore next */
    this.on('reconnecting', () => {
      debug('redis reconnecting')
      this.status = this.client.status
    })
    this.on('idle', () => {
      debug('redis idle')
      this.status = this.client.status
    })
    this.status = this.client.status
  }

  async get(sid) {
    var data = await this.client.get(sid)
    debug('get session: %s', data || 'none')
    if (!data) {
      return null
    }
    try {
      return JSON.parse(data.toString())
    } catch (err) {
      // ignore err
      debug('parse session error: %s', err.message)
    }
  }

  /**
   * set session
   * @param {string} sid - session id
   * @param {object} sess - session object
   * @param {number|string} maxAge - session max age, if number, it's the max age in milliseconds, if string, it's 'session'
   * @param {object} options - session options
   */
  async set(sid, sess, maxAge, options = {}) {
    let ttl = null;

    if (typeof maxAge === 'number') {
      // if maxAge is a number, convert it to seconds
      ttl = Math.ceil(maxAge / 1000);
    } else if (maxAge === 'session') {
      // set a default ttl for session
      ttl = 24 * 60 * 60 * 1000;
    }

    // ensure ttl is at least 1 second
    if (ttl !== null) {
      ttl = Math.max(ttl, 1);
    }

    const jsonString = JSON.stringify(sess);
    
    if (ttl !== null) {
      debug('SETEX %s %s %s', sid, ttl, jsonString);
      await this.client.setex(sid, ttl, jsonString);
    } else {
      debug('SET %s %s', sid, jsonString);
      await this.client.set(sid, jsonString);
    }

    debug('SET %s complete', sid);
    // debug('SET options: %j', options);
  }

  async destroy(sid) {
    debug('DEL %s', sid)
    await this.client.del(sid)
    debug('DEL %s complete', sid)
  }
  
  async quit() {                         // End connection SAFELY
    debug('quitting redis client')
    await this.client.quit()
  }

  async end() {
    await this.quit()
  }
}
