const fs = require('fs');
const striptags = require('striptags');

const rss = require('./lib/rss.js'); // rss feed
const Help = require('./lib/help.js');  // help text
const constants = require('./lib/constants.js');  // constants and settings
const IRC = new (require('./lib/irc.js')).IRC();  // irc client, connected
const Database = new (require('./lib/db.js')).Database();  // database, connected

// Hack
// TODO: Better way to ensure one instance of bot only (pid file method breaks if process exits unexpectedly)
var app = require('express')();
app.listen(22532);


// Main listener
IRC.addListener('raw',async (message) => {
  console.log(message);
  if(message.command==='PRIVMSG' &&
    (message.args[0].toLowerCase()==='@'+constants.IRC_CHAN.toLowerCase() || message.args[0].toLowerCase()===constants.IRC_CHAN.toLowerCase())) {
    if(await Database.userIsRegistered(message.nick))
      parse(message.nick,message.args[1],(message.args[0].substr(0,1)=='#'));
  }
  else if(message.command==='JOIN') {
    if(!await Database.userIsRegistered(message.nick))
      IRC.whois(message.nick);
    else
      IRC.notice(message.nick,"Welcome back!");
  }
  else if(message.command==='330') {
    if(message.args[1].toLowerCase()!==message.args[2].toLowerCase()) {
      IRC.mode(constants.IRC_CHAN,'+b',message.args[1]+"!*@*");
      IRC.remove(constants.IRC_CHAN,message.args[1],"Sorry, but only primary nicks may join this channel.");
      setTimeout(() => {
        IRC.mode(constants.IRC_CHAN,'-b',message.args[1]+"!*@*");
      },10000);
    }
    else {
      if(await Database.userRegister(message.args[2]))
        IRC.notice(message.args[2],"You have been added to the verified user database.");
    }
  }
});

