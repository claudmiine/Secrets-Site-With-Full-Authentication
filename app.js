//jshint esversion:6
require("dotenv").config(); //environment variable //always on top
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds  = 10;
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({  
    extended: true
}));

/*Start mongoDB server*/
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true});
//it is an object created from mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model("User", userSchema);

app.get('/', (req, res) =>{
    res.render("home")
});

app.route('/login') 
    .get((req, res) =>{
        res.render("login")
    }) 
    .post((req, res)=>{
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email: username}, (err, foundUSer)=>{
            if (err) {
                console.log(err);
            } else {
                if (foundUSer) {
                    bcrypt.compare(password, foundUSer.password, function(err, result) {
                        if (result === true) {
                            res.render("secrets")
                        }
                    });
                }
            }
        });
    });

app.route("/register")

    .get((req, res)=>{
        res.render("register");
    })
    .post((req, res)=>{

        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            
        const newUser = new User({
            email: req.body.username,
            password: hash
        });

        newUser.save((err)=> {
           if (err) {
               console.log(err);
           } else {
               res.render("secrets");
           }
        });
        });

    });


app.listen(3000, () => {
    console.log("Server started on port 3000.")
});