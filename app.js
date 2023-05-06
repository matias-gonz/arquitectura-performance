const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { decode } = require('metar-decoder');
const { rateLimit } = require('express-rate-limit');
const RedisStore = require("rate-limit-redis");
const { createClient } = require('redis');
const StatsD = require('node-statsd');

const app = express();

// const redisClient = createClient({
//   url: 'redis://redis:6379'
// });

// (async () => {
//   await redisClient.connect();
//   console.log('Connected to Redis');
// })();

// process.on('SIGTERM', async () => {
//   await redisClient.quit();
//   console.log('Disconnected from Redis');
// });

app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

const random = Math.round(Math.random() * 100, 1);

const dogstatsd = new StatsD({
  host: 'graphite',
  port: 8125,
});

// const limiter = rateLimit({
//   windowMs: 50 * 1000, // 50 seconds
// 	max: 1500, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
// 	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
// 	legacyHeaders: false, // Disable the `X-RateLimit-*` headers

//   store: new RedisStore({
//     sendCommand: (...args) => redisClient.sendCommand(args),
//   }),
// })
// app.use(limiter);

app.get('/ping', (req, res) => {
  console.log('Request received at /ping');
  res.status(200).send(`[${random}] Pong!\n`);
  const responseTime = Date.now() - req.startTime;
  console.log('Response time:', responseTime);
  if (!isNaN(responseTime)) {
    dogstatsd.timing('project.ping', responseTime);
  }
});


app.get('/space_news', async (req, res) => {
  console.log('Request received at /space_news');
  let titles = [];

  let limit = 5;
  const response = await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=' + limit);
  const responseTimeExt = Date.now() - req.startTime;
  console.log('Response time ext:', responseTimeExt);
  if (!isNaN(responseTimeExt)) {
    dogstatsd.timing('project.space-news-ext', responseTimeExt);
  }

  response.data.results.forEach((article) => {
    titles.push(article.title);
  });

  res.status(200).send(titles);
  const responseTime = Date.now() - req.startTime;
  console.log('Response time:', responseTime);
  if (!isNaN(responseTime)) {
    dogstatsd.timing('project.space-news', responseTime);
  }
});

app.get('/fact', async (req, res) => {
  console.log('Request received at /fact');
  const response = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random');
  const responseTimeExt = Date.now() - req.startTime;
  console.log('Response time ext:', responseTimeExt);
  if (!isNaN(responseTimeExt)) {
    dogstatsd.timing('project.fact-ext', responseTimeExt);
  }
  let fact = response.data.text;

  const responseTime = Date.now() - req.startTime;
  console.log('Response time:', responseTime);
  if (!isNaN(responseTime)) {
    dogstatsd.timing('project.fact', responseTime);
  }
  res.status(200).send(fact);
});

app.get('/metar', async (req, res) => {
  console.log('Request received at /metar');
  let station = req.query.station;
  console.log('Station: ' + station);
  const response = await axios.get(`https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=${station}&hoursBeforeNow=1`);
  const responseTimeExt = Date.now() - req.startTime;
  console.log('Response time ext:', responseTimeExt);
  if (!isNaN(responseTimeExt)) {
    dogstatsd.timing('project.metar-ext', responseTimeExt);
  }

  const parser = new XMLParser();
  console.log('🚀 ~ app.get ~ parser:', response.data);
  const parsed = parser.parse(response.data);

  if (parsed.response.data === '') {
    return res.status(404).send('No data found');
  }

  let data = parsed.response.data.METAR;
  if(parsed.response.data.METAR.length > 1){
    data = parsed.response.data.METAR[0];
  }

  const metereologic_report = decode(data.raw_text);
  res.status(200).send(metereologic_report);
  const responseTime = Date.now() - req.startTime;
  console.log('Response time:', responseTime);
  if (!isNaN(responseTime)) {
    dogstatsd.timing('project.metar', responseTime);
  }
});

app.listen(3000, () => console.log("Listening at 3000"));
