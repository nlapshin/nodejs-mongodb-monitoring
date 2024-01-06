const express = require('express');
const client = require('prom-client');
const { setTimeout: delay } = require('timers/promises');
const { randomInt } = require('crypto');

// Создали сервер
const app = express();

// Создали клиента для prometheus
const register = new client.Registry();
register.setDefaultLabels({
  app: 'my-express-app'
});

// Стандартные метрики
client.collectDefaultMetrics({ 
  prefix: 'node_',
  register 
});

// Кастомные метрики
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [10, 50, 100, 200, 300, 500, 800, 1000, 1500, 2000, 3000, 4000, 5000]
});

register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDuration);

// Считаем самостоятельно
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, path } = req;
    const { statusCode } = res;

    httpRequestCounter.labels(method, path, statusCode).inc();
    httpRequestDuration.labels(method, path, statusCode).observe(duration);
  });
  next();
});
app.get('/', async (req, res) => {
  res.send("Hello world");
});


app.get('/fast', async (req, res) => {
  res.json({ success: true });
});

app.get('/slow', async (req, res) => {
  await delay(1000);

  res.json({ success: true });
});

app.get('/slow-random', async (req, res) => {
  const randomDelayNumber = randomInt(10, 5000);
  await delay(randomDelayNumber);

  res.json({ success: true });
});

app.get('/random-error', async (req, res, next) => {
  const randomNum = randomInt(0, 9);
  
  if (randomNum === 0) {
    return next(new Error('Random error'));
  }

  res.json({ success: true });
});

// Собираем метрики
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use((err, req, res, next) => {
  res.status(500).send('Internal server error');
});


// Запускаем сервис
app.listen(8080, () => {
  console.log('Server is running on port 8080');
});
