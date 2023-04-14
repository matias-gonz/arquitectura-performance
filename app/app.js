const express = require('express');
const axios = require('axios');

const app = express();

app.get('/ping', (req, res) => {
  console.log('Request received at /ping');
  res.status(200).send('Pong!');
});

app.get('/space_news', async (req, res) => {
  console.log('Request received at /space_news');
  let limit = 5;
  const response = await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=' + limit);
  let articles = response.data.results;
  let titles = articles.map(article => article.title);
  console.log(titles);
  res.status(200).send(titles);
});

app.get('/fact', async (req, res) => {
  console.log('Request received at /fact');
  const response = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random');
  let fact = response.data.text;
  console.log(fact);
  res.status(200).send(fact);
});

app.listen(3000, () => console.log("Listening at 3000"));
