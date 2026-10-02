const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const dataFolder = path.join(__dirname, "data");
const dataFile = path.join(dataFolder, "expenses.json");

// Create data folder if it doesn't exist
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}

// Create JSON file if it doesn't exist
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf8");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Read expenses
function getExpenses() {
    try {
        const data = fs.readFileSync(dataFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save expenses
function saveExpenses(expenses) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(expenses, null, 2),
        "utf8"
    );
}

// Get all expenses
app.get("/api/expenses", (req, res) => {
    const expenses = getExpenses();
    res.json(expenses);
});

// Add expense
app.post("/api/expenses", (req, res) => {
    const {
        title,
        amount,
        category,
        date,
        paymentMethod,
        notes
    } = req.body;

    if (!title || !amount || !category || !date) {
        return res.status(400).json({
            message: "Please fill all required fields."
        });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
            message: "Please enter a valid amount."
        });
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

    res.status(201).json({
        message: "Expense added successfully.",
        expense: newExpense
    });
});

// Delete expense
app.delete("/api/expenses/:id", (req, res) => {
    const expenses = getExpenses();

    const expenseExists = expenses.some(
        expense => expense.id === req.params.id
    );

    if (!expenseExists) {
        return res.status(404).json({
            message: "Expense not found."
        });
    }

    const updatedExpenses = expenses.filter(
        expense => expense.id !== req.params.id
    );

    saveExpenses(updatedExpenses);

    res.json({
        message: "Expense deleted successfully."
    });
});

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`Expense Tracker is running`);
    console.log(`http://localhost:${PORT}`);
    console.log(`=================================`);
});