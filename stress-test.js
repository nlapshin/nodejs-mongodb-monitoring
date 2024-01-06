const autocannon = require('autocannon')

const instance = autocannon({
  url: 'http://localhost:8080/random-error',
  connections: 10, //default
  pipelining: 1, // default
  duration: 10 // default
})

// this is used to kill the instance on CTRL-C
process.once('SIGINT', () => {
  instance.stop()
})

// just render results
autocannon.track(instance, {renderProgressBar: true})
