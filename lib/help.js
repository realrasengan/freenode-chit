const header = `**** ChitBot Help ****`;
const footer = `**** End of Help ****`;

const help = `ChitBot is the central command for https://chit.freenode.net
Your chits will be available at https://chit.freenode.net/<your nick> - the following commands are available:
CHIT - Chit a message.
REPLY - Reply to a CHIT
VOTE - Vote on a CHIT
DEL - Delete a CHIT
You can also get more information with HELP <command>
**** End of Help ****`;

const chit = `CHIT lets you CHIT a message
Syntax: CHIT <message>
Example: CHIT I'm just shooting the chit.`;

const reply = `REPLY lets you CHIT a message in reply to a CHIT
Syntax: REPLY <id> <message>
Example: REPLY 24 That's a great message.`;

const vote = `VOTE lets you VOTE for a CHIT
Syntax: VOTE <chit id>
Example: VOTE 1135`;

const del = `DEL lets you delete a CHIT if you're an @ or the ORIGINAL CHITTER
Syntax: DEL <chit id>
Only ops and the original chitter can delete a chit
Example: DEL 1135`;

const none = `No such command `;

module.exports = {
  header,
  footer,
  help,
  chit,
  reply,
  vote,
  del,
  none
}
