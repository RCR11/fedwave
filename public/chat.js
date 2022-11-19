// this is the basic refrence processing needed for a chat system that is goodish
// most of the processing is done serverside [DONE]
// the way that this should work is you make an instance of chat and it binds and installs the 
// chat stuff into the element that you point it at
// adding a display message area [DONE]
// message input area [DONE]
// a ui send button [DONE]

// https://github.com/bitwave-tv/bitwave/blob/dev/layouts/default.vue
//  const Fireworks = async () => await import( '@/components/effects/fireworks' );
// if ( val ) this.$refs['fireworks'].start( this.fireworks.message, this.fireworks.subtext );


//const jose = require('jose');
//https://github.com/auth0/jwt-decode

let scrollChat = true;
let forceScrollToBottom = false;
let do_scroll_based_on_height = true;

let sendbuffer = [];
const sendbuffer_size_limit = 20;
let send_buffer_index = 0

let profilePref="user";

let channel = "default";

let chatFeatureNotify = true;

let users = [];

let username_global = "nobody";

let useTTS = false;

let textOnlyMode = false;

let read_names = true;

var vlist = null;

var vSelected = '';

let hideUserNumbers = true;

let ignore_users = [];

let ignore = false;

let ignore_channel = false;

let ignore_channels = [];

let renderMessages = []; // allows for rendering of new and old messages

let aliases = [];

let load_count = 0;

//let usertoken = "";

let chatConfig = {};

function getChatConfig(){
    
}

function useSelectedVoice(){
    //vSelected = selected option text
    vSelected = $( "#voiceselect option:selected" ).text();
    // call the save tts settings
    save_tts_settings();
}

function load_tts_settings(){
    try{
       var tts_settings_string =  window.localStorage.getItem('tts_settings');
       
    
        // try to restore the object from the string
       var tts_settings_obj  = JSON.parse(tts_settings_string);
       
       //ignore_set = new Set(ignore_list);
       vSelected = tts_settings_obj.voice;
       // should set the selection 
       $( "#voiceselect option:selected" ).text(vSelected)
    
    }catch(err){
        console.log("error loading tts settings");
    }

    try{
        if(window.localStorage.tts){
            useTTS = window.localStorage.getItem("tts");
        }
    }catch(ex){

    }
    
}

function save_tts_settings(){
    try{
        //var ignore_list = Array.from(ignore_set);
        var tts_settings = {
            'voice':vSelected
        };
        var myJSON = JSON.stringify(tts_settings);
        window.localStorage.setItem('tts_settings'  , myJSON  );
    }catch(err){
        console.log("error saving tts settings");
    
    }
}

function load_ignores(){
    //ignore_set = stuff in storage
    try{
        if(window.localStorage.ignore_set){
            let ignore_string =  window.localStorage.getItem('ignore_set');
            
            
                // try to restore the object from the string
                ignore_users  = JSON.parse(ignore_string);
            
            
            ignore_set = new Set(ignore_users);
        }
       
        if(window.localStorage.ignore_ch_set){
            var ignore_ch_string =  window.localStorage.getItem('ignore_ch_set');
            var ignore_ch_list  = JSON.parse(ignore_ch_string);
            ignore_ch_set = new Set(ignore_ch_list);
        }
    
    }catch(err){
        console.log("error loading ingore set");
    }

}

function save_ignores(){
    
    try{
        //ignore_list = Array.from(ignore_set);
        var myJSON = JSON.stringify(ignore_users);
        window.localStorage.setItem('ignore_set'  , myJSON  );
        
        /*
        var ignore_ch_list = Array.from(ignore_ch_set);
        var myJSON = JSON.stringify(ignore_ch_list);
        window.localStorage.setItem('ignore_ch_set'  , myJSON  );
        */
        
    }catch(err){
        console.log("error saving ingore set");
    
    }
}   

function voices () {
    var voiceSelect = document.querySelector('select');
    //return voicesListTTS.map( (voice, index) => { return { text: voice.name, value: index } } );
    console.log("loading voice list... info for speech crap...");
    $('#voiceselect').empty();
    speechSynthesis.getVoices().forEach(function(voice) {
        console.log(voice.name, voice.default ? voice.default :'');
        // build the options select list
        $('#voiceselect').append('<option value="' + voice.name + '">' + voice.name + '</option>');
    });
    load_tts_settings();
    console.log('somthing...');
}

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = voices;
}

let ttsTimeout = 0;

function getTtsTimeout(){
    // should try and get the timeout time
    return ttsTimeout;
}

