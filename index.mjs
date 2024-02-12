// Fedwave Dependencies
//const process = require('process');
import express from 'express';
//const express = require("express");
//const exphbs = require("express-handlebars");
import bodyParser from 'body-parser';
//import exphbs from 'express-handlebars';
import {create} from 'express-handlebars';

import fetch from 'node-fetch';

// Jdanks.Army Dependencies
import https from 'https';
import scrapers from './scrapers.js';
import { rateLimit } from 'express-rate-limit'
const idToData = new Map();
//const http = require("http");
//const fs = require("fs");
//const nconf = require("nconf");
//const nconf = require('nconf');
//const crypto = require("crypto");
//const scrapers = require("./scrapers");







// Fedwave
//import { WhipEndpoint } from "@eyevinn/whip-endpoint";

// Don't mind these links
// https://github.com/AngelThump/transcoder
// https://github.com/abb128/LiveCaptions
// https://www.youtube.com/watch?v=mhq0bsWJEOw Mesh Central/MeshCommander AMT
// https://odysee.com/@fireship:6
// https://docs.nestjs.com/modules

// https://www.tesla-fire.com/
// https://github.com/corellium/projectsandcastle/
// https://projectsandcastle.org/status
// https://the-eye.eu/public/AI/
// https://github.com/fgsfdsfgs/perfect_dark
// https://github.com/snesrev/zelda3
// https://github.com/phoboslab/wipeout-rewrite
// https://github.com/open-goal/jak-project#extract-assets
// https://gitgud.io/fatchan/haproxy-protection/
// https://basedflare.com/
// https://github.com/dremin/RetroBar

// well fuck lets keep going with this list of shit that doesn't work but could work this stuff is for whip support (which OBS 30.0.2+ supports)
/* https://archive.fosdem.org/2022/schedule/event/rtc_whip/attachments/slides/5152/export/events/attachments/rtc_whip/slides/5152/fosdem2022_whip_broadcasting.pdf
    https://github.com/agonza1/free-whip
    https://github.com/meetecho/simple-whip-server
    https://github.com/ggarber/whip-go/
    https://github.com/ossrs/srs

    https://github.com/AirenSoft/OvenMediaEngine this seems like it would work but would take a lot of effort to setup
    https://github.com/x186k/deadsfu/ this one starts up but I can't get any of the ingest stuff to work

    https://webrtchacks.com/webrtc-cracks-the-whip-on-obs/

    sadly https://github.com/livekit/livekit still seems the most gooder of them all in one stuff
    https://github.com/livekit-examples/livestream it might be easier to setup all of the livekit stuff and have it be configurable to have it run on another server
*/

// Implements basic server stuff
const app = express();

/* TODO:
        Need to add config for ice servers
        Chat server that it connects to for the client side
        Video ICE 
        Add client config push for video
        FedConnect (for federation of data between instances) Swaps keys, has a message
            Emotes
            Chat, jannying chat content?
            Live streams
        Need federation sockets to allow pushing data to connected instances that are subbed to us like a user
        Need federation sockets to allow pulling and subbing to other instances
        Glowing Fed Logo or powered by
        https://github.com/kmturley/webrtc-radio
        userPreferences
        localMediaConstraints
        https://stackoverflow.com/questions/46063374/is-it-really-possible-for-webrtc-to-stream-high-quality-audio-without-noise
        connection.mediaConstraints = {
            sessionForced ends up being used
            invokeGetUserMedia seems to be used with null a lot and it could be used with the streamer and configured 
            captureUserMedia
        Add Janny/Admin/Moderator tools via websocket api etc that is authed
        So far I like the rebake process that has produced this, need to hook this up and add a fw sub to run this on
        https://github.com/supabase/supabase

        First type of federation will be passive listen to another server, probably do it via gui

        optional message logging that can be configured per streamer

        Add support for basic livego, need to hit the api and get the stream key for the user to use

        Need to add config for livego to get keys

        So you will have the base API for livego to work

        Also needs setup directions for livego and adding https for hls/rtmp

        Would be nice to hook up livego with something like redis or shim layer

        Making a similar layer for livekit would also be good for testing, you will want to run live kit on another server and probably another subdomain
        which will need a trigger layer on the server backend that authenticates and then can hit the rest api of something like livekit/livego

*/

import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

// https://www.npmjs.com/package/@eyevinn/whip-endpoint
/*
const endpoint = new WhipEndpoint({ 
  port: 8000, 
  hostname: "<whiphost>",
  https: false,
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  enabledWrtcPlugins: [ "sfu-broadcaster" ], 
});*/




