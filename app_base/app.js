const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { decode } = require('metar-decoder');

const app = express();

app.get('/ping', (req, res) => {
  const random = 1;
  console.log('Request received at /ping');
  res.status(200).send(`[${random}] pong!\n`);
});

app.get('/space_news', async (req, res) => {
  console.log('Request received at /space_news');
  let titles = [];

  let limit = 5;
  const response = await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=' + limit);

  response.data.results.forEach((article) => {
    titles.push(article.title);
  });

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