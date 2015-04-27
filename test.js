var test = require('tape')

var _ = require('icebreaker')
require('icebreaker-peer-net')
require('./')

var localPeers = {}
var remotePeers = {}
var connections = []

test('start peers', function (t) {
  t.plan(30)

  for (var i = 0; i < 10; ++i) {
    var peer = _.peers.net({
      port: '568' + i,
      name: 'net'
    })

    peer.once('started', function (port, i) {
      return function () {
        t.equals(this.name, 'net')
        i % 2 ? localPeers[this.name + i] = this :
        remotePeers[this.name + i] = this
        t.equals(this.port, port)
        t.ok(true, 'peer net' + i + ' started')
      }
    }('568' + i, i))

    peer.on('connection', function (c) {
      connections.push(c)
    })

    peer.once('stop', function () {
      return function () {
        delete localPeers[this.name + i]
        delete remotePeers[this.name + i]
      }
    }(i))

    peer.start()
  }
})

var agent
var localAgent
var remoteAgent

test('start agents', function (t) {
  t.plan(2)

  agent = _.agent({
    name: 'test-agent',
    start: function () {
      if (this.name === 'remote') _(_.values(localPeers), this.connect())
      else _([_.values(remotePeers)], this.connect())
      this.emit('started')
    },
    stop: function () {
      clearTimeout(this.timer)
      this.emit('stopped')
    }
  })

  localAgent = agent({
    peers: localPeers,
    name: 'local'
  })

  remoteAgent = agent({
    peers: remotePeers,
    name: 'remote'
  })

  localAgent.once('started', t.ok.bind(null, true, 'local agent started'))
  localAgent.start()

  remoteAgent.once('started', t.ok.bind(null, true, 'remote agent started'))
  remoteAgent.start()
})

test('connections', function next(t) {
  t.plan(6)
  t.equal(connections.length, 10)
  for (var i in connections) {
    var connection = connections[i]
    if (connection.direction === 1) {
      _('test1', connection, _.drain(function (item) {
        t.equal(item.toString(), 'echotest1')
      }))
    }
    else _(
      connection,
      _.map(function (m) {
        return 'echo' + m.toString()
      }),
      connection
    )
  }

})

test('stop peers', function (t) {
  t.plan(10)
  for (var i in localPeers) {
    var peer = localPeers[i]
    peer.once('stopped', t.ok.bind(null, true, 'local peer ' + i + ' stopped'))
    peer.stop()
  }
  for (var i in remotePeers) {
    var peer = remotePeers[i]
    peer.once('stopped', t.ok.bind(null, true, 'remote peer ' + i + ' stopped'))
    peer.stop()
  }
})

test('stop agents', function (t) {
  t.plan(2)
  localAgent.once('stopped', t.ok.bind(null, true, 'local agent stopped'))
  localAgent.stop()
  remoteAgent.once('stopped', t.ok.bind(null, true, 'remote agent stopped'))
  remoteAgent.stop()
})
