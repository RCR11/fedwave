# This branch of fedwave has rudimentary jdanks.armyd support baked in from the latest LiveStreamNorge fork.
The idea is to eventually merge it with the array of local streamers and deliver the merged data set to an endpoint in a manner the bitvvave front end api is expecting. This should let us view local and off site streamers in a unified interface.

# FedWave
## Federated streaming in a minimal box

The idea was to build a minimal site that a streamer could run on their own using their own hardware, cloud hardware, with minimal cost.
Providing features like: Chat, video live streams, channeling, federation, minimal management.

## Federation
Chat messages, allow the linking of servers to federate chat, federated messages should be username#num@federatedhost.tld
-	LiveStreams, allowing servers to list and show info about other streams that are live and how to connect to them.
-	Cross site whispering !w username#num@server

Federation can be enabled and disabled by a admin at will, allows the outgoing and the incomming to be turned off

Techonologies used of note:
-	Socket.io (provides chat, live stream info, negotiates live stream connections)
-	jose (to provide authentication via tokens) 
-	RTCMultiConnection (handles webrtc connections)
-	hbs for streaming site pages
-	nodejs (server side)
-	markedjs (message formatting)
-	htmlsanitizer (for message cleaning of html inputs)
-   livego (for RTMP backend)
-   P2P Media Loader (webtorrent based p2p hls streaming) https://github.com/Novage/p2p-media-loader
-   fluent-ffmpeg (for processing streams into thumbnails) https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
	

## To get started

You will need a system with git, npm, pm2, optional but recommend setup steps: cloudflare or use lets encrypt

Setup NVM for using npm/node 

`nvm exec 16 npm run dev`


git co 
npm i

setup firewall rules 

setup nginx


## To deploy to production

Setup a new user account or lower priv account to use in production.
`adduser fedwave`

## Security Recommendations
Fail2ban
Firewall

### Firewall rules
You'll want to adjust the ports based on your config file (.env)
```ufw app list
ufw allow OpenSSH
ufw enable
sudo ufw allow from 127.0.0.1 proto tcp to any port 8000
sudo ufw allow from 127.0.0.1 proto tcp to any port 5080
sudo ufw allow from 127.0.0.1 proto tcp to any port 5555
sudo ufw allow from 127.0.0.1 proto tcp to any port 9002
sudo ufw allow 9001/tcp

sudo ufw allow 3478/tcp
```
	
### Setup NPM/NodeJS

Tested using Version 16.18
https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-22-04

NVM is a pretty nice option for getting npm/nodejs installed and working in a version that your software will probably want https://github.com/nvm-sh/nvm

### Setup the production folders

```mkdir fedwave.git
cd fedwave.git
git init --bare
nano hooks/post-receive
chmod +x hooks/post-receive
```

### Also make the directory that the post-receive target copies to

```mkdir fedwave
```

### Setup your reference to remote production for your local git
```git remote add production ssh://user@server:/full/path/to/bare.git
git push production
```

### Configuration

You'll want to make a `.env` file
For reference these are configuration options that you will probably want to setup.

```PORT=3556
SIGPORT=9004
SIGSERVER="https://fedwave.tv:9005/"
TOKENISSUER='urn:fedwave:issuer'
THUMBNAILSERVER="https://fedwave.tv"
TOKENAUDIENCE='urn:fedwave:audience'
BRANDING="Fedwave"
BRANDINGFAV=""
BRANDINGLOGO=""
KEYNAME="tokenkey"
SALTROUNDS=10
TROLLICON='/dead_sus_troll_standing.png'
LEGACYCHAT=""
ANTISCRAPE="https://cdn.bitwave.tv/"
ICESERVER2="{
        urls: 'turns:muazkhan.com:5349',
        credential: 'muazkh',
        username: 'hkzaum'
    }"
ICESERVER4="{
        urls: 'turns:muazkhan.com:3478',
        credential: 'muazkh',
        username: 'hkzaum'
    }"
ICESERVER3="{
        urls: 'turn:muazkhan.com:3478',
        credential: 'muazkh',
        username: 'hkzaum'
    }"
ICESERVER1="{
        urls: 'stun:stun.l.google.com:19302'
    }"
SIR='<img src="/sir.png">'
HAPPYBLOB='<img src="/happyblob.gif">'
SADBLOB='<img src="/SadBlobby.png">'
ECHOESL='<img style="-webkit-transform: scaleX(-1);transform: scaleX(-1);" src="/echoes.gif">'
ECHOES='<img src="/echoes.gif">'
QUAD_S='/quad.mp3'
TAUNT_S='/taunt.wav'
RAIL_S='/railgf1a.wav'
HIT_S='/hit.wav'
PROTECT_S='/protect.wav'
RUNTY_S='/runty.mp3'
MENU1_S='/menu1.wav'
MENU2_S='/menu2.wav'
MENU3_S='/menu3.wav'
MENU4_S='/menu4.wav'
DEFAULT_S='https://www.myinstants.com/media/sounds/kitty-blabla.mp3'
CHAT_HYDRATION_SIZE=100
CHAT_HYDRATION=true

LIVEGO_ENABLED=true
LIVEGO_SERVER_API='http://localhost:8090/'
LIVEGO_SERVER_RTMP='rtmp://fedwave.tv:1935/live/'
LIVEGO_SERVER_HLS='https://fedwave.tv/live/'

```

