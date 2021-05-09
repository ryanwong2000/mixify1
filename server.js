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
  // console.log(spotifyApi.createAuthorizeURL(scopes))
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', async (req, res) => {
  //rewrite w async/await bc i like it better
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }
  
  try{
    const data = await spotifyApi.authorizationCodeGrant(code);

    const access_token = data.body['access_token'];
    const refresh_token = data.body['refresh_token'];
    const expires_in = data.body['expires_in'];
    
    //STORE ACCESS TOKENS IN CLIENT
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    console.log('access_token:', access_token);
    console.log('refresh_token:', refresh_token);

    console.log(`Sucessfully retreived access token. Expires in ${expires_in} s.`);
    // res.send('Success! You can now close the window.');
    
    //refresh token every half <expires_in>
    setInterval(async () => {
      const data = await spotifyApi.refreshAccessToken();
      const access_token = data.body['access_token'];

      console.log('The access token has been refreshed!');
      console.log('access_token:', access_token);
      spotifyApi.setAccessToken(access_token);
    }, expires_in / 2 * 1000);

    res.redirect('/');//back to index.html
    getTopArtistsShort();
  }catch(error) {
    console.error('Error getting Tokens:', error);
    res.send(`Error getting Tokens: ${error}`);
  }

  
});

app.listen(8888, () =>
  console.log('HTTP Server up. Now go to http://localhost:8888/login in your browser.')
);
//serve static pages in public folder
app.use(express.static('public'));


/**
 * 
 * @returns array of top artists IDs
 */
async function getTopArtistsShort(){
  //get top
	try {
		const data = await spotifyApi.getMyTopArtists({ time_range: 'short_term', limit: 5 });
		
		console.log('My top artists are:')
    let artistIDs = [];

    for(let artist_obj of data.body.items){
      let id = artist_obj.id;
      
      artistIDs.push(id);
      let name = artist_obj.name;
      console.log(`${name} id: ${id}`);
    }
    return artistIDs;

	} catch (error) {
		console.log('Error getting artists/tracks:', error);
	}
}