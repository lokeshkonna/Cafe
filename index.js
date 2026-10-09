const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const methodOverride = require("method-override");

dotenv.config();


// ==============================
// APP CONFIGURATION
// ==============================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));


// ==============================
// EMPLOYEE SCHEMA
// ==============================

const empSchema = new mongoose.Schema({
    name: {
        type: String
    },

    empid: {
        type: Number
    },

    email: {
        type: String
    },

    password: {
        type: String
    }
});


// ==============================
// USER SCHEMA
// ==============================

const userschema = new mongoose.Schema({
    name: {
        type: String
    },

    email: {
        type: String
    },

    password: {
        type: String
    }
});


// ==============================
// TABLE SCHEMA
// ==============================

const tablesSchema = new mongoose.Schema({
    tableId: {
        type: Number
    },

    tableNumber: {
        type: Number
    },

    status: {
        type: String
    }
});


// ==============================
// MENU SCHEMA
// ==============================

const menuSchema = new mongoose.Schema({

    itemName: {
        type: String
    },

    category: {
        type: String
    },

    price: {
        type: Number
    },

    status: {
        type: String
    },

    image: {
        type: String
    }
});


// ==============================
// FEEDBACK SCHEMA
// ==============================

const feedbackSchema = new mongoose.Schema({

    name: {
        type: String
    },

    email: {
        type: String
    },

    message: {
        type: String
    }
});


// ==============================
// ORDER SCHEMA
// ==============================
//
// This schema stores the information required
// for the live order page and order history.
//

const orderSchema = new mongoose.Schema({

    itemName: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    image: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        required: true,
        default: "Received"
    },

    date: {
        type: String,
        required: true
    },

    table: {
        type: Number,
        required: true
    },

    mail: {
        type: String,
        required: true
    }
});


// ==============================
// MODELS
// ==============================

const history = mongoose.model(
    "history",
    orderSchema,
    "history"
);

const feedback = mongoose.model(
    "feedback",
    feedbackSchema,
    "feedback"
);

const tables = mongoose.model(
    "tables",
    tablesSchema,
    "tables"
);

const menu = mongoose.model(
    "menu",
    menuSchema,
    "menu"
);

const user = mongoose.model(
    "user",
    userschema,
    "user"
);

const emp = mongoose.model(
    "emp",
    empSchema,
    "emp"
);

const order = mongoose.model(
    "order",
    orderSchema,
    "order"
);


// ==============================
// MONGODB CONNECTION
// ==============================

mongoose.connect(process.env.mongodb)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.log("MongoDB connection error:", err);
    });


// ==============================
// BASIC ROUTES
// ==============================

app.get("/", (req, res) => {
    res.render("index");
});


app.get("/index", (req, res) => {
    res.render("index");
});


app.get("/about", (req, res) => {
    res.render("about");
});


app.get("/contact", (req, res) => {
    res.render("contact");
});


app.get("/customer_profile", (req, res) => {
    res.render("customer_profile");
});


app.get("/menu-item", (req, res) => {
    res.render("menu-item");
});


// ==============================
// LOGIN PAGE
// ==============================

app.get("/login", (req, res) => {

    const token = req.cookies.token;

    if (token) {

        try {

            jwt.verify(
                token,
                process.env.jwtSecret
            );

            return res.redirect("/tables");

        } catch (err) {

            res.clearCookie("token");
        }
    }

    res.render("login");
});


// ==============================
// DASHBOARD
// ==============================

app.get("/dashboard", (req, res) => {

    res.render("dashboard");

});


// ==============================
// CUSTOMER REGISTER
// ==============================

app.get("/register", (req, res) => {

    res.render("register");

});


app.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        const hashedPassword =
            await bcrypt.hash(password, 10);


        await user.create({

            name: name,

            email: email,

            password: hashedPassword

        });


        res.redirect("/login");

    } catch (err) {

        console.error(
            "Registration Error:",
            err
        );

        res.redirect("/register");
    }

});


// ==============================
// CUSTOMER LOGIN
// ==============================

app.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        const existingUser =
            await user.findOne({
                email: email
            });


        if (!existingUser) {

            return res.redirect("/register");

        }


        const isPasswordValid =
            await bcrypt.compare(
                password,
                existingUser.password
            );


        if (!isPasswordValid) {

            return res.redirect("/login");

        }


        const newToken =
            jwt.sign(
                {
                    id: existingUser._id
                },

                process.env.jwtSecret,

                {
                    expiresIn: "1h"
                }
            );


        res.cookie(
            "token",
            newToken,
            {
                httpOnly: true
            }
        );


        return res.redirect("/tables");

    } catch (err) {

        console.error(
            "Login Error:",
            err
        );

        return res.redirect("/login");
    }

});


