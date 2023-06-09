const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { decode } = require('metar-decoder');
const StatsD = require('node-statsd');

const app = express();
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

const random = Math.round(Math.random() * 100, 1);

const sendMetric = (metric, value) => {
  if (!isNaN(value)) {
    dogstatsd.timing(`project.${metric}`, value);
  }
}

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

app.get('/fact', async (req, res) => {
  console.log('Request received at /fact');
  const response = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random');
  const responseTimeExt = Date.now() - req.startTime;
  sendMetric('fact-ext', responseTimeExt);
  let fact = response.data.text;

  const responseTime = Date.now() - req.startTime;
  sendMetric('fact', responseTime);
  res.status(200).send(fact);
});

app.get('/metar', async (req, res) => {
  console.log('Request received at /metar');
  let station = req.query.station;
  console.log('Station: ' + station);
  const response = await axios.get(`https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=${station}&hoursBeforeNow=1`);
  const responseTimeExt = Date.now() - req.startTime;
  sendMetric('metar-ext', responseTimeExt);

  const parser = new XMLParser();
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
  sendMetric('metar', responseTime);
});

app.listen(3000, () => console.log("Listening at 3000"));
