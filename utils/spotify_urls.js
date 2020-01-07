const baseEndpoint = 'https://api.spotify.com/v1/';

module.exports = {
  pauseUrl: `${baseEndpoint}me/player/pause`,
  playUrl: `${baseEndpoint}me/player/play`,
  prevUrl: `${baseEndpoint}me/player/previous`,
  nextUrl: `${baseEndpoint}me/player/next`,
  devicesUrl: `${baseEndpoint}me/player/devices`,
  transferUrl: `${baseEndpoint}me/player`,
  getPlaylistsUrl: `${baseEndpoint}me/playlists`,
  setShuffleUrl: `${baseEndpoint}me/player/shuffle`
}
