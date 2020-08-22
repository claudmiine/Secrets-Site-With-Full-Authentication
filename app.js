//jshint esversion:6
require("dotenv").config(); //environment variable //always on top
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({  
    extended: true
}));

app.use(session({    //set up a session
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize()); // comes with passport and it just initializing for auth.
  app.use(passport.session()) // use the session to manage

  //Google OA2.0
  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfile: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//FACEBOOK
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile)
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


/*Start mongoDB server*/
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
//it is an object created from mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose); //to hash and salt passwords, also save users to dataDB
userSchema.plugin(findOrCreate); //mongoose plugin

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //to authenticate user, create local strategy

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

app.get('/', (req, res) =>{
    res.render("home")
});

//ROUTES

app.route("/secrets")
.get((req, res) => {
    if (req.isAuthenticated) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.route('/login') 
    .get((req, res) => {
        res.render("login");
    }) 
    .post((req, res) => {
        const user = new User ({
            username: req.body.username,
            password: req.body.password
        });
        req.login(user, (err) => { //method from passport
            if (err) {
                console.log(err)
            } else {
                passport.authenticate("local")(req, res, function(){ ////stategy from passport, allows cookie to store user credentials
                    res.redirect("/secrets")
                }); 
            }
        });
    });
    
    
app.route("/register")

    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        User.register(
            {username: req.body.username},
             req.body.password, (err, user) => { //!!!SPRAWDZ
            if (err) {
                console.log(err);
                res.redirect("/register")
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
        });
    });
    
app.route("/logout")
    .get((req, res) => {
       req.logOut();
       res.redirect("/");
    });
//GOOGLE    
app.get("/auth/google",
    passport.authenticate("google", 
    {scope: ["profile"]
    }));
    
app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/secrets');
     });

//FACEBOOK
app.get('/auth/facebook',
  passport.authenticate('facebook')
);

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' } ),
  function(Req, res) {
       // Successful authentication, redirect secrets page.
      res.redirect("/secrets");
  });

app.listen(3000, () => {
    console.log("Server started on port 3000.")
});

//Passport allows website to remember when a user is already logged in, cookies are remembered, session is not interrupted 
//so users dont have to keep logging in. It's all saved in cookie.