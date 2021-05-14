const SpotifyWebApi = require('spotify-web-api-node');
const express = require('./node_modules/express');
require('dotenv').config();
const Datastore = require('nedb');
// const CronJob = require("cron").CronJob;
const cron = require('node-cron');

const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify'
];
const app = express();
const port = process.env.PORT || 8888;
console.log('you looking for a boyfriend?');
var uri;
console.log('env = ' + process.env.PORT);
if (process.env.PORT === undefined) {
  uri = 'http://localhost:8888/callback';
} else {
  uri = 'https://mixify1.herokuapp.com/callback';
}
app.listen(port, () =>
  console.log(`HTTP Server up. Now go to ${uri} in your browser.`)
);
//serve static pages in public folder
app.use(express.static('public'));
app.use(express.json());

const spotifyApi = new SpotifyWebApi({
  redirectUri: uri,
  clientId: '92fef82c4b9f4b3ca1b3eb08b0001568',
  clientSecret: process.env.CLIENT_SECRET
});

//declare database and load
const database = new Datastore('myDatabase.db');
database.loadDatabase();

app.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

console.log('I see that');

//AUTH STUFF
app.get('/callback', async (req, res) => {
  console.log(req);
  console.log(req.query);

  //rewrite w async/await bc i like it better
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);

    const access_token = data.body['access_token'];
    const refresh_token = data.body['refresh_token'];
    const expires_in = data.body['expires_in'];

    //STORE ACCESS TOKENS IN CLIENT
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    console.log('access_token:', access_token);
    console.log('refresh_token:', refresh_token);

    console.log(
      `Sucessfully retreived access token. Expires in ${expires_in} s.`
    );
    // res.send('Success! You can now close the window.');

    //refresh token every half <expires_in>
    setInterval(async () => {
      const data = await spotifyApi.refreshAccessToken();
      const access_token = data.body['access_token'];

      console.log('The access token has been refreshed!');
      console.log('access_token:', access_token);
      spotifyApi.setAccessToken(access_token);
    }, (expires_in / 2) * 1000);

    // res.redirect("/top"); //back to index.html
  } catch (error) {
    console.error('Error getting Tokens:', error);
    res.send(`Error getting Tokens: ${error}`);
  }

  // getTopArtistsShort('short_term');
  // getTopTracksShort('short_term');

  //SET TO UPDATE EVERY MONDAY AT 12:12PM
  // try {
  //   cron.schedule('12 12 * * mon', () => {
  //     getTopArtistsShort('short_term'), { timezone: 'America/New_York' };
  //   });
  // } catch (error) {
  //   console.error('Error getting top artists', error);
  // }
  // try {
  //   cron.schedule('12 12 * * mon', () => {
  //     getTopTracksShort('short_term'), { timezone: 'America/New_York' };
  //   });
  // } catch (error) {
  //   console.error('Error getting top tracks', error);
  // }

  res.redirect('/login');
});

async function getTopArtistsShort(term) {
  console.log('getting top artists...');
  const artistData = await spotifyApi
    .getMyTopArtists({
      time_range: term,
      limit: 50
    })
    .catch((error) => {
      console.log('error getting top artists', error);
    });

  let ids = {};
  let index = 1;
  console.log('my top artists are:');
  for (artistObj of artistData.body.items) {
    let id = artistObj.id;
    let name = artistObj.name;
    console.log(`${name} id: ${id}`);
    ids[index++] = id;
  }
  //create obj to add to database
  let store = {
    type: 'artists',
    date: new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }),

    items: ids
  };
  console.log('+++++++++++++++++++++++++++++++++++');
  console.log(store);
  database.insert(store);
}
async function getTopTracksShort(term) {
  console.log('getting top tracks...');
  const trackData = await spotifyApi
    .getMyTopTracks({
      time_range: term,
      limit: 50
    })
    .catch((error) => {
      console.log('error getting top tracks', error);
    });

  let ids = {};
  let index = 1;
  console.log('my top tracks are:');
  for (trackObj of trackData.body.items) {
    let id = trackObj.id;
    let name = trackObj.name;
    console.log(`${name} id: ${id}`);
    ids[index++] = id;
  }
  //create obj to add to database
  let store = {
    type: 'tracks',
    date: new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }),

    items: ids
  };
  console.log('+++++++++++++++++++++++++++++++++++');
  console.log(store);
  database.insert(store);
}

console.log('Give me time you know im gonna be that');