// use the dotenv to pass config info into our templates
// so socket servers, signaling servers, federation options, branding can all be passed in for rendering
let template_config = {
    SIGSERVER:process.env.SIGSERVER,
    BRANDING:process.env.BRANDING,
    BRANDINGLOGO:process.env.BRANDINGLOGO,
    TROLLICON:process.env.TROLLICON,
    ICESERVER1:process.env.ICESERVER1,
    ICESERVER2:process.env.ICESERVER2,
    ICESERVER3:process.env.ICESERVER3,
    SIR:process.env.SIR,
    HAPPYBLOB:process.env.HAPPYBLOB,
    SADBLOB:process.env.SADBLOB,
    ECHOESL:process.env.ECHOESL,
    ECHOES:process.env.ECHOES,
    DEFAULT_S:process.env.DEFAULT_S,
    
    QUAD_S:process.env.QUAD_S,
    TAUNT_S:process.env.TAUNT_S,
    RAIL_S:process.env.RAIL_S,
    HIT_S:process.env.HIT_S,
    PROTECT_S:process.env.PROTECT_S,
    RUNTY_S:process.env.RUNTY_S,
    MENU1_S:process.env.MENU1_S,
    MENU2_S:process.env.MENU2_S,
    MENU3_S:process.env.MENU3_S,
    MENU4_S:process.env.MENU4_S,
    port:process.env.HTTP_PORT,
    sslPort:process.env.HTTP_SSL_PORT,
   
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

import cors from 'cors';
// https://www.npmjs.com/package/express-cors
// https://www.npmjs.com/package/cors
if(process.env.CORS_ALLOW){
  
}else{
  app.use(cors({origins:['*']}))
}


const port = process.env.PORT || 3150;

import http, { get } from 'http';
const server = http.createServer(app);

import { Server } from 'socket.io';
const fwcio = new Server(server,{cors: {
  origin: "*"
}});

const signalingServer = http.createServer(app);
const io_signal_server = new Server(signalingServer,{cors: {
  origin: "*"
}});

import {io} from "socket.io-client";// Need to look at managing federation sockets and getting request for federation
// Needs the token, with server info for federation

import bcrypt from 'bcryptjs';


import fs from "fs";

import path from "path";

import * as jose from 'jose'

import os from 'node:os' ;

import RTCMultiConnectionServer from 'rtcmulticonnection-server'; // need to look at what is stored in the server object and log the outputs so we can look for and disconnect users/streamers

//const crypto = require('crypto');
import crypto from 'crypto';

function sha1sum(input) {
  const sha1Hash = crypto.createHash('sha1');
  sha1Hash.update(input, 'utf-8'); // Assuming the input string is in UTF-8 encoding
  return sha1Hash.digest('hex');
}

// maybe add some live kit streaming support? https://docs.livekit.io/concepts/authentication/
//import { AccessToken } from 'livekit-server-sdk';
// streamList
// expose live kit via express /public

// https://github.com/livekit/ingress

// https://github.com/livekit/server-sdk-js/blob/main/examples/webhooks-http/webhook.js
// https://github.com/livekit/server-sdk-js
//import { RoomServiceClient, Room } from 'livekit-server-sdk';
//const livekitHost = process.env.LKSERVER || 'https://livekit.test.host' ;
//const svc = new RoomServiceClient(livekitHost, process.env.LKAPIKEY, process.env.LKSECRET);

// needs a request stream join method for people that want to watch
// list rooms which can be added to the list of live streams
/*svc.listRooms().then((rooms: Room[]) => {
  console.log('existing rooms', rooms);
});*/

// add special LK slugs on the site to work with LK live streams and such?
// create a new room
/*const opts = {
  name: 'myroom',
  // timeout in seconds
  emptyTimeout: 10 * 60,
  maxParticipants: 20,
};
svc.createRoom(opts).then((room: Room) => {
  console.log('room created', room);
});

*/

import Ffmpeg from 'fluent-ffmpeg';

// so we should have a table of images to return as thumbnails for streams
// need to have a way to schedule ways to thumbnail and update the files for the streams


const saltRounds = process.env.SALTROUNDS || 10; // this should be configured from the .env

let rsaPriKey = "";
let rsaPubKey = "";

let sockets = {};
let users = [];
let userList = new Set(); // this should be a map or a set to not have dupes in it (ideally)

let fatchatUserSet = {};// new Set();

let streamList = [];

let listOfBroadcasts = {};

let approved_streamers = [];

let admins = [];

let jannys = [];

let banned = [];
let bannedip = [];

let emoteList = [];
let altemoteList = [];

let federation_clients = []; // these should be servers that we can connect to and listen to via the socket io client io
let federation_sockets = []; // these are the connections that should be tracked and used for federation

let globalMessageHydrationCache = []; // default this is empty and not persistent between restarts, should hold a list of messages and use a filter based on the channel to return them

let thumbnailerinfo = []; // these are all of the jobs for making and update thumbnails, used by the /v1/api/thumbnail/thumbnailid interface to return a thumbnail to view
// the jobs should be thumbnailerinfo {user:"username",online:true,url:"rtmp url",hash:"the hash to use to make the thumbnailname.jpeg or png"}
let thumbnaildelay = 1000 * 60; // 30 seconds in ms

let maxHydrationSize = process.env.CHAT_HYDRATION_SIZE || 100;

let hydrationEnabled = process.env.CHAT_HYDRATION || false; // you have to turn it on in the config

let chatBasedViewCounter = {};//tempViews

async function securityChecks(){
    // does startup checks for jwt and other security info that we need to run securely 
    //https://github.com/panva/jose/blob/main/docs/functions/key_generate_key_pair.generateKeyPair.md#readme
    // check for public and private key set
    const keyname = process.env.KEYNAME || "fwkey"; // should be configured via .env
    // check if a .pub and .pri exist, if not generate and save a new key set
    // these need to be excluded from the public release, and need to be configured via the .env file
    const does_key_exist = fs.existsSync(keyname + ".pub" ) && fs.existsSync(keyname + ".pri" );
    if(does_key_exist){
      console.log("Loaded chat keys");
      // open and restore the keys for use
      // https://github.com/panva/jose/blob/main/docs/functions/key_import.importJWK.md#readme
      // on my local machine this is a problem
      let pubks = fs.readFileSync(keyname + ".pub");
      let priks = fs.readFileSync(keyname + ".pri");
      const rsaPublicKey = await jose.importJWK(JSON.parse(pubks) ,'PS256');
      const rsaPrivateKey = await jose.importJWK(JSON.parse(priks) ,'PS256');
      console.log("Pub Loaded: ",rsaPublicKey);
      console.log("Pri Loaded: ", rsaPrivateKey);
      rsaPriKey = rsaPrivateKey;
      rsaPubKey = rsaPublicKey;
    }else{
      console.log("No keys found, making a new set to save...");
      const { publicKey, privateKey } = await jose.generateKeyPair('PS256');
      console.log(publicKey);
      console.log(privateKey);
      rsaPriKey = privateKey;
      rsaPubKey = publicKey;
      // https://github.com/panva/jose/blob/main/docs/functions/key_export.exportJWK.md#readme
      const privateJwk = await jose.exportJWK(privateKey);
      const publicJwk = await jose.exportJWK(publicKey);
      // should save the keys out
      fs.writeFile(keyname + ".pri", JSON.stringify(privateJwk), 'utf8', (err) => {
        
        if (err) {
            console.log(`Error writing file: ${err}`);
        } else {
            console.log(`Saved PRI key`);
        }
  
      });
  
      fs.writeFile(keyname + ".pub", JSON.stringify(publicJwk), 'utf8', (err) => {
        
        if (err) {
            console.log(`Error writing file: ${err}`);
        } else {
            console.log(`Saved PUB key`);
        }
  
      });
  
    }
  }
  
  securityChecks();

  const hbs = create(
    {
      defaultLayout: 'main',
      extname: '.hbs'
    }
  );

  app.engine('hbs', hbs.engine );

  //var toobusy = require('toobusy-js'); // https://www.npmjs.com/package/toobusy-js

  app.set('view engine', 'hbs');

    // middleware which blocks requests when we're too busy
/*app.use(function(req, res, next) {
    if (toobusy()) {
      // maybe make a nice page for too busy template :(
      res.send(503, "I'm busy right now, sorry.");
    } else {
      next();
    }
  });*/
  
  app.use(express.static("./public"));

  app.use('/', express.static('./node_modules/livekit-client/dist/')); // redirect bootstrap JS

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  function getRandomUserId(){
    return Math.floor(Math.random() * 99000);
  }

  app.get('/', (req, res) => {
    var authStatus = true;//req.isAuthenticated();
    res.render('chatandvideo',{session:authStatus,req:req,config:template_config});
  });

  app.get('/stream', (req, res) => {
    // needs https://github.com/webrtc/adapter/
    var authStatus = true;//req.isAuthenticated();
    res.render('stream',{session:authStatus,req:req,config:template_config});
  });

  app.get('/video', (req, res) => {
    // needs https://github.com/webrtc/adapter/
    var authStatus = true;//req.isAuthenticated();
    res.render('video',{session:authStatus,req:req,config:template_config});
  });

  app.get('/chat', (req, res) => {
    // needs https://github.com/webrtc/adapter/
    var authStatus = true;//req.isAuthenticated();
    res.render('chat',{session:authStatus,req:req,config:template_config});
  });

  app.get('/watch', (req, res) => {
    // needs https://github.com/webrtc/adapter/
    var authStatus = true;//req.isAuthenticated();
    res.render('watch',{session:authStatus,req:req,config:template_config});
  });

  app.get('/v1/thumbnail/:thumb',(req,res) => {
    const thumb = req.params.thumb;
    // get the username or stream id.jpeg that we want
    // use it to search the stream thumbnail list
    // if a match
    let found = false;
    // check the server for the image
    // if found, return it...
    // thumbnailerinfo {user:"username",online:true,url:"rtmp url",hash:"the hash to use to make the thumbnailname.jpeg or png"}
    thumbnailerinfo.forEach((stn)=>{
      // if it's a match return the image data
      if(stn.thumbfilename == thumb){
        const imagePath = path.join('/tmp/', thumb);
        fs.readFile(imagePath, (err, data) => {
          if (err) {
            console.error(`Error reading image file: ${err.message}`);
            return res.status(500).send('Internal Server Error');
            
          } else {
            // Set the content type header based on the image file type

            // The issue we have here is the thumbnailer continues to run in the background after the stream terminates and then the entire program
            // crashes when the same user streams again. Try is a bandaid to keep it from crashing but this causes thumbnail processes to stack in the bg eating resources.
            try{
            res.setHeader('Content-Type', 'image/jpeg'); // Adjust based on your image type (jpeg, png, etc.)
            found = true;
            // Send the binary data as the response
            return res.send(data);}catch(error){
              // so this crash only happens when running the bitvvave front end, interesting
              console.log(`Error serving thumbnail:${thumb}`)
            }
            
          }
        })
      }
    });

    if(found == false){
      // return one of the default images
      // or offer a redirect to another image url...?
      //res.status(500).send('Internal Server Error');
    }

  });


  app.get('/v1/emotesfw',(req,res) => {
    let temp_emotes = emoteList;
    for( const emote in altemoteList.data){
      let bw_emote = {label:altemoteList.data[emote].label,value:altemoteList.data[emote].value,name:altemoteList.data[emote].label,url:altemoteList.data[emote].image,image:altemoteList.data[emote].image};
      temp_emotes.emotes.push(bw_emote);
    }
    res.send(temp_emotes); // litechat standard
    
  });



  app.get('/v1/emotes',(req,res) => {
    //let temp_emotes = emoteList;
    // copy all of the bw emotes into the list as well
    let temp_emotes = altemoteList;

    // then iterate through the stuff and add more


    emoteList.emotes.forEach(emote => {
      let bw_emote = {label:emote.name,value:':'+emote.name+':',name:emote.name,url:emote.url,image:emote.url};
      temp_emotes.data.push(bw_emote);
    });

    

    /*for( const emote in altemoteList.data){
      let bw_emote = {label:altemoteList.data[emote].label,value:altemoteList.data[emote].value,name:altemoteList.data[emote].label,url:altemoteList.data[emote].image,image:altemoteList.data[emote].image};
      temp_emotes.emotes.push(bw_emote);
    }
    //res.send(temp_emotes); // litechat standard
    res.send({success:true,data:temp_emotes});*/
    res.send(temp_emotes);
  });

  // this is what is hit by most things, like pages/index, streamerlist live, chat/chat.vue
  app.get('/v1/channels/live',(req,res) => {
    
    //"livestreams",{streams:streamList}
    // console.log("Is this the one that gets called for the user list?");
      // return the live streamers list ordered maybe?
      let liveList = streamList.filter(checkmestreamer => {
        if(checkmestreamer.live){
          return true;
        }
      });
    res.send({success:true,streamers:streamList,live:liveList});
    
  });

  // Legacy API endpoint used to send channel data to the front end. Need for jdanks.army scraper.
  // Mocking this up with static data for now since its above my current knowladge level, maybe mark can figure it out.
  // https://web.archive.org/web/20210303060004/https://api.bitwave.tv/v1/channels/saltycracker1
  app.get('/v1/channels/saltycracker1',(req,res) => {

    console.log("Returned /v1/channels/${this.username}");

    res.send('{"success":true,"message":"success","data":{"_username":"saltycracker1","title":"Default Title","description":"Default Description.","timestamp":"2021-03-02T04:08:37.437Z","cover":"https://cdn.bitwave.tv/static/img/odysee-banner-live-mockup-2.jpg","poster":"https://web.archive.org/web/20210303060004/https://cdn.stream.bitrave.tv/preview/saltycracker1.jpg","thumbnail":"https://web.archive.org/web/20210303060004/https://cdn.stream.bitrave.tv/preview/saltycracker1.jpg","live":true,"nsfw":true,"archive":true,"url":"https://cdn.stream.bitrave.tv/hls/saltycracker1/index.m3u8","name":"saltycracker1","owner":"tp6icUHo0nUV1DGOFGT10HNJPtB2","avatar":"http://web.archive.org/web/20190130195832/https://user-image.creekcdn.com/mediasvc/v1/user/avatar/v/31/res/256x256/406f9188-3066-11e5-9aee-42010af0b4cf.jpg","to":"/saltycracker1","scheduled":"2021-03-02T01:30:00.000Z","banned":false,"viewCount":20271}}');
    
  });

  app.get('/v1/chat/channels',(req,res) => {
    
    //"livestreams",{streams:streamList}
    // so this should also have user data in it as well... in .data
    // should have channel viewCount in it
    res.send({success:true,data:streamList});
    
  });

  app.post('/v1/livego/getkey',async (req,res) => {
      // checks the streamer permissions and does a request to get the stream key
      console.log("User requestion stream token"); // or this needs to be handled via the chat socket the same way for simplicity
      let rtoken = req.body.userToken;
      //console.log("Token:",rtoken);
      if(rtoken){
        // then look as the streamer info and sees if they are allowed to stream
        //console.log("user token:",rtoken);
        try{
          const { payload, protectedHeader } = await jose.jwtVerify(rtoken, rsaPubKey, {
            issuer: template_config.TOKENISSUER,
            audience: template_config.TOKENAUDIENCE
          })
          //console.log("stuff in the payload that has been verified:",payload);
          const mysubinfo = payload.sub;
          //console.log("My sub info:",mysubinfo);
          let userinfo = mysubinfo;//JSON.parse(mysubinfo);
          console.log("Authed:",userinfo);
          //socket.username = userinfo.username;
          //socket.unum = userinfo.num;
          // should check if it's a troll and copy in the color info or just tag everything with some color
          //socket.color = userinfo.color;

        
            try{
              let data = fs.readFileSync('approved_streamers.json');
              //console.log(data.toString());
              approved_streamers = JSON.parse(data);
              //console.log("approved streamers json obj:",approved_streamers.approvedstreamers);
            }catch(error){
              console.log("Error loading approved streamers json file.");
            }
      
          // then we should do a for loop and look for our streamer that matches
          let streamer_found = false;
          //for( const emote in emoteList.emotes){
          for( const livestreamer in approved_streamers.approvedstreamers){
            // parse the user token and look for a match of the username, color, number
            // jwt should be validated
            // if matched set to true
            //if(userinfo.username === livestreamer.username){
            if(userinfo.username === approved_streamers.approvedstreamers[livestreamer].username && userinfo.num === approved_streamers.approvedstreamers[livestreamer].num && userinfo.color === approved_streamers.approvedstreamers[livestreamer].color){
              streamer_found = true;
            }
          }

          if(streamer_found){
            // then do the api request to get the streamer key
            // which should be a get request
            let streamer_name = userinfo.username;
            // the streamer name needs to be validated for url use
            // and then do the request to the api endpoint
            let letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            streamer_name = '';
            for (var i = 0; i < 16; i++) {
              streamer_name += letters[Math.floor(Math.random() * letters.length)];
            }
            // 
            let live_go = {};
            //config.LIVEGO_SERVER_API
            live_go.rtmp = process.env.LIVEGO_SERVER_RTMP;//"rtmp";
            // make it some random id to get around the streamer name issue
            live_go.hls = process.env.LIVEGO_SERVER_HLS + streamer_name + ".m3u8";//"hls";
            live_go.key = "User key";

            // do the key request
            let getKeyAPIEndpoint = process.env.LIVEGO_SERVER_API + 'control/get?room=' + streamer_name;
            fetch(getKeyAPIEndpoint).then(res => res.json())
            .then(json => {
              console.log("livego api response:",json);
              live_go.key = json.data;
              live_go.success = true;
              res.send(live_go);
            }).catch(error => console.log(error))


            
            
          }else{
            res.send({success:false,message:"Not Authed to stream"});    
          }
        }catch(e){
          console.log(e);
          res.send({success:false,message:"Not Authed to stream"});    
        }

      }else{
        // need to return the key for the user display area on the user stream page (this should also be used in the bitvvave stream page)
        res.send({success:false,message:"Not Authed to stream"});
      }
  });

  app.get('/v1/livekit/mktoken',(req,res) => {
    // so as of 2023 jan https://github.com/livekit/server-sdk-js
    // https://github.com/livekit/server-sdk-js/pull/48/commits
    /* jsonwebtoken  <=8.5.1
        Severity: high
        jsonwebtoken's insecure implementation of key retrieval function could lead to Forgeable Public/Private Tokens from RSA to HMAC - https://github.com/advisories/GHSA-hjrf-2m68-5959
        jsonwebtoken unrestricted key type could lead to legacy keys usage  - https://github.com/advisories/GHSA-8cf7-32gw-wr33
        jsonwebtoken vulnerable to signature validation bypass due to insecure default algorithm in jwt.verify() - https://github.com/advisories/GHSA-qwph-4952-7xr6
        jsonwebtoken has insecure input validation in jwt.verify function - https://github.com/advisories/GHSA-27h2-hvpr-p74q

        Look at forking and patching to use jose or something similar as per jwt.io
    */
    const roomName = 'name-of-room';
    const participantName = 'user-name';
    
    /*const at = new AccessToken('api-key', 'secret-key', {
      identity: participantName,
    });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    
    const token = at.toJwt();
    */
    let token = "no livekit token support removed";
    console.log('access token', token);
  });

  // const endpoint = `https://fw.rnih.org/v1/coins/${this.username}/alerts/${this.offset}`;

  app.post('/v1/user/exchangetoken',async (req,res) => {
    // should return state of success or error message
    console.log('Trying to get a chatToken from FB login.',req.body);
    let rtoken = req.body.token;
    //console.log("Token:",rtoken);
    if(rtoken){

      // parse the rtoken, validate the iss,aud,auth_time
      const payload = await jose.decodeJwt(rtoken);
      console.log("Payload decoded maybe:?",payload);
      //const { payload, protectedHeader } = await jose.jwtVerify(data.jwt, rsaPubKey, {
      //  issuer: template_config.TOKENISSUER,
      //  audience: template_config.TOKENAUDIENCE
      //})
      //console.log("stuff in the payload that has been verified:",payload);
      let login_valid = true;
      const mysubinfo = payload.sub;
      //console.log("My sub info:",mysubinfo);
      let userinfo = mysubinfo;//JSON.parse(mysubinfo);
      console.log("Authed:",userinfo);
      if(payload.iss != 'https://securetoken.google.com/bitwave-7f415'){
        login_valid = false;
      }
      if(payload.aud != 'bitwave-7f415'){
        login_valid = false;
      }
      if(payload.auth_time < 1672600925){
        login_valid = false;
      }
      //userinfo.name;
      //socket.unum = userinfo.num;
      // should check if it's a troll and copy in the color info or just tag everything with some color
      //socket.color = userinfo.color;
      // don't do anything with the email
      let userobj = {username:"Dickhead",color:"Red", num:9,secreth: "mytestsecrethash"};
        if(payload.name){
          userobj.username = payload.name;
        }
        if(req.body.myKey){
          let bhash = await bcrypt.hash(req.body.myKey,saltRounds);
          //let bhash = bcrypt.hashSync(req.body.myKey, saltRounds);
          userobj.secreth = bhash; // but we need to make sure that we strip the returns
        }
        userobj.color = '#0000dd';// getRandomColor();
        userobj.num = 99999;//getRandomUserId(); // if it is valid it's a shitwave color and number specific to them
        const jwt = await new jose.SignJWT({ 'urn:example:claim': true })
          .setProtectedHeader({ alg: 'PS256' })
          .setIssuedAt()
          .setIssuer('urn:example:issuer')
          .setAudience('urn:example:audience')
          //.setExpirationTime('2h')
          .setSubject(userobj)
          .sign(rsaPriKey)
    
        //console.log(jwt)
    
        //const randomState = rand(160,36);
        //res.send(jwt);
        let done_token = "nothing";
        if(login_valid){
          done_token = jwt;
        }
      res.send({success:login_valid,message:'Made you an account!',chatToken:done_token});
    }else{
      // have a token or not as well
      res.send({success:false,message:"not implemented yet"});
    }
 });

  app.post('/v1/user/register',async (req,res) => {
    // should return state of success or error message
    console.log('Trying to register. which in this case is throw a token back', req.body.username,req.body.email,req.body.password);
    let run = req.body.username;
    let rem = req.body.email;
    let rpa = req.body.password;
    if(run && rem && rpa){
      // don't do anything with the email
      let userobj = {username:"Dickhead",color:"Red", num:9,secreth: "mytestsecrethash"};
        if(req.body.username){
          userobj.username = run;
        }
        if(req.body.myKey){
          let bhash = await bcrypt.hash(req.body.myKey,saltRounds);
          //let bhash = bcrypt.hashSync(req.body.myKey, saltRounds);
          userobj.secreth = bhash; // but we need to make sure that we strip the returns
        }
        userobj.color = getRandomColor();
        userobj.num = getRandomUserId();
        const jwt = await new jose.SignJWT({ 'urn:example:claim': true })
          .setProtectedHeader({ alg: 'PS256' })
          .setIssuedAt()
          .setIssuer('urn:example:issuer')
          .setAudience('urn:example:audience')
          //.setExpirationTime('2h')
          .setSubject(userobj)
          .sign(rsaPriKey)
    
        //console.log(jwt)
    
        //const randomState = rand(160,36);
        //res.send(jwt);
      res.send({success:true,message:'Made you an account!',token:jwt});
    }else{
      // have a token or not as well
      res.send({success:false,message:"not implemented yet"});
    }
 });

 app.post('/v1/reports',(req,res) => {
  // should return state of success or error message
  /* Expects:
   const payload = {
          name: this.name,
          email: this.email,
          subject: this.subject,
          report: this.report,
          captcha: this.captchaToken,
        }*/
  // have a token or not as well
  res.send({success:false,message:"not implemented yet"});
});


function genUsersList(page){
  let userlist = [];
  let tempnamelist = Array.from(userList);
  tempnamelist.forEach(user => {
    userlist.push({avatar:null,name:user,page:page,color:"#dddddd"});
  });
}

function getApprovedStreamerInfo(byusername){
  /*approved_streamers.forEach(streamer => {

  })*/
  try{
    let data = fs.readFileSync('approved_streamers.json');
    //console.log(data.toString());
    approved_streamers = JSON.parse(data);
    //console.log("approved streamers json obj:",approved_streamers.approvedstreamers);
  }catch(error){
    console.log("Error loading approved streamers json file.");
  }

  //let found_streamer = -1;
  console.log("Trying to find",byusername, ' but match with :',byusername.toLowerCase());
  for(let si = 0;si < approved_streamers.length;si++){
    if(approved_streamers[si].username.toLowerCase() == byusername.toLowerCase()){
      console.log("Got a match for the streamer, should return it based on teh name match");
      return approved_streamers[si];
    }
  }

  /*let matched_streamer = approved_streamers.filter(function(streamer){
    if(streamer.username.tolower() == byusername.tolower()){
      return true;
    }
  });*/
  return [];
}

// cname = data[user].page.watch;
// cname = data[user].page;
  app.get('/api/channel/:id',(req,res) => {
    
    //"livestreams",{streams:streamList}
    console.log("Streamers to select from:",streamList);
    var currStream = streamList.filter(function(streamer){
      if(streamer.name == req.params.id){
         return true;
      }
   });

   


    //let streamername = req.params.id;
    console.log("trying to find streamer: ",req.params.id, ' in: ',currStream);
    if(currStream.length == 1){
      res.json(currStream[0])
   } else {

      // then is the next phase where we check the approved user list...
      const found_streamer = getApprovedStreamerInfo(req.params.id);
      console.log("Found streamer:",found_streamer);
      if(found_streamer.length){
        res.json(found_streamer);
      }else{

        res.status(404);//Set status to 404 as movie was not found
        res.json({message: "Not Found"});
      }
   }
    //res.send({success:true,streamers:streamList[0],live:true});
    
  });

app.post('/v1/admin/fireworks',(req,res) => {
  // should do something to pop fireworks for a stream
  /* m.type === 'fireworks'
       m.channel, this.page 
       m.topText, m.bottomText
       message
       subtext
  */

       const message = req.body.message;
        const subtext = req.body.subtext;
        let sub_channel = req.body.channel;

        if(sub_channel){

        }else{
          sub_channel = 'Global';
        }

        if(message && subtext && sub_channel){
          console.log("Sending fireworks on channel:",sub_channel);
        

        const msg_md = sanitizeHtml(message);//do_md(message);
        let bottom_text = sanitizeHtml(subtext);//do_md(subtext);
       fwcio.sockets.emit("bulkmessage",[{message:msg_md,type:'fireworks',topText:msg_md,bottomText:bottom_text,channel:sanitizeHtml(sub_channel),timestamp:Date.now()}]);

       res.send( 'Created fireworks' );
      }else{
        res.send("Error missing things to show and abuse fireworks...");
        console.log("Didn't show fireworks:",sub_channel, message,subtext);
      }

});

app.post('/v1/admin/alert',(req,res) => {
    // get the message and push it out message
    if(req.body.message){
      //await showSystemAlert( color, icon, message, textColor );
    //const message = do_md(req.body.message);
    const color = req.body.color || 'blue';
    const icon = req.body.icon || 'warning';
    const message = req.body.message || 'no message';
    const textColor = req.body.textColor || 'black--text';
    //fwcio.sockets.emit("bulkmessage",[{message:msg_md,type:'fireworks',topText:msg_md,bottomText:bottom_text,channel:sanitizeHtml(req.body.channel),timestamp:Date.now()}]);
    res.send( 'Created alert' );
    }else{
      res.send( 'Should show an error :(' );
    } 
});

  // cname = data[user].page.watch;
// cname = data[user].page;
app.get('/api/channels/list',(req,res) => {
    
  //"livestreams",{streams:streamList}
  /*var currStream = streamList.filter(function(streamer){
    if(streamer.name == req.params.id){
       return true;
    }
 });*/
/*
username: user.username,
        avatar: user.avatar || null,
        color: user.color   || null,
        page: user.page     || null,
      .page = { watch: channel };
        */
 


  //let streamername = req.params.id;
  //console.log("trying to find streamer: ",req.params.id, ' in: ',currStream);
  let userlist = [];
  let tempnamelist = Array.from(userList);
  tempnamelist.forEach(user => {
    userlist.push({avatar:null,name:user,username:user,page:"NoAgenda",color:"#FFFFFF"});
  });
  res.json({streams:streamList,users:userlist});
  /*if(streamList.length == 1){
    
 } else {
    res.status(404);//Set status to 404 as movie was not found
    res.json({message: "Not Found"});
 }*/
  //res.send({success:true,streamers:streamList[0],live:true});
  
});

// cname = data[user].page;
app.get('/api/channels',(req,res) => {
    
  //"livestreams",{streams:streamList}
  /*var currStream = streamList.filter(function(streamer){
    if(streamer.name == req.params.id){
       return true;
    }
 });*/
/*
username: user.username,
        avatar: user.avatar || null,
        color: user.color   || null,
        page: user.page     || null,
      .page = { watch: channel };
        */
 /* From plb
       if viewlist['success'] == True:
                for channel in viewlist['data']:
                    if chatname == channel['channel']:
                        # save the view count 
                        viewer_count_for_channel = channel['viewCount']
                        obsviewcounts()
                        try:
                            for viewer in channel.viewers:
                                unique_users.add(viewer)


 */


  //let streamername = req.params.id;
  //console.log("trying to find streamer: ",req.params.id, ' in: ',currStream);
  let userlist = [];
  let tempnamelist = Array.from(userList);
  tempnamelist.forEach(user => {
    userlist.push({avatar:null,name:user});
  });
  res.json({streams:streamList,users:userlist});
  /*if(streamList.length == 1){
    
 } else {
    res.status(404);//Set status to 404 as movie was not found
    res.json({message: "Not Found"});
 }*/
  //res.send({success:true,streamers:streamList[0],live:true});
  
});


// This is where we build our user list
// This is the OFFICIAL SOURCE OF USERS endpoint for lists etc
// this is also the method that should be user for channel viewer counts updating
  app.get('/v1/chat/users',(req,res) => {

    // should return success,data
    // then should have data[key].data
    // data[key].watching
    
    //"livestreams",{streams:streamList}
    /*state[$states.userlist] = Object
      .keys( data )
      .map( key => {
        return {
          user: key,
          data: data[key].data,
          watching: data[key].watching,
        };
      })*/

      // This is mostly working, the watching probably needs some counts added to it or something or page info
      // but it does show the user list so it can be turned back on.
      /* so via doing it as an object it would be data = {
        'username':{
          data:{
            username:"name",
            page:"page",
            color:"color"
          },
          watching: ["channel",channel2]
        }
      }
      */

      



      let fatchatUserList = [];
      let lsockets = fwcio.sockets.sockets; // skip manually tracking, just look through the socket set

      // could also build a map/object to store channel counts in so it would be viewcounts:{'channel':num,}
      let tempViews = {};
      lsockets.forEach(usocket => {
        if(usocket.page){
          
        }else{
          usocket.page = 'Global';
        }

        let channelname = usocket.page;
          if(tempViews[channelname]){
              tempViews[channelname] +=1;
          }else{
              tempViews[channelname] = 1;
          }
          
      });

      chatBasedViewCounter = tempViews;

      let viewers = {};
      lsockets.forEach(usocket => {
        // loop through all of the sockets and build user objects to throw 
        let watching = [];
        let user_obj = {};
        if(usocket.page){
          user_obj.page = usocket.page;
        }else{
          user_obj.page = 'Global';
        }
        if(usocket.page){
          //user_obj.watching = [usocket.page];
          watching.push(usocket.page);
        }else{
          //user_obj.watching = ['Global'];
          watching.push("Global");
        }
        if(usocket.username){
          user_obj.username = usocket.username;
        }else{
          user_obj.username = "UnAuthenticatedUser"
          usocket.disconnect();
          // disconnect the unauthed user?
        }
        if(usocket.unum){
          user_obj.unum = usocket.unum;
          // then update the username to show the num 
          user_obj.username += '#' + user_obj.unum;
        }else{
          // gen a user number since it is missing one
          user_obj.unum = getRandomUserId();
          user_obj.username += '#' + user_obj.unum;
        }
        if(usocket.color){
          user_obj.color = usocket.color;
        }else{
          user_obj.color = "#FFFFFF";
        }

        //fatchatUserList.push({data:user_obj});
        viewers[usocket.username] = {data:user_obj,watching:watching};

      });

      // throw the viewer list into the global space so it can be filtered and used for the live list maybe?
      fatchatUserSet = viewers;
      
      let viewersList = [];
      // do a for loop over userList and build new users to add based on that and then emit that 
      /*let tempnamelist = Array.from(userList);
      tempnamelist.forEach(user => {
        //fatchatUserList.push({username:user,avatar:'',color:'',watching:'Playlistbot9k'});
        //fatchatUserList.push({username:user,watching:'Playlistbot9k',data:'something'});
        //fatchatUserList.push({ [user]: {username:user,watching:{username:user, page: 'NoAgenda' },data:{username:user,watching:{username:user, page: 'NoAgenda' },avatar:null,username:user,page:'NoAgenda',color:null}} });
        //viewersList.push({data:{username:user,watching:'Playlistbot9k',page:'Playlistbot9k'}});
        //fatchatUserList.push([{[user]:{channel:'Playlistbot9k',viewers:viewersList,viewCount:tempnamelist.length}}]);  
        // the other model similar to this is in plb
        // should be able to go through the user list and pull out the page, avatar, color if they exist
        //fatchatUserList.push({username:user,page:'Playlistbot9k',avatar:null,color:null}); //page.watch 
        // that should be the format that gets used
      });*/
      //fatchatUserList.push([{'Playlistbot9k':{username:"Test username",channel:'Playlistbot9k',viewers:viewersList,viewCount:tempnamelist.length}}]);
      //fatchatUserList.push([{'NoAgenda':{username:"Test username",channel:'NoAgenda',viewers:viewersList,viewCount:tempnamelist.length}}]);

      //console.log("V1 Chat User list:",viewers);
      console.log("V1 Chat User list sent");

      //fatchatUserList.push({channel:"Playlistbot9k",viewCount:viewersList.length,viewers:viewersList});
      //fatchatUserList.push({channel:"NoAgenda",viewCount:viewersList.length,viewers:viewersList});
      

    res.json({success:true,data:viewers});
    
  });

  app.get('/v1/messages',(req,res) => {
    console.log("Should feed the client hydration messages");
    //"livestreams",{streams:streamList}

    
    // if enabled store the last 100 messages
    // fwcio.sockets.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
    res.send({success:true,size:globalMessageHydrationCache.length,data:globalMessageHydrationCache});
    
  });

  app.get('/v1/messages/:id',(req,res) => {
    let streamName = req.params.id;
    console.log("Should build and filter messages to send back to the user. Channel:",streamName);
    //"livestreams",{streams:streamList}

    let filteredMessages = globalMessageHydrationCache.filter(function(message){
      if(message.channel.toLowerCase() == streamName.toLowerCase()){
         return true;
      }
   });//globalMessageHydrationCache.filter();
    // filters the global message cache for a specific channel and returns it with the count of filtered messages
    // fwcio.sockets.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
    res.send({success:true,size:filteredMessages.length,data:filteredMessages});
    
  });

  app.get('/api/bump',(req,res) => {
    
    //"livestreams",{streams:streamList}
    // fwcio.sockets.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
    res.send({success:true,data:[{message:"Test message on the server", username:"Test User",channel:'Test Server channel'}]});
    
  });

  app.get('/v1/chat/bans',(req,res) => {

  });

  app.get('/v1/chat/unban',(req,res) => {
    
  });

  app.post('/v1/admin/stream/kick',(req,res) => {
    // should find and update the streamer info 
    // this should also look through the streamer sockets and force a disconnect
    // so there should be some get params or url params that need to be extracted out of this
    // ?reset=name
    console.log("/v1/admin/stream/kick params:", req.params);
    console.log("query params:",req.query);
    // reset: 'true' 
  });

  app.post('/v1/admin/stream/',(req,res) => {
    // should find and update the streamer info 
    // should be able to modify and set nsfw status and offline status of a stream
    console.log("/v1/admin/stream/ params:", req.params);
    console.log("query params:",req.query);
  });

  // adds the fat chat compatible api
  app.post('/v1/whispers/send', async (req,res) => {
    let from_token = req.body.chatToken;
    let receiver = req.body.receiver;
    let message = req.body.message;

    let error_message = "";

    // check user token sent
    let from_user = '';//userinfo.username;
    let from_user_unum = '';//userinfo.num;
    let from_user_color = '';//userinfo.color;
    let parsed_user = false;

    receiver = receiver.replace( '@', '' );
      // strip out the @
    
    //console.log("what is my user token?:", from_token);
    // so fat chat is retarded and passes in a message of {success:true,message:'made you an account!',chatToken}
    if(from_token.chatToken){
      from_token = from_token.chatToken;
    }

    console.log("Should try and send a whisper to:",receiver);
    try{
      const { payload, protectedHeader } = await jose.jwtVerify(from_token, rsaPubKey, {
        issuer: template_config.TOKENISSUER,
        audience: template_config.TOKENAUDIENCE
      })
      //console.log("stuff in the payload that has been verified:",payload);
      const mysubinfo = payload.sub;
      //console.log("My sub info:",mysubinfo);
      let userinfo = mysubinfo;//JSON.parse(mysubinfo);
      
      from_user = userinfo.username;
      from_user_unum = userinfo.num;
      from_user_color = userinfo.color;
      parsed_user = true;
      console.log("Sending user validated:",from_user);
    }catch(error){
      error_message = "Could not parse the user token! \n";
      console.log("Sending user could not be validated:");
    }

    if(parsed_user && receiver && message){
      


      // see if we can find who we are sending to
      let lsockets = fwcio.sockets.sockets; // skip manually tracking, just look through the socket set
      let user_found = false;
      lsockets.forEach(usocket => {
        // need to look at adding the username#num to shit that gets emitted
          //const from_user = socket.username + "#" + socket.unum;
          const to_user = usocket.username + "#" + usocket.unum;
          if(receiver == to_user){
            // we can then send a message to the user at that socket
            console.log("Found user socket!");
            let processed_message = message;
            try{
              //proccessNewMessage(processed_message);
              processed_message = do_md(processed_message);

            }catch(ex){
              console.log("Error processing message:",ex);
              //socket.emit("error",[{message:"Error sending message",channel:"error",username:"servererror"}]);
              error_message += "Error processing message for user! \n"
              return;
            }
            // should be sent back as a regular message, but with processing done to the message contents
            // now to see how they were processed to add the orange text header...
            //console.log("REMOVE FOR PRODUCTION, processed message:", processed_message);
            let whisperColor = "#FF9800";
            try{
              usocket.emit("bulkmessage",[{message:'<span style=" color: rgb(218, 152, 0);">[to: ' + receiver + "]</span> " + processed_message,color:from_user_color,username:from_user,unum:from_user_unum,channel:"whisper"}]);
              //socket.emit("bulkmessage",[{message:"<span style='color: rgb(218, 152, 0);'>Sent to: "+ receiver + " </span>  " + processed_message,color:from_user_color,username:from_user,unum:from_user_unum,channel:"whisper"}]);
              user_found = true;
            }catch(ex){
              console.log("We had an error sending our whisper:",ex);
            }
          }
      });

      if(user_found){
        res.send({success:true,message:'Sent!'});  
      }else{
        error_message += "User not found! \n";
        res.send({success:false,message:error_message});
      }
      


      // find and send
    }else{
      // error
      res.send({success:false,message:"Some type of error when trying to send whisper to user."});
    }



  });

  app.get('/v1/chatconfig',(req,res) => {
    let legacyChatConfig = {
      'legacychat': process.env.LEGACYCHAT || '',
      'defaultavatar': process.env.TROLLICON || '/fed.svg',
      'antiscrape':process.env.ANTISCRAPE || '',
      'DEFAULT_S':process.env.DEFAULT_S || '',
      'HIT_S':process.env.HIT_S || '',
      'QUAD_S':process.env.QUAD_S || '',
      'TAUNT_S':process.env.TAUNT_S || '',
      'RAIL_S':process.env.RAIL_S || '',
      'RUNTY_S':process.env.RUNTY_S || '',
      'PROTECT_S':process.env.PROTECT_S || '',
      'MENU1_S':process.env.MENU1_S || '',
      'MENU2_S':process.env.MENU2_S || '',
      'MENU3_S':process.env.MENU3_S || '',
      'MENU4_S':process.env.MENU4_S || '',
    }

    res.send(legacyChatConfig);

    
  });

  // add fedration page to show federation info status
  // have a fed api to request federation from another server, sends a special token so the other server can send back to use via public key
  /* Federation
    Should have options of what to sync and how to connect
    There should be another public socket or unlisted user for federation, that allows them to sub (get messages/send messages)
    So the way that it should work allows the special federation socket to connect and then provides a way to push/pull messages
    Now as an admin you can do stuff via the chat api that enables and disables federation features
    Live stream list federation
  */
  app.get('/fed',(req,res) => {
    var authStatus = true;//req.isAuthenticated();
    res.render('federation',{session:authStatus,req:req,config:template_config});
  });

  function bulkFedMsg(data){

    data.forEach(msg => {
      // check the message type and ignore it if it's a federation message
      // if it has federation in the message that means that it already came from a federated source and shouldn't be passed along
      if(msg.federation){
        // message gets dropped
      }else{

        // do a user filter check for plb
        if(msg.username != "plb"){
          fwcio.sockets.emit("bulkmessage",[{federation:'fw.rnih.org',message:msg.message,username:sanitizeHtml(msg.username),channel:sanitizeHtml(msg.channel),color:sanitizeHtml(msg.color),timestamp:Date.now(),unum:msg.unum}]);
        }
      }
  });
    

    
  }

  // so basic federation should allow you to listen to another server via a federation socket, all the messages that come in on it will get rebroadcast via our main socket
  // with the exception of fed messages, they will get dropped 
  // ==========================================================================================================================================================
  // FED SOCKET STUFF
  // ==========================================================================================================================================================
  function setup_ferderation(){
    //federation_clients
    // federation sockets is where they should be stored
    let fw_client = 'https://fw.rnih.org';

    console.log("Should connect to the federation servers that we want to listen to");
    let fcs = io(fw_client,{transports: ['websocket'] } ); // fed client socket
    // hook the federation message processing based on message type
    // hook the info onto the socket so we know what connection this stuff is on and a name
    fcs.fedname = "Fedwave";
    fcs.fedurl = fw_client;
    fcs.on('bulkmessage',bulkFedMsg);

  }

  //setup_ferderation();

  // Moderation, no one likes it but for illegal things
  /* Should show a user list to be moderated
      There will be a special moderation endpoint/chat message that logs the moderation action in detail
      Type of moderation (ban,ip ban, temp ban), who moderated (which mod or admin), who was moderated (which user/ip), messages of ban status
      is it in a channel, global, federated, everywhere
      scope of ban/moderatation (global, channel, federated, everywhere)
      Detail level of ban, username, name + num, name + num + color

      messages, has the message, and time it was submitted, who submitted it

  */

// returns a troll id 4 characters long
function genTrollId(){
    var letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var color = '';
    for (var i = 0; i < 4; i++) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
  
  }
    
  
    // look at adding a rate limiter
    app.get('/trollid',async (req, res) => {
      // should rng a troll id and sign it as being valid
      // jwt that shit
      /*var authStatus = req.isAuthenticated();
      if(authStatus){
        res.send('Not able to get troll id while logged in!');
      }else{
        var rand = require('csprng');
        const randomState = rand(160, 36); // should be 20 bytes long 
        res.send(randomState);
      }*/
      //const randomState = rand(160,36);
  
      let userobj = {username:"Dickhead",color:"Red", num:9,secreth: "mytestsecrethash"};
  
      userobj.color = getRandomColor();
      userobj.num = getRandomUserId();
      const trollid = genTrollId(); // should be 4 characters long, nums, upper, lower
      userobj.username = "troll:" + trollid;
      const jwt = await new jose.SignJWT({ 'urn:example:claim': true })
        .setProtectedHeader({ alg: 'PS256' })
        .setIssuedAt()
        .setIssuer('urn:example:issuer')
        .setAudience('urn:example:audience')
        //.setExpirationTime('2h')
        .setSubject(userobj)
        .sign(rsaPriKey)
  
      //console.log(jwt)
  
      //const randomState = rand(160,36);
      res.send(jwt);
  
  
      //res.send(randomState);
    });

    // do as a post or a get request
    app.post('/mkuser',async (req, res) => {
        // make a jwt https://github.com/panva/jose
        // make all of the bits for inside it
        // name
        // should generate a color
        // generate an id
        // have a secret hash that only the user should know used for server side validate
        // save the user to the users.json
        // sign the jwt
        console.log("Creating new user token")
        //console.log("Body post data:",req.body);
        // https://github.com/panva/jose/blob/main/docs/classes/jwt_sign.SignJWT.md#readme
        // example shows ES256
    
        // generate our number
        // generate our color
        // generate a name if there isn't one provided from a few word sets
        // make sure that the data is hashed for the secreth via the bcrypt
        
        let userobj = {username:"Dickhead",color:"Red", num:9,secreth: "mytestsecrethash"};
        if(req.body.user){
          userobj.username = req.body.user;
        }
        if(req.body.myKey){
          let bhash = await bcrypt.hash(req.body.myKey,saltRounds);
          //let bhash = bcrypt.hashSync(req.body.myKey, saltRounds);
          userobj.secreth = bhash; // but we need to make sure that we strip the returns
        }
        userobj.color = getRandomColor();
        userobj.num = getRandomUserId();
        const jwt = await new jose.SignJWT({ 'urn:example:claim': true })
          .setProtectedHeader({ alg: 'PS256' })
          .setIssuedAt()
          .setIssuer('urn:example:issuer')
          .setAudience('urn:example:audience')
          //.setExpirationTime('2h')
          .setSubject(userobj)
          .sign(rsaPriKey)
    
        //console.log(jwt)
    
        //const randomState = rand(160,36);
        res.send(jwt);
      });

  app.get('/mktroll', async (req, res) => {
    // name
    // should generate a color
    // generate an id
    // have a secrete hash that only the user should know
    // save the user to the users.json

    let userobj = {username:"Dickhead",color:"Red", num:9};

    userobj.color = getRandomColor();
    userobj.num = getRandomUserId();
    const trollid = genTrollId(); // should be 4 characters long, nums, upper, lower
    userobj.username = "troll:" + trollid;
    const jwt = await new jose.SignJWT({ 'urn:example:claim': true })
      .setProtectedHeader({ alg: 'PS256' })
      .setIssuedAt()
      .setIssuer('urn:example:issuer')
      .setAudience('urn:example:audience')
      //.setExpirationTime('2h')
      .setSubject(userobj)
      .sign(rsaPriKey)

    //console.log(jwt)

    //const randomState = rand(160,36);
    res.send(jwt);
  });


  import { marked } from 'marked';
  import sanitizeHtml from 'sanitize-html';
import { match } from 'assert';

  const emotes_obj = { emotes:
    [
      {name:"test",url:template_config.TROLLICON},
      {name:"test2",url:template_config.TROLLICON},
    ]
    };

    function do_emotes(msg_in){
        var premiumEmotes = msg_in;
        // do the regex for emotes based on the emote db list
        for( const emote in emotes_obj.emotes){
          const alt = emotes_obj.emotes[emote].name;
          //console.log(alt);
          const eurl = emotes_obj.emotes[emote].url;
          //console.log(alt,eurl);
          const matcher = ":"+ alt + ":/gi";
          //const replacer = "<img src=\"" + eurl + "\" alt=\"" + alt + "\">";
          //const pattern = new RegExp(`:${alt}:`, 'gi' );
          const replacer = "<img src=\"" + eurl + "\" title=\":" + alt + ":\" alt=\":" + alt + ":\">";
          const pattern = new RegExp(`((<img([\w\W]+?)|\w|\s|"|'):${alt}:(('|"|\w|\s).+?>)|:${alt}:)`, 'gi' );
          //premiumEmotes = premiumEmotes.replace('/:'+ alt +':/gi','<img src="' + eurl + '" alt="'+alt+'">');
          //const pattern = new RegExp(`[^\"]:${alt}:[^\"]`, 'gi' );
          
          //console.log(pattern);
          //console.log(replacer);
          //el.message = el.message.replace(pattern, `<span class="highlight">$&</span>`);
          premiumEmotes = premiumEmotes.replace(pattern,replacer);
          //console.log(premiumEmotes);
        }
      
        for( const emote in emoteList.emotes){
          // label 
          // value
          // image object iterate through them
          const alt = emoteList.emotes[emote].name;
          const eurl = emoteList.emotes[emote].url;
          let style = "";
          if(emoteList.emotes[emote].flip){
            if(emoteList.emotes[emote].flip == "mirrorx"){
              style = 'style="-webkit-transform: scaleX(-1);transform: scaleX(-1);"';
            }
          }
          const matcher = ":"+ alt + ":/gi";
          //const replacer = "<img src=\"" + eurl + "\" alt=\"" + alt + "\">";
          //const pattern = new RegExp(`:${alt}:`, 'gi' );
          const replacer = "<img src=\"" + eurl + "\" title=\"" + alt + "\" alt=\"" + alt + "\" "+style+">";
          const pattern = new RegExp(`((<img([\w\W]+?)|\w|\s|"|'):${alt}:(('|"|\w|\s).+?>)|:${alt}:|;${alt};|:${alt};|;${alt}:)`, 'gi' );
          premiumEmotes = premiumEmotes.replace(pattern,replacer);
        }
    
        for( const emote in altemoteList.data){
          // label 
          // value
          // image object iterate through them
          const alt = altemoteList.data[emote].label;
          const eurl = altemoteList.data[emote].image;
          const matcher = ":"+ alt + ":/gi";
          //const replacer = "<img src=\"" + eurl + "\" alt=\"" + alt + "\">";
          //const pattern = new RegExp(`:${alt}:`, 'gi' );
          const replacer = "<img src=\"" + eurl + "\" title=\":" + alt + ":\" alt=\":" + alt + ":\">";
          const pattern = new RegExp(`((<img([\w\W]+?)|\w|\s|"|'):${alt}:(('|"|\w|\s).+?>)|:${alt}:|;${alt};|:${alt};|;${alt}:)`, 'gi' );
          premiumEmotes = premiumEmotes.replace(pattern,replacer);
        }
    
        
      
        return premiumEmotes;
      }

      function getAltEmotes(){
        
        try{
          let data = fs.readFileSync('altemotes.json');
          //console.log(data.toString());
          altemoteList = JSON.parse(data);
        }catch(error){
          console.log('Error loading alt emotes json file.');
          altemoteList = [];
        }
      }
      
      getAltEmotes();
    
      function getEmotes(){
        
        try{
          let data = fs.readFileSync('emotes.json');
          //console.log(data.toString());
          emoteList = JSON.parse(data);
        }catch(error){
          console.log("Error loading emotes json file.");
          emoteList = [];
          emoteList.emotes = [];
        }
      }
      
      getEmotes();

      const renderer = new marked.Renderer();

  renderer.link = function(href, title, text) {
    const link = marked.Renderer.prototype.link.call(this, href, title, text);
    return link.replace('<a','<a target="_blank" ');
  };

  renderer.blockquote = function(quote) {
    return `<blockquote>${quote.replace('<p>', '<p>>')}</blockquote>`;
  };



  function do_md(msg_in) {
    msg_in = msg_in.trim();
    var msg_out = sanitizeHtml(marked(msg_in,{renderer:renderer,smartLists:true,tables:false}));

    //const matchershrug = new RegExp(`:shrug:`, 'gi' );//":"+ alt + ":/gi";
    const replacershrug = '\xAF\\_(\u30C4)_/\xAF';//"¯\_(ツ)_/¯"; // Â¯_(ãƒ„)_/Â¯ is what comes out the other end
    msg_out = msg_out.replaceAll(":shrug:",replacershrug);

    msg_out = do_emotes(msg_out);

    // validate matches https://regexkit.com/javascript-regex

    // hacky shit time SIR
    // would be nice to have it not do this sometimes... like in a url
    msg_out = msg_out.replace(/SIR/gi, (match, key) => {
      //emoteCount++;
      return template_config.SIR; 
    });

    // happyblob.gif
    msg_out = msg_out.replace(/:\)/gi, (match, key) => {
      //emoteCount++;
      return template_config.HAPPYBLOB;
    });

    // sadblob
    msg_out = msg_out.replace(/:\(/gi, (match, key) => {
      //emoteCount++;
      return template_config.SADBLOB;
    });

    msg_out = msg_out.replace(/^<p>(&lt;\s?.*)<\/p>/, '<p><span style="color:#E0727F">$1</span></p>');

    msg_out = msg_out.replace(/(?:\[)(["',?!\w\d\s]+)(?:])/g, `<span style="font-size: 1.25rem;">$1</span>`);
    msg_out = msg_out.replace(/(?:\^)(["',?!\w\d\s]+)(?:\^)/g, `<span style="font-size: .75rem;">$1</span>`);

    // rainbow text support
    msg_out = rainbowText(msg_out);
    msg_out = glowText(msg_out);
    msg_out = glowGreenText(msg_out);

    // should look at rainbow text like how it is done in matrix
    // (((ECHO))) emote
    msg_out = msg_out.replace(/\(\(\(/, (match, key) => {
      return template_config.ECHOESL;
    });
    
    msg_out = msg_out.replace(/\)\)\)/, (match, key) => {
      return template_config.ECHOES;
    });

    msg_out = msg_out.replace(/\n/g,"<br>");
    msg_out = msg_out.replace(/\\n/g,"<br>");
    return msg_out;
  }

  globalMessageHydrationCache = [{message:do_md("Nothing to see here since this is the default message because there is nothing stored..."),username:"SERVER",channel:"SYSTEM"}];

  const bulkmessages = [];

  function rainbowText(message){
      return message.replace(/\=\=(.*?)\=\=/g,`<p class="rainbow-text"> $& </p>`)
      .replace(/\=\=/g,'')
      // instead of returning we could get the match, then do a sub string replace in it to clean up the double =='s after the fact
  }
                  
  function glowText(message){
      return message.replace(/\++(.*?)\++/g,`<p class="glow"> $& </p>`)
      .replace(/\+\+/g,'')
      // instead of returning we could get the match, then do a sub string replace in it to clean up the double =='s after the fact
  }
  
  function glowGreenText(message){
      return message.replace(/\+\=(.*?)\=\+/g,`<p class="glowgreen"> $& </p>`)
      .replace(/\+\=/g,'').replace(/\=\+/g,'')
      // instead of returning we could get the match, then do a sub string replace in it to clean up the double =='s after the fact
  }
  
  function proccessNewMessage(msg) {
    //console.log("message:",msg);
    
    // could do classic whisper processing and return after sending the whisper
    // process for whisper
    
      // do some of the basic checks for a whisper message header, or not, this is the danger of having whispers go over the message wire
    // will probably go for the custom whisper message socket messaging
    
    const msg_md = do_md(msg.message);
    //bulkmessages.push();

    let chat_badge = false;
    if(msg.showBadge){
      if(msg.showBadge === true){
        chat_badge = "";
      }
    }

    let msg_global = false;
    if(msg.global){
      if(msg.global === true){
        msg_global = true;
      }
    }

    let msg_obj = {message:msg_md,username:sanitizeHtml(msg.username),channel:sanitizeHtml(msg.channel),color:sanitizeHtml(msg.color),timestamp:Date.now(),unum:msg.unum,global:msg_global};

    // configured in the .env so it can be turned on, is off by default
    if(hydrationEnabled){
      globalMessageHydrationCache.push(msg_obj);

      if(globalMessageHydrationCache.length > maxHydrationSize){
        globalMessageHydrationCache.splice(0,globalMessageHydrationCache.length - maxHydrationSize); // should truncate the thinger down
      }
    }
    // now for testing this will spit out stuff and still needs a safety pass of filtering output
    // to whitelisted tag types 
    fwcio.sockets.emit("bulkmessage",[msg_obj]);
  }

  // maybe not do this and leave it for when the list is requested to do it
  function addUserToFatChatList(user_obj){
    // rebuild it based on the connected sockets?
    //fatchatUserSet.add(user_obj);
    // or go through all of the connected sockets and use them to build the list...

  }

  function addUserToList(temp_username){
    userList.add(sanitizeHtml(temp_username));
    // make this into a more complicated 
    // then fire an event to push the updated user list?
    fwcio.sockets.emit("update usernames",{users:Array.from(userList)});
  }
  
  function setsAreEqual(a, b) {
    if (a.size !== b.size) {
      return false;
    }
  
    return Array.from(a).every(element => {
      return b.has(element);
    });
  }
  
  function removeUserFromList(user_socket_id){
    // might be easier to scan all of the sockets and build a set of users from it again
    let userListTemp = new Set();
  
    // update the temp list 
    fwcio.sockets.sockets.forEach(user_s => {
      if(user_socket_id != user_s.id){
        userListTemp.add(sanitizeHtml(user_s.username + "#" + user_s.unum));
      }
    });
  
  
    // check if the sets are the same, if so do nothing
    if(setsAreEqual(userList,userListTemp)){
  
    }else{
      // if diff send the new updated users list, set the userList = userListTemp as well
      userList = userListTemp;
      fwcio.sockets.emit("update usernames",{users:Array.from(userList)});
    }
  
    
  
    // make a set from a list 
    /*if(userList.has(temp_username)){
      console.log("Found user to remove...");
      userList.delete(temp_username);
      fwcio.sockets.emit("update usernames",{users:Array.from(userList)});
    }*/
  }

  fwcio.sockets.on("error", e => console.log(e));
fwcio.sockets.on("connection", socket => {
  socket.channels = {};
  sockets[socket.id] = socket;
  //let currentUser = socket.id;
  //RTCMultiConnectionServer.addSocket(socket);
  

  socket.on("message",(data)=> {
    // process the message that came in...
    data.username = socket.username;
    data.color = socket.color;
    data.unum = socket.unum;

    if(socket.unum == undefined || socket.username == undefined || socket.color == undefined){
      // should force a disconnect of the client aka get them to reconnect
      let error_message = "You have been disconnected, you need to be authenticated before you can send a message.";
      error_message = do_md(error_message)
      socket.emit("bulkmessage",[{message:error_message,color:'#DDDDDD',username:'SYSTEM',unum:0,channel:"SYSTEM"}]);
      socket.disconnect();
    }

    // hook up special admin stuff to add user permissions and streamers
    if(socket.admin){
      // check if this should be a special admin command
      // check for ! so we can do server side commands
      // ban
      if(data.message.substr(0,4) == '!ban'){
        if(data.message.substr(0,5) == '!ban '){
          //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
          let chunks = data.message.split(" ");
          if(chunks.length > 1){
            let uchunks = chunks[1].split("#");
            function isNumeric(val) {
                return /^-?\d+$/.test(val);
            }
            if(uchunks.length > 1){
              let user_to_find = uchunks[0];
              console.log("Should find user:",user_to_find);
              let user_num = parseInt(uchunks[1]);
              console.log('And the matching num:', user_num);
                // add them to the ban list, which is checked on connection and other events to clean up sockets
                // it would be nice to add a ban message for the system to reference and send the user before they are disconnected
            }

          }
          let msg_md = do_md('Should ban user: ');
          socket.emit("bulkmessage",[{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum}]);
          return;
        }
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        const msg_md = do_md('You need to specify a username to ban. IE: `!ban username`');
        socket.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        //return;
      }
      
      // unban
      if(data.message.substr(0,7) == '!unban '){
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        const msg_md = do_md('Should unban user: ');
        socket.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        //return;
      }
      // ipban
      if(data.message.substr(0,7) == '!ipban '){
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        const msg_md = do_md('Should ipban user: ');
        socket.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        //return;
      }

      if(data.message.substr(0,7) == '!emotes'){
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        const msg_md = do_md('Should reload emotes');
        getEmotes();
        socket.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        //return;
      }

      if(data.message.substr(0,7) == '!status'){
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        let systemInfo = "System usage: " + os.uptime() + " Freemem " + os.freemem() + " of " + os.totalmem();
        const msg_md = do_md(systemInfo);
        console.log("Status:",systemInfo);
        //getEmotes();
        socket.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        //return;
      }

      if(data.message.substr(0,3) == '!fw'){
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        let systemInfo = "Should fire fireworks in channel: ";
        const msg_md = do_md(systemInfo);
        console.log("Status:",systemInfo);
        //getEmotes();
        socket.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        //return;
      }

      if(data.message.substr(0,5) == '!wipe'){
        globalMessageHydrationCache = []; // clears the cache
      }

      if(data.message.substr(0,5) == '!kick'){
        // should kick the stream of the channel it is in or take a param of the name to kick
        // https://github.com/muaz-khan/RTCMultiConnection/issues/907 
        console.log("Should kick stream on channel:", data.channel);
        console.log("Should also look for the stream socket to kick as well.");
          cleanStreamerList(data.channel);
            //streamList.push(streaminfo);
            console.log("Matched our streamer!");
            console.log("Now:",streamList.length,' streamers:',streamList);
            //fwcio.sockets.emit("livestreams",{streams:Array.from(streamListSet)}); // let everyone know there is a new live stream

        let streamer_sockets = io_signal_server.sockets;
        // then loop through all of them and look at the userid for the streamer to disconnect
        // maybe do a full disconnect ?
        streamer_sockets.forEach(vsocket => {
            if(vsocket.userid == data.channel){
              vsocket.disconnect();
            }
        });
            
          
        fwcio.sockets.emit("bulkmessage",{message:do_md("Kicked stream for: " + data.channel),username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});

        fwcio.sockets.emit("livestreams",{streams:streamList});

        return;
      }

      if(data.message.substr(0,5) == '!nsfw'){
        // should mark the stream nsfw for the channel it was in
        console.log("Should toggle the user stream's nsfw state:",data.channel);

        return;
      }


      // iprangeban
      // mkstreamer username
      if(data.message.substr(0,12) == '!mkstreamer '){
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        let chunks = data.message.split(" ");
        let msg_md = do_md('You probably need to fix the mkstreamer command.'); //do_md('Should make user: ', chunks[1] , ' a streamer!');
        if(chunks.length > 1){
          msg_md = do_md('Should make user: ' + chunks[1] + ' a streamer!');
          // check that we have a number and hash to add them as a streamer
          // should find the user and add their info to the streamers
          let uchunks = chunks[1].split("#");
          function isNumeric(val) {
              return /^-?\d+$/.test(val);
          }
          if(uchunks.length > 1){
            let user_to_find = uchunks[0];
            console.log("Should find user:",user_to_find);
            let user_num = parseInt(uchunks[1]);
            console.log('And the matching num:', user_num);
            // if the user already exists is should repalce it? or add art to it via avatar
            if(isNumeric(uchunks[1])){
              msg_md = do_md('Should make user: ' + user_to_find + ' a streamer!');
              // use the same logic used for whispers
              let lsockets = fwcio.sockets.sockets; // skip manually tracking, just look through the socket set
              let user_found = false;
              lsockets.forEach(usocket => {
                // need to look at adding the username#num to shit that gets emitted
                if(usocket.username == user_to_find && usocket.unum == user_num ){
                  msg_md = do_md('Found user: ' + user_to_find + ' to make a streamer!');
                  try{
                    let data = fs.readFileSync('approved_streamers.json');
                    
                    approved_streamers = JSON.parse(data);
                  }catch(error){
                    console.log("Error loading approved streamers json file.");
                    msg_md = do_md('Failed to load the streamers object...');
                    approved_streamers = {approvedstreamers:[]};// creates a default clean object to use
                  }
                    let user_color = usocket.color;
                    let streamer_found = false;
                    // loop through our streamers and add this one if not found
                    for( const livestreamer in approved_streamers.approvedstreamers){
                      //console.log(approved_streamers.approvedstreamers[livestreamer]);
                      if(usocket.username == approved_streamers.approvedstreamers[livestreamer].username && usocket.unum == approved_streamers.approvedstreamers[livestreamer].num && usocket.color == approved_streamers.approvedstreamers[livestreamer].color){
                        streamer_found = true;
                      }
                    }

                    if(!streamer_found){
                      console.log("Since the user wasn't found we can add them to the list");
                      approved_streamers.approvedstreamers.push({username:user_to_find,num:user_num,color:user_color});
                      // should save out the json for it
                      try {
                        fs.writeFileSync('approved_streamers.json', JSON.stringify(approved_streamers,null,4))
                      } catch (err) {
                        console.error(err)
                      }
                    }else{
                      msg_md = do_md('Found user: ' + user_to_find + ' nothing to do, they are already a streamer!');
                    }
                    
                  
                  
                }
                
              })
            }else{
              msg_md = do_md('Failed to find user: ' + user_to_find + ' ');
            }
            // check that we have a number and hash to add them as a streamer
          }
        }else{
          msg_md = do_md('You are missing the user info to make them a streamer');
        }
        fwcio.sockets.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        return;
      }
      // revoke username (removes them from the permissions files, streamers, admin,mods,jannys,etc)
      // permissions
      if(data.message.substr(0,6) == '!check'){
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        const msg_md = do_md('Holy shit your the admin!');
        fwcio.sockets.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        return;
      }

    } // end of special socket admin command checks

    try{
    proccessNewMessage(data);

    }catch(ex){
      console.log("Error processing message:",ex);
      socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
    }


  });
  socket.on('get live kit room token', async (data) => {
    // this should pull out the user jwt stuff and then return a stream room access token, there should also be another version of this for watching
    
    if(data.jwt){
      try{
        const { payload, protectedHeader } = await jose.jwtVerify(data.jwt, rsaPubKey, {
          issuer: template_config.TOKENISSUER,
          audience: template_config.TOKENAUDIENCE
        })
        //console.log("stuff in the payload that has been verified:",payload);
        const mysubinfo = payload.sub;
        //console.log("My sub info:",mysubinfo);
        let userinfo = mysubinfo;//JSON.parse(mysubinfo);
        console.log("Authed:",userinfo);
        //socket.username = userinfo.username;
        //socket.unum = userinfo.num;
        // should check if it's a troll and copy in the color info or just tag everything with some color
        //socket.color = userinfo.color;

        //if(data.page){
          //socket.page = sanitizeHtml(data.page); // page should be escaped and cleaned so it is only alphanums with no spaces in them
          // this also needs to be escaped if it gets used elsewhere (like if it is updated on a message send event)
        //}

        // if this room doesn't exist, it'll be automatically created when the first
        // client joins
        const roomName = userinfo.username;
        // identifier to be used for participant.
        // it's available as LocalParticipant.identity with livekit-client SDK
        const participantName = userinfo.username;

        // this is the live kit stuff that needs to be done yet...
        /*
        const at = new AccessToken('api-key', 'secret-key', {
          identity: participantName,
        });
        at.addGrant({ roomJoin: true, room: roomName });

        const token = at.toJwt();
        console.log('access token', token);
        */

        // part 2 of connection is to see if they have any special permissions, admin, moderator, janitor, etc
        // admin can make/add a new mod/janitor, give out stream access
        // mod can ban people via global ip, name, etc
        // janitor can only mute/ban people in a specific channel
        // now in the config file there should be a mod(moderator star),admin(special background color maybe overlay?),janny (wrench)
        // need to be able to create config files if they do not exist aka read and dump the object data back out
        try{
          let data = fs.readFileSync('admin.json');
          admins = JSON.parse(data);
          
        }catch(error){
          console.log("Error loading admin json file.");
        }

        // checks if the user should be granted special permissions
        for( const admini in admins.admin){
          //console.log(approved_streamers.approvedstreamers[livestreamer]);
          if(userinfo.username == admins.admin[admini].username && userinfo.num == admins.admin[admini].num && userinfo.color == admins.admin[admini].color){
            //socket.admin = true;
            console.log("Found user to allow in room");
            socket.emit('room access token',{token:token}); // should send the streamer the token
          }
        }


      }catch(ex){
        console.log("Error processing Live kit stream request")
        console.log(ex);
        //const unum = getRandomUserId();
        //socket.username = "troll:dickhead";
        //socket.unum = unum;
        // should send a message that they have a corrupt token, maybe disconnect them?
      }
    }
  });

  socket.on("new user",async (data)=> {
    // need to get the user info and validate them
    // type
    // token
    // page
    // session validation via captcha (if we turn on recap)
    // have a validation message that we can send back to the user
    // if they haven't been captcha'd server side
    // should put the user name in their socket
    //console.log("user connected...",data);
    // should validate the user auth and set the username on socket
    //console.log(req.session.cookie.chatToken); // see if we can get the chat token session data to use instead
    //console.log('session info:', socket.request.session.passport.user);
    // https://github.com/panva/jose/blob/main/docs/functions/jwt_verify.jwtVerify.md#readme
    // add user and sockets to the groups to checkout
    if(data.jwt){
      try{
        const { payload, protectedHeader } = await jose.jwtVerify(data.jwt, rsaPubKey, {
          issuer: template_config.TOKENISSUER,
          audience: template_config.TOKENAUDIENCE
        })
        //console.log("stuff in the payload that has been verified:",payload);
        const mysubinfo = payload.sub;
        //console.log("My sub info:",mysubinfo);
        let userinfo = mysubinfo;//JSON.parse(mysubinfo);
        console.log("Authed:",userinfo);
        socket.username = userinfo.username;
        socket.unum = userinfo.num;
        // should check if it's a troll and copy in the color info or just tag everything with some color
        socket.color = userinfo.color;

        if(data.page){
          socket.page = sanitizeHtml(data.page); // page should be escaped and cleaned so it is only alphanums with no spaces in them
          // this also needs to be escaped if it gets used elsewhere (like if it is updated on a message send event)
        }

        // part 2 of connection is to see if they have any special permissions, admin, moderator, janitor, etc
        // admin can make/add a new mod/janitor, give out stream access
        // mod can ban people via global ip, name, etc
        // janitor can only mute/ban people in a specific channel
        // now in the config file there should be a mod(moderator star),admin(special background color maybe overlay?),janny (wrench)
        // need to be able to create config files if they do not exist aka read and dump the object data back out
        try{
          let data = fs.readFileSync('admin.json');
          admins = JSON.parse(data);
          
        }catch(error){
          console.log("Error loading admin json file.");
        }

        // checks if the user should be granted special permissions
        for( const admini in admins.admin){
          //console.log(approved_streamers.approvedstreamers[livestreamer]);
          if(socket.username == admins.admin[admini].username && socket.unum == admins.admin[admini].num && socket.color == admins.admin[admini].color){
            socket.admin = true;
          }
        }


      }catch(ex){
        console.log(ex);
        const unum = getRandomUserId();
        socket.username = "troll:dickhead";
        socket.unum = unum;
        // should send a message that they have a corrupt token, maybe disconnect them?
      }
    }else{
      // if it exists
      //socket.username = data.user;
      const unum = getRandomUserId();
      socket.unum = unum;
      socket.username = "troll:UITT"; // un identified troll token
      // maybe set that the user has been authenticated on the socket 
    }
    // should add a object with {user,num,socket id}
    //if(socket.username != "troll:UITT" && socket.username != "troll:dickhead"){
      // add it to our socket list for sending whispers to users
      users.push(socket);
      let temp_username = socket.username + "#" + socket.unum;
      addUserToList(temp_username);
      let user_obj = {};

      addUserToFatChatList(user_obj);
    //}
    //socket.emit('hyrate',[{message:do_md('This is test hydration for chat'),username:sanitizeHtml('SERVER'),channel:sanitizeHtml('test data.channel'),color:sanitizeHtml(socket.color),unum:socket.unum}]);
  });



  socket.on("whisper",(data) => {
    // get the whisper info from parsing 
    // try to find the sockets that are active for that user and then
    // send it to them
    // should use the socket user num to find them and send to them as well with the user name
    if(socket.unum == undefined || socket.username == undefined || socket.color == undefined){
      // should force a disconnect of the client aka get them to reconnect
      // send the error message to the user that they have not been authenticated
      let error_message = "You have been disconnected, you need to be authenticated before you can send a message.";
      error_message = do_md(error_message)
      socket.emit("bulkmessage",[{message:error_message,color:'#DDDDDD',username:'SYSTEM',unum:0,channel:"SYSTEM"}]); // should make system errors a standard message style
      socket.disconnect();
    }
    //console.log("Whisper:",data);
    console.log("Whisper to:", data.to);
    //console.log("message:", data.message);
    // loop through all of the user connections and look for the authenticated user that matches the socket and send them the message and try to match up the number as well
    let lsockets = fwcio.sockets.sockets; // skip manually tracking, just look through the socket set
    let user_found = false;
    lsockets.forEach(usocket => {
      // need to look at adding the username#num to shit that gets emitted
      const from_user = socket.username + "#" + socket.unum;
      const to_user = usocket.username + "#" + usocket.unum;
      if(data.to == to_user){
        // we can then send a message to the user at that socket
        console.log("Found user socket!");
        let processed_message = data.message;
        try{
          //proccessNewMessage(processed_message);
          processed_message = do_md(processed_message);

        }catch(ex){
          console.log("Error processing message:",ex);
          socket.emit("error",[{message:"Error sending message",channel:"error",username:"servererror"}]);
          return;
        }
        // should be sent back as a regular message, but with processing done to the message contents
        // now to see how they were processed to add the orange text header...
        //console.log("REMOVE FOR PRODUCTION, processed message:", processed_message);
        let whisperColor = "#FF9800";
        try{
          usocket.emit("bulkmessage",[{message:'<span style=" color: rgb(218, 152, 0);">[to: ' + data.to + "]</span> " + processed_message,color:socket.color,username:socket.username,unum:socket.unum,channel:"whisper"}]);
          socket.emit("bulkmessage",[{message:"<span style='color: rgb(218, 152, 0);'>Sent to: "+ data.to + " </span>  " + processed_message,color:socket.color,username:socket.username,unum:socket.unum,channel:"whisper"}]);
          user_found = true;
        }catch(ex){
          console.log("We had an error sending our whisper:",ex);
        }
      }
    })
    

      if(user_found){

      }else{
        let failure_message = ":(<`User not found` Not sent: " + data.message;
        failure_message = do_md(failure_message);
        socket.emit("bulkmessage",[{message:failure_message,color:socket.color,username:socket.username,unum:socket.unum,channel:"whisper"}]);
      }

  });

  function cleanStreamerList(streamer){
    for(let streami = 0;streami < streamList.length;streami++){
      if(streamList[streami].user == streamer){
        console.log("Now:",streamList.length,' streamers:',streamList, ' splicing:',streami);
        streamList.splice(streami,1);
        console.log("Now:",streamList.length,' streamers:',streamList);
      }
    }
  }



  // streamer related stuff: "live", "update", "offline", "error"
  // this is the intial socket tracker used for viewer stats
  socket.on('user.streamer.connect',(data)=>{
      // { streamer: this.streamer.toLowerCase() } 
      // this would be the other way to count users
      if(data.streamer){
        console.log("Got someone connecting to watch streamer:", data.streamer);
        // this should be used for doing viewer counts and used for debugging, might need another socket to keep this clean or it should ride on the chat socket.
      }
  });



  socket.on("announcestream",(data) => {
    // need to set a global stream descripter as a test
    console.log("Stream announce:",socket.username);
    //console.log("Stream sdp:", data);
    // check for a password or userid for this? so only I can do it?
    // store the stream info in the user's socket?
    // maybe also check color for validity socket.color

    // make this into a file that can be checked for announce
    // get the data.desc

    try{
        let data = fs.readFileSync('approved_streamers.json');
        //console.log(data.toString());
        approved_streamers = JSON.parse(data);
        //console.log("approved streamers json obj:",approved_streamers.approvedstreamers);
      }catch(error){
        console.log("Error loading approved streamers json file.");
      }

    // then we should do a for loop and look for our streamer that matches
    //for( const emote in emoteList.emotes){
    for( const livestreamer in approved_streamers.approvedstreamers){
        //console.log(approved_streamers.approvedstreamers[livestreamer]);
        //{"title":"Stream Title","name":"User Display Name","avatar":"https://site.com/uploads/v2/avatar/displayimage.png","poster":"https://site.com/static/img/streamposter.png","thumbnail":"https://site.com/preview/user.jpg","to":"/user","live":true,"nsfw":false,"url":"https://site.com/hls/userrtmp/index.m3u8","owner":"ownerapikeyfirebase","banned":false}
        if(socket.username == approved_streamers.approvedstreamers[livestreamer].username && socket.unum == approved_streamers.approvedstreamers[livestreamer].num && socket.color == approved_streamers.approvedstreamers[livestreamer].color){
            let streaminfo = {channel:socket.username,name:socket.username,user:socket.username,desc:"A near real time live stream!",thumbnail:approved_streamers.approvedstreamers[livestreamer].avatar,avatar:approved_streamers.approvedstreamers[livestreamer].avatar,viewCountRTC:0,viewers:0,viewCount:0,live:true};
            if(data.desc){
              streaminfo.desc = sanitizeHtml(data.desc);
              streaminfo.title = sanitizeHtml(data.desc);
            }

            

            if(streaminfo.avatar){
              streaminfo.cover = streaminfo.avatar;
            }

            


            if(data.src){
              streaminfo.url = data.src;
              streaminfo.src = data.src;
              streaminfo.type = "application/x-mpegURL";

              // should check and update the thumbnail if it exists... thumbnail, hash the user name for a file name to use
              // check the global cache of thumbnails to include by value... maybe write these to ram? /tmp/user.jpeg
              // check if the file exists...
              // should throw this into the list of things to thumbnail, when this gets removed the thumbnailer request should go away as well
              // should set the thumbnail url, we then need a way to spit back a valid thumbnail blob

              // add a thumbnailer check, to see if it is enabled or not, if not use the avatar

              let thumbstr = socket.username + "#" + socket.unum + socket.color;
              let thumbfn = sha1sum(thumbstr) + '.jpeg';
              thumbnailerinfo.push( {user:thumbstr,online:true,url:data.src,thumbfilename:thumbfn})

              streaminfo.thumbnail = `/v1/thumbnail/${thumbfn}`;
              if(process.env.THUMBNAILSERVER){
                streaminfo.thumbnail = `${process.env.THUMBNAILSERVER}/v1/thumbnail/${thumbfn}`;
              }
            }

            if(data.viewCountRTC){
              streaminfo.viewCountRTC = data.viewCountRTC;
            }
      

            if(data.viewers){
              streaminfo.viewers = data.viewers;
              streaminfo.viewCount = data.viewers;
              streaminfo.to = socket.username;
              streaminfo.owner = socket.username;
            }

            Object.filter = (obj, predicate) => 
            Object.keys(obj)
                  .filter( key => predicate(obj[key]) )
                  .reduce( (res, key) => (res[key] = obj[key], res), {} );

            let filtered_viewers = Object.filter(fatchatUserSet, viewer => viewer.watching.includes(socket.username));
            if(filtered_viewers){

              streaminfo.viewers = filtered_viewers;
            }

            // should enable live view counts based on people in chat
            if(chatBasedViewCounter[socket.username]){
              streaminfo.viewCount = chatBasedViewCounter[socket.username];
            }

            if(data.nsfw){
              streaminfo.nsfw = data.nsfw;
            }else{
              streaminfo.nsfw = false;
            }

            if(data.live){
              streaminfo.live = data.live;
            }

            if(data.banned){
              // should check if it's true and not add the stream or remove it from the list

            }

            if(data.federation){
              // should check if it's allowed to federate with the server info to connect back to for streaming
              streaminfo.federation = data.federation; // should be the domain
            }

            //streamListSet.add(streaminfo);
            cleanStreamerList(socket.username);
            streamList.push(streaminfo);
            console.log("Matched our streamer!");
            console.log("Now:",streamList.length,' streamers:',streamList);
            //fwcio.sockets.emit("livestreams",{streams:Array.from(streamListSet)}); // let everyone know there is a new live stream
            fwcio.sockets.emit('live', {live:true,streamer:socket.username,server:'federationmaybe'}); // emit that stream is live
          }
    }

    fwcio.sockets.emit("livestreams",{streams:streamList});

    // so the process should check for instances of the username and num in the list and remove them if in the list/object (maybe use a key)
    // then add the user instance to the live stream list for viewing after it has started

    

    // generic processing pipline should be opening the auth streamers list, which is setup to match color, number, name

    // build the streamer info

    // remove dupes

    // add to the streamlist

    // emit updated list to everyone
    
    
  });

// for the client
socket.on("getlivestreams",(data) => {
    // returns a list of the current live streams
    // publishes a livestreams message
    //fwcio.sockets.emit("update usernames",{users:Array.from(userList)});
    // the live streams should have a user name, description, live status, user picture from token
    // need to make sure that all of the streamlistset is stripped of HTML
    // yeah add user, desc, live, avatar
    //let streaminfo = {user:"pugna",desc:"PugnaListBot test sample stream",avatar:"none cause avatars are gay"};
    //streamListSet.add(streaminfo);
    //socket.emit("livestreams",{streams:Array.from(streamListSet)});
    socket.emit("livestreams",{streams:streamList});
  });

  socket.on("checkforstream",(data) => {
    // need to set a global stream descripter as a test
    // check if we have a global stream to watch or not
    // search the sockets for an active stream
    if(test_stream_sdp != ''){
      // send a reply back with the stream info
      // should send the connection info
      //console.log("We found a stream:",test_stream_sdp);
      socket.emit("stream",{stream:test_stream_sdp});
      // 

      // find the streamer and send them a copy of the data.sdp

    }

    
  });

  // this is the connect back for chat, I don't know that we need it for the stream
  socket.on("watcheroffer",(data) => {
    console.log("User wants to connect, here is their session descriptor: user", socket.username);
    //console.log("user sdp:",data.sdp);

    // this should happen but doesn't seem to...
    fwcio.sockets.emit("watcherconnect",{sdp:data.sdp,user:socket.username});// this is what the streamer should connect back to
  })

  function check_if_is_streamer(username,usernum,color){

    try{
      let data = fs.readFileSync('approved_streamers.json');
      //console.log(data.toString());
      approved_streamers = JSON.parse(data);
      //console.log("approved streamers json obj:",approved_streamers.approvedstreamers);
    }catch(error){
      console.log("Error loading approved streamers json file.");
    }

  // then we should do a for loop and look for our streamer that matches
  //for( const emote in emoteList.emotes){
  for( const livestreamer in approved_streamers.approvedstreamers){
      //console.log(approved_streamers.approvedstreamers[livestreamer]);
      //{"title":"Stream Title","name":"User Display Name","avatar":"https://site.com/uploads/v2/avatar/displayimage.png","poster":"https://site.com/static/img/streamposter.png","thumbnail":"https://site.com/preview/user.jpg","to":"/user","live":true,"nsfw":false,"url":"https://site.com/hls/userrtmp/index.m3u8","owner":"ownerapikeyfirebase","banned":false}
      if(username == approved_streamers.approvedstreamers[livestreamer].username && usernum == approved_streamers.approvedstreamers[livestreamer].num && color == approved_streamers.approvedstreamers[livestreamer].color){
        return true; // user is a streamer
      }
    }

    return false; // user is not a streamer


  }

  function set_streamer_offline(username){
    for(let streami = 0;streami < streamList.length;streami++){
      if(streamList[streami].user == username){
        //console.log("Now:",streamList.length,' streamers:',streamList, ' splicing:',streami);
        //streamList.splice(streami,1);
        //console.log("Now:",streamList.length,' streamers:',streamList);
        streamList[streami].live = false;
      }
    }
  }


  function checkIfShouldCleanUpLiveStreams(username,usernum,color){
    // when the user disconnects they should have their named check to be cleand up
    // should do a check if the user is a streamer first
    if(check_if_is_streamer(username,usernum,color)){
      let found_streamer = false;
      
      //let streamer_sockets = io_signal_server.sockets;
        // then loop through all of them and look at the userid for the streamer to disconnect
        // maybe do a full disconnect ?
        //streamer_sockets.forEach(vsocket => {
      
      let streams_to_check = io_signal_server.sockets;
      //console.log("Should check sockets for disconnect, if we have them...",streams_to_check);
      if(streams_to_check){
        for(let uid = 0;uid < streams_to_check.length;uid++){//(stream_user => {
          if(streams_to_check[uid].username === username){
            found_streamer = true;
          }
        }
      }
      //let channel_to_cleanup = socket.userid;
      //console.log("Should disconnect and remove stream:",socket.userid);
      if(found_streamer){
        // nothing to do since they are still online and connected
      }else{
        //cleanStreamerList(username);
        set_streamer_offline(username);
        fwcio.sockets.emit('offline', {live:false,streamer:username,server:'federationmaybe'});
        fwcio.sockets.emit("livestreams",{streams:streamList});
      }
    }
    
  }


  socket.on("disconnect", () => {
    // should clean up the socket of the user that was connected to the server
    // should only clean up the user that is associated with the socket that closed
    
    console.log("Clean up socket:", socket.id);
    console.log("user diconnected...",socket.username + "#" + socket.unum);
    if(socket.username && socket.unum && socket.color){
      checkIfShouldCleanUpLiveStreams(socket.username,socket.unum,socket.color);
    }
    //if(socket.username == 'DeadPugner'){
     /// test_stream_sdp = '';//data.sdp;
      //socket.sdp = data.sdp;
    //}
    // should clean up the user list 
    for (var channel in socket.channels) {
        part(channel);
    }
    //removeUserBySocketId(socket.id);
    //removeUserFromList(socket.username + "#" + socket.unum); // should be based on the socket id instead 
    removeUserFromList(socket.id); // should be based on the socket id instead 
    // console.log("Users:",users);
    // console.log("Will delete:",socket);
    // should loop through and do the delete of the socket...
    // seems like it isn't doing this tho
    //delete users[socket];
    //scalableBroadcastCleanupDisconnect();

    delete sockets[socket.id];
  });

  // there is a bunch of stuff to hook up to make https://github.com/muaz-khan/RTCMultiConnection-Server/blob/master/node_scripts/Scalable-Broadcast.js
  // work

  // yeah so I need to hook up all of the special stuff for the socket to handle all of the special
  // signaling shit
  
});

// https://github.com/bitwave-tv/bitwave-media-server/blob/dev/api-server/src/webserver/api/index.ts
// https://github.com/bitwave-tv/bitwave-media-server/blob/dev/api-server/src/webserver/server.ts#L96
// https://github.com/bitwave-tv/bitwave-media-server/blob/dev/api-server/src/classes/Relay.ts#L53
function executeJobs() {
  // Iterate over the array of jobs and execute each job
  thumbnailerinfo.forEach((job) => {
    try {
      // Execute the job
      // job(); // this is a neat idea using () => {console.log("Job")}; in the array aka using lambda functions to be jobs to exec
      let ffj = Ffmpeg();//.FfmpegCommand();
      // screenshotFFmpeg.renice( 5 )
      const thumbfn = job.thumbfilename;
      const inputStream  = job.url;
      ffj.input(inputStream);

      ffj.inputOptions([
        '-hide_banner',
        '-err_detect ignore_err',
        '-ignore_unknown',
        '-stats',
        '-fflags nobuffer+genpts+igndts',
      ]);

      ffj.output( `/tmp/${thumbfn}` );
      ffj.outputOptions([
          '-frames:v 1', // frames
          '-q:v 25', // image quality
          '-an', // no audio
          '-y', // overwrite file
        ]
      );

        ffj.on( 'start', commandLine => {
          console.log(`Doing thumbnail for ${job.user}...`);
        })

        .on( 'end', () => {
          console.log(`Finished doing thumbnail ${job.user}...`);
        })
        .on( 'error', ( error, stdout, stderr ) => {
          console.log( error );
          console.log( stdout );
          console.log( stderr );

          if ( error.message.includes('SIGKILL') ) {
            console.log( `${job.user}: Stream thumbnail stopped!` );
          } else {
            console.log(   `${job.user}: Stream thumbnail error!` ) ;
          }
        })

        .on( 'progress', progress => {
          // progress
        });

      ffj.run();
      // could set a flag that it's still running and use something live the event detection to set when it has finished running and updates it
      // https://github.com/bitwave-tv/bitwave-media-server/blob/dev/api-server/src/classes/Relay.ts#L76
      // user:thumbstr,online:true,url:data.src,thumbfilename:thumbfn
      // run the ffmpeg command, should probably test that it works...
    } catch (error) {
      console.error(`Error executing job: ${error.message}`);
    }
  });
}

// Set up the interval to execute jobs at the specified time interval
const intervalId = setInterval(executeJobs, thumbnaildelay);

// CORS https://socket.io/docs/v3/handling-cors/
// https://socket.io/docs/v4/faq/
// hmm 
/*
  https://stackoverflow.com/questions/43620041/how-to-create-multiple-nodejs-socket-io-server-client
  https://www.metered.ca/tools/openrelay/
  https://webrtc.org/getting-started/turn-server
  https://www.audiocodes.com/solutions-products/products/session-border-controllers-sbcs/webrtc-gateway
  https://www.geeksforgeeks.org/web-api-webrtc-getusermedia-method/

  This should more than likely work as expected as long as the nginx ports are setup and forwarded correctly

*/

//const RTCMultiConnectionServer = require('rtcmulticonnection-server');

io_signal_server.on('connection', function(socket) {
    // so extend it and add the features to auth for stream creation
    RTCMultiConnectionServer.addSocket(socket);
    //console.log(RTCMultiConnectionServer);
    //console.log("Sockets after new listener connected:",io_signal_server.sockets);
    // userid is what we want to look at
});

// offline or disconnect of the main streamer/room socket
/*io_signal_server.on('disconnect', function(socket){
    let channel_to_cleanup = socket.userid;
    console.log("Should disconnect and remove stream:",socket.userid);
    cleanStreamerList(channel_to_cleanup);
    fwcio.sockets.emit("livestreams",{streams:streamList});
});*/



let signalServerPort = process.env.SIGPORT || 9002;//9002; // this is the internal local port
signalingServer.listen(signalServerPort), () => console.log('Signaling Server for WebRTC is running on port: ', signalServerPort)

// would be nice to add cores to the server start
/*{cors: {
  origin: "*"
}*/ 
server.listen(port, () => console.log(`Server is running on port ${port}`));



// Jdanks.Army Body
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // limit each IP to 100 requests per windowMs
});

app.use(cors());
app.use(limiter);

app.get("/streams", async (req, res) => {
  let data = Array.from(idToData.values());
  if (req.query.filter && typeof req.query.filter === "object") {
    let filteredData = data;
    Object.entries(req.query.filter).forEach((arg) => {
      var index = arg[0];
      var filter = arg[1];
      filteredData = filteredData.filter((d) => {
        if (filter === "true") filter = true;
        if (filter === "false") filter = false;
        if (filter && typeof filter === "string" && filter.indexOf(",") > -1) {
          filters = filter.split(",");
          for (f in filters) {
            if (filters.hasOwnProperty(f)) {
              if (d[index] === filters[f]) return true;
            }
          }
          return false;
        } else {
          return d[index] === filter;
        }
      });
    });
    res.send(filteredData);
  } else {
    res.send(data);
  }
  console.info(`[${req.ip}] Requested /streams`);
});

app.get("/teams", (req, res) => {
  let data = Array.from(idToData.values());
  let teams = [];
  data.forEach((d) => {
    if (d.team && teams.indexOf(d.team) === -1) teams.push(d.team);
  });
  res.send(teams);
});

app.get("/platforms", (req, res) => {
  res.send([...scrapers]?.map((s) => s[0]) ?? {});
});

const updatePeriod = 5 * 60 * 1000; // 5 minutes

/**
 * @return Boolean
 * @returns Return true on successful scrape
 */
async function scrape({ platform, userId, customUsername, ...rest }) {
  let data;

  const scraper =
    (scrapers.has(platform) && scrapers.get(platform)) ||
    (async () => {
      throw new Error(`Platform ${platform} not supported!`);
    });

  const id = crypto
    .createHash("sha256")
    .update(platform + userId + customUsername)
    .digest("hex");

  if (platform === "kick") {
    // wait 2 sec before fetching
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  try {
    data = await scraper(userId, customUsername);
  } catch (e) {
    console.error(
      `Couldn't scrape ${userId} ${customUsername ?? ""}: `,
      e.message
    );
    // Add a placeholder user (in case the first API request for this user fails)
    if (!idToData.get(id)) {
      idToData.set(id, {
        id,
        userId,
        platform,
        name: customUsername ?? userId,
        customUsername,
        featuredRank: rest.featuredRank ?? null,
        team: rest.team ?? null,
      });
    }
    return false;
  }

  // Append `id' and `userId' fields before adding to the map
  data = { id, userId, ...data };
  if (rest.featuredRank) data.featuredRank = rest.featuredRank;
  if (rest.team) data.team = rest.team;

  idToData.set(id, data);

  return true;
}

const timestamp = () => new Date().toTimeString().split(" ")[0];
const loadPeople = async (people) => {
  console.info("Populating scrape data...");

  // multithread all initial scrapes, wait for them all to finish
  await Promise.all(
    people.map(async (person, i) => {
      setTimeout(() => {
        setInterval(async () => {
          await scrape(person);
          console.info(`[${timestamp()}] Rescraped ${person.userId}`);
        }, updatePeriod);
      }, (updatePeriod / people.length) * i);
      // Split `updatePeriod` into equal periods, and then scrape every `updatePeriod`,
      // so that the scrapes are evenly distributed over the `updatePeriod`.

      (await scrape(person)) && console.info(`Scraped ${person.userId}!`);
    })
  );

  console.info("Finished scraping everyone!");
};

//const people = require("./people.json");
//import * as people from './people.json'
import people from './people.json' assert { type: 'json' };
await loadPeople(people);
