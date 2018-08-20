/**
 * @file helper.js
 * @author clark-t (clarktanglei@163.com)
 */

const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')
const minimatch = require('minimatch')
const crypto = require('crypto')

function noop () {}

function resolvePath (possiblePaths) {
  return someAsync(possiblePaths.map(
    iPath => fs.exists(iPath).then(
      result => new Promise(
        (resolve, reject) => (
          result ? resolve(iPath) : reject(Error('not found.'))
        )
      )
    )
  ))
    .catch(noop)
}

function pify (fn) {
  return (...args) => new Promise((resolve, reject) => {
    let callback = (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    }

    fn(...args, callback)
  })
}

function globPify (...args) {
  return pify(glob)(...args)
}

function someAsync (promises) {
  return new Promise((resolve, reject) => {
    let maxLength = promises.length
    let failCounter = 0
    let errCallback = err => {
      if (++failCounter === maxLength) {
        reject(err)
      }
    }

    for (let i = 0; i < maxLength; i++) {
      promises[i].then(resolve).catch(errCallback)
    }
  })
}

/**
 * 获取 obj 的子集
 *
 * @param {Object} obj obj
 * @param {Array.<string>} names property names
 * @return {Object} 子集
 */
function objectSubset (obj, names) {
  let result = {}
  for (let i = 0; i < names.length; i++) {
    if (obj[names[i]] !== undefined) {
      result[names[i]] = obj[names[i]]
    }
  }
  return result
}

function resolveModule (moduleName, rest) {
  let possiblePaths = [
    path.resolve(__dirname, '../../node_modules'),
    path.resolve(__dirname, '../../../../node_modules')
  ]
    .map(p => path.resolve(p, moduleName))

  if (rest) {
    possiblePaths = possiblePaths.map(p => path.resolve(p, rest))
  }

  for (let i = 0; i < possiblePaths.length; i++) {
    if (fs.existsSync(possiblePaths[i])) {
      return possiblePaths[i]
    }
  }
}

function pathFormat (pathname, shouldRemoveExt = true) {
  pathname = pathname.replace(/\\/g, '/')
  if (!shouldRemoveExt) {
    return pathname
  }

  return removeExt(pathname)
}

function removeExt (pathname) {
  let ext = path.extname(pathname)
  if (ext === '') {
    return pathname
  }
  return pathname.slice(0, -ext.length)
}

function match (rule, str) {
  if (typeof rule === 'string') {
    if (rule === str) {
      return true
    }

    return minimatch(str, rule)
  } else if (rule instanceof RegExp) {
    return rule.test(str)
  } else if (Array.isArray(rule)) {
    return rule.some(r => match(rule, str))
  }

  throw Error('not illegal type of rule')
}

function hash (buffer) {
  return crypto.createHash('sha1')
    .update(buffer)
    .digest('hex')
    .substr(0, 16)
}

module.exports = {
  noop,
  resolvePath,
  pify,
  globPify,
  someAsync,
  resolveModule,
  pathFormat,
  removeExt,
  objectSubset,
  match,
  hash
}
