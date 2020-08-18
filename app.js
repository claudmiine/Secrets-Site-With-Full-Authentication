//jshint esversion:6
require("dotenv").config(); //environment variable //always on top
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

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

/*Start mongoDB server*/
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
//it is an object created from mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose); //to hash and salt passwords, also save users to dataDB

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //to authenticate user, create local strategy

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) =>{
    res.render("home")
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
    
app.route("/secrets")
.get((req, res) => {
    if (req.isAuthenticated) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});
    

app.route("/register")

    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        User.register(
            {username: req.body.username},
             req.body.password, (err, user) => {
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
    

app.listen(3000, () => {
    console.log("Server started on port 3000.")
});