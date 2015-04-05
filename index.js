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
          if (!isFunction(value)||k==='peers') emitter[k] = value
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

      var seen = {}

      emitter.connect= function () {
        var list = function(){
          return isFunction(this.peers)?this.peers():this.peers
        }.bind(this)

        return _(
        _.filter(function (d) {
          if (!d) return false
          for (var i in seen) {
            var p = seen[i]
            if (p.port === d.port && p.address === d.address) {
              return false
            }
          }
          return true
        }),
        _.sink(function (read) {
          read(null, function next(end, d) {
            if (end) return

            _(
            list(),
            _.find(function (p) {
              return p && p.port === d.port && p.address === d.address
            },
            function (err, peer) {
              if (err || peer) return read(null, next)
              _(
                list(),
                _.find(function (peer) {
                    return peer.name === d.name
                  },
                  function (err, peer) {

                    if (!peer) return read(null, next)
                    _(
                      _.values(peer.connections),
                      _.find(function (connection) {
                          if (typeof d.port === 'string') {
                            return connection.port === d.port
                          }
                          return connection.address === d.address
                        },
                        function (err, found) {
                          if (err) return read(null, next)
                          if (!found) peer.connect(d)
                          read(null, next)
                        }
                      )
                    )
                  })
              )

            })
            )
          })

        })())
      }.bind(emitter)


      apply(params)
      apply(options)

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
