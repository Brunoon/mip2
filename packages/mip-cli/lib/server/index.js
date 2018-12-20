/**
 * @file server.js
 * @author clark-t (clarktanglei@163.com)
 */

const Koa = require('koa')
const Router = require('koa-router')
const path = require('path')
const script = require('./middleware/script')
const html = require('./middleware/html')
const cli = require('../cli')
const koaStatic = require('koa-static')
const directory = require('./middleware/directory')

module.exports = class Server {
  constructor (options) {
    this.app = new Koa()
    this.options = options

    Object.keys(options).forEach(key => {
      this[key] = options[key]
    })

    this.router = new Router()
  }

  async run () {
    let record = async (ctx, next) => {
      cli.info(`[request]: ${ctx.request.url}`)
      await next()
    }

    let options = Object.assign({app: this.app}, this.options)
<<<<<<< HEAD

    let scriptMiddlewares = script(options)
    let htmlMiddlewares = html(options)
    let dirMiddlewares = directory(options)

    this.router
      .get('/:id([^\\.]+\\.html)', ...htmlMiddlewares)
      .get(/[\w,\s-]+\.[A-Za-z]{1,4}/, ...scriptMiddlewares, koaStatic(this.dir))
      .get('*', ...dirMiddlewares)
=======
    let [
      scriptMiddlewares,
      htmlMiddlewares,
      dirMiddlewares
    ] = await Promise.all([
      script(options),
      html(options),
      directory(options)
    ])

    this.router
      .get('/:id([^\\.]+\\.html)', ...htmlMiddlewares)
      .get('/:id([^\\.]*)', ...dirMiddlewares)
      .get(['/**/example/*.*', '/**/mock/*.*'], koaStatic(this.dir))
      .get('*', ...scriptMiddlewares)
>>>>>>> 4e8ebb194a698c1a52f3d5b9ab05157aca21960b

    this.app
      .use(record)
      .use(this.router.routes())
      .listen(this.port)

    if (this.livereload) {
      const lrserver = require('livereload').createServer({
        extraExts: ['vue', 'less', 'styl', 'stylus'],
        delay: 500
      })

      lrserver.watch([
        path.resolve(this.dir, 'components'),
        path.resolve(this.dir, 'common'),
        path.resolve(this.dir, 'example')
      ])
    }
  }
}
