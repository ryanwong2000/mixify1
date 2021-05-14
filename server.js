console.log('you looking for a boyfriend?');

const SpotifyWebApi = require('spotify-web-api-node');
const express = require('./node_modules/express');
require('dotenv').config();
const Datastore = require('nedb');
const cron = require('node-cron');
const app = express();

const port = process.env.PORT || 8888;
var uri;
if (process.env.PORT === undefined) {
  uri = 'http://localhost:8888/callback';
} else {
  uri = 'https://mixify1.herokuapp.com/callback';
}

const spotifyApi = new SpotifyWebApi({
  redirectUri: uri,
  clientId: process.env.CLIENT_ID, //92fef82c4b9f4b3ca1b3eb08b0001568
  clientSecret: process.env.CLIENT_SECRET
});
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

//declare database and load
const database = new Datastore('myDatabase.db');
database.loadDatabase();

console.log('I see that');

//serve static pages in public folder
app.use(express.static('public'));

app.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes)); // goes to /callback
});

app.get('/callback', getAuth, (req, res) => {
  // SET TO UPDATE EVERY MONDAY AT 12:12PM
  try {
    cron.schedule('12 12 * * mon', () => {
      getTop('artists', 'short_term'), { timezone: 'America/New_York' };
    });
  } catch (error) {
    console.error('Error getting top artists', error);
  }
  try {
    cron.schedule('12 12 * * mon', () => {
      getTop('tracks', 'short_term'), { timezone: 'America/New_York' };
    });
  } catch (error) {
    console.error('Error getting top tracks', error);
  }

  res.redirect('/');
});
app.get('/credentials', getAuth, () => {
  console.log(spotifyApi.getCredentials());
});
app.get('/top', getAuth, () => {
  getTop('artists', 'short_term');
  getTop('tracks', 'short_term');
});

//AUTH STUFF
async function getAuth(req, res, next) {
  //check if client already has a token so we don't have to request a grant again.
  if (spotifyApi.getAccessToken()) {
    console.log('access token is available already');
    next();
    return;
  }

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

    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('access_token:', access_token);
    console.log('refresh_token:', refresh_token);

    console.log(
      `Sucessfully retreived access token. Expires in ${expires_in} s.`
    );
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    // res.send('Success! You can now close the window.');

    //refresh token every half <expires_in>
    setInterval(async () => {
      const data = await spotifyApi.refreshAccessToken();
      const access_token = data.body['access_token'];

      console.log('The access token has been refreshed!');
      console.log('access_token:', access_token);
      spotifyApi.setAccessToken(access_token);
    }, (expires_in / 2) * 1000);

    next();

    // res.redirect("/top"); //back to index.html
  } catch (error) {
    console.error('Error getting Tokens:', error);
    res.send(`Error getting Tokens: ${error}`);
  }
}
async function getMe() {}
async function getTop(type, term) {
  let topData;
  if (type === 'artists') {
    console.log('getting top artists');
    topData = await spotifyApi
      .getMyTopArtists({
        time_range: term,
        limit: 50
      })
      .catch((error) => {
        console.log('error getting top artists', error);
      });
  } else if (type === 'tracks') {
    console.log('getting top tracks');
    topData = await spotifyApi
      .getMyTopTracks({
        time_range: term,
        limit: 50
      })
      .catch((error) => {
        console.log('error getting top artists', error);
      });
  } else {
    console.log('wrong type specified');
    return;
  }

  let ids = {};
  let index = 1;
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log(`my top ${type} are:`);
  for (obj of topData.body.items) {
    let id = obj.id;
    let name = obj.name;
    console.log(`${name} id: ${id}`);
    ids[index++] = id;
  }
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  //create obj to add to database
  let toStore = {
    type: type,
    date: new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }),

    items: ids
  };
  // console.log(toStore);
  database.insert(toStore);
}

console.log('Give me time you know im gonna be that');

app.listen(port, () =>
  console.log(`HTTP Server up. Now go to ${port} in your browser.`)
);
