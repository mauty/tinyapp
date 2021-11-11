const log = console.log

/// CONFIG ///
const express = require("express");
const PORT = 8080;
const app = express();

const morgan = require('morgan');
const cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const bodyParser = require("body-parser");

const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers/helpers");
const { urlDatabase, userDB } = require("./data/data");

app.use(morgan('short'));
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieSession({
  name: 'session',
  keys: ['chocolatechipoatmealarethebest', 'raisinsaretheworstithinktheysuck'],
}))

app.set("view engine", "ejs");



/// ROUTES ///

// HOME
app.get("/", (req, res) => {
  res.redirect("/urls");
});


// CREATE NEW URL
app.get("/urls/new", (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    res.redirect('/urls')
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: userDB[userID]
  };
  res.render("urls_new", templateVars);
});


// DELETE URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    res.render('noLogin')
  }
  const shortURL = req.params.shortURL
  console.log(shortURL)
  delete urlDatabase[shortURL];
  res.redirect('/urls/');
});


// DISPLAY URL
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"];
  const shortURL = req.params.shortURL
  let userUrlDatabase = urlsForUser(userID);
  const templateVars = {urls: userUrlDatabase, shortURL: shortURL, user: userDB[userID] };
  
  let urlFound = false;
  for (let url in userUrlDatabase) {
    if (url === shortURL) {
      urlFound = true;
    }
  }
  if (urlFound === true) {
    res.render("urls_show", templateVars);
  };
  res.render('error')
});


// PROCESS UPDATED URL
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    res.render('noLogin')
  }
  console.log('req.params.shortURL=>', req.params)
  const shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  if (!longURL.includes('http://')) {
    longURL = 'http://' + longURL
  }
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls/')
});


// REDIRECT SHORTURL TO LONGURL
app.get("/u/:shortURL", (req, res) => {
  const requestedShortURL = req.params.shortURL
  for (let url in urlDatabase) {
    if (requestedShortURL === url ) {
      const longURL = urlDatabase[req.params.shortURL].longURL
      res.redirect(longURL);
    }
  }
  res.status(400).send("URL not found in database")
});


// LIST OF URLS
app.get("/urls", (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    res.render('noLogin')
  }
  let userUrlDatabase = urlsForUser(userID);
  const templateVars = {urls: userUrlDatabase, user: userDB[userID] };
  res.render("urls_index", templateVars);
});


// PROCESS CREATE NEW URL
app.post("/urls", (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    res.status(400).send("User must be logged in to create a short URL\n")
    return;
  }
  let shortURL = generateRandomString()
  let longURL = req.body.longURL;  // Log the POST request body to the console
  if (!longURL.includes('http://')) {
    longURL = 'http://' + longURL
  }
  urlDatabase[shortURL] = { longURL: longURL, userID: userID }
  res.redirect(`urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});


//REGISTER FORM
app.get("/register", (req, res) => {
  const templateVars = {}
  res.render("register", templateVars)
});


// PROCESS REGISTER FORM
app.post("/register", (req, res) => {
  let userID = generateRandomString()
  const { email, password } = req.body;
  let hashedPassword = bcrypt.hashSync(password, 10);
  let newUser = { id: userID, email: email, password: hashedPassword }
  if (newUser.email.length === 0 || newUser.password.length === 0) {
    res.status(400).send('please provide an email and password')
    return;
  }
  if (getUserByEmail(newUser.email, userDB)) {
    res.status(400).send('email already exists in database')
    return;
  }
  userDB[userID] = newUser;
  req.session.user_id = userID;
  res.redirect('/urls')
});


// LOGIN FORM
app.get("/login", (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    const templateVars = {}
    res.render("login", templateVars)
  } else {
    res.redirect('/urls')
  }
});


// PROCESS LOGIN FORM
app.post("/login", (req, res) => {
  const { email, password }  = req.body;
  let currentUserID = getUserByEmail(email, userDB)
  if (!currentUserID) {
    res.status(403).send('email not found')
  }
  if (!bcrypt.compareSync(password, userDB[currentUserID].password)) {
    res.status(403).send('password does not match')
  }
  if (email === userDB[currentUserID].email && bcrypt.compareSync(password, userDB[currentUserID].password)) {
    req.session.user_id = currentUserID;
    res.redirect('/urls');
  }
});


// LOGOUT
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


// DASHBOARD
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Tinyapp is listening on port ${PORT}`)
});