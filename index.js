var EventEmitter = require('events').EventEmitter

function isFunction(obj) {
  return typeof obj === 'function'
}

function apply(options, to) {
  if (typeof options === 'object') {
	for (var k in options) {
		var value = options[k]
      if (!isFunction(value)) to[k] = value
    }
  }
}

function Agent(params, ext) {
  if (!(this instanceof Agent)) return new Agent(params, ext)

  EventEmitter.call(this)
  this.peers = []

  apply(ext, params)
  apply(params, this)


  if (isFunction(params.start)) {
    this.on('start', params.start)
  }

  if (isFunction(params.stop)) {
    this.on('stop', params.stop)
  }
}

var proto = Agent.prototype = Object.create(EventEmitter.prototype)
proto.constructor = Agent

proto.start = function (options) {
  apply(options, this)

  if (this.listeners('start').length === 0) {
    throw new Error('no agent start listener defined')
  }

  this.emit('start')
}

proto.stop = function () {
  if (this.listeners('stop').length === 0) {
    throw new Error('no agent stop listener defined')
  }

  this.emit('stop')
}

module.exports = Agent
