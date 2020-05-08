const express = require('express');
var request = require('request');
const spotifyIds = require('./spotify_ids');
const spotifyUrls = require('./utils/spotify_urls');
const tokens = require('./tokens.json');
const fs = require("fs");

const app = express();
app.use(express.json()) // Parse body
const port = 3010;

let allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Headers', "*");
  res.header('Access-Control-Allow-Methods', "*");
  next();
}
app.use(allowCrossDomain);

app.get('/login-needed', (req, res) => {
  res.send({ loginNeeded: !tokens.refresh_token });
});

app.post('/fetch-and-save-tokens', (req, res) => {
  if (!tokenExpired()) {
    res.send({ success: true });
    return;
  }

  const code = req.body.code;
  //Must match redirectUrl in spotify_control project
  const redirect_uri = 'http://192.168.1.205:3000';

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(spotifyIds.clientId + ':' + spotifyIds.secretId).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      tokens.access_token = body.access_token;
      tokens.refresh_token = body.refresh_token;
      tokens.expires = Date.now() + (body.expires_in * 1000)
      fs.writeFile('./tokens.json', JSON.stringify(tokens, null, 2), () => { });
      res.send({ success: true });
    } else {
      res.send({ success: false, error: JSON.stringify(response) });
    }
  });

});

app.put('/play', async (req, res) => {
  await refreshToken();

  request.put({
    url: spotifyUrls.playUrl + getDeviceQuery(req),
    headers: getAuthHeader(),
  }, (error, response, body) => {
    res.status(response.statusCode);
    res.send(response);
  });
});

app.put('/play-playlist-recently-added', async (req, res) => {
  await refreshToken();

  const uris = await getRecentlyAddedTracksUris(req.query.playlist);
  request.put({
    url: spotifyUrls.playUrl + getDeviceQuery(req),
    body: `{"uris": ${JSON.stringify(uris)}}`,
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    },
  }, (error, response, body) => {
    res.status(response.statusCode);
    res.send(response);
  });
});


app.put('/play-playlist', async (req, res) => {
  await refreshToken();

  request.put({
    url: spotifyUrls.playUrl + getDeviceQuery(req),
    body: `{"context_uri": "${req.query.playlist}"}`,
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    },
  }, (error, response, body) => {
    res.status(response.statusCode);
    res.send(response);
  });
});

app.put('/pause', async (req, res) => {
  await refreshToken();

  request.put({
    url: spotifyUrls.pauseUrl + getDeviceQuery(req),
    headers: getAuthHeader(),
  }, (error, response, body) => {
    res.status(response.statusCode);
    res.send(response);
  });
});

app.put('/next', async (req, res) => {
  await refreshToken();

  request.post({
    url: spotifyUrls.nextUrl + getDeviceQuery(req),
    headers: getAuthHeader(),
  }, (error, response, body) => {
    res.status(response.statusCode);
    res.send(response);
  });
});

app.put('/prev', async (req, res) => {
  await refreshToken();

  request.post({
    url: spotifyUrls.prevUrl + getDeviceQuery(req),
    headers: getAuthHeader(),
  }, (error, response, body) => {
    res.status(response.statusCode);
    res.send(response);
  });
});

app.put('/shuffle', async (req, res) => {
  await refreshToken();

  request.put({
    url: spotifyUrls.setShuffleUrl + (getDeviceQuery(req) || '?') + `&state=${req.query.state}`,
    headers: getAuthHeader(),
  }, (error, response, body) => {
    res.status(response.statusCode);
    res.send(response);
  });
});

app.get('/devices', async (req, res) => {
  await refreshToken();

  request.get({
    url: spotifyUrls.devicesUrl,
    headers: getAuthHeader()
  }, (error, response, body) => {
    res.setHeader("Content-Type", "application/json");
    res.status(response.statusCode);
    res.send(body)
  });

});

app.get('/playlists', async (req, res) => {
  await refreshToken();

  request.get({
    url: spotifyUrls.getPlaylistsUrl,
    headers: getAuthHeader()
  }, (error, response, body) => {
    res.setHeader("Content-Type", "application/json");
    res.status(response.statusCode);
    res.send(body)
  });

});

app.put('/transfer', async (req, res) => {
  await refreshToken();
  const device_id = req.query.device_id;

  request.put({
    url: spotifyUrls.transferUrl,
    body: `{"device_ids":["${device_id}"]}`,
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    },
  }, (error, response, body) => {
    res.status(response.statusCode);
    res.send(response);
  });
});

function getDeviceQuery(req) {
  if (req.query.device_id) {
    return `?device_id=${req.query.device_id}`;
  }
  return '';
}

function tokenExpired() {
  return !tokens.expires || Date.now() > tokens.expires;
}

function getAuthHeader() {
  return { 'Authorization': `Bearer ${tokens.access_token}` };
}

async function refreshToken() {
  return new Promise(function (resolve, reject) {

    if (!tokenExpired()) {
      resolve(true);
      return;
    }

    var refresh_token = tokens.refresh_token;
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(spotifyIds.clientId + ':' + spotifyIds.secretId).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };

    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        tokens.access_token = body.access_token;
        tokens.expires = Date.now() + (body.expires_in * 1000)
        fs.writeFile('./tokens.json', JSON.stringify(tokens, null, 2), () => { });
        resolve(response);
        return;
      }
      else {
        console.log(JSON.stringify(body));
        resolve();
        return;
      }
    });
  });
}

async function getRecentlyAddedTracksUris(playlistId) {
  const total = await getPlaylistTotal(playlistId);
  const limit = 100; //Max limit
  const offset = Math.max(total - limit, 0);

  return new Promise(function (resolve, reject) {
    url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
    request.get({
      url: url + `?limit=${limit}&offset=${offset}`,
      headers: getAuthHeader(),
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const res = JSON.parse(body);
        const uris = res.items.map(t => t.track.uri).reverse();
        resolve(uris);
        return;
      } else {
        console.log(JSON.stringify(body));
        resolve([]);
        return;
      }
    });
  });
}

async function getPlaylistTotal(id) {
  return new Promise(function (resolve, reject) {
    url = `https://api.spotify.com/v1/playlists/${id}/tracks`
    var r = request.get({
      url: url + '?limit=1',
      headers: getAuthHeader(),
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(JSON.parse(body).total);
        return;
      } else {
        console.log(JSON.stringify(body));
        resolve(1);
        return;
      }
    });
  });
}

app.listen(port, () => console.log(`[${new Date().toLocaleTimeString()}] Spotify help api on ${port}`))
