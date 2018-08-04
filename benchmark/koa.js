const Koa = require('koa');
const session = require('koa-session');
const redisStore = require('../');
const app = new Koa();
const store = new redisStore()
app.keys = ['keys', 'keykeys'];
if (process.argv[2] !== 'nosession') {
  app.use(session({
    store
  }, app));
}

app.use(() => {
  this.session = this.session || {};
  this.session.name = 'koa2-redis';
  this.body = this.session.name;
});

require('http').createServer(app.callback()).listen(8080);
console.log('server start listen at 8080');
