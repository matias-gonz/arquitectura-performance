const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { decode } = require('metar-decoder');
const StatsD = require('node-statsd');
const {createClient} = require('redis');
const _ = require('underscore');

const app = express();
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

const redisClient = createClient({
  url: 'redis://redis:6379'
});

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

process.on('SIGTERM', async () => {
  await redisClient.quit();
  console.log('Disconnected from Redis');
});

const random = Math.round(Math.random() * 100, 1);

const sendMetric = (metric, value) => {
  if (!isNaN(value)) {
    dogstatsd.timing(`project.${metric}`, value);
  }
};

const dogstatsd = new StatsD({
  host: 'graphite',
  port: 8125,
});

app.get('/ping', (req, res) => {
  console.log('Request received at /ping');
  res.status(200).send(`[${random}] Pong!\n`);
  const responseTime = Date.now() - req.startTime;
  sendMetric('ping', responseTime);
});

app.get('/space_news', async (req, res) => {
  console.log('Request received at /space_news');
  let titles = [];

  let limit = 5;
  const response = await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=' + limit);
  const responseTimeExt = Date.now() - req.startTime;
  sendMetric('space-news-ext', responseTimeExt);

  response.data.results.forEach((article) => {
    titles.push(article.title);
  });

  res.status(200).send(titles);
  const responseTime = Date.now() - req.startTime;
  sendMetric('space-news', responseTime);
});


const populateFacts = async (facts) => {
  const AMOUNT_OF_FACTS = 50;
  if(facts.length > 2*AMOUNT_OF_FACTS){
    return;
  }

  let fact_promises = [];
  for (let i = 0; i < AMOUNT_OF_FACTS; i++) {
    fact_promises.push(axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random'));
  }

  let newFacts = await Promise.all(fact_promises);
  newFacts = newFacts.map((fact) => fact.data.text);
  facts = facts.concat(newFacts);

  await redisClient.set('useless-facts', JSON.stringify(facts));
};

app.get('/fact', async (req, res) => {
  console.log('Request received at /fact');

  const factsString = await redisClient.get('useless-facts');

  let fact;
  let facts = [];
  if (factsString) {
    const facts = JSON.parse(factsString);
    fact = facts.pop();
  } else {
    fact = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random');
    fact = fact.data.text;
  }
  populateFacts(facts);

  const responseTimeExt = Date.now() - req.startTime;
  sendMetric('fact-ext', responseTimeExt);
  const responseTime = Date.now() - req.startTime;
  sendMetric('fact', responseTime);
  res.status(200).send(fact);
});

const parseMetar = (metar) => {
  const parser = new XMLParser();
  const parsed = parser.parse(metar);

  if (parsed.response.data === '') {
    return null;
  }

  let data = parsed.response.data.METAR;
  if(parsed.response.data.METAR.length > 1){
    data = parsed.response.data.METAR[0];
  }

  return decode(data.raw_text);
};

const METAR_STATIONS = ['SAEZ', 'KJFK', 'LIRE', 'RJTY', 'KLAX', 'KNXF', 'KUKI', 'KITR', 'EFHK', 'EFTU', 'EFOU', 'EGBB', 'EGLC', 'EKYT', 'ENGM', 'EPKK', 'EPWA', 'ESMS', 'ESND', 'ESST', 'LCLK'];

const populateMetar = async () => {
  const stations = _.sample(METAR_STATIONS, 5);

  let stationPromises = [];
  stations.forEach((station) => {
    let promise = axios.get(`https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=${station}&hoursBeforeNow=1`);
    stationPromises.push(promise);
  });

  let metars = await Promise.all(stationPromises);
  for(let i = 0; i < metars.length; i++){
    redisClient.set('metar' + stations[i], JSON.stringify(parseMetar(metars[i].data)), {EX: 10});
  }
};

app.get('/metar', async (req, res) => {
  console.log('Request received at /metar');
  let station = req.query.station;
  console.log('Station: ' + station);

  let reportString = await redisClient.get('metar' + station);

  let report;
  if (reportString) {
    report = JSON.parse(reportString);
  } else{
    const response = await axios.get(`https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=${station}&hoursBeforeNow=1`);
    const responseTimeExt = Date.now() - req.startTime;
    sendMetric('metar-ext', responseTimeExt);

    report = parseMetar(response.data);
    if (report) {
      redisClient.set('metar' + station, JSON.stringify(report), {EX: 10});
    }

    populateMetar();
  }

  if (!report) {
    return res.status(200).send('No report found');
  }

  res.status(200).send(report);

  const responseTime = Date.now() - req.startTime;
  sendMetric('metar', responseTime);
});

app.listen(3000, () => console.log("Listening at 3000"));