// Main bot processor
async function parse(from,msg,isop) {
  if(typeof msg === 'undefined')
    return 0;
  msg=msg.split(" ");
  switch(msg[0].toLowerCase()) {
    case "help":
      if(!msg[1])
        IRC.notice_chan(from,Help.help,constants.IRC_CHAN);
      else {
        IRC.notice_chan(from,Help.header,constants.IRC_CHAN);
        switch(msg[1].toLowerCase()) {
          case 'chit':
            IRC.notice_chan(from,Help.chit,constants.IRC_CHAN);
            break;
          case 'reply':
            IRC.notice_chan(from,Help.reply,constants.IRC_CHAN);
            break;
          case 'vote':
            IRC.notice_chan(from,Help.vote,constants.IRC_CHAN);
            break;
          case 'del':
            IRC.notice_chan(from,Help.del,constants.IRC_CHAN);
            break;
          default:
            IRC.notice_chan(from,Help.none+msg[1]);
            break;
        }
        IRC.notice_chan(from,Help.footer,constants.IRC_CHAN);
      }
      break;
    case 'chit':
      msg.shift();
      if(!await Database.userCanChit(from)  && from.toLowerCase()!==constants.BBS.toLowerCase())
        IRC.notice_chan(from,"Sorry, you can only chit one chit per "+constants.CHIT_TIME_BETWEEN+" minutes",constants.IRC_CHAN);
      else if(msg.length<1)
        IRC.notice_chan(from,"Syntax error.  Try 'help'",constants.IRC_CHAN);
      else if(1) {
        msg=msg.join(' ');
        if(striptags(msg)!==msg)
          IRC.notice_chan(from,"Sorry, but these characters are not allowed in a chit.",constants.IRC_CHAN);
        else {
          if(striptags(msg)!==msg||msg.replace(/[^a-zA-Z0-9\,\-\.\'\"\?\!\%\$\#\@\(\)\*\+\~\\\/\:\;\[\]\{\}\=\& ]/g,"")!==msg)
            IRC.notice_chan(from,"Sorry, but these characters are not allowed in a chit.",constants.IRC_CHAN);
          else {
            result = await Database.chit(from,msg);
            if(result) {
              writeChit(from,result);
              writeChits(from);
              IRC.say(constants.IRC_CHAN,constants.BOLD+'['+result+'] Chit posted by '+from+constants.BOLD+ " " + "https://chit.freenode.net/u/"+from.toLowerCase().replace("\\","~")+"/"+result+".html");
              IRC.notice_chan(from,constants.BOLD+'['+result+'] '+IRC.colour.red(msg)+' '+IRC.colour.grey('['+from+']')+constants.BOLD, constants.IRC_CHAN);
              if(from.toLowerCase()===constants.BBS.toLowerCase()) {
                _msg=msg.split(" ");
                IRC.notice(from,result + " " + from + " " + _msg[0]);
              }
            }
            else
                IRC.notice_chan(from,"An unknown error has occurred.",constants.IRC_CHAN);
          }
        }
      }
      break;
    case 'reply':
      let parent = msg[1];
      msg.shift();
      msg.shift();
      _parent = await Database.findChit(parent);
      if(!_parent) {
        IRC.notice_chan(from,"Sorry, the parent post does not exist.",constants.IRC_CHAN);
      }
      else if(!await Database.userCanChit(from))
        IRC.notice_chan(from,"Sorry, you can only chit one chit per "+constants.CHIT_TIME_BETWEEN+" minutes",constants.IRC_CHAN);
      else if(msg.length<1)
        IRC.notice_chan(from,"Syntax error.  Try 'help'",constants.IRC_CHAN);
      else if(1) {
        msg=msg.join(' ');
        if(striptags(msg)!==msg)
          IRC.notice_chan(from,"Sorry, but these characters are not allowed in a chit.",constants.IRC_CHAN);
        else {
          if(striptags(msg)!==msg||msg.replace(/[^a-zA-Z0-9\,\-\.\'\"\?\!\%\$\#\@\(\)\*\+\~\\\/\:\;\[\]\{\}\=\& ]/g,"")!==msg)
            IRC.notice_chan(from,"Sorry, but these characters are not allowed in a chit.",constants.IRC_CHAN);
          else {
            result = await Database.reply(from,msg,parent);
            if(result) {
              await writeChit(_parent.NICK,parent);
              await writeChit(from,result);
              await writeChits(from);
              IRC.say(constants.IRC_CHAN,constants.BOLD+'['+result+'] Reply to ['+Math.round(parent)+'] posted by '+from+constants.BOLD+ " " + "https://chit.freenode.net/u/"+from.toLowerCase().replace("\\","~")+"/"+result+".html");
              IRC.notice_chan(from,constants.BOLD+'['+result+'] Reply to ['+Math.round(parent)+'] '+IRC.colour.red(msg)+' '+IRC.colour.grey('['+from+']')+constants.BOLD, constants.IRC_CHAN);
            }
            else
                IRC.notice_chan(from,"An unknown error has occurred or can't find parent.",constants.IRC_CHAN);
          }
        }
      }
      break;
    case 'vote':
      if(msg.length<2)
        IRC.notice_chan(from,"Syntax error.  Try 'help'",constants.IRC_CHAN);
      else {
        result = await Database.userCanVoteForChit(msg[1],from);
        switch(result) {
          case 0:
            IRC.notice_chan(from,"That chit does not exist.",constants.IRC_CHAN);
            break;
          case -1:
            IRC.notice_chan(from,"You cannot vote for your own chit.",constants.IRC_CHAN);
            break;
          case -2:
            IRC.notice_chan(from,"You can only vote once per chit",constants.IRC_CHAN);
            break;
          case 1:
            vote = await Database.userVoteForChit(msg[1],from);
            switch(vote) {
              case 0:
                IRC.notice_chan(from,"An unknown error has occurred.",constants.IRC_CHAN);
                break;
             case 1:
                let chit_data = await Database.findChit(Math.round(msg[1]));
                await writeChit(chit_data.NICK,Math.round(msg[1]));
                await writeChits(chit_data.NICK);
                IRC.say(constants.IRC_CHAN,constants.BOLD+'['+Math.round(msg[1])+'] Vote recorded from '+from+" for https://chit.freenode.net/u/"+chit_data.NICK.toLowerCase().replace("\\","~")+"/"+Math.round(msg[1])+".html"+constants.BOLD);
                break;
            }
            break;
        }
      }
      break;
    case 'del':
      if(msg.length < 2)
        IRC.notice_chan(from,"Syntax error.  Try 'help'",constants.IRC_CHAN);
      else {
        result = await Database.findChit(msg[1]);
        if(!result)
          IRC.notice_chan(from,"That chit does not exist",constants.IRC_CHAN);
        else if((result.NICK.toLowerCase()===from.toLowerCase() && !isop) || isop) {
          await Database.delChit(msg[1]);
          IRC.notice_chan(from,"Chit has been deleted.",constants.IRC_CHAN);
          IRC.say(constants.IRC_CHAN,"Chit ["+msg[1]+"] has been deleted"+(!isop?" by the original chitter.":"."));
          fs.unlinkSync(constants.HTML_INDEX+"/"+result.NICK.toLowerCase().replace("\\","~")+"/"+result.CID+".html");
          writeChits(result.NICK);
          if(result.PARENT!==null && result.PARENT!=='' && result.PARENT!==0) {
            let parent = await Database.findChit(result.PARENT);
            if(parent)
              writeChit(parent.NICK,parent.CID);
          }
        }
        else {
          IRC.notice_chan(from,"You do not have permission to delete that chit.",constants.IRC_CHAN);
        }
      }
      break;
    default:
      break;
  }
};

async function writeChit(nick,_chit) {
  let chit = await Database.findChit(_chit);
  if(!chit)
    return 0;
  else {
    let output="";
    let votes=await Database.countVotes(chit.CID);
    output+='<!--#include virtual="/head_user_1.html"-->';
    output+=nick+" - "+timestampToDate(chit.TIMESTAMP);
    output+='<!--#include virtual="/head_user_2.html"-->';
    output+='<div class="single_chit">';
    if(chit.PARENT!==null && chit.PARENT!=='' && chit.PARENT!==0) {
      let parent = await Database.findChit(chit.PARENT);
      if(parent) {
        output+='<span class="single_chit_reply">In reply to <a href="https://chit.freenode.net/u/'
              +parent.NICK.toLowerCase().replace("\\","~")
              +'/'
              +chit.PARENT
              +'.html">'
              +parent.NICK.toLowerCase()+' '+chit.PARENT+'</a></span>';
      }
    }
    output+='<span class="single_chit_timestamp">'+timestampToDate(chit.TIMESTAMP)+'</span>';
    output+='<span class="single_chit_author">'+nick.toLowerCase()+'</span>';
    output+='<span class="single_chit_text">'+chit.CHIT+'</span>';

    output+='<span class="single_chit_votes">'+votes+'</span>';
    let result = await Database.getReplies(chit.CID);
    output+='<span class="single_chit_replies">'+result.length+'</span>';
    output+='</div>';

    if(result && result.length>0) {
      for(x=0;x<result.length;x++) {
        let votes=await Database.countVotes(result[x].CID);
        output+='<a class="chit_link" href="/u/';
        output+=result[x].NICK.toLowerCase().replace('\\','~');
        output+='/';
        output+=result[x].CID+'.html"><div class="single_reply">';
        output+='<span class="single_reply_timestamp">'+timestampToDate(result[x].TIMESTAMP)+'</span>';
        output+='<span class="single_reply_author">'+result[x].NICK.toLowerCase()+'</span>';
        output+='<span class="single_reply_text">'+result[x].CHIT+'</span>';
        output+='<span class="single_reply_votes">'+votes+'</span>';
        let replies = await Database.getReplies(result[x].CID);
        output+='<span class="single_reply_replies">'+replies.length+'</span>';
        output+='</div></a>';

      }
    }

    output+='<!--#include virtual="/footer_user.html"-->';


    if(!fs.existsSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~")))
      fs.mkdirSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~"));

    fs.writeFileSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~")+"/"+_chit+".html",output);
    fs.chmodSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~")+"/"+_chit+".html",0755);
  }
}
async function writeChits(nick) {
  let chits = await Database.getChits(nick.toLowerCase());
  let output="";
  output+='<!--#include virtual="/head_user_1.html"-->';
  output+=nick;
  output+='<!--#include virtual="/head_user_2.html"-->';
  for(x=0;x<chits.length;x++) {
    let votes=await Database.countVotes(chits[x].CID);
    if(chits[x].PARENT!==null && chits[x].PARENT!=='' && chits[x].PARENT!==0) {
      let parent = await Database.findChit(chits[x].PARENT);
      if(parent)
        output+='<span class="single_chit_reply_main">In reply to <a href="https://chit.freenode.net/u/'
              +parent.NICK.toLowerCase().replace("\\","~")
              +'/'
              +chits[x].PARENT
              +'.html">'+parent.NICK.toLowerCase()+' '+chits[x].PARENT+'</a></span>';
      delete parent;
    }
    output+='<a class="chit_link" href="'+chits[x].CID+'.html"><div class="single_chit">';
    output+='<span class="single_chit_timestamp">'+timestampToDate(chits[x].TIMESTAMP)+'</span>';
    output+='<span class="single_chit_author">'+nick.toLowerCase()+'</span>';
    output+='<span class="single_chit_text">'+chits[x].CHIT+'</span>';
    output+='<span class="single_chit_votes">'+votes+'</span>';
    let replies = await Database.getReplies(chits[x].CID);
    output+='<span class="single_chit_replies">'+replies.length+'</span>';
    output+='</div></a>';
  }

  output+='<!--#include virtual="/footer_user.html"-->';
  if(!fs.existsSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~")))
    fs.mkdirSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~"));

  fs.writeFileSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~")+"/index.html",output);
  fs.chmodSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~")+"/index.html",0755);
  fs.writeFileSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~")+"/index.json",JSON.stringify(chits));
  fs.writeFileSync(constants.HTML_INDEX+"/"+nick.toLowerCase().replace("\\","~")+"/rss.xml",rss.createRSS(chits,nick));
}
function timestampToDate(tm) {
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
