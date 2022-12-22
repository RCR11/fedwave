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

Also make the directory that the post-receive target copies to

```mkdir fedwave
```

### Setup your reference to remote production for your local git
`git remote add production ssh://user@server:/full/path/to/bare.git`

### Setup PM2
```npm i pm2@latest -g
pm2 startup systemd
sudo systemctl start pm2-fedwave.service

pm2 start ./index.mjs
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
