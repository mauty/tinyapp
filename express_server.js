const log = console.log

// CONFIG

const express = require("express");
const PORT = 8080;
const app = express();

const morgan = require('morgan');
app.use(morgan('short'));

const cookieParser = require('cookie-parser');
app.use(cookieParser())


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));


app.set("view engine", "ejs");

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

const emailLookup = (email) => {
  log(email)
  for (let user in users) {
    if (email === users[user].email) {
      return user;
    } 
  }
  return null;
} 

// DATABASE

let urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "qM7hmG"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "qM7hmG"
  }
};

const users = { 
  "qM7hmG": {
    id: "qM7hmG", 
    email: "user@example.com", 
    password: "456"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

// ROUTES

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.redirect('/urls')
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[userID]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  console.log(shortURL)
  delete urlDatabase[shortURL];
  res.redirect('/urls/');
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[userID]
  };
  res.render("urls_show", templateVars);
});

// Update a URL
app.post("/urls/:shortURL", (req, res) => {
  console.log('req.params.shortURL=>', req.params)
  const shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  if (!longURL.includes('http://')) {
    longURL = 'http://' + longURL
  }
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls/')
  // console.log('hello')
});

app.get("/u/:shortURL", (req, res) => {
  // const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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
  const userID = req.cookies["user_id"];
  // log(userID)
  const templateVars = {urls: urlDatabase, user: users[userID] };
  // log('templateVars:',templateVars)
  // log('user email:',users[userID].email)
  log('urlDatabase:',urlDatabase)
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
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

app.get("/register", (req, res) => {
  const templateVars = {}
  res.render("register", templateVars)
});

app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    const templateVars = {}
    res.render("login", templateVars)
  } else {
    res.redirect('/urls')
  }
});



// REGISTER FORM POST
app.post("/register", (req, res) => {
  let userID = generateRandomString()
  let newUser = { id: userID, email: req.body.email, password: req.body.password }
  if (newUser.email.length === 0 || newUser.password.length === 0) {
    res.status(400).send('please provide an email and password')
    return;
  }
  if (emailLookup(newUser.email)) {
    res.status(400).send('email already exists in database')
    // res.redirect('/register')
    return;
  }
  users[userID] = newUser;
  log('userDB:', users)
  res.cookie('user_id', userID)
  res.redirect('/urls')
});

app.post("/login", (req, res) => {
  // lookup email in user 
  let enteredEmail = req.body.email;
  let enteredPassword = req.body.password;
  let currentUserID = emailLookup(enteredEmail)
  if (!currentUserID) {
    res.status(403).send('email not found')
  }
  if (enteredPassword !== users[currentUserID].password ) {
    res.status(403).send('password does not match')
  }
  if ((enteredEmail === users[currentUserID].email && enteredPassword === users[currentUserID].password)) {
    res.cookie('user_id', currentUserID);
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  log('clear?')
  res.clearCookie('user_id');
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`)
});