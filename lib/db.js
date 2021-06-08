// Database
const constants = require("./constants.js");

class Database {
  constructor() {
    this.db=0;
    require('sqlite-async').open(constants.DATABASE_FILE).then(_db => { this.db = _db});
  }

  // Get PAGE_LIMIT number of results in order of newest first, where newest means the most recent.
  // Returns results as array
  async getChits(nick) {
    let results = await this.db.all("SELECT * FROM CHITS WHERE NICK = ? AND ISDELETED=0 ORDER BY TIMESTAMP DESC LIMIT "+constants.PAGE_LIMIT,nick.toLowerCase());
    return results;
  }

  // Check if user is chiting too frequently
  // Returns true or false
  async userCanChit(nick) {
    let results = await this.db.all("SELECT * FROM CHITS WHERE NICK = ? AND TIMESTAMP > ? AND ISDELETED = 0",nick.toLowerCase(),Math.floor(Date.now()/1000)-(60*constants.CHIT_TIME_BETWEEN));
    if(results.length > 0)
      return false;
    return true;
  }


  // Chit
  // Returns last id or 0
  async chit(nick,msg) {
    let results = await this.db.run("INSERT INTO CHITS (NICK,CHIT,TIMESTAMP,ISDELETED) VALUES (?,?,?,?)",
                        nick.toLowerCase(),msg,Math.floor(Date.now()/1000),0);
    if(results.lastID)
      return results.lastID;
    return 0;
  }

  // Check if chit can be voted on
  // 0 if not found -1 if same nick, -2 if already voted, 1 if user can vote.
  async userCanVoteForChit(cid,nick) {
    let results = await this.db.all("SELECT * FROM CHITS WHERE CID = ? AND ISDELETED = 0",cid);
    if(results.length === 0)
      return 0;
    if(results[0].NICK.toLowerCase()===nick.toLowerCase())
      return -1;
    results = await this.db.all("SELECT * FROM VOTES WHERE NICK = ? AND CID = ?",nick,cid);
    if(results.length > 0)
      return -2;
    return 1;
  }

  // Vote
  // 1 if it just voted, 0 if the vote didnt work.
  async userVoteForChit(cid,nick) {
    let results = await this.db.run("INSERT INTO VOTES (CID,NICK) VALUES (?,?)",cid,nick);
    if(results.lastID) {
      return 1;
    }
    return 0;
  }

  // findChit
  // return chit
  async findChit(cid) {
    let results = await this.db.all("SELECT * FROM CHITS WHERE CID = ? AND ISDELETED = 0",cid);
    if(results.length === 0)
      return 0;
    return results[0];
  }

  // deleteChit
  // Deletes a chit if it exists
  async delChit(cid) {
    await this.db.run("UPDATE CHITS SET ISDELETED = 1 WHERE CID = ?",cid);
  }

  // countVotes
  // Get num of votes
  async countVotes(cid) {
    let results = await this.db.all("SELECT * FROM VOTES WHERE CID = ?",cid);
    return results.length;
  }

  // userIsRegistered
  // true or false
  async userIsRegistered(nick) {
    let results = await this.db.all("SELECT * FROM NICKS WHERE NICK = ?",nick.toLowerCase());
    if(results.length>0)
      return true;
    return false;
  }

  // userRegister
  async userRegister(nick) {
    if(await this.userIsRegistered(nick))
      return false;
    else {
      let results = await this.db.run("INSERT INTO NICKS (NICK) VALUES (?)",nick.toLowerCase());
      if(results.lastID)
        return true;
      return false;
    }
  }
};

module.exports = {
  Database
}
