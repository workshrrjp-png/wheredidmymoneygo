const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const modal = document.getElementById("expenseModal");
const expenseForm = document.getElementById("expenseForm");
const categorySelect = document.getElementById("category");
const customCategoryContainer = document.getElementById("customCategoryContainer");
const customCategory = document.getElementById("customCategory");
const dateInput = document.getElementById("date");
const formMessage = document.getElementById("formMessage");
const searchInput = document.getElementById("searchInput");
const expenseTableBody = document.getElementById("expenseTableBody");
const recentExpenses = document.getElementById("recentExpenses");
const categoryList = document.getElementById("categoryList");
const totalSpent = document.getElementById("totalSpent");
const monthlySpent = document.getElementById("monthlySpent");
const totalExpenses = document.getElementById("totalExpenses");
const topCategory = document.getElementById("topCategory");

let expenses = [];

// *** THIS IS THE FIX ***
const API_BASE = window.location.hostname.includes("github.io") 
  ? "https://wheredidmymoneygoexpenses.onrender.com" 
  : "";

openModalBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    dateInput.value = getTodayDate();
    document.getElementById("title").focus();
});

closeModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

function closeModal() {
    modal.classList.add("hidden");
    expenseForm.reset();
    customCategoryContainer.classList.add("hidden");
    formMessage.textContent = "";
    dateInput.value = getTodayDate();
}

categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "custom") {
        customCategoryContainer.classList.remove("hidden");
        customCategory.focus();
    } else {
        customCategoryContainer.classList.add("hidden");
    }
});

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}

function formatDate(date) {
    const dateObject = new Date(date + "T00:00:00");
    return dateObject.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formMessage.textContent = "";
    const title = document.getElementById("title").value.trim();
    const amount = document.getElementById("amount").value;
    let category = categorySelect.value;
    const date = document.getElementById("date").value;
    const paymentMethod = document.getElementById("paymentMethod").value;
    const notes = document.getElementById("notes").value.trim();

    if (category === "custom") {
        category = customCategory.value.trim();
        if (!category) {
            formMessage.textContent = "Please enter your custom category.";
            return;
        }
    }

    try {
        const response = await fetch(`${API_BASE}/api/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, amount, category, date, paymentMethod, notes })
        });
        const data = await response.json();
        if (!response.ok) {
            formMessage.textContent = data.message || "Something went wrong.";
            return;
        }
        closeModal();
        await loadExpenses();
    } catch (error) {
        console.error(error);
        formMessage.textContent = "Could not connect to the server.";
    }
});

async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE}/api/expenses`);
        expenses = await response.json();
        renderDashboard();
    } catch (error) {
        console.error("Error loading expenses:", error);
    }
}

function renderDashboard() {
    renderSummary();
    renderCategories();
    renderRecentExpenses();
    renderTable();
}

function renderSummary() {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    totalSpent.textContent = formatMoney(total);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthTotal = expenses.reduce((sum, expense) => {
        const expenseDate = new Date(expense.date + "T00:00:00");
        if (expenseDate.getMonth() === currentMonth && expenseDate