const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 10000;

const dataFile = path.join(__dirname, "data", "expenses.json");
if (!fs.existsSync(path.join(__dirname, "data"))) fs.mkdirSync(path.join(__dirname, "data"), {recursive:true});
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const getData = () => JSON.parse(fs.readFileSync(dataFile, "utf8"));
const saveData = (d) => fs.writeFileSync(dataFile, JSON.stringify(d,null,2));

app.get("/api/expenses", (req,res)=> res.json(getData()));
app.post("/api/expenses", (req,res)=>{
  const d=getData();
  d.push({id:Date.now().toString(),...req.body,amount:Number(req.body.amount)});
  saveData(d);
  res.json({ok:true});
});
app.delete("/api/expenses/:id", (req,res)=>{
  saveData(getData().filter(x=>x.id!==req.params.id));
  res.json({ok:true});
});
app.get("/", (req,res)=> res.sendFile(path.join(__dirname,"public","index.html")));

app.listen(PORT, ()=> console.log("Running"));