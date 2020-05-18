# Spotify Control API
A middleware API for the Spotify API with automatic token refresh.\
Developed for [Spotify Control](https://github.com/thohe973/spotify_control_react) but can probably be used for other apps.

## Setup
- Install [Node.js](https://nodejs.org/en/)
- Run `npm install`
- With your Spotify account, log in to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
- Create a new app
- After creation, add a *Redirect URI* under *Edit settings*. This must match the URI for the frontend.
- Set `redirect_uri` in `index.js` to your frontend URI.
- Create a copy of `spotify_ids_template.js` and name it `spotify_id.js`
- Copy the *Client ID* and *Client Secret* from the Spotify app to the file.

## Run
Run the API with
```
node index.js
```

If you want hot reload, use nodemon
```
npm install -g nodemon
npm start
```
