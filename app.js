var os = require('os');
var redis = require('redis');
var sub = redis.createClient(9778, 'panga.redistogo.com', {detect_buffers: true});
sub.auth('2c46fbd747f1048ced1904b1572514db');


var pub = redis.createClient(9778, 'panga.redistogo.com', {detect_buffers: true});
pub.auth('2c46fbd747f1048ced1904b1572514db');

var nick = os.hostname();
var chan = 'test';

sub.on('subscribe', function(channel, count){
  chan = channel;
  pub.publish(channel, nick + ' entre dans le salon (' + count + ' personnes).\r\n');
});
sub.subscribe(chan);


sub.on("message", function (channel, message) {
  process.stdout.write(message);
});

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (chunk) {
  if(chunk === '/exit\r\n') {
    pub.publish(chan,nick + ' quitte le salon.');
    process.stdin.pause();
    sub.unsubscribe();
    pub.end();
    sub.end();
  }
  else if(chunk === '/nick\r\n') {
    pub.publish(chan,nick + ' est désormais prout.');
  }
  else
    pub.publish(chan,nick + ': ' + chunk);
});

process.stdin.on('end', function () {
  process.stdout.write('end');
});

