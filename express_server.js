const log = console.log;

/// CONFIG ///
const express = require('express');
const PORT = 8080;
const app = express();

const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const bodyParser = require("body-parser");

const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers/helpers');
const { urlDatabase, userDB } = require('./data/data');

app.use(morgan('short'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieSession({
  name: 'session',
  keys: ['chocolatechipoatmealarethebest', 'raisinsaretheworstithinktheysuck'],
}));

app.set('view engine', 'ejs');



/// ROUTES ///

// HOME
app.get("/", (req, res) => {
  res.redirect('/urls');
});


// CREATE NEW URL
app.get("/urls/new", (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    return res.redirect('/login');
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: userDB[userID]
  };
  return res.render('urls_new', templateVars);
});


// DELETE URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    return res.render('./errors/noLogin');
  }
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  return res.redirect('/urls/');
});


// DISPLAY URL
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.userId;
  const shortURL = req.params.shortURL;
  let userUrlDatabase = urlsForUser(userID);
  const templateVars = {urls: userUrlDatabase, shortURL: shortURL, user: userDB[userID] };
  
  let urlFound = false;
  for (let url in userUrlDatabase) {
    if (url === shortURL) {
      urlFound = true;
    }
  }
  if (urlFound === true) {
    return res.render('urls_show', templateVars);
  }
  return res.render('./errors/error');
});


// PROCESS UPDATED URL
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    return res.render('./errors/noLogin');
  }
  const shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  if (!longURL.includes('http://')) {
    longURL = 'http://' + longURL;
  }
  urlDatabase[shortURL].longURL = longURL;
  return res.redirect('/urls/');
});


// REDIRECT SHORTURL TO LONGURL
app.get("/u/:shortURL", (req, res) => {
  const requestedShortURL = req.params.shortURL;
  for (let url in urlDatabase) {
    if (requestedShortURL === url) {
      const longURL = urlDatabase[req.params.shortURL].longURL;
      return res.redirect(longURL);
    }
  }
  return res.status(400).send("URL not found in database");
});


// LIST OF URLS
app.get("/urls", (req, res) => {
  const userID = req.session.userId;
  let userUrlDatabase = urlsForUser(userID);
  const templateVars = {urls: userUrlDatabase, user: userDB[userID] };
  if (!userID) {
    return res.render('./errors/noLogin', templateVars);
  }
  return res.render('urls_index', templateVars);
});


// PROCESS CREATE NEW URL
app.post("/urls", (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    return res.status(400).send("User must be logged in to create a short URL\n");
  }
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  if (!longURL.includes('http://')) {
    longURL = 'http://' + longURL;
  }
  urlDatabase[shortURL] = { longURL: longURL, userID: userID };
  return res.redirect(`urls/${shortURL}`);
});


//REGISTER FORM
app.get("/register", (req, res) => {
  const templateVars = {};
  return res.render('register', templateVars);
});


// PROCESS REGISTER FORM
app.post("/register", (req, res) => {
  let userID = generateRandomString();
  const { email, password } = req.body;
  let hashedPassword = bcrypt.hashSync(password, 10);
  let newUser = { id: userID, email: email, password: hashedPassword };
  log('newUser:', newUser)
  if (newUser.email.length === 0) {
    return res.status(400).send('please provide an email');
  }
  if (password.length === 0) {
    log('newUser.password:', newUser.password)
    return res.status(400).send('please provide a password');
  }
  if (getUserByEmail(newUser.email, userDB)) {
    return res.status(400).send('email already exists in database');
  }
  userDB[userID] = newUser;
  req.session.userId = userID;
  return res.redirect('/urls');
});


// LOGIN FORM
app.get("/login", (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    const templateVars = {};
    return res.render('login', templateVars);
  }
  return res.redirect('/urls');
});


// PROCESS LOGIN FORM
app.post("/login", (req, res) => {
  const { email, password }  = req.body;
  let currentUserID = getUserByEmail(email, userDB);
  if (!currentUserID) {
    return res.status(403).send('email not found');
  }
  if (!bcrypt.compareSync(password, userDB[currentUserID].password)) {
    return res.status(403).send('password does not match');
  }
  if (email === userDB[currentUserID].email && bcrypt.compareSync(password, userDB[currentUserID].password)) {
    req.session.userId = currentUserID;
    return res.redirect('/urls');
  }
});


// LOGOUT
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect('/urls');
});


// DASHBOARD
app.get("/urls.json", (req, res) => {
  return res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Tinyapp is listening on port ${PORT}`);
});