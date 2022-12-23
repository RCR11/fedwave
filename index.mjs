//const process = require('process');
import express from 'express';
//const express = require("express");
//const exphbs = require("express-handlebars");
import bodyParser from 'body-parser';
//import exphbs from 'express-handlebars';
import {create} from 'express-handlebars';
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

*/

import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

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

import http from 'http';
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

import * as jose from 'jose'

const saltRounds = process.env.SALTROUNDS || 10; // this should be configured from the .env

let rsaPriKey = "";
let rsaPubKey = "";

let sockets = {};
let users = [];
let userList = new Set(); // this should be a map or a set to not have dupes in it (ideally)

let streamList = [];

let listOfBroadcasts = {};

let approved_streamers = [];

let admins = [];

let jannys = [];

let banned = [];
let bannedip = [];

let emoteList = [];
let altemoteList = [];

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

  app.get('/v1/emotes',(req,res) => {
    let temp_emotes = emoteList;
    // copy all of the bw emotes into the list as well
    for( const emote in altemoteList.data){
      let bw_emote = {name:altemoteList.data[emote].label,url:altemoteList.data[emote].image};
      temp_emotes.emotes.push(bw_emote);
    }
    res.send(temp_emotes);
    
  });

  app.get('/v1/channels/live',(req,res) => {
    
    //"livestreams",{streams:streamList}
    res.send({streamers:streamList});
    
  });

  app.get('/v1/chat/channels',(req,res) => {
    
    //"livestreams",{streams:streamList}
    res.send({streams:streamList});
    
  });

  app.get('/v1/chat/users',(req,res) => {
    
    //"livestreams",{streams:streamList}
    res.send({streams:streamList});
    
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
    
    // now for testing this will spit out stuff and still needs a safety pass of filtering output
    // to whitelisted tag types 
    fwcio.sockets.emit("bulkmessage",[{message:msg_md,username:sanitizeHtml(msg.username),channel:sanitizeHtml(msg.channel),color:sanitizeHtml(msg.color),unum:msg.unum}]);
  }

  function addUserToList(temp_username){
    userList.add(sanitizeHtml(temp_username));
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
          fwcio.sockets.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
          return;
        }
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        const msg_md = do_md('You need to specify a username to ban. IE: `!ban username`');
        fwcio.sockets.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        return;
      }
      
      // unban
      if(data.message.substr(0,7) == '!unban '){
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        const msg_md = do_md('Should unban user: ');
        fwcio.sockets.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
        return;
      }
      // ipban
      if(data.message.substr(0,7) == '!ipban '){
        //socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
        const msg_md = do_md('Should ipban user: ');
        fwcfwcio.sockets.emit("bulkmessage",{message:msg_md,username:sanitizeHtml('SERVER'),channel:sanitizeHtml(data.channel),color:sanitizeHtml(socket.color),unum:socket.unum});
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

    }

    try{
    proccessNewMessage(data);

    }catch(ex){
      console.log("Error processing message:",ex);
      socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
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
    //}
  });



  socket.on("whisper",(data) => {
    // get the whisper info from parsing 
    // try to find the sockets that are active for that user and then
    // send it to them
    // should use the socket user num to find them and send to them as well with the user name
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
          socket.emit("error",{message:"Error sending message",channel:"error",username:"servererror"});
          return;
        }
        // should be sent back as a regular message, but with processing done to the message contents
        // now to see how they were processed to add the orange text header...
        //console.log("REMOVE FOR PRODUCTION, processed message:", processed_message);
        let whisperColor = "#FF9800";
        try{
          usocket.emit("bulkmessage",{message:'<span style=" color: rgb(218, 152, 0);">[to: ' + data.to + "]</span> " + processed_message,color:socket.color,username:socket.username,unum:socket.unum,channel:"whisper"});
          socket.emit("bulkmessage",{message:"<span style='color: rgb(218, 152, 0);'>Sent to: "+ data.to + " </span>  " + processed_message,color:socket.color,username:socket.username,unum:socket.unum,channel:"whisper"});
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
        socket.emit("bulkmessage",{message:failure_message,color:socket.color,username:socket.username,unum:socket.unum,channel:"whisper"});
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
        if(socket.username == approved_streamers.approvedstreamers[livestreamer].username && socket.unum == approved_streamers.approvedstreamers[livestreamer].num && socket.color == approved_streamers.approvedstreamers[livestreamer].color){
            let streaminfo = {name:socket.username,user:socket.username,desc:"A near real time live stream!",avatar:approved_streamers.approvedstreamers[livestreamer].avatar,viewers:0,viewCount:0,live:true};
            if(data.desc){
              streaminfo.desc = sanitizeHtml(data.desc);
              streaminfo.title = sanitizeHtml(data.desc);
            }
      
            if(data.viewers){
              streaminfo.viewers = data.viewers;
              streaminfo.viewCount = data.viewers;
            }
            //streamListSet.add(streaminfo);
            cleanStreamerList(socket.username);
            streamList.push(streaminfo);
            console.log("Matched our streamer!");
            console.log("Now:",streamList.length,' streamers:',streamList);
            //fwcio.sockets.emit("livestreams",{streams:Array.from(streamListSet)}); // let everyone know there is a new live stream
            
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


  socket.on("disconnect", () => {
    // should clean up the socket of the user that was connected to the server
    // should only clean up the user that is associated with the socket that closed
    
    console.log("Clean up socket:", socket.id);
    console.log("user diconnected...",socket.username + "#" + socket.unum);
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
import RTCMultiConnectionServer from 'rtcmulticonnection-server'
//const RTCMultiConnectionServer = require('rtcmulticonnection-server');

io_signal_server.on('connection', function(socket) {
    // so extend it and add the features to auth for stream creation
    RTCMultiConnectionServer.addSocket(socket);
});


let signalServerPort = process.env.SIGPORT || 9002;//9002; // this is the internal local port
signalingServer.listen(signalServerPort), () => console.log('Signaling Server for WebRTC is running on port: ', signalServerPort)

// would be nice to add cores to the server start
/*{cors: {
  origin: "*"
}*/ 
server.listen(port, () => console.log(`Server is running on port ${port}`));