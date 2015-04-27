var _ = require('icebreaker')
var EventEmitter = require('events').EventEmitter

function isFunction(obj) {
  return typeof obj === 'function'
}

function isPath(p){
  return typeof p === 'string' && isNaN(p)
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

      function find(test,test2){
        return _(
          _.asyncMap(function(p1,cb){
            _(
              isFunction(emitter.peers)?emitter.peers():_.values(emitter.peers),
              _.find(function(p2){
                return test(p1,p2)
              },
              function(err,peer){
                if(err) return cb(null,false)
                if(isFunction(test2))return cb(null,test2(peer,p1))
                cb(null,peer?p1:false)
              })
            )
          }),
        _.filter()
        )
      }

      function findNot(test){
        return find(test,function(p1,p2){
          return p1?false:p2
        })
      }

      emitter.connect= function () {
        return _(
          findNot(function(p1,p2){
            if(isPath(p2.port) && p1.port === p1.port) return true
            return p1 && p2 && p1.port === p2.port && p1.address === p2.address
          }),
          find(function(p1,p2){
            return p1.name === p2.name
          }),
          findNot(function(p1,p2){
            for(var i in p2.connections){
             var connection = p2.connections[i]
             if(typeof connection ==='object' && connection.direction === 1){
              if(isPath(p1.port) && p1.port === connection.port)return true
              else if(!isPath(p1.port) && (
              p1.address === connection.address ||
              p1.address === connection.hostname ||
              p1.hostname === connection.hostname ) &&
              !isNaN(connection.port) &&
              Number(p1.port)===Number(connection.port) ){
                return true
              }
            }
            }
            return false
          }),
          find(function(p1,p2){
            return p1.name === p2.name
          },
          function(from,to){
            return from?{from:from,to:to}:false
          }),
          _.drain(function(item){
            item.from.connect({address:item.to.address,port:item.to.port})
          })
        )
      }

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
