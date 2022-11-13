let httpServer = require('http');

const ioServer = require('socket.io');
let PORT = 9001;
let isUseHTTPs = false;
require('rtcmulticonnection-server').addSocket(socket);