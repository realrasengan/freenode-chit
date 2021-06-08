// User Input Constants
const CHIT_TIME_BETWEEN = 10; // minimum time between chits

// Page Constants
const PAGE_LIMIT = 50; // Number of chits to display

// Password
const PASSWORD_FILE = "/home/shellsuser/Software/chitbot/.password";

// Db
const DATABASE_FILE = '/home/shellsuser/Software/chitbot/bot.db';

// Output
const HTML_INDEX = "/home/shellsuser/Software/chitbot/output";

// Bold
const BOLD = String.fromCharCode(2);

// IRC
const IRC_SERVER = "chat.freenode.net";
const IRC_NICK = "ChitBot";
const IRC_USER = "chitbot";
const IRC_GECOS = "freenode chit";
const IRC_CHAN = "#freenode-chit";

module.exports = {
  CHIT_TIME_BETWEEN,
  PAGE_LIMIT,
  PASSWORD_FILE,
  DATABASE_FILE,
  HTML_INDEX,
  BOLD,
  IRC_SERVER,
  IRC_NICK,
  IRC_USER,
  IRC_GECOS,
  IRC_CHAN
}