function readTTSmessage(message){
    const voice = new SpeechSynthesisUtterance();
        const pitch = 1;
        //voice.voice = 0;//this.voicesListTTS[this.selectionTTS];
        //const selectedOption = $( "#voiceselect option:selected" ).text();
        // need to set the voice
        const selectedOption = vSelected;
        voices = speechSynthesis.getVoices();
        for(var i = 0; i < voices.length ; i++) {
            if(voices[i].name === selectedOption) {
            voice.voice = voices[i];
            }
        }
        
        voice.rate  = 10.0/10.0;//this.rateTTS / 10.0;
        voice.pitch = pitch;
        
        
        // Remove html tags
        message = message.replace(/<\/?[^>]*>/g, '');
        
        // Remove Links
        message = message.replace(/((https?:\/\/)|(www\.))[^\s]+/gi, '');
        // need to remove the ' character or sub it
        message = message.replace(/&#39;/g, '');
        
        
        voice.text  = message;
        // probably need to setup getTtsTimeout, and keep track of the timeout function call event setup to do the clearing automatically
        voice.onend = function(e) {
          //console.log(`Finished in ${e.elapsedTime} seconds.`, e);
          // this should be used for debugging stuck engines
          if ( ttsTimeout ){
               clearTimeout( ttsTimeout );
            }
        };
        speechSynthesis.speak(voice);
        if ( ttsTimeout > 0 ) {
            ttsTimeout = setTimeout( () => speechSynthesis.cancel(), ttsTimeout * 1000 );
        }
}

/* From here on down there is a bunch of whisper specific things that run the old litechat
============================================================================================
*/

let whisperSocketServer = null; // this is how we can whipser since someone can't fix their own version of whispers
whisperSocketServer = io('wss://bw.rnih.org:8088',{transports: ['websocket'] } ); //socket

let emotes_obj = null;

let emotes_obj_bw = null;





function toggleTTSsayName(){
    read_names = !read_names;

}

function clean_old_messages(){

}

// allows chat message user names to be rendered w/o numbers
if(window.localStorage.hideUserNumbers){
    hideUserNumbers = window.localStorage.getItem("hideUserNumbers");
}




function rr(data){
    if(data.to.toLowerCase() == username_global.toLowerCase()){
        //console.log('whisper receipt', data);
        // unpack the receipt and mark the message based on the random id that we orginally sent
        const msg_id = data.msg_id;
        
        // search theses
        var position = -1;
        if(sent_whispers){
            if(sent_whispers.length > 0){
                const tmesg = search(msg_id,sent_whispers);
                // and then remove it from the sent list and add it to the message window
                //console.log('message id found:',tmesg.msg_id);
                position = sent_whispers.indexOf(tmesg);
                //console.log('index in list:', position);
                var msg_to_add_locally = sent_whispers.pop(position);
                //console.log('we found and removed:',msg_to_add_locally);
                msg_to_add_locally.channel = "Whisper";
                msg_to_add_locally.username = msg_to_add_locally.from;
                msg_to_add_locally.message = '<p>Whisper sent to: ' + msg_to_add_locally.to + "</p>";
                addMessage(msg_to_add_locally);
            }
        }
        //console.log("we need to mark this message as recieved by the user");
        // the idea being that we will keep our outbound messages and then mark them as recv by adding them locally aka delivered
    }

}

function messagein(data){
    
    if(data.to.toLowerCase() == username_global.toLowerCase()){
        //console.log('whisper came in from someone', data);
        console.log('from user:',data.from);
        console.log('to user:',data.to);
        //console.log('message:',data.message);
        console.log("can you keep a secret?")
        
        const msg_id = data.msg_id;
        const msg_to = data.from;
        const msg_from = data.to;
        
        const msg_to_add_locally = {
            message: "<p>" + data.message + "</p>",
            username: msg_to,
            channel: 'Whisper'
        
        }
        //ats
        //dms.push(msg_to_add_locally);
        //updateWhisperCount();
        //featureBingBingWahoo(data);
        bindSounds();
        playSound();
        addMessage(msg_to_add_locally);
        
        // send a receipt back to the server to be sent back to the sender
        const message_rct = {
            to: msg_to,
            from: msg_from,
            msg_id: msg_id
        
        }
        
        // add the message to the messages as a whisper
        whisperSocketServer.emit('receipt', message_rct) ;
    }
    
    
}



function said(data){
    // ZPE6F-KFWQ6-8WYT2
    
    // global_mod: true
    //if(data.to.toLowerCase() == username.toLowerCase()){
        console.log('someone said something in litechat:', data);
        console.log('from user:',data.user);
        //console.log('to user:',data.to);
        console.log('message:',data.message);
        if(data.user_count > -1){
            console.log('Users:', data.user_count);
            $('#lc_count').text("LC:" + data.user_count);
        }
        
        
        
        const msg_id = data.msg_id;
        const msg_to = data.user;
        const msg_from = data.to;
        
        featureBingBingWahoo(data,username_global);
        
        const datanew = data;
        
        //let message_string = data.message.toString();
        //console.log("Message after copy:", message_string);
        let msg_to_add_locally = {};
        
            //msg_to_add_locally.message_text = datanew.message + ' https://www';
            msg_to_add_locally.message = datanew.message.replace(/\\n/g, "<br>");;
            msg_to_add_locally.username = msg_to;
            msg_to_add_locally.channel = datanew.channel;
            msg_to_add_locally.avatar = '/fed.svg';
        
            if(window.localStorage.useMsgCache){
                let useLocalCache = window.localStorage.getItem("useMsgCache");
                if(useLocalCache == "true"){
                    renderMessages.push(msg_to_add_locally);
                }
            }
            saveMessages();
        //ats
        //dms.push(msg_to_add_locally);
        //updateWhisperCount();
        //console.log('message in said before add:',msg_to_add_locally);
        if(useTTS){
            if($("#filterchatbychannel").prop( "checked" )){
                if(el.channel){
                
                    //const myChat      = el.channel.toLowerCase() === channel.toLowerCase();
                    //if(myChat){
                    const tempchannel = $( "#channelselect option:selected" ).text();
                    const myChat      = el.channel.toLowerCase() === tempchannel.toLowerCase();
                    if(myChat){
                        var message_to_read = datanew.message;
                        if(read_names){
                            message_to_read =  msg_to + " says " + message_to_read;
                        }
                        readTTSmessage(message_to_read);
                    }
                }
            }else{
                var message_to_read = datanew.message;
                if(read_names){
                    message_to_read =  msg_to + " says " + message_to_read;
                }
                readTTSmessage(message_to_read);
            }
        }
        addMessage(msg_to_add_locally);
        clean_old_messages();
   
}
whisperSocketServer.on( 'messagein', async data => await this.messagein(data) );
whisperSocketServer.on( 'receipt_r', async data => await this.rr(data) );
whisperSocketServer.on( 'said', async data => await this.said(data) );

function checkForNewPremiumEmotes(){
    // does a call to the server to check the json data structure
    console.log('getting emotes');
    var temp_obj = null;
    const emotesurl="/v1/emotes";
    try{
    $.get(emotesurl, function(data, status){

        const emoteinfo_str = JSON.stringify(data, null, 4);
        //console.log(emoteinfo_str);
        const emotes_info_obj =  JSON.parse(emoteinfo_str);
        console.log('after the parser runs');
        emotes_obj = emotes_info_obj;
        
    });
    }catch(err){
    
    }
    
    
    
    //checkChatConnections();
    
}
checkForNewPremiumEmotes();

/* This ends the specific parts for message processing and display in og litechat 
---------------------------------------------------------------------------------
*/

function load_profile_pref(){
    try {
        if(window.localStorage.profilePref){
            profilePref = window.localStorage.getItem('profilePref');
            //const temptoken = JSON.parse(usertoken);
            //console.log("My token loade:",temptoken);
            console.log("loading:",profilePref);
            //const usernametemp = parseToken(usertoken).sub.username;
            //$("#userid").val(usernametemp);
            return profilePref;
        }

    }catch(ex){
        return profilePref = "troll";
    }
    return profilePref = "user";
}


function load_sent(){

    
    try{
        var ignore_string =  window.localStorage.getItem('sendbuffer');
        

        // try to restore the object from the string
        sendbuffer  = JSON.parse(ignore_string);
    }catch(err){
        sendbuffer = [];
    }
}

function save_sent(){
    
    try{
        var ignore_list = Array.from(sendbuffer);
        var myJSON = JSON.stringify(ignore_list);
        window.localStorage.setItem('sendbuffer'  , myJSON  );
    }catch(err){
    
    }
}

function reset_sent(){
    sendbuffer = [];
    var myJSON = JSON.stringify(sendbuffer);
    window.localStorage.setItem('sendbuffer'  , myJSON  );
}

load_sent();



function parseToken (token) {
    try{
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }catch(ex){
        console.log("failed to parse the token")
        return {user:{name:'failed'}}
    }
    return JSON.parse(jsonPayload);
};

function load_chatToken(){
    try {
        if(window.localStorage.chatToken){
            usertoken = window.localStorage.getItem('chatToken');
            //const temptoken = JSON.parse(usertoken);
            //console.log("My token loade:",temptoken);

            const usernametemp = parseToken(usertoken).sub.username;
            username_global = usernametemp;
            $("#userid").val(usernametemp);
            return;
        }else{
            if(window.localStorage.trollToken){
                load_trollToken();
            }else{
                load_trollToken();
            }
        }

    }catch(ex){

    }
}

function load_trollToken(){
    try {
        if(window.localStorage.trollToken){
            usertoken = window.localStorage.getItem('trollToken');
            //const temptoken = JSON.parse(usertoken);
            //console.log("My token loade:",temptoken);

            const usernametemp = parseToken(usertoken).sub.username;
            username_global = usernametemp;
            $("#userid").val(usernametemp);
            return;
        }else{
            mktroll();
            /*
            usertoken = window.localStorage.getItem('trollToken');
            //const temptoken = JSON.parse(usertoken);
            //console.log("My token loade:",temptoken);

            const usernametemp = parseToken(usertoken).sub.username;
            username_global = usernametemp;
            $("#userid").val(usernametemp);*/
            return;
        }

    }catch(ex){
        
    }
}

function append_sent(last_message){
    last_message = last_message.trim()
    if(last_message.length < 4){
        return;
    }
    try{
    
        sendbuffer.unshift(last_message); // needs to be push front 
    
    
    
    // clean up the value with pop
    if( sendbuffer.length > sendbuffer_size_limit + 20){
        while(sendbuffer.length > sendbuffer_size_limit){
            sendbuffer.pop()
        }
    }
    }catch(err){
    
    }
    
    sendbuffer = removeDups(sendbuffer);
    send_buffer_index = 0;
    save_sent();
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  function removeDups(names) {
    let unique = {};
    try{
      names.forEach(function(i) {
          if(!unique[i]) {
          unique[i] = true;
          }
      });
    }catch(err){
    
    }
    return Object.keys(unique);
  }


function togglepause(){
    scrollChat = !scrollChat;
    //console.log("new scroll state:", scrollChat)
}
function pauseScroll(){
    if(scrollChat){
        togglepause();
    }

}

function resumeScroll(){
    if(!scrollChat){
        togglepause();
        scrollToBottom();
    }
}

function scrollToBottom(){
    if(forceScrollToBottom){
        scrollChat = true;
    }


    if(scrollChat){
        //textarea.scrollTop = textarea.scrollHeight;
        var messagecontainerlocal = document.getElementById('messageListContainer');
        // do the measurement and see if we are currently off of the bottom of chat
        if(do_scroll_based_on_height){
        
            messagecontainerlocal.scrollTop = messagecontainerlocal.scrollHeight;
            //document.querySelector("#messageListContainer > div:last-child").scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
        
    }

}

setInterval(function(){ scrollToBottom();},1000);

function cleanImages(message){
    // want to check all image tags to verify they source from https://cdn.bitwave.tv/
    let getImgUrl = /src\W*=[^\'"]*([\'"])([^\1]*?)\1/
    let prematch = /<img([\w\W]+?)>/;
    let regex = /(http[s]?:\/\/.*\.(?:png|jpg|gif|svg|jpeg))/i;
    // (http)?s?:?(\/\/[^"']*\.(?:png|jpg|jpeg|gif|png|svg))
    let result ;
    if(message.match(prematch)){
        let matchesImg = prematch.exec(message);
        matchesImg.forEach( img => {
            console.log("checking image", img);
            if (img.match(regex)){
                console.log("says there is a url that needs cleaned");
                let matches = regex.exec(img);
                console.log(matches);
                // this seems to work better and should be used to check each instance to see if its in the cdn 
                matches.forEach( url => {
                    console.log("checking url:", url);
                    if(url.includes("https://cdn.bitwave.tv/")){
                        console.log("url is clean...");
                    }else{
                        // do a url replace to something else safer
                        console.log("need to clean the url",url);
                        const safe = "/fed.svg";
                        message = message.replace(url,safe);
                    }
                });
                
            }
        });
    }
    /*if (message.match(getImgUrl)){
        console.log("says there is a url that needs cleaned src");
        // need to get the info and check the url that it is in the cdn
        let matches = getImgUrl.exec(message);
        console.log(matches);
    }*/
    return message;
}

function processPremiumEmotes(messageText){
    var premiumEmotes = messageText;
    
    // do a loop over the emotes and do a search for all of the subs
    const use_server_side = true;
    if(use_server_side){
        
        const emo_count = 0;
        //const emo_max = 0;
        try{
            // do a special sub for :shrug: as ¯\_(ツ)_/¯
            const matchershrug = new RegExp(`:shrug:`, 'gi' );//":"+ alt + ":/gi";
            const replacershrug = '\xAF\\_(\u30C4)_/\xAF';//"¯\_(ツ)_/¯"; // Â¯_(ãƒ„)_/Â¯ is what comes out the other end
            premiumEmotes = premiumEmotes.replaceAll(":shrug:",replacershrug);
        for( const emote in emotes_obj.emotes){
            const alt = emotes_obj.emotes[emote].name;
            const eurl = emotes_obj.emotes[emote].url;
            
            const matcher = ":"+ alt + ":/gi";
            
            const replacer = "<img src=\"" + eurl + "\" title=\"" + alt + "\" alt=\"" + alt + "\">";
            
            const pattern = new RegExp(`((<img([\w\W]+?)|\w|\s|"|'):${alt}:(('|"|\w|\s).+?>)|:${alt}:)`, 'gi' );
            
            premiumEmotes = premiumEmotes.replace(pattern,replacer);
            
        }
        }catch(ex){
        
        }
        
        try{
        for( const emote in emotes_obj_bw.data){
            
            const alt = emotes_obj_bw.data[emote].label; //emotes_obje
            const eurl = emotes_obj_bw.data[emote].image; // emotes_obj_bw[
            
            const matcher = ":"+ alt + ":/gi";
            
            const replacer = "<img src=\"" + eurl + "\" title=\"" + alt + "\" alt=\"" + alt + "\">";
            
            const pattern = new RegExp(`((<img([\w\W]+?)|\w|\s|"|'):${alt}:(('|"|\w|\s).+?>)|:${alt}:)`, 'gi' );
            
            premiumEmotes = premiumEmotes.replace(pattern,replacer);
            //console.log(premiumEmotes);
        }
        }catch(ex){
        
        }
    }else{
       
        
        
    }
    // do global replace for :rngriker:
    return premiumEmotes;
}

function addMessage(data){
    let node = document.createElement("div");                 // Create a <li> node
        let textnode = document.createElement("message");         // Create a text node
        //const pattern = new RegExp(`@${username}\\b`, 'gi' );
        //el.message = el.message.replace(pattern, `<span class="highlight">$&</span>`);
        if(ignore_users.indexOf(data.username) > -1){
            return;
        }
        let hideID = Math.random().toString(36).replace('0.', ''); // hide based on the id string that is generated for the element
        textnode.id = hideID;
        textnode.innerHTML = data.message;
        if(textOnlyMode){

        }else{
            textnode.innerHTML = cleanImages(textnode.innerHTML);
            textnode.innerHTML = processPremiumEmotes(textnode.innerHTML);
        }
        
        let textnodeAvatar = document.createElement("div");
        textnodeAvatar.classList.add("avatar");
        
        textnodeAvatar.innerHTML = "<img class=\"userav\" src=\"/fed.svg\" style=\"background: rgb(32, 99, 223);\">";
        if(data.color){
            let usercolor = hexToRgb(data.color);
            textnodeAvatar.innerHTML = "<img class=\"userav\" src=\"/fed.svg\" style=\"background: rgb("+ usercolor.r+ "," + usercolor.g + ","+ usercolor.b +");\">";
        }
        let textnodeUserName = document.createElement("div"); // need to add a on click event for the attribute
        textnodeUserName.classList.add("username");
        textnodeUserName.textContent = data.username;// + "#" + data.unum; 

        let textnodeDate = document.createElement("div");
        textnodeDate.classList.add("date");
        let theDate = new Date()
        const dateString = theDate.toLocaleTimeString();
        textnodeDate.textContent = '[' + dateString + ']'; 
        textnodeDate.addEventListener('click', function(e){
                $("#" + hideID).html("<p style=' color: rgb(218, 10, 0);'>[REDACTED]</p>"); // should toggle 
            }
        );

        let textnodeChannelName = document.createElement("div");
        textnodeChannelName.classList.add("channel");
        textnodeChannelName.textContent = data.channel;

        node.appendChild(textnodeAvatar); 
        node.appendChild(textnodeDate);     
        node.appendChild(textnodeUserName);    
        node.appendChild(textnodeChannelName);    
        node.appendChild(textnode);  

        textnodeDate.addEventListener('click', function(e){
            // do something
                //let atmessage = $("textarea#message").val()
                //atmessage += "@" + user + " ";
                //$("textarea#message").val(atmessage)
                //$("textarea#message").focus();// send focus back to chat
                // https://www.w3schools.com/jquery/jquery_ref_selectors.asp
                console.log("try to hide the message clicked");
                $("message:first-child").hide(); // should toggle
            }
        );

        // add a special remove message option to delete this node

        document.getElementById("messageListContainer").appendChild(node); 
        // scroll to bottom call
        scrollToBottom();
}

function help(){
    const msg_to_add_locally = {
        message: "Hi here is some help info:<br>/h or /help for help<br>/w username message to whisper<br>/hit for the hit alert sounds<br>/notify to toggle notify<br>/afk to set an away message<br>/users Gets a current list of users<br>/mkuser username password to make a unique user<br>/mktroll makes a new random troll<br>/autooff turns off autocomplete<br>/autouser user @ complete<br>/autoemote emote only autocomplete<br>/autoall turns on both<br>/hit for a nice sound notification<br>/resetsend if you have garbage in your send<br>/textonly turns off images in chat<br>/usernum To toggle showing user numbers<br>/tts to toggle tts on and off<br>/cacheon to turn on local message caching for reloads<br>/cacheoff turns off and clears the local message cache.",
        username: "Helper",
        channel: 'Help'
    
    }
    //ats
    //dms.push(msg_to_add_locally);
    addMessage(msg_to_add_locally);
}

function mktroll(){
    const endpoint = 'mktroll';
            //let payload = {user:"troll",myKey:"Troll"};
            $.get( endpoint, function(data, status){
                //console.log(status);
                
                if(status == "success"){
                    console.log("data:",data);
                    window.localStorage.setItem('trollToken'  , data  );
                    //load_chatToken();
                    load_trollToken();
                    window.location.reload();
                }
            });
}


function toggleUserList(){
    // toggles the class to hide/ show the user list overlay
    $(".userlist").toggle();
    // <ol id="thewatchers"> </ol>
}

function playSound() {
    var sound = document.getElementById("audio2");
    sound.muted = false;
    var promise = sound.play();

    if (promise !== undefined) {
        promise.then(_ => {
            // Autoplay started!

        }).catch(error => {
            // DO NOTHING BECAUSE THE USER CANT SEE THIS ELEMENT ON THE PAGE
        });
    }
}

function bindSounds(){
  // used to bind the sound sources to prevent them from playing intially
  // should look for a setting in storage to enable quad via /quad
  document.getElementById("audio2").src="https://www.myinstants.com/media/sounds/kitty-blabla.mp3";
  try{
      var quad_string =  window.localStorage.getItem('useQuad');
          if (quad_string === '1'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/quad.mp3";
          }
      }catch(err){
      
  }
  
  try{
      var quad_string =  window.localStorage.getItem('useBones');
          if (quad_string === '1'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/taunt.wav";
          }
      }catch(err){
      
  }
  
  try{
      var quad_string =  window.localStorage.getItem('useRail');
          if (quad_string === '1'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/railgf1a.wav";
          }
      }catch(err){
      
  }
  
  // hit support useHit
  try{
      var quad_string =  window.localStorage.getItem('useHit');
          if (quad_string === '1'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/hit.wav";
          }
      }catch(err){
      
  }
  
  try{
      var quad_string =  window.localStorage.getItem('useProtect');
          if (quad_string === '1'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/protect.wav";
          }
      }catch(err){
      
  }
  
  try{
      var quad_string =  window.localStorage.getItem('useRunty');
          if (quad_string === '1'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/runty.mp3";
          }
      }catch(err){
      
  }
  
  // adds support for menu sounds useMenu
  try{
      var quad_string =  window.localStorage.getItem('useMenu');
          if (quad_string === '1'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/menu1.wav";
          }
          if (quad_string === '2'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/menu2.wav";
          }
          if (quad_string === '3'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/menu3.wav";
          }
          if (quad_string === '4'){
          document.getElementById("audio2").src="https://bw.rnih.org/litechat/menu4.wav";
          }
      }catch(err){
      
  }
  
}

function unsetaudiobinds(){
    localStorage.removeItem( 'useQuad');
    localStorage.removeItem( 'useRail');
    localStorage.removeItem( 'useMenu');
    localStorage.removeItem( 'useHit');
    localStorage.removeItem( 'useProtect');
    localStorage.removeItem('useRunty');
    $("textarea#message").val("");
}

function featureBingBingWahoo(message,usernamep){
    if(chatFeatureNotify){
        if(message.message.toLowerCase().includes(usernamep.toLowerCase())){
            bindSounds();
            playSound();
            //updateWhisperCount();
            const msg_to_add_locally = {
                message: message.message,
                username: message.username,
                channel: 'At'
            
            }
            //ats
            //ats.push(msg_to_add_locally);
            //updateAtCount();
        }
    }
}

function featureAFK(message){

}

function changeChatChannel(newchannel){
    channel = newchannel;
    localStorage.setItem( 'channel', newchannel );
}

function load_chat_channel(){
    if(window.localStorage.channel){
        channel = localStorage.getItem('channel');
    }
}



load_chat_channel();

let emoteList = [];

function split( val ) {
    return val.split( /:*/ );
  }
  function extractLast( term ) {
    return split( term ).pop();
  }

let autocompletedata = [];

function addv2msg(data){
    let node = document.createElement("div");                 // Create a <li> node
        
        let hideID = Math.random().toString(36).replace('0.', ''); // hide based on the id string that is generated for the element
        let textnode = document.createElement("message");    
        textnode.id = hideID;     // Create a text node
        let username = $("#userid").val(); // get the username from above
        const pattern = new RegExp(`@${username}\\b`, 'gi' );
        //el.message = el.message.replace(pattern, `<span class="highlight">$&</span>`);
        featureBingBingWahoo(data,username);
        textnode.innerHTML = data.message;
        textnode.innerHTML = textnode.innerHTML.replace(pattern, `<span class="highlight">$&</span>`);
        if(textOnlyMode){
            // do some regex magic to remove images?
            textnode.innerHTML = cleanImages(textnode.innerHTML);
        }

        if(useTTS){
            let message_to_read = data.message;
            if(read_names){
                message_to_read =  data.username + " says " + message_to_read;
            }
            readTTSmessage(message_to_read);
        }
        
        let textnodeAvatar = document.createElement("div");
        textnodeAvatar.classList.add("avatar");
        textnodeAvatar.innerHTML = "<img class=\"userav\" src=\"/fed.svg\" style=\"background: rgb(32, 99, 223);\">";
        if(data.color){
            let usercolor = hexToRgb(data.color);
            textnodeAvatar.innerHTML = "<img class=\"userav\" src=\"/fed.svg\" style=\"background: rgb("+ usercolor.r+ "," + usercolor.g + ","+ usercolor.b +");\">";
        }

        textnodeAvatar.addEventListener('click', function(e){
            // do something
            let atmessage = $("textarea#message").val()
                atmessage += "@" + data.username + " ";
                $("textarea#message").val(atmessage)
                $("textarea#message").focus();// send focus back to chat
            }
        );

        
        
        let textnodeUserName = document.createElement("div"); // need to add a on click event for the attribute
        textnodeUserName.classList.add("username");
        textnodeUserName.textContent = data.username + "#" + data.unum; 

        
        if(ignore_users.indexOf(data.username + "#" + data.unum) > -1){
            return;
        }
        
        if(hideUserNumbers){
            textnodeUserName.textContent = data.username;
        }
        aliases.forEach(alias => {
            if(alias.alias == data.username + "#" + data.unum){
                textnodeUserName.textContent = alias.id;
            }
        });
        textnodeUserName.addEventListener('click', function(e){
            // do something
            let atmessage = $("textarea#message").val()
                //if (atmessage.length > ("!w " + el.username).length){
                    
                    if(atmessage.includes("!w " + data.username + "#" + data.unum)){
                        // do nothing.... it's already in the message
                        atmessage = atmessage.replace('!w ', '!ww ')
                    }else{
                        
                        if(atmessage.includes("!ww " + data.username + "#" + data.unum)){
                            //atmessage = "!w " + el.username + " " + atmessage;
                            atmessage = atmessage.replace('!ww ', '!w ')
                        }else{
                            atmessage = "!w " + data.username + "#" + data.unum + " " + atmessage;
                        }
                        
                    }
                    
                //}
                $("textarea#message").val(atmessage)
                $("textarea#message").focus();// send focus back to chat
            }
        );

        let textnodeDate = document.createElement("div");
        textnodeDate.classList.add("date");
        let theDate = new Date()
        const dateString = theDate.toLocaleTimeString();
        textnodeDate.textContent = '[' + dateString + ']'; 

        textnodeDate.addEventListener('click', function(e){
                $("#" + hideID).html("<p style=' color: rgb(218, 10, 0);'>[REDACTED]</p>"); // should toggle 
            }
        );

        let textnodeChannelName = document.createElement("div");
        textnodeChannelName.classList.add("channel");
        textnodeChannelName.textContent = data.channel;
            textnodeChannelName.addEventListener('click', function(e){
                // do something
                console.log('clikcked:', data.channel);
                changeChatChannel(data.channel);
            }
            
            // might be nice to auto fill whispers here
        );

        node.appendChild(textnodeAvatar); 
        node.appendChild(textnodeDate);     
        node.appendChild(textnodeUserName);    
        node.appendChild(textnodeChannelName);    
        node.appendChild(textnode);  
        document.getElementById("messageListContainer").appendChild(node); 
        // scroll to bottom call
        scrollToBottom();
}

function saveMessages(){
    if(window.localStorage.useMsgCache){
        let useLocalCache = window.localStorage.getItem("useMsgCache");
        if(useLocalCache == "true"){
            // do some message pruning and have a max length 28262 seems to be an upper limit
            if(renderMessages.length > 1000){
                // prune it back to 100 or 500 messages
                renderMessages = renderMessages.slice(0,renderMessages.length - 500); // remove everything but the most recent 500 messages
            }
            window.localStorage.setItem("msgStore",JSON.stringify(renderMessages));
        }
    }
}

function load_emotes(){
    const endpoint = '/v1/emotes';
            if(window.localStorage.autocomplete){

            if(localStorage.getItem("autocomplete") == "all" || localStorage.getItem("autocomplete") == "emote"){
                $.get( endpoint, function(data, status){
                
                    
                    if(status == "success"){
                        //console.log("emote autocomplete data:",data);
                        data.emotes.forEach(emote => {
                            emoteList.push( ":" + emote.name + ":");
                        });
                        autocompletedata = [];
                        emoteList.forEach(emote => {
                            autocompletedata.push(emote);
                        });
                        // also add users?
                        users.forEach(user => {
                            autocompletedata.push("@" + user);
                        });

                        $( "#message" ).autocomplete({minLength: 1,
                            source: autocompletedata
                        });
                        $( "#message" ).on( "keydown", function( event ) {
                            if ( event.keyCode === $.ui.keyCode.TAB &&
                                $( this ).autocomplete( "instance" ).menu.active ) {
                            event.preventDefault();
                            }
                        })
                        
                        
                    }
                });
            }
        }
        
}

load_emotes();

function sendWhisperLC(messageText){
    const withChannelSub = messageText.replace(/@@/gi, '@'+tempchannel);
    
        const withChannelSubNoReturns = withChannelSub.replace(/\n|\r/g, "");
        console.log('whisper test');
        //const message_to_split = $("textarea#message").val();
        var parts = withChannelSubNoReturns.split(" ");
        // 0 is !w, 1 is username, after that point the rest is the actual message
        
        var tuser = 'troll:y1e0';
        if(parts.length > 1){
            tuser = parts[1];
        }
        var start_len = 0;
        start_len += tuser.length + 1
        const rest_of_message = messageText.substr(start_len,messageText.length).trim();
        const msg_id = Math.random().toString(36).replace('0.', '');
        const msg = {
            message: "<p>" + rest_of_message + "</p>",
            channel: channel,
            to: 'playlistbot',
            from: username_global,
            msg_id: msg_id
          };
        if(whisperSocketServer){
            // this does send but we get that damn print prompt
            whisperSocketServer.emit('messagew', msg);//whisper
            $("textarea#message").val("");
        }
}

function loadCachedMessages(){
    // so we can show messages from before we refreshed
    if(window.localStorage.aliases){
        let aliasesStr = window.localStorage.getItem("aliases");

        aliases = JSON.parse(aliasesStr);
    }

    if(window.localStorage.useMsgCache){
        let useLocalCache = window.localStorage.getItem("useMsgCache");
        if(useLocalCache == "false"){
            renderMessages = [];
            let renderMessagesStr = JSON.stringify(renderMessages);
            window.localStorage.setItem("useMsgCache",renderMessagesStr);
            return;
        }
    }else{
        return;
    }

    // add a check if it's already been ran or not
    // maybe get the message display count and use it to not load this... and return early
    if(window.localStorage.msgStore){
        let old_tts_state = useTTS;
        useTTS = false;
        let old_chatFeatureNotify = chatFeatureNotify;
        chatFeatureNotify = false;
        console.log("Says we have messages we can load...");
        let renderMessagesStr = window.localStorage.getItem("msgStore");
        renderMessages = JSON.parse(renderMessagesStr);
        // run through all of the messages and render the most rencent 50?
        let restoreMessageSubset = [];
        try{
            if(renderMessages.length > 50){
                restoreMessageSubset = renderMessages.slice(-50);
            }else{
                restoreMessageSubset = renderMessages;
            }
        }catch(ex){
            console.log("nothing to load?");
            restoreMessageSubset = renderMessages;
        }
        restoreMessageSubset.forEach(message => {
            //console.log("message:",message);
            if(message.unum){
                addv2msg(message);
            }else{
                let tmessg = message;
                if(message.user){
                    tmessg.username = message.user;

                }
                addMessage(tmessg);
            }
        });
        useTTS = old_tts_state;
        chatFeatureNotify = old_chatFeatureNotify;
    }
}

function addAlias(id,alias){
    
    aliases.push({alias:alias,id:id});
    window.localStorage.setItem("aliases",JSON.stringify(aliases));
}
load_ignores();
function addIgnore(ignoreme){
    //if(ignore_list)
    /*ignore_list.forEach(ignore => {
        if(ignore == ignoreme){
            ignore_list.remove(ignoreme);
        }
    });
    */
    if(ignore_users.indexOf(ignoreme)> -1){
        //ignore_users.remove(ignoreme);
        delete ignore_users[ignore_users.indexOf(ignoreme)];
    }else{
        ignore_users.push(ignoreme);
    }

    save_ignores();
    
}

function litechat(){
    console.log("chat starting...");
    //this.io = io( 'wss://localhost:4000', { transports: ['websocket'] } );
    this.socket = io.connect(window.location.origin, { transports: ['websocket'] });//io( window.location.origin, { transports: ['websocket'] } );    

    this.socket.on('connect', () => {
        console.log("says we connected...");
        // need to possibly reconnect as a new user/troll
        // and check our user status if we have accepted tos on the server side or not
        // https://jstris.jezevec10.com/
        // check and see if we have a troll token or a chat token and use it to start our session
        load_profile_pref();
        if(profilePref == "troll"){
            load_trollToken();
        }else{

            load_chatToken();
        }
        // should check if we have a troll token and if we are set to troll or not
        // if it fails we get called troll:dickhead on our unauthenticated socket connection
        this.socket.emit('new user', {jwt:usertoken});
        whisperSocketServer.emit('hi',username_global);
        //whisperSocketServer.emit('hi',$("#userid").val());
        // add a load count to prevent from reloading
        if(load_count == 0){
            load_count += 1;
            loadCachedMessages();
        }
    });
    
    this.sendWhisper = function (user,message){
        this.socket.emit("whisper",{message:message,to:user});
    }


    this.initUI = function (telement) {
        console.log("Doing chat ui init");
        // used to add the ui elements to the document
        var nodeChat = document.createElement("div");    
        var nodeChatInput = document.createElement("input");    
        var nodeChatSend = document.createElement("button");   

        $(telement).appendChild(nodeChat);
        $(telement).appendChild(nodeChatInput);// input
        $(telement).appendChild(nodeChatSend);// send
    }

    // add to playlist
    // these should be turned into whispers and decoded in plb as such @ 2720
    this.atp = function(){
        // first check that we have something to link in the chat box, get the val, check the length (should be longer than 5 or something since most sites have ids that are needed)
        const itemText = $("textarea#message").val().trim();
        if(itemText.length > 5){
            // check if plb is connected
            let plb_found = false;
            users.forEach(user => {
                if(user.includes("plb#65487")){
                    plb_found = true;
                }
            });
            if(plb_found){
                $("textarea#message").val("");
                console.log("Adding...");
                const msg = {
                    message: "@plb atp " + itemText,
                    channel: channel,
                }
                //this.socket.emit("message",msg);
                /*let chunks = "@plb atp " + itemText; //msg.split(" ")
                let toUser = chunks[1];
                let restOfMessage = "";
                for(var i =2;i<chunks.length;i++){
                    restOfMessage += chunks[i] + " ";
                }*/

                this.sendWhisper("plb#65487","atp " + itemText);
                // make this into a whisper by default
                // need to look at 3888 in plb to hook up whispers
            }else{
                const plb_not_found_msg = {username:"error",channel:"error",message:":sadblob:<`PLB not found!`"};
                addMessage(plb_not_found_msg);
            }
        }
    }

    // start playlist
    this.spl = function(){
        
            const msg = {
                message: "@plb spl",
                channel: channel,
            }
            console.log("Starting playlist...");
            // check if plb is connected
            let plb_found = false;
            
            users.forEach(user => {
                if(user.includes("plb#65487")){
                    plb_found = true;
                }
            });
            if(plb_found){
                //this.socket.emit("message",msg);
                /*let chunks = "@plb spl"; //msg.split(" ")
                let toUser = chunks[1];
                let restOfMessage = "";
                for(var i =2;i<chunks.length;i++){
                    restOfMessage += chunks[i] + " ";
                }*/

                this.sendWhisper("plb#65487","spl");
                // make this into a whisper by default
            }else{
                const plb_not_found_msg = {username:"error",channel:"error",message:":sadblob:<`PLB not found!`"};
                addMessage(plb_not_found_msg);
            }
            //this.socket.emit("message",{message:msg,channel:channel});
        
    }

    this.sendMsg = function () {
        
        const msg = $("textarea#message").val().trim();
        $("textarea#message").val("");

        if(msg.length == 0){
            return; // your retarded and hit enter :)
        }
        // this will probably be the easiest way to do some client side command processing
        // like mkuser (no args requests one to be generated out of the dictionary of names), otherwise it will generate a token for use 
        // that has a color, name, number, secret 
        // mktroll https://passwordsgenerator.net/
        if(msg.substr(0,7) == '/mkuser'){
            console.log("Should request to make a user");
            const endpoint = 'mkuser';
            let chunks = msg.split(" ");

            // do some chunk count validation so see how much data we have and throw an error message or allow it to generate a random user id
            if(chunks.length > 1){
                let reqUserName = chunks[1];
                // let hash = bcrypt.hashSync('myPassword', 10);
                let reqPass = chunks[2]; // do a hash of the pwd before submitting it with the user request, should use something like bcrypt
                let payload = {user:reqUserName,myKey:reqPass};
                $.post( endpoint, payload, function(data, status){
                    console.log(status);
                    
                    if(status == "success"){
                        console.log("data:",data);
                        window.localStorage.setItem('chatToken'  , data  );
                        load_chatToken();
                        window.location.reload();
                    }
                });
            }else{
                const mkuserHowTo = "Invalid use of /mkuser: must have a username and password like:<br>" + "/mkuser userName myPassword<br>";
                const msg_to_add_locally = {
                    message: mkuserHowTo,
                    username: "Helper",
                    channel: 'Help'
                
                }
                //ats
                //dms.push(msg_to_add_locally);
                addMessage(msg_to_add_locally);
                $("textarea#message").val( msg);
            }
            return;
        }

        if(msg.substr(0,2) == "/i"){
            
            let chunks = msg.split(" ");
            if(chunks.length > 1){
                let name = chunks[1];
                //let id = chunks[2];
                //addAlias(name,id);
                addIgnore(name);
            }else{
                const mkuserHowTo = "Invalid use of /i: must have a username like:<br>" + "`/i userNameToIgnore<br>The username is what will be ignored";
                const msg_to_add_locally = {
                    message: mkuserHowTo,
                    username: "Helper",
                    channel: 'Help'
                
                }
                addMessage(msg_to_add_locally);
            }
            return;
        }

        if(msg.substr(0,6) == "/alias"){
            // name,id , name is what the id will be replaced with
            let chunks = msg.split(" ");
            if(chunks.length > 2){
                let name = chunks[1];
                let id = chunks[2];
                addAlias(name,id);
            }else{
                const mkuserHowTo = "Invalid use of /alias: must have a username and id like:<br>" + "/alias userName chatuserid<br>The username is what will be displayed";
                const msg_to_add_locally = {
                    message: mkuserHowTo,
                    username: "Helper",
                    channel: 'Help'
                
                }
                addMessage(msg_to_add_locally);
            }
            return;
        }

        if(msg.substr(0,8) == '/autoall'){
            localStorage.setItem("autocomplete","all");
            return;
        }
        if(msg.substr(0,8) == '/autooff'){
            localStorage.setItem("autocomplete","off");
            return;
        }
        if(msg.substr(0,9) == '/autouser'){
            localStorage.setItem("autocomplete","user");
            return;
        }
        if(msg.substr(0,10) == '/autoemote'){
            localStorage.setItem("autocomplete","emote");
            return;
        }
        if(msg.substr(0,8) == '/mktroll'){
            console.log("Should request a troll id");
            // then use it to setup a new connection and store the result if it's valid
            mktroll();
            return;
        }

        if(msg.substr(0,3) == "/w " || msg.substr(0,3) == "!w " || msg.substr(0,3) == "!W " || msg.substr(0,3) == "/W "){
            // send a whisper to a user
            var chunks = msg.split(" ")
            var toUser = chunks[1]
            var restOfMessage = ""
            for(var i =2;i<chunks.length;i++){
                restOfMessage += chunks[i] + " "
            }

            this.sendWhisper(toUser,restOfMessage);

            const msg_to_add_locally = {
                message: "<p>To: " + toUser + " " + restOfMessage + "</p>",
                username: "Me",
                channel: 'Whisper'
            
            }
            //ats
            
            //dms.push(msg_to_add_locally);
            //addMessage(msg_to_add_locally);
            append_sent(msg);

            $("textarea#message").val("");
            return;
        }

        

        if(msg.substr(0,3) == "/h "){
            // help
            help();
            return;
        }

        if(msg.substr(0,5) == "/help"){
            //console.log("no command matched, did not send");
            //$("textarea#message").val("Command not matched:" + msg);
            help();
            // add a local message with basic help info
            return;
        }

        if(msg.substr(0,9) == "/cacheoff"){
            //window.localStorage.useMsgCache
            window.localStorage.setItem("useMsgCache", false);
            window.localStorage.setItem("msgStore",JSON.stringify([]));
            return;
        }

        if(msg.substr(0,8) == "/cacheon"){
            //window.localStorage.useMsgCache
            window.localStorage.setItem("useMsgCache", true);
            //window.localStorage.setItem("msgStore",[]);
            return;
        }

        if(msg.substr(0,9) == "/ttsnames"){
            read_names = !read_names;
            //if(useTTS){
                if(read_names){
                    readTTSmessage("TTS read names enabled!");
                }else{
                    readTTSmessage("TTS read names disabled!");
                }
            //}
            return;
        }

        if(msg.substr(0,8) == "/usernum"){
            hideUserNumbers = !hideUserNumbers;
            window.localStorage.setItem("hideUserNumbers",hideUserNumbers);
            return;
        }

        if(msg.substr(0,4) == "/tts"){
            //read_names = !read_names;
            // https://addons.mozilla.org/en-CA/firefox/addon/read-aloud/
            // https://www.wikihow.com/Convert-Text-to-Speech-on-Linux
            useTTS = !useTTS;
            if(useTTS){
                readTTSmessage("TTS enabled!");
            }else{
                readTTSmessage("TTS disabled!");
            }
            localStorage.setItem('tts',useTTS);
            return;
        }

        if(msg.substr(0,10) == "/textonly"){
            console.log("Toggle Text only mode");
            // turns on text only processing to turn off images
            textOnlyMode = !textOnlyMode;
            return;
        }

        if(msg.substr(0,10) == "/resetsend"){
            reset_sent();
            return;
        }

        if(msg.substr(0,6) == "/troll"){
            // switch to troll mode
            window.localStorage.setItem('profilePref'  , "troll"  );
            window.location.reload();
            // add a local message with basic help info
            return;
        }

        if(msg.substr(0,5) == "/user"){
            // switch to user mode
            window.localStorage.setItem('profilePref'  , "user"  );
            window.location.reload();
            // add a local message with basic help info
            return;
        }

        if(msg.substr(0,8) == "/channel"){
            // switch to user mode
            //window.localStorage.setItem('profilePref'  , "user"  );
            //window.location.reload();
            var chunks = msg.split(" ");
            //var toUser = chunks[1]
            channel =  chunks[1];
            // add a local message with basic help info
            try{
                changeChatChannel(channel);
            }catch(ex){

            }
            return;
        }

        if(msg.substr(0,5) == '/quad'){
            unsetaudiobinds();
            localStorage.setItem( 'useQuad', "1" );
            return;
        }
        
        if(msg.substr(0,6) == '/bones'){
            unsetaudiobinds();
            localStorage.setItem( 'useBones', "1" );
            return;
        }
        
        if(msg.substr(0,6) == '/menu1'){
            unsetaudiobinds();
            localStorage.setItem( 'useMenu', "1" );
            return;
        }
        
        if(msg.substr(0,6) == '/menu2'){
            unsetaudiobinds();
            localStorage.setItem( 'useMenu', "2" );
            return;
        }
        
        if(msg.substr(0,6) == '/menu3'){
            unsetaudiobinds();
            localStorage.setItem( 'useMenu', "3" );
            return;
        }
        
        if(msg.substr(0,6) == '/menu4'){
            unsetaudiobinds();
            localStorage.setItem( 'useMenu', "4" );
            return;
        }
        if(msg.substr(0,4) == '/hit'){
            unsetaudiobinds();
            
            localStorage.setItem( 'useHit', "1" );
            //localStorage.setItem( 'useRail', "1" );
            return;
        }
        if(msg.substr(0,8) == '/protect'){
            unsetaudiobinds();
            
            localStorage.setItem( 'useProtect', "1" );
            //localStorage.setItem( 'useRail', "1" );
            return;
        }
        
        if(msg.substr(0,6) == '/runty'){
            unsetaudiobinds();
            localStorage.setItem('useRunty','1');
            return;
        
        }
        
        
        
        if(msg.substr(0,8) == '/default'){
            unsetaudiobinds();
            return;
        }
        
        // adds support for rail railgf1a.wav
        if(msg.substr(0,5) == '/rail'){
            unsetaudiobinds();
            //localStorage.setItem( 'useQuad', "0" );
            localStorage.setItem( 'useRail', "1" );
            return;
        }

        if(msg.substr(0,5) == '/say '){
            // sends it via litechat 
            var message = msg;
            var restofmessage = message.substring(message.search("/say ") + 5);
            const msg_id = Math.random().toString(36).replace('0.', '');
            /*to: tuser,
                from: username,
                msg_id: msg_id*/
            
            if(restofmessage.length > 4){
                    append_sent(restofmessage);
                }
            const msgt = {
                message: restofmessage,
                channel: channel,
                user: username_global
            };
            whisperSocketServer.emit('say', msgt);
            $("textarea#message").val("");
            return;
        }

        if(msg.substr(0,3) == '/lc'){
            // toggles on lc
            return;
        }

        if(msg.substr(0,1) == "/"){
            console.log("no command matched, did not send");
            $("textarea#message").val("Command not matched: " + msg);
            return;
        }

        //console.log("Should have sent something...",msg);
        append_sent(msg);
        this.socket.emit("message",{message:msg,channel:channel});
    }

    this.addMsg = function (data) {
        
    }

    this.updateUserNames = function(data){
        //console.log(data);
        //console.log("Should update our viewer list or at least people who are connected");
        let total_watchers = data.users.length;
        let watchers = 0;
        $("#thewatchers").empty();
        let sorted_jerks = data.users;
        sorted_jerks.sort();
        users = [];
        sorted_jerks.forEach(user => {
            let node = document.createElement("div"); 
            users.push(user);
            let textnodeAvatar = document.createElement("avatar");
                
                
                textnodeAvatar.classList.add("avatar");
                //<i aria-hidden="true" class="v-icon material-icons theme--dark" style="background: rgb(32, 99, 223);">person</i>
                //textnodeAvatar.innerHTML = '<i aria-hidden="true" class="v-icon material-icons theme--dark userav" style="background: rgb(32, 99, 223);">person</i>';
                //textnodeAvatar.innerHTML = "<img class=\"userav\" src=\"https://i.imgur.com/kdxSQI9.png\" style=\"background: " + ucolor+";\">";
                textnodeAvatar.innerHTML = "<img class=\"userav\" src=\"/fed.svg\" style=\"background: rgb(32, 99, 223);\">";
                // 

                textnodeAvatar.addEventListener('click', function(e){
                    // do something
                    let atmessage = $("textarea#message").val()
                        atmessage += "@" + user + " ";
                        $("textarea#message").val(atmessage)
                        $("textarea#message").focus();// send focus back to chat
                    }
                );
                node.appendChild(textnodeAvatar); 

                let textnodeUserName = document.createElement("username"); // need to add a on click event for the attribute
                // need to add a onclick for username_click(el.username)
                textnodeUserName.addEventListener('click', function(e){
                    // do something
                    let atmessage = $("textarea#message").val()
                        atmessage = "!w " + user + " " + atmessage;
                        $("textarea#message").val(atmessage)
                        $("textarea#message").focus();// send focus back to chat
                    }
                );
                
                textnodeUserName.innerHTML = '<span style=" color: white;">' + user + '</span>'; 
                
                
                
                node.appendChild(textnodeUserName);  
                
                let textnode = document.createElement("message");
                textnode.innerHTML = "<p>Ignore Toggle</p>"; 
                
                node.appendChild(textnode); 

                document.getElementById("thewatchers").appendChild(node);
                let nodebr = document.createElement("br"); 
                //document.getElementById("thewatchers").appendChild(nodebr);
                //document.getElementById("thewatchers").appendChild(nodebr);
                document.getElementById("thewatchers").appendChild(nodebr);

        });
        autocompletedata = [];
        if(window.localStorage.autocomplete){
            if(localStorage.getItem("autocomplete") == "all" || localStorage.getItem("autocomplete") == "user" || localStorage.getItem("autocomplete") == "emote"){
                if(localStorage.getItem("autocomplete") == "emote"){
                    emoteList.forEach(emote => {
                        autocompletedata.push(emote);
                    });
                }
                // also add users?
                if(localStorage.getItem("autocomplete") == "user"){
                    users.forEach(user => {
                        autocompletedata.push("@" + user);
                    });
                }
                
                $( "#message" ).autocomplete({minLength: 1,
                    source: autocompletedata,
                    
                    focus: function() {
                    // prevent value inserted on focus
                    return false;
                    },
                    select: function( event, ui ) {
                    var terms = split( this.value );
                    // remove the current input
                    terms.pop();
                    // add the selected item
                    terms.push( ui.item.value );
                    // add placeholder to get the comma-and-space at the end
                    terms.push( "" );
                    this.value = terms.join( "" );
                    return false;
                    }
                });

                $( "#message" ).on( "keydown", function( event ) {
                    if ( event.keyCode === $.ui.keyCode.TAB &&
                        $( this ).autocomplete( "instance" ).menu.active ) {
                    event.preventDefault();
                    }
                })
            }
        }
        let plb_found = false;
        users.forEach(user => {
            //autocompletedata.push("@" + user);
            
            if(user.includes("plb#")){
                plb_found = true;
            }
        });

        if(plb_found){
            $("#plbspl").show();
            $("#plbatp").show();
        }else{
            $("#plbspl").hide();
            $("#plbatp").hide();
        }
        $("#watchcount").text("On Channel: " + watchers + " total: " + total_watchers);
    }

    // not even do this https://github.com/bitwave-tv/bitwave/tree/dev/components/effects
    this.processWhisper = function (data){
        //console.log("whisper:",data);
        let wuser = data.username;
        let wmsg = data.message;
        let unum = data.unum;
        let wch = data.channel;
    }

    this.bulkmsg = function (data) {
        // this is the stuff we need to process and show
        // add back some of the ignore logic just return out of it for ignored channel/user
        //console.log(data);
        if(window.localStorage.useMsgCache){
            let useLocalCache = window.localStorage.getItem("useMsgCache");
            if(useLocalCache == "true"){
                renderMessages.push(data);
            }
        }
        saveMessages();
        addv2msg(data);
        
    }

    this.socket.on('bulkmessage',this.bulkmsg);

    this.socket.on('update usernames',this.updateUserNames);

    //this.socket.on('whisper',this.processWhisper);
   

    console.log("Chat finished init");
}


var chat = new litechat();
//chat.sendMsg("testing...");
//chat.initUI("#chatcontainer");

function checkToSend(event){
    if((event.keyCode || event.which) == 13) { //Enter keycode
        if (event.shiftKey) {
            //sendPremium();
        }else{
            console.log("Should send a messages");
            chat.sendMsg();
        }
    }

    if((event.keyCode || event.which) == 38) { //UP keycode
        //send();
        if($("textarea#message").val().length == 0 || send_buffer_index > 0){
            const msg = sendbuffer[send_buffer_index];
            $("textarea#message").val(msg);
            send_buffer_index += 1;
            // scroll throw the command buffer
            if(send_buffer_index > sendbuffer.length){
                send_buffer_index = sendbuffer.length-1;
            }
        }
    }
    if((event.keyCode || event.which) == 40) { //UP keycode
        //send();
        // scroll throw the command buffer
        
        // should check the message length before we change the message to use the buffer
        if($("textarea#message").val().length == 0 || send_buffer_index > 0 ){
            const msg = sendbuffer[send_buffer_index];
            $("textarea#message").val(msg);
            send_buffer_index -= 1;
            //send_buffer_index = 0;
            if(send_buffer_index < 0){
                send_buffer_index = 0;
            }
        }
    }
}

$("textarea#message").keyup(function(e){
    console.log("Setup the bind for enter...");
    if((e.keyCode || e.which) == 13) { //Enter keycode
        if (e.shiftKey) {
            //sendPremium();
        }else{
            console.log("Should send a messages");
            chat.sendMsg();
        }
        if((e.keyCode || e.which) == 38) {

        }

        if((e.keyCode || e.which) == 40) { //UP keycode

        }
    }
    /*if((e.keyCode || e.which) == 38) { //UP keycode
        //send();
        
        const msg = sendbuffer[send_buffer_index];
        $("textarea#message").val(msg);
        send_buffer_index += 1;
        // scroll throw the command buffer
        if(send_buffer_index > sendbuffer.length){
            send_buffer_index = sendbuffer.length-1;
        }
    }
    if((e.keyCode || e.which) == 40) { //UP keycode
        //send();
        // scroll throw the command buffer
        
        const msg = sendbuffer[send_buffer_index];
        $("textarea#message").val(msg);
        send_buffer_index -= 1;
        //send_buffer_index = 0;
        if(send_buffer_index < 0){
            send_buffer_index = 0;
        }
    }*/
    // left 37
    // right 39
});



window.onunload = window.onbeforeunload = () => {
    chat.socket.close();
    //peerConnection.close();
  };