# FedWave
## Federated streaming in a minimal box

The idea was to build a minimal site that a streamer could run on their own using their own hardware, cloud hardware, with minimal cost.
Providing features like: Chat, video live streams, channeling, federation, minimal management.

Techonologies used of note:
	Socket.io (provides chat, live stream info, negotiates live stream connections)
	jose (to provide authentication via tokens) 
	RTCMultiConnection (handles webrtc connections)
	hbs for streaming site pages
	nodejs (server side)
	markedjs (message formatting)
	htmlsanitizer (for message cleaning of html inputs)
	

## To get started

You will need a system with git, npm, pm2, optional but recommend setup steps: cloudflare or use lets encrypt
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
`ufw app list`
`ufw allow OpenSSH`
`ufw enable`
`sudo ufw allow from 127.0.0.1 proto tcp to any port 8000`
`sudo ufw allow from 127.0.0.1 proto tcp to any port 5080`
`sudo ufw allow from 127.0.0.1 proto tcp to any port 5555`
`sudo ufw allow from 127.0.0.1 proto tcp to any port 9002`
`sudo ufw allow 9001/tcp`

`sudo ufw allow 3478/tcp`
	
### Setup NPM/NodeJS



### Setup the production folders
`mkdir fedwave.git`
`cd fedwave.git`
`git init --bare`
`nano hooks/post-receive`
`chmod +x hooks/post-receive`

### Setup your reference to remote production for your local git
`git remote add production ssh://user@server:/full/path/to/bare.git`

### Setup PM2
`npm i pm2@latest -g`
`pm2 startup systemd`
`sudo systemctl start pm2-fedwave.service`

`pm2 start ./index.mjs`
`pm2 save`

### Setup Nginx or some type of reverse proxy/cloudflare
Make the following files based on the proxy templates for nginx
`/etc/nginx/sites-enabled/fedwave.tv`
`/etc/nginx/sites-enabled/fedwave.tv_signalserver`


### Certs via certbot
`certbot --nginx -d fedwave.tv`

# Manually configure appoved streamers
`nano approved_streamers.json`

## a sample looks like:
{"approvedstreamers":[
    {"username": "MizztourMetokur", "color": "#1A07D8", "num": 83271,"avatar":"https://fedwave.tv/emotes/4of5starshat.png"}
    
]}


# Getting streams into the site

Users need to use obs (version 27 or newer) to create a virtual camera and capture their audio when they start a stream.
Or they can use a regular microphone and webcam to stream (via laptop, computer, or cell phone)

## Experimental things

https://github.com/MarshalX/python-webrtc
https://pericror.com/software/python-create-a-webrtc-video-stream-from-images/
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

https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/