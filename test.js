var test = require('tape')
var _ = require('icebreaker')
var Agent=require('./')
var agent

test('start agents', function (t) {
  t.plan(1)

  agent = Agent.bind(null,{
    name: 'test-agent',
    start: function () {
      this.emit('started')
    },
    stop: function () {
      this.emit('stopped')
    }
  })({
    name: 'local'
  })

  agent.once('started', t.ok.bind(null, true, 'agent started'))
  agent.start()
})

test('stop agents', function (t) {
  t.plan(1)
  agent.once('stopped', t.ok.bind(null, true, 'agent stopped'))
  agent.stop()
})