// ==============================
// STAFF LOGIN
// ==============================

app.post("/loginStaff", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide your Staff ID/Email and password."

            });

        }


        const existingUser =
            await emp.findOne({
                email: email
            });


        if (!existingUser) {

            return res.status(404).json({

                success: false,

                message:
                    "Staff member not found. Please register.",

                redirectUrl: "/register"

            });

        }


        const isPasswordValid =
            await bcrypt.compare(
                password,
                existingUser.password
            );


        if (!isPasswordValid) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid Staff ID/Email or password."

            });

        }


        const newToken =
            jwt.sign(

                {
                    id: existingUser._id
                },

                process.env.jwtSecret,

                {
                    expiresIn: "1h"
                }

            );


        res.cookie(
            "token",
            newToken,
            {
                httpOnly: true
            }
        );


        return res.status(200).json({

            success: true,

            redirectUrl: "/dashboard"

        });


    } catch (err) {

        console.error(
            "Staff Login Error:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "An error occurred on the server. Please try again."

        });

    }

});


// ==============================
// TABLES
// ==============================

app.get("/tables", async (req, res) => {

    try {

        const token =
            req.cookies.token;


        if (!token) {

            return res.redirect("/login");

        }


        const data =
            jwt.verify(
                token,
                process.env.jwtSecret
            );


        const userData =
            await user.findById(data.id);


        if (!userData) {

            res.clearCookie("token");

            return res.redirect("/login");

        }


        const tablesData =
            await tables.find();


        res.render(
            "tables",
            {
                user: userData,
                data: tablesData
            }
        );


    } catch (err) {

        console.error(
            "Tables Error:",
            err
        );

        res.clearCookie("token");

        return res.redirect("/login");

    }

});


// ==============================
// SELECT TABLE
// ==============================

app.post("/tables/:id", async (req, res) => {

    try {

        const tableId =
            Number(req.params.id);


        const updatedTable =
            await tables.findOneAndUpdate(

                {
                    tableId: tableId,

                    status: "available"
                },

                {
                    $set: {
                        status: "occupied"
                    }
                },

                {
                    new: true
                }

            );


        if (!updatedTable) {

            return res
                .status(400)
                .send("Table is not available.");

        }


        res.redirect("/menu");


    } catch (err) {

        console.error(
            "Error updating table status:",
            err
        );

        res.redirect("/tables");

    }

});


// ==============================
// CUSTOMER MENU
// ==============================

app.get("/menu", async (req, res) => {

    try {

        const menuData =
            await menu.find();


        res.render(
            "menu-item",
            {
                data: menuData
            }
        );


    } catch (err) {

        console.error(
            "Menu Error:",
            err
        );

        res.redirect("/tables");

    }

});


// ==============================
// STAFF MENU
// ==============================

app.get("/staffMenu", async (req, res) => {

    try {

        const data =
            await menu.find();


        res.render(
            "staff_inventory",
            {
                data: data
            }
        );


    } catch (err) {

        console.error(
            "Staff Menu Error:",
            err
        );

        res.status(500).send(
            "Unable to load staff menu."
        );

    }

});


// ==============================
// EDIT MENU ITEM
// ==============================

app.post("/edit/:id", async (req, res) => {

    try {

        const itemId =
            req.params.id;


        const {
            itemName,
            category,
            price,
            status,
            image
        } = req.body;


        await menu.findByIdAndUpdate(

            itemId,

            {
                itemName,
                category,
                price,
                status,
                image
            },

            {
                new: true
            }

        );


        res.redirect("/staffMenu");


    } catch (err) {

        console.error(
            "Edit Menu Error:",
            err
        );

        res.redirect("/staffMenu");

    }

});


// ==============================
// EDIT MENU PAGE
// ==============================

app.get("/staffMenu/:id", async (req, res) => {

    try {

        const itemId =
            req.params.id;


        const item =
            await menu.findById(itemId);


        if (!item) {

            return res
                .status(404)
                .send("Menu item not found.");

        }


        res.render(
            "editMenu",
            {
                item: item
            }
        );


    } catch (err) {

        console.error(
            "Edit Menu Page Error:",
            err
        );

        res.redirect("/staffMenu");

    }

});


