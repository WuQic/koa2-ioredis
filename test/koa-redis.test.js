/**!
 * koa-redis - test/koa-redis.test.js
 * Copyright(c) 2015
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

const should = require('should');
const Redis = require('ioredis');
const RedisStroe = require('../')

function event(object, name) {              // Convert events to promises
  return new Promise(function(resolve) {
    object.once(name, resolve);
  });
}

describe('test/koa-redis.test.js', function () {
  it('should connect and ready with external client and quit ok', async () => {
    var store = new RedisStroe({client: new Redis()});
    await event(store, 'connect');
    store.status.should.eql('connect');
    await event(store, 'ready');
    store.status.should.eql('ready');
    await store.quit();
    await event(store, 'end');
    store.status.should.eql('end');
  });

  it('should connect and ready with duplicated external client and disconnect ok', async () => {
    var store = new RedisStroe({
      client: new Redis(),
      duplicate: true
    });
    await event(store, 'connect');
    store.status.should.eql('connect');
    await event(store, 'ready');
    store.status.should.eql('ready');
    await store.end()
    await event(store, 'disconnect');
    store.status.should.eql('end');
  });

  it('should set and delete with db ok', async () => {
    var store = new RedisStroe({db: 2});
    var client = new Redis();
    await client.select(2);
    await store.set('key:db1', {a: 2});
    (await store.get('key:db1')).should.eql({a: 2});
    JSON.parse(await client.get('key:db1')).should.eql({a: 2});
    await store.destroy('key:db1');
    should.not.exist(await store.get('key:db1'));
    should.not.exist(await client.get('key:db1'));
    await store.quit();
  });

  it('should set with ttl ok', async () => {
    var store = new RedisStroe();
    await store.set('key:ttl', {a: 1}, 86400000);
    (await store.get('key:ttl')).should.eql({a: 1}); (await store.client.ttl('key:ttl')).should.equal(86400);
    await store.quit();
  });

  it('should not throw error with bad JSON', async () => {
    var store = new RedisStroe();
    await store.client.set('key:badKey', '{I will cause an error!}');
    should.not.exist(await store.get('key:badKey'));
    await store.quit();
  });

  it('should set without ttl ok', async () => {
    var store = new RedisStroe();
    await store.set('key:nottl', {a: 1});
    (await store.get('key:nottl')).should.eql({a: 1});
    (await store.client.ttl('key:nottl')).should.equal(-1);
    await store.quit();
  });

  it('should destroy ok', async () => {
    var store = new RedisStroe();
    await store.destroy('key:nottl');
    await store.destroy('key:ttl');
    await store.destroy('key:badKey');
    should.not.exist(await store.get('key:nottl'));
    should.not.exist(await store.get('key:ttl'));
    should.not.exist(await store.get('key:badKey'));
    await store.quit();
  });

  it('should expire after 1s', async () => {
    this.timeout(2000);
    function sleep(t) { return new Promise(function(resolve) { setTimeout(resolve, t); }); }

    var store = new RedisStroe();
    await store.set('key:ttl2', {a: 1, b: 2}, 1000);
    await sleep(1200);                                 // Some odd delay introduced by co-mocha
    should.not.exist(await store.get('key:ttl2'));
    await store.quit();
  });
});
