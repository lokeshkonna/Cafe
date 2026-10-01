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

const user = mongoose.model("user", userschema, "user");

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
    itemId: {
        type: Number
    },
    itemName: {
        type: String
    },
    price: {
        type: Number
    },
    status: {
        type: String
    }
});
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
const tables = mongoose.model("tables", tablesSchema, "tables");
const menu = mongoose.model("menu", menuSchema, "menu");
const emp = mongoose.model("emp", empSchema, "emp");


