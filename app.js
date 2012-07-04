var os = require('os');
var redis = require('redis');

var subs = [];
var sub;

var chan = 'home';
var nick = os.hostname();
var pub = redis.createClient(9778, 'panga.redistogo.com', {detect_buffers: true});
pub.auth('2c46fbd747f1048ced1904b1572514db');

var switchChannel = function(channel){
  if(!subs[channel]) {
    subs[channel] = {
      sub: null,
      messages: []
    };
    subs[channel].sub = redis.createClient(9778, 'panga.redistogo.com', {detect_buffers: true});
    subs[channel].sub.auth('2c46fbd747f1048ced1904b1572514db');
    subs[channel].sub.on('subscribe', function(channel, count){
      chan = channel;
      pub.publish(channel, nick + ' is entering ' + channel + ' channel');
    });
    subs[channel].sub.subscribe(channel);
  }
  else {
    process.stdout.write('Channel ' + channel + '\r\n');
  }
  if(sub){
    sub.removeAllListeners('message');
    sub.on("message", function (channel, message) {
      subs[channel].messages.push(message);
    });
  };
  sub = subs[channel].sub;
  sub.removeAllListeners('message');
  while(subs[channel].messages.length > 0) {
    process.stdout.write(subs[channel].messages.shift() + '\r\n');
  }
  sub.on("message", function (channel, message) {
    process.stdout.write(message + '\r\n');
  });
};

switchChannel(chan);


process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (chunk) {
  chunk = chunk.toString().substr(0, chunk.toString().length-2);
  if(chunk.match(/^\/exit/)) {
    pub.publish(chan,nick + ' left the room');
    process.stdout.write('Goodbye\r\n');
    process.stdin.pause();
    sub.unsubscribe();
    pub.end();
    sub.end();
  }
  else if(chunk.match(/^\/channel /)) {
    var param = chunk.split(' ');
    if( param[1] && param[1] !== '' ){
      chan = param[1];
      switchChannel(chan);
    }
  }
  else if(chunk.match(/^\/nick /)) {
    var param = chunk.split(' ');
    if( param[1] && param[1] !== '' ){
      for (chann in subs)
      {
        pub.publish(chann,nick + ' is known as ' + param[1]);
      }
      nick = param[1];
    }
  }
  else if(chunk.match(/^\/list/)) {
    process.stdout.write('Channel\'s list\r\n');
    for (chann in subs)
    {
      process.stdout.write(chann + ' : ' + subs[chann].messages.length + ' remaining messages\r\n');
    }
  }
  else if(chunk !== '')
    pub.publish(chan,nick + ': ' + chunk);
});