const html=require('html-entities').encode;

const header=`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">`;

function channel_start(nick) {
  return `<channel>
  <title>`+nick+` - freenode chit</title>
  <link>https://chit.freenode.net/u/`+nick+`</link>
  <description>freenode Chit is a Chit Posting System which allows you to chit short messages to the world wide web from IRC</description>`;
}

const channel_end=`</channel>`;

const footer=`
</rss>`;

function rssTimestampToDate(tm) {
  var a = new Date(tm * 1000);
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var day = days[a.getDay()];
  var hours = a.getHours();
  var minutes = "0" + a.getMinutes();
  var seconds = "0" + a.getSeconds();

  return day + ", " + month + ' ' + date + ', ' + year + " at " + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + " GMT";
}

function createRSS(chit,nick) {
  let output=header+channel_start(nick);
  for(var i=0;i<chit.length;i++) {
    output+="\n<item>\n<title>"+rssTimestampToDate(chit[i].TIMESTAMP)+"</title>\n<guid>https://chit.freenode.net/u/"+nick+"/"+chit[i].CID+".html</guid>\n<description>"+chit[i].CHIT+"</description>\n<pubDate>"+rssTimestampToDate(chit[i].TIMESTAMP)+"</pubDate>\n</item>\n";
  }
  output+=channel_end+footer;
  return output;
}

module.exports = {
  createRSS
}
