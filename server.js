const SpotifyWebApi = require('spotify-web-api-node');
const express = require('./node_modules/express');
require('dotenv').config();
const Datastore = require('nedb');

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

const spotifyApi = new SpotifyWebApi({
  redirectUri: 'http://localhost:8888/callback',
  clientId: '92fef82c4b9f4b3ca1b3eb08b0001568',
  clientSecret: process.env.CLIENT_SECRET
});

const app = express();

app.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  console.log(req.query.error)
  console.log(req.query.code)

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }
  async function getAuthorization(){
    try{
      const data = await spotifyApi.authorizationCodeGrant(code);
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];
      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log('access_token:', access_token);
      console.log('refresh_token:', refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      res.send('Success! You can now close the window.');
    }catch(error) {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    }
  }

  getAuthorization();
});

app.listen(8888, () =>
  console.log('HTTP Server up. Now go to http://localhost:8888/login in your browser.')
);