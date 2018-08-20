/**
 * @file rollup-plugin-url.js
 * @author clark-t (clarktanglei@163.com)
 * @description folk from https://github.com/rollup/rollup-plugin-url
 *
 * change:
 * 1. add outputFileSystem options
 * 2. change output filename rule
 * 3. add ongenerate
 */

const {createFilter} = require('rollup-pluginutils')
const mime = require('mime')
// const crypto = require('crypto')
const path = require('path')
const fs = require('fs-extra')
const assetFactory = require('../config/shared/asset')

const defaultInclude = [
  '**/*.svg',
  '**/*.png',
  '**/*.jpg',
  '**/*.gif'
]

module.exports = function url(options = {}) {
  const {
    limit = 10 * 1024,
    include = defaultInclude,
    exclude,
    outputPath = '',
    publicPath = '',
    emitFiles = true,
    outputFileSystem = fs
  } = options

  const assetConfig = assetFactory({outputPath})

  const filter = createFilter(include, exclude)
  const copies = Object.create(null)

  return {
    async load (id) {
      if (!filter(id)) {
        return null
      }

      let [stats, buffer] = await Promise.all([fs.stat(id), fs.readFile(id)])

      let data
      if ((limit && stats.size > limit) || limit === 0) {
        let filename = assetConfig.getName(id, buffer)
        data = `${publicPath}${filename}`
        copies[id] = `${outputPath}${filename}`
      } else {
        const mimetype = mime.getType(id)
        const isSVG = mimetype === 'image/svg+xml'
        data = isSVG ? encodeSVG(buffer) : buffer.toString('base64')
        const encoding = isSVG ? '' : ';base64'
        data = `data:${mimetype}${encoding},${data}`
      }

      return `export default '${data}'`
    },
    onwrite: function write (options) {
      // Allow skipping saving files for server side builds.
      if (!emitFiles) return

      const base = options.dir || path.dirname(options.file)
      return Promise.all(Object.keys(copies).map(name => {
        const output = copies[name]
        return copy(name, path.join(base, output))
      }))
    }
  }
}

function copy(src, dest) {
  return new Promise((resolve, reject) => {
    if (file)
    const read = fs.createReadStream(src)
    read.on('error', reject)
    const write = fs.createWriteStream(dest)
    write.on('error', reject)
    write.on('finish', resolve)
    read.pipe(write)
  })
}

// https://github.com/filamentgroup/directory-encoder/blob/master/lib/svg-uri-encoder.js
function encodeSVG(buffer) {
  return encodeURIComponent(buffer.toString("utf-8")
    // strip newlines and tabs
    .replace(/[\n\r]/gmi, "")
    .replace(/\t/gmi, " ")
    // strip comments
    .replace(/<!\-\-(.*(?=\-\->))\-\->/gmi, "")
    // replace
    .replace(/'/gmi, "\\i"))
    // encode brackets
    .replace(/\(/g, "%28").replace(/\)/g, "%29")
}