### Setup RTMP backend
You can now use livego as a rtmp backend and it is integrated into the /stream and backend with it's own endpoint
https://github.com/gwuhaolin/livego
You will need to run it on a server that can be accessed by the backend (or on the same server if you are on a budget)
Another option would be to setup local port fowarding to the remote server and use something like autossh to maintain the connection
Also if you run a https instance of fedwave, you will need to host the HLS/RTMP endpoints on a https port with valid cert.
You can do this with a nginx proxy that fowards traffic from your https -> http port like 7003 would be the https of 7002 to help with
CORS errors that will pop up because of unsecure content on a secure page
To run livego you will need to get and install/setup GO lang from https://go.dev/dl/

then the server will need to be manually started or have a hook tied into the index.mjs to help manage/start/restart it
(this will be added in the future probably)


### Setup PM2
```npm i pm2@latest -g
pm2 startup systemd
sudo systemctl start pm2-fedwave.service
```


``` pm2 start ./index.mjs --name fedwave
pm2 save
```


### Setup Nginx or some type of reverse proxy/cloudflare
Make the following files based on the proxy templates for nginx
`/etc/nginx/sites-enabled/fedwave.tv`
`/etc/nginx/sites-enabled/fedwave.tv_signalserver`


### Certs via certbot
`certbot --nginx -d fedwave.tv`

# Manually configure approved streamers
`nano approved_streamers.json`

## a sample looks like:
```
{"approvedstreamers":[
    {"username": "MizztourMetokur", "color": "#1A07D8", "num": 83271,"avatar":"https://fedwave.tv/emotes/4of5starshat.png"}
    
]}
```

# Configure admins

The file will be called `admin.json`

it allows the users listed in it to be used for !mkstreamer !ban !unban etc from chat
```{"admin":[
    {"username": "AsweetAdminName", "color": "#666666", "num": 666},
    {"username": "AnotherAdminName", "color": "#333333", "num": 333}
]}
```

For the admin to work, the name needs to be matched, color needs to match, and the num needs to match.


# Getting streams into the site

Users need to use obs (version 27 or newer) to create a virtual camera and capture their audio when they start a stream.
Or they can use a regular microphone and webcam to stream (via laptop, computer, or cell phone)

## Experimental things

https://github.com/MarshalX/python-webrtc
https://pericror.com/software/python-create-a-webrtc-video-stream-from-images/
https://www.npmjs.com/package/emoji-picker-element
In theory that could be made to work if it handled all of the signaling events of the backend signaling server.

# Protocol theory
You create a initial peer to peer connection that is one way
You create a session offer, get the other connection answer from someone who wants to join

When a new peer wants to watch they connect to the tail of the stream chain (type that is in use audio, audio + video, high bitrate, low bitrate)

When someone disconnects, the chain is relinked without the person that was dropped out/disconnected

you position in a stream chain is determined based on your connection speed + stability, speed determines what chain you should get connected to, stability determines if you get put towards the end of chain to not cause constant drop outs

Every link in the streamer chain should be able to have client connect to them to extend the chain and create a branch

# Be a leach of public infrastracture 

https://gist.github.com/yetithefoot/7592580 A long list of public stun servers

# Running your own webrtc relay server

https://github.com/coturn/coturn

coturn can be used via authentication/user connections that could be authed with chat


## Testing webrtc

https://meetrix.io/blog/webrtc/debugging-webrtc-applications.html
https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
chrome://webrtc-internals/

# Yet another scaling solution for streaming

https://github.com/fastcast/fastcast
https://github.com/pldubouilh/live-torrent
https://github.com/Novage/p2p-media-loader
https://github.com/leeroybrun/webtorrent-transcode?tab=readme-ov-file
https://github.com/unifiedstreaming/live-demo/tree/master/ffmpeg

https://github.com/qascade/yast

https://github.com/LazyIce/p2p-video-streaming/blob/master/index.html

https://github.com/valverde-marcelo/liveontorrent

https://github.com/saitejach127/t-tube

https://github.com/negu63/webtorrent-video/blob/master/src/App.tsx

https://github.com/Sergeypro91/webtorrent_streaming_api/blob/feature/torrentInfoRouter/package.json


https://github.com/Seedess/webtorrent-video-stream-optimized

https://github.com/helios-h2020/h.extension-MediaStreaming-WebTorrent

https://docs.joinpeertube.org/admin/configuration

https://github.com/Novage/wt-tracker

Also to make all of this stuff work, you need to add exceptions for video and chat to work with federation (if you want some security with who you share with)

So running the tracker need to 
`ufw allow 8000`
`ufw allow 8443`
`nginx reload`


## This seems like the good one
https://github.com/Novage/p2p-media-loader/tree/master/p2p-media-loader-hlsjs


# Other Considerations

Logging, you might want to turn this off to save disk space and reduce potential issues with long term hosting.

Logs you'll want to probably clean up:
In linux: 
```/var/log/
/var/log/nginx/
~/.pm2/*.logs
```

# Optional Cloudflare

https://www.digitalocean.com/community/tutorials/how-to-host-a-website-using-cloudflare-and-nginx-on-ubuntu-22-04

## Security
Markdown (but with some safe restrictions of use to prevent issues with scraping of IP info)
-    Ip scraping is accomplished by injecting markdown content that can be directed to a server for loading by users in a chat, common with src, images, links, buttons, etc

Another class of things that need to be check are all other data outputs, notice in messaging that the channel, username, and other details
that come through are also sanatized for user input and that they also use specific access methods when content is displayed that is user
generated to prevent html elements, images, sources from being injected.


# Somtimes Worse IS Better