// ==============================
// DELETE MENU ITEM
// ==============================

app.post("/delete/:id", async (req, res) => {

    try {

        const itemId =
            req.params.id;


        await menu.findByIdAndDelete(
            itemId
        );


        res.redirect("/staffMenu");


    } catch (err) {

        console.error(
            "Delete Menu Error:",
            err
        );

        res.redirect("/staffMenu");

    }

});


// ==============================
// ADD MENU ITEM
// ==============================

app.post("/add", async (req, res) => {

    try {

        const {
            itemName,
            category,
            price,
            status,
            image
        } = req.body;


        const newItem =
            new menu({

                itemName,

                category,

                price,

                status,

                image

            });


        await newItem.save();


        res.redirect("/staffMenu");


    } catch (err) {

        console.error(
            "Add Menu Error:",
            err
        );

        res.redirect("/addMenu");

    }

});


// ==============================
// ADD MENU PAGE
// ==============================

app.get("/addMenu", (req, res) => {

    res.render("addMenu");

});


// ==============================
// TRANSACTION PAGE
// ==============================

app.get("/transaction/:id", async (req, res) => {

    try {

        const itemId =
            req.params.id;


        const item =
            await menu.findById(itemId);


        if (!item) {

            return res
                .status(404)
                .send("Menu item not found.");

        }


        const tableNumber =
            req.query.tableNumber;


        res.render(
            "transaction",
            {
                item: item,
                tableNumber: tableNumber
            }
        );


    } catch (err) {

        console.error(
            "Transaction Error:",
            err
        );

        res.redirect("/menu");

    }

});


// ==============================
// LIVE ORDER STATUS
// ==============================

app.get("/liveOrder/:id", async (req, res) => {

    try {

        const orderId =
            req.params.id;


        // Check whether the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(orderId)) {

            return res
                .status(400)
                .send("Invalid order ID.");

        }


        // Find the order
        const orderData =
            await order
                .findById(orderId)
                .lean();


        // If order does not exist
        if (!orderData) {

            return res
                .status(404)
                .send("Order not found.");

        }


        // Find corresponding menu item
        // to get its image and other menu information.
        const menuItem =
            await menu
                .findOne({
                    itemName: orderData.itemName
                })
                .lean();


        res.render(
            "customer_order_status",
            {
                orderData: orderData,

                menuItem: menuItem
            }
        );


    } catch (err) {

        console.error(
            "Live Order Error:",
            err
        );


        return res
            .status(500)
            .send(
                "Unable to load this order right now."
            );

    }

});


// ==============================
// OLD CUSTOMER ORDER STATUS ROUTE
// ==============================
//
// Keep this route only if you need to open
// the page without a specific order.
//

app.get("/customer_order_status", (req, res) => {

    res.render(
        "customer_order_status",
        {
            orderData: null,

            menuItem: null
        }
    );

});


// ==============================
// CONTACT / FEEDBACK
// ==============================

app.post("/contact", async (req, res) => {

    try {

        const {
            name,
            email,
            message
        } = req.body;


        const newFeedback =
            new feedback({

                name,

                email,

                message

            });


        await newFeedback.save();


        res.redirect("/contact");


    } catch (err) {

        console.error(
            "Contact Error:",
            err
        );

        res.redirect("/contact");

    }

});


// ==============================
// ORDER HISTORY
// ==============================

app.get("/history", async (req, res) => {

    const token =
        req.cookies.token;


    console.log(
        "Token:",
        token
    );


    try {

        if (!token) {

            return res.redirect("/login");

        }


        const data =
            jwt.verify(
                token,
                process.env.jwtSecret
            );


        const userData =
            await user.findById(data.id);


        if (!userData) {

            res.clearCookie("token");

            return res.redirect("/login");

        }


        const orders =
            await history.find({

                mail: userData.email

            });


        console.log(
            "Orders:",
            orders
        );


        res.render(
            "previous-orders",
            {
                data: orders
            }
        );


    } catch (err) {

        console.error(
            "Error fetching order history:",
            err
        );


        res.clearCookie("token");


        return res.redirect("/login");

    }

});


// ==============================
// LOGOUT
// ==============================

app.get("/logout", (req, res) => {

    res.clearCookie("token");

    res.redirect("/login");

});


app.get("/logoutStaff", (req, res) => {

    res.clearCookie("token");

    res.redirect("/login");

});


// ==============================
// START SERVER
// ==============================

app.listen(5005, () => {

    console.log(
        "http://localhost:5005"
    );

});