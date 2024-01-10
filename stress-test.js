const autocannon = require('autocannon')

const instance = autocannon({
  url: 'http://localhost:8080/insert',
  connections: 10, //default
  pipelining: 1, // default
  duration: 60 // default
})

// this is used to kill the instance on CTRL-C
process.once('SIGINT', () => {
  instance.stop()
})

// just render results
autocannon.track(instance, {renderProgressBar: true})
