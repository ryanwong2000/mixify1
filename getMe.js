const fs = require('fs')
const SpotifyWebApi = require('spotify-web-api-node');
const token = "BQCFscR79ADYfWHdFzyP7qw275ednyc-1F-OglAkwf1TWDNgEKwc46Xv9A7wQauCISQscIRlZobK-MTBmdmP-Mvwbxvst7_W_LejjWMJ-e7JiJbfd4uY9Q50nRrtv1rOqli1MwQgZHqh0LklcZx2WgFJc3n0od7sHb0tRPEih4ZjwcS47BmIAreiDXE945WJUGWuRqQPPmEjWUdnb2L0GjV1UwbC3-d-yeGw5qGfNSUvGUUAQ7PLaDEqpLZ5fG1dPHj5AGCmfoX0JGVdX8ehpOuX7zGdBMX62Yw";

const spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(token);

//GET MY PROFILE DATA
function getMyData() {
  (async () => {
    const me = await spotifyApi.getMe();
    // console.log(me.body);
    getUserPlaylists(me.body.id);
  })().catch(e => {
    console.error(e);
  });
}

//GET MY PLAYLISTS
async function getUserPlaylists(userName) {
  const data = await spotifyApi.getUserPlaylists(userName, {
      offset: 0,
      limit: 50 //max
  })

  console.log("---------------+++++++++++++++++++++++++")
  let playlists = []

  for (let playlist of data.body.items) {
    console.log(playlist.name + " " + playlist.id)
    
    let tracks = await getPlaylistTracks(playlist.id, playlist.name);
    console.log(tracks);

    const tracksJSON = { tracks }
    let data = JSON.stringify(tracksJSON);
    // fs.writeFileSync(playlist.name+'.json', data);
  }
}

//GET SONGS FROM PLAYLIST
async function getPlaylistTracks(playlistId, playlistName) {

  const data = await spotifyApi.getPlaylistTracks(playlistId, {
    offset: 1,
    limit: 100,
    fields: 'items'
  })

//   console.log('The playlist contains these tracks', data.body);
//   console.log('The playlist contains these tracks: ', data.body.items[0].track);
  console.log("'" + playlistName + "'" + ' contains these tracks:');
  let tracks = [];

  for (let track_obj of data.body.items) {
    const track = track_obj.track
    tracks.push(track);
    console.log(track.name + " : " + track.artists[0].name)
  }
  
  console.log("---------------+++++++++++++++++++++++++")
  return tracks;
}

getMyData();