var os = require('os');
var redis = require('redis');

var sub = redis.createClient(9778, 'panga.redistogo.com', {detect_buffers: true});
var pub = redis.createClient(9778, 'panga.redistogo.com', {detect_buffers: true});

sub.auth('2c46fbd747f1048ced1904b1572514db');
pub.auth('2c46fbd747f1048ced1904b1572514db');

var currentChannel = 'home';
var messages = [];
var nick = os.hostname();


sub.on('ready', function () {
  sub.subscribe(currentChannel);
});

pub.on('ready', function () {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
});

sub.on('subscribe', function (channel, count) {
  messages[channel] = [];
  currentChannel = channel;
  process.stdout.write('You\'re entering the ' + channel + ' room\r\n');
  pub.publish(channel,nick + ' enter the room');
});

sub.on('unsubscribe', function (channel, count) {
  delete messages[channel];
  if(currentChannel===channel){
    if(count === 0){
      // Exit
    }
    else
      currentChannel = Object.keys(messages)[0];
  }
});

sub.on('message', function(channel, message){
  console.log('message', channel, message.toString(), messages);
  if(currentChannel === channel)
    process.stdout.write(message + '\r\n');
  else
    messages[channel].unshift(message.toString());
});

process.stdin.on('data', function (chunk) {
  message = chunk.toString().substr(0, chunk.toString().length-1);
  if(message.match(/^\/exit/)) {
    Object.keys(messages).forEach(function(channel){
      pub.publish(channel,nick + ' left the room');
    });
    process.stdout.write('Goodbye\r\n');
    process.stdin.pause();
    sub.unsubscribe();
    pub.end();
    sub.end();
  }
  else if(message.match(/^\/channel /)) {
    var param = message.split(' ');
    if( param[1] && param[1] !== '' ){
      channel = param[1];
      sub.subscribe(channel);
    }
  }
  else if(message.match(/^\/nick /)) {
    var param = message.split(' ');
    if( param[1] && param[1] !== '' ){
      Object.keys(messages).forEach(function(channel){
        pub.publish(channel,nick + ' is known as ' + param[1]);
      });
      nick = param[1];
    }
  }
  else if(message.match(/^\/list/)) {
    process.stdout.write('Channel\'s list\r\n');
    Object.keys(messages).forEach(function(channel){
      process.stdout.write(channel + ' : ' + messages[channel].length + ' remaining messages\r\n');
    });
  }
  else if(message !== '')
    pub.publish(currentChannel,nick + ': ' + message);
});