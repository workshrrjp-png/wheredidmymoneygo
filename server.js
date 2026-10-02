const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const dataFolder = path.join(__dirname, "data");
const dataFile = path.join(dataFolder, "expenses.json");

if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder, {recursive: true});
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]", "utf8");

app.use(express.json());

// Try to find public folder in all possible places
const possiblePublicPaths = [
  path.join(__dirname, "public"),
  path.join(__dirname, "..", "public"),
  path.join(__dirname, "src", "public"),
  path.join(process.cwd(), "public"),
  path.join(process.cwd(), "src", "public")
];

let publicPath = possiblePublicPaths.find(p => fs.existsSync(p));
if (!publicPath) publicPath = path.join(__dirname, "public");

console.log("Using public folder:", publicPath);
console.log("Files in _dirname:", fs.readdirSync(_dirname));

app.use(express.static(publicPath));

function getExpenses() {
  try { return JSON.parse(fs.readFileSync(dataFile, "utf8")); } catch { return []; }
}
function saveExpenses(e) { fs.writeFileSync(dataFile, JSON.stringify(e, null, 2), "utf8"); }

app.get("/api/expenses", (req, res) => res.json(getExpenses()));

app.post("/api/expenses", (req, res) => {
  const { title, amount, category, date, paymentMethod, notes } = req.body;
  if (!title || !amount || !category || !date) return res.status(400).json({message: "Please fill all required fields."});
  const expenses = getExpenses();
  const newExpense = { id: Date.now().toString(), title: title.trim(), amount: Number(amount), category: category.trim(), date, paymentMethod: paymentMethod || "Cash", notes: notes?.trim() || "", createdAt: new Date().toISOString() };
  expenses.push(newExpense);
  saveExpenses(expenses);
  res.status(201).json({ message: "Expense added successfully.", expense: newExpense });
});

app.delete("/api/expenses/:id", (req, res) => {
  const expenses = getExpenses();
  saveExpenses(expenses.filter(e => e.id !== req.params.id));
  res.json({ message: "Expense deleted successfully." });
});

// This fixes "Not Found" - serve index for any other route
app.use((req, res) => {
  const indexFile = path.join(publicPath, "index.html");
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send(index.html not found. Looked in: ${publicPath}. __dirname files: ${fs.readdirSync(__dirname).join(", ")});
  }
});

app.listen(PORT, () => console.log(Running on ${PORT}));
