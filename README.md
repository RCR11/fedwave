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


