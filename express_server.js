// CONFIG

const express = require("express");
const PORT = 8080;
const app = express();

const morgan = require('morgan');
app.use(morgan('short'));

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

// DATABASE

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  res.render("urls_new");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  console.log(shortURL)
  delete urlDatabase[shortURL];
  res.redirect('/urls/');
});

app.get("/urls/:shortURL", (req, res) => {
  console.log(urlDatabase);
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls/')
  // console.log('hello')
});

app.get("/u/:shortURL", (req, res) => {
  // const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString()
  let longURL = req.body.longURL;  // Log the POST request body to the console
  if (!longURL.includes('http://')) {
    longURL = 'http://' + longURL
  }
  urlDatabase[shortURL] = longURL
  res.redirect(`urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});


app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`)
});