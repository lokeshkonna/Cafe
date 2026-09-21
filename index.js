const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const userschema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String },
});

const user = mongoose.model("user", userschema, "user");

mongoose.connect(process.env.mongodb)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    // If user already has a valid token when visiting GET /login, send them to /tables
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.jwtSecret);
            return res.redirect("/tables");
        } catch (err) {
            res.clearCookie("token");
        }
    }
    res.render("login");
});

app.get("/tables", (req, res) => {
    const data = req.cookies.token ? jwt.verify(req.cookies.token, process.env.jwtSecret) : null;
    if (!data) {
        return res.redirect("/login");
    }
    res.render("tables",{ user: data.name });    
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await user.create({ name, email, password: hashedPassword });
        res.redirect("/login");
    } catch (err) {
        res.redirect("/register");
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await user.findOne({ email });
        if (!existingUser) {
            return res.redirect("/register");
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.redirect("/login");
        }

        const newToken = jwt.sign({ id: existingUser._id }, process.env.jwtSecret, { expiresIn: "1h" });
        res.cookie("token", newToken, { httpOnly: true });
        return res.redirect("/tables");
    } catch (err) {
        console.error("Login Error:", err);
        return res.redirect("/login");
    }
});





app.listen(5005, () => {
    console.log("http://localhost:5005");
});