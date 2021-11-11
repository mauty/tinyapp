const { urlDatabase, userDB } = require("../data/data.js");

// HELPER FUNCTIONS

function generateRandomString() {
  let result           = '';
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const getUserByEmail = (email, database) => {
  for (let userID in database) {
    if (email === database[userID].email) {
      return userID;
    } 
  }
  return null;
}

const urlsForUser = (id) => {
  let userUrlDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrlDatabase[url] = {
        longURL: urlDatabase[url].longURL,
        userID: id,
      }
    }
  }
  return userUrlDatabase;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
}