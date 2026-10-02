const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const dataFolder = path.join(__dirname, "data");
const dataFile = path.join(dataFolder, "expenses.json");

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf8");
}

app.use(express.json());

// FIX FOR RENDER: check where public folder actually is
let publicPath = path.join(__dirname, "public");
if (!fs.existsSync(publicPath)) {
    publicPath = path.join(__dirname, "..", "public");
}
if (!fs.existsSync(publicPath)) {
    publicPath = path.join(__dirname, "src", "public");
}
app.use(express.static(publicPath));

function getExpenses() {
    try {
        const data = fs.readFileSync(dataFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function saveExpenses(expenses) {
    fs.writeFileSync(dataFile, JSON.stringify(expenses, null, 2), "utf8");
}

app.get("/api/expenses", (req, res) => {
    res.json(getExpenses());
});

app.post("/api/expenses", (req, res) => {
    const { title, amount, category, date, paymentMethod, notes } = req.body;
    if (!title || !amount || !category || !date) {
        return res.status(400).json({ message: "Please fill all required fields." });
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Please enter a valid amount." });
    }
    const expenses = getExpenses();
    const newExpense = {
        id: Date.now().toString(),
        title: title.trim(),
        amount: numericAmount,
        category: category.trim(),
        date,
        paymentMethod: paymentMethod || "Cash",
        notes: notes ? notes.trim() : "",
        createdAt: new Date().toISOString()
    };
    expenses.push(newExpense);
    saveExpenses(expenses);
    res.status(201).json({ message: "Expense added successfully.", expense: newExpense });
});

app.delete("/api/expenses/:id", (req, res) => {
    const expenses = getExpenses();
    if (!expenses.some(e => e.id === req.params.id)) {
        return res.status(404).json({ message: "Expense not found." });
    }
    saveExpenses(expenses.filter(e => e.id !== req.params.id));
    res.json({ message: "Expense deleted successfully." });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Expense Tracker is running on ${PORT}`);
});
