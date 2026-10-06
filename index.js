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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));

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

const feedback = mongoose.model("feedback", feedbackSchema, "feedback");
const tables = mongoose.model("tables", tablesSchema, "tables");
const menu = mongoose.model("menu", menuSchema, "menu");
const user = mongoose.model("user", userschema, "user");
const emp = mongoose.model("emp", empSchema, "emp");

mongoose.connect(process.env.mongodb)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.log("MongoDB connection error:", err);
    });

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
app.get("/customer_order_status", (req, res) => {
    res.render("customer_order_status");
});
app.get("/login", (req, res) => {
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


app.get("/dashboard", (req, res) => {
    const token = req.cookies.token;
    res.render("dashboard");
});

app.post("/loginStaff",async (req, res) => {
    const token = req.cookies.token; 
    
     try {
        const { email, password } = req.body;

        const existingUser = await emp.findOne({ email });

        if (!existingUser) {
            return res.redirect("/register");
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            existingUser.password
        );


        if (!isPasswordValid) {
            return res.redirect("/login");
        }

        const newToken = jwt.sign(
            {
                id: existingUser._id
            },
            process.env.jwtSecret,
            {
                expiresIn: "1h"
            }
        );

        res.cookie("token", newToken, {
            httpOnly: true
        });

        return res.redirect("/dashboard");

    } catch (err) {
        console.error("Login Error:", err);
        return res.redirect("/login");
    }



});


app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await user.create({
            name,
            email,
            password: hashedPassword
        });

        res.redirect("/login");

    } catch (err) {
        console.error("Registration Error:", err);
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

        const isPasswordValid = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!isPasswordValid) {
            return res.redirect("/login");
        }

        const newToken = jwt.sign(
            {
                id: existingUser._id
            },
            process.env.jwtSecret,
            {
                expiresIn: "1h"
            }
        );

        res.cookie("token", newToken, {
            httpOnly: true
        });

        return res.redirect("/tables");

    } catch (err) {
        console.error("Login Error:", err);
        return res.redirect("/login");
    }
});

app.get("/tables", async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.redirect("/login");
        }

        const data = jwt.verify(
            token,
            process.env.jwtSecret
        );

        const userData = await user.findById(data.id);

        if (!userData) {
            res.clearCookie("token");
            return res.redirect("/login");
        }

        const tablesData = await tables.find();

        res.render("tables", {
            user: userData,
            data: tablesData
        });

    } catch (err) {
        console.error("Tables Error:", err);
        res.clearCookie("token");
        return res.redirect("/login");
    }
});

app.post("/tables/:id", async (req, res) => {
    try {
        const tableId = Number(req.params.id);

       

        const updatedTable = await tables.findOneAndUpdate(
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


        res.redirect("/menu");

    } catch (err) {
        console.error("Error updating table status:", err);
        res.redirect("/tables");
    }
});



app.get("/menu", async (req, res) => {
    try {
        const menuData = await menu.find();

        res.render("menu-item", { data: menuData });
    } catch (err) {
        console.error("Menu Error:", err);
        res.redirect("/tables");
    }
});



app.post("/loginStaff", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation check for empty input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide your Staff ID/Email and password."
            });
        }


        // Search database for either match
        const existingUser = await emp.findOne({ email: email });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found. Please register.",
                redirectUrl: "/register"
            });
        }

        // Verify hashed password
        const isPasswordValid = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Staff ID/Email or password."
            });
        }

        // Generate JWT token
        const newToken = jwt.sign(
            { id: existingUser._id },
            process.env.jwtSecret,
            { expiresIn: "1h" }
        );

        // Store token in HTTP-only cookie
        res.cookie("token", newToken, {
            httpOnly: true
        });

        // Return success response with redirect target
        return res.status(200).json({
            success: true,
            redirectUrl: "/dashboard"
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({
            success: false,
            message: "An error occurred on the server. Please try again."
        });
    }
});

app.get("/staffMenu", async (req, res) => {

    const  token = req.cookies.token;
    const data= await menu.find();
    const TotalItems = data.length;
    const availableCount = data.filter(item => item.status === "in stock").length;
    const unavailableCount = data.filter(item => item.status === "out of stock").length;
   

    res.render("staff_inventory", { data: data, TotalItems: TotalItems, availableCount: availableCount, unavailableCount: unavailableCount });
});

