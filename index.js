var _ = require('icebreaker')
var EventEmitter = require('events').EventEmitter
function isFunction(obj) {
  return typeof obj === 'function'
}
_.mixin({
  agent: function (params) {
    var a = function (options) {
      var emitter = new EventEmitter()

      var apply = function (options) {
        if (typeof options === 'object') {
          for (var k in options) {
            var value = options[k]
            if (!isFunction(value)) emitter[k] = value
          }
        }
      }

      emitter.start = function (options) {
        apply(options)

        if (this.listeners('start').length === 0) {
          throw new Error('no agent start listener defined')
        }

        this.emit('start')
      }

      emitter.stop = function () {
        if (this.listeners('stop').length === 0) {
          throw new Error('no agent stop listener defined')
        }

        this.emit('stop')
      }

      apply(params)
      apply(options)

      for (var key in params) {
        if (!isFunction(params[key])) this[key] = params[key]
      }

      var handle = function (key) {
        if (isFunction(params[key])) {
          var event = function () {
            params[key].apply(this, [].slice.call(arguments))
          }.bind(this)
          this.on(key, event)
        }
      }.bind(emitter)

      handle('start')
      handle('stop')

      return emitter
    }

    a.type = 'agent'

    return a
  }
})

if (!_.agents) _.mixin({
  agents: {}
})
