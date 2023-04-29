const express = require('express');
const axios = require('axios');
const {XMLParser} = require('fast-xml-parser');
const {decode} = require('metar-decoder');
const {createClient} = require('redis');

const app = express();
const redisClient = createClient({
  url: 'redis://redis:6379'
});

// const random = Math.round(Math.random() * 100, 1);

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

process.on('SIGTERM', async () => {
  await redisClient.quit();
  console.log('Disconnected from Redis');
});

app.get('/ping', (req, res) => {
  const random = 1;
  console.log('Request received at /ping');
  res.status(200).send(`[${random}] pong!\n`);
});

app.get('/space_news', async (req, res) => {
  console.log('Request received at /space_news');
  let titles;
  const titlesString = await redisClient.get('space_news');

  if(titlesString) {
    titles = JSON.parse(titlesString);
  } else {
    let limit = 5;
    titles = [];
    const response = await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=' + limit);

    response.data.results.forEach((article) => {
      titles.push(article.title);
    });

    await redisClient.set('space_news', JSON.stringify(titles), { EX: 5 });
  }

  res.status(200).send(titles);
});

app.get('/fact', async (req, res) => {
  console.log('Request received at /fact');
  const response = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random');
  let fact = response.data.text;
  console.log(fact);
  res.status(200).send(fact);
});

app.get('/metar', async (req, res) => {
  console.log('Request received at /metar');
  let station = req.query.station;
  console.log('Station: ' + station);
  const response = await axios.get(`https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=${station}&hoursBeforeNow=1`);
  const parser = new XMLParser();
  const parsed = parser.parse(response.data);

  if (parsed.response.data === '') {
    return res.status(404).send('No data found');
  }

  const metereologic_report = decode(parsed.response.data.METAR.raw_text);
  console.log(metereologic_report);
  res.status(200).send(metereologic_report);
});

app.listen(3000, () => console.log("Listening at 3000"));
