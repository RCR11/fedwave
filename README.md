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