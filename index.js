const express = require('express');
var request = require('request');
const spotify_ids = require('./spotify_ids')
const tokens = require('./tokens.json')
const fs = require("fs");

const app = express();
app.use(express.json()) // Parse body
const port = 3010;

app.get('/login-needed', (req, res) => {
  res.send({ loginNeeded: !tokens.refresh_token });
});

app.post('/fetch-and-save-tokens', function (req, res) {
  if (Date.now() < tokens.expires) {
    res.send({ success: true });
    return;
  }

  const code = req.body.code;
  const redirect_uri = 'http://localhost:3000';

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(spotify_ids.clientId + ':' + spotify_ids.secretId).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      tokens.access_token = body.access_token;
      tokens.refresh_token = body.refresh_token;
      tokens.expires = Date.now() + (body.expires_in * 1000)
      fs.writeFile('./tokens.json', JSON.stringify(tokens, null, 2), () => {});
      res.send({ success: true });
    } else {
      res.send({ success: false, error: JSON.stringify(response) });
    }
  });

});

app.get('/refresh_token', function (req, res) {
  var refresh_token = tokens.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(spotify_ids.clientId + ':' + spotify_ids.secretId).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.listen(port, () => console.log(`Test api on ${port}`))
