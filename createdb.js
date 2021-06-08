const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

if(!fs.existsSync('./bot.db')) {
  let db = new sqlite3.Database('./bot.db', function(err) {
    if (err) {
      console.error(err.message);
    }
    else {
      db.run(`CREATE TABLE CHITS(
                CID INTEGER PRIMARY KEY AUTOINCREMENT,
                CHIT TEXT,
                NICK CHAR(32),
                TIMESTAMP INTEGER,
                ISDELETED INTEGER
              );`);
      db.run(`CREATE TABLE VOTES(
                VID INTEGER PRIMARY KEY AUTOINCREMENT,
                CID INTEGER,
                NICK CHAR(32)
              );`);
      db.run(`CREATE TABLE NICKS(
                NID INTEGER PRIMARY KEY AUTOINCREMENT,
                NICK CHAR(32),
                TIMESTAMP INTEGER
              );`);
      console.log("Completed creation of bot.db");
    }
  });
}
else {
  console.log("bot.db file already exists.");
}