app.post("/edit/:id", async (req, res) => {
    const itemId = req.params.id;
    const { itemName, category, price, status, image } = req.body;

    const updatedItem = await menu.findByIdAndUpdate(
        itemId,
        {
            itemName,
            category,
            price,
            status,
            image
        },
        { new: true }
    );  
    res.redirect("/staffMenu");

  
});

app.get("/staffMenu/:id", async (req, res) => {

    const itemId = req.params.id;
    const item = await menu.findById(itemId);
    res.render("editMenu", { item: item });
    



});
app.post("/delete/:id", async (req, res) => {
    const itemId = req.params.id;
    await menu.findByIdAndDelete(itemId);
    res.redirect("/staffMenu");
});


app.post("/add", async (req, res) => {
    const { itemName, category, price, status } = req.body;
    const newItem = new menu({ itemName, category, price, status });
    await newItem.save();
    res.redirect("/staffMenu");

});

app.get("/transaction/:id", async (req, res) => {
    const itemId = req.params.id;
    const item = await menu.findById(itemId);
    res.render("transaction", { item: item });


});
app.post("/contact", async (req, res) => {

    const { name, email, message } = req.body;
    const newFeedback = new feedback({ name, email, message });
    await newFeedback.save();
    res.redirect("/contact");

});
app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});
app.get("/logoutStaff", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});
app.get("/addMenu", (req, res) => {
    res.render("addMenu");
});
app.get("/order-status", (req, res) => {
    res.render("customer_order_status");
});
app.get("/history", (req, res) => {
    res.render("previous-orders");
});
app.get("/reception_order_management", (req, res) => {
    res.render("reception_order_management");
});


const VALID_TABLE_STATUSES = ["available", "occupied", "cleaning"];

// GET: Staff table management page
app.get("/staff_tables", async (req, res) => {
    try {
        const tablesData = await tables.find().sort({ number: 1 });

        const availableCount = tablesData.filter(
            table => table.status === "available"
        ).length;

        const occupiedCount = tablesData.filter(
            table => table.status === "occupied"
        ).length;

        const cleaningCount = tablesData.filter(
            table => table.status === "cleaning"
        ).length;

        const totalSeats = tablesData.reduce(
            (total, table) => total + (Number(table.seats) || 0),
            0
        );

        res.render("staff_tables", {
            tablesData,
            availableCount,
            occupiedCount,
            cleaningCount,
            totalSeats
        });
    } catch (error) {
        console.error("Error fetching table data:", error);
        res.status(500).send("Unable to load table management.");
    }
});

// PATCH: Update a table's status
app.patch("/staff_tables/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (!VALID_TABLE_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid table status."
            });
        }

        const table = await tables.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found."
            });
        }

        table.status = status;

        if (status === "available" || status === "cleaning") {
            table.customer = "";
        } else if (!table.customer) {
            table.customer = "Walk-in Guests";
        }

        await table.save();

        res.json({
            success: true,
            message: "Table status updated successfully."
        });
    } catch (error) {
        console.error("Error updating table status:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update table status."
        });
    }
});

// app.get("/staffMenu", async (req, res) => {
//     try {
//         const menuData = await menu.find();

//         const availableCount = menuData.filter(
//             item => item.status === "in stock"
//         ).length;

//         const unavailableCount = menuData.filter(
//             item => item.status === "out of stock"
//         ).length;
//         const totalItems = menuData.length;

      

//         res.render("staff_inventory", {
//             data: menuData,
//             availableCount,
//             unavailableCount,
//             totalItems
//         });

//     } catch (err) {
//         console.error("Error fetching menu data:", err);
//         res.status(500).send("Unable to load menu inventory.");
//     }
// });


app.get("/staff_analytics", (req, res) => {
    res.render("staff_analytics");
});
app.get("/profile", (req, res) => {
    res.render("customer_profile");
});


app.listen(5005, () => {
    console.log("http://localhost:5005");
});
