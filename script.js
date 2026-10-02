const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const modal = document.getElementById("expenseModal");

const expenseForm = document.getElementById("expenseForm");

const categorySelect = document.getElementById("category");

const customCategoryContainer =
    document.getElementById("customCategoryContainer");

const customCategory =
    document.getElementById("customCategory");

const dateInput = document.getElementById("date");

const formMessage =
    document.getElementById("formMessage");

const searchInput =
    document.getElementById("searchInput");

const expenseTableBody =
    document.getElementById("expenseTableBody");

const recentExpenses =
    document.getElementById("recentExpenses");

const categoryList =
    document.getElementById("categoryList");

const totalSpent =
    document.getElementById("totalSpent");

const monthlySpent =
    document.getElementById("monthlySpent");

const totalExpenses =
    document.getElementById("totalExpenses");

const topCategory =
    document.getElementById("topCategory");

let expenses = [];


// Open modal
openModalBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");

    dateInput.value = getTodayDate();

    document.getElementById("title").focus();
});


// Close modal
closeModalBtn.addEventListener("click", closeModal);


// Close when clicking outside modal
modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeModal();
    }
});


// Close modal function
function closeModal() {
    modal.classList.add("hidden");

    expenseForm.reset();

    customCategoryContainer.classList.add("hidden");

    formMessage.textContent = "";

    dateInput.value = getTodayDate();
}


// Custom category
categorySelect.addEventListener("change", () => {

    if (categorySelect.value === "custom") {

        customCategoryContainer.classList.remove("hidden");

        customCategory.focus();

    } else {

        customCategoryContainer.classList.add("hidden");

    }
});


// Get today's date
function getTodayDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// Format money
function formatMoney(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);

}


// Format date
function formatDate(date) {

    const dateObject = new Date(date + "T00:00:00");

    return dateObject.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


// Add expense
expenseForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    formMessage.textContent = "";

    const title =
        document.getElementById("title").value.trim();

    const amount =
        document.getElementById("amount").value;

    let category = categorySelect.value;

    const date =
        document.getElementById("date").value;

    const paymentMethod =
        document.getElementById("paymentMethod").value;

    const notes =
        document.getElementById("notes").value.trim();


    if (category === "custom") {

        category = customCategory.value.trim();

        if (!category) {

            formMessage.textContent =
                "Please enter your custom category.";

            return;
        }
    }


    try {

        const response = await fetch("/api/expenses", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title,
                amount,
                category,
                date,
                paymentMethod,
                notes
            })

        });


        const data = await response.json();


        if (!response.ok) {

            formMessage.textContent =
                data.message || "Something went wrong.";

            return;
        }


        closeModal();

        await loadExpenses();

    } catch (error) {

        console.error(error);

        formMessage.textContent =
            "Could not connect to the server.";

    }

});


// Load expenses
async function loadExpenses() {

    try {

        const response =
            await fetch("/api/expenses");

        expenses = await response.json();

        renderDashboard();

    } catch (error) {

        console.error("Error loading expenses:", error);

    }

}


// Dashboard
function renderDashboard() {

    renderSummary();

    renderCategories();

    renderRecentExpenses();

    renderTable();

}


// Summary
function renderSummary() {

    const total = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
    );

    totalSpent.textContent =
        formatMoney(total);


    const currentDate = new Date();

    const currentMonth =
        currentDate.getMonth();

    const currentYear =
        currentDate.getFullYear();


    const monthTotal = expenses.reduce(
        (sum, expense) => {

            const expenseDate =
                new Date(expense.date + "T00:00:00");

            if (
                expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear
            ) {

                return sum + Number(expense.amount);

            }

            return sum;

        },
        0
    );


    monthlySpent.textContent =
        formatMoney(monthTotal);


    totalExpenses.textContent =
        expenses.length;


    const categoryTotals = {};

    expenses.forEach(expense => {

        if (!categoryTotals[expense.category]) {

            categoryTotals[expense.category] = 0;

        }

        categoryTotals[expense.category] +=
            Number(expense.amount);

    });


    const sortedCategories =
        Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1]);


    topCategory.textContent =
        sortedCategories.length > 0
            ? sortedCategories[0][0]
            : "-";

}


// Category section
function renderCategories() {

    if (expenses.length === 0) {

        categoryList.innerHTML =
            `<p class="empty">No expenses yet.</p>`;

        return;
    }


    const categoryTotals = {};


    expenses.forEach(expense => {

        if (!categoryTotals[expense.category]) {

            categoryTotals[expense.category] = 0;

        }

        categoryTotals[expense.category] +=
            Number(expense.amount);

    });


    const total = Object.values(categoryTotals)
        .reduce((sum, value) => sum + value, 0);


    const sortedCategories =
        Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1]);


    categoryList.innerHTML =
        sortedCategories.map(([category, amount]) => {

            const percentage =
                total > 0
                    ? (amount / total) * 100
                    : 0;

            return `

                <div class="category-item">

                    <div class="category-top">

                        <span class="category-name">
                            ${escapeHtml(category)}
                        </span>

                        <span class="category-amount">
                            ${formatMoney(amount)}
                        </span>

                    </div>

                    <div class="progress">

                        <div
                            class="progress-bar"
                            style="width: ${percentage}%"
                        ></div>

                    </div>

                </div>

            `;

        }).join("");

}


// Recent expenses
function renderRecentExpenses() {

    if (expenses.length === 0) {

        recentExpenses.innerHTML =
            `<p class="empty">No expenses yet.</p>`;

        return;
    }


    const recent =
        [...expenses]
            .sort(
                (a, b) =>
                    new Date(b.date) - new Date(a.date)
            )
            .slice(0, 5);


    recentExpenses.innerHTML =
        recent.map(expense => {

            return `

                <div class="recent-item">

                    <div class="recent-left">

                        <div class="category-circle">
                            ${getCategoryIcon(expense.category)}
                        </div>

                        <div>

                            <div class="recent-name">
                                ${escapeHtml(expense.title)}
                            </div>

                            <div class="recent-date">
                                ${formatDate(expense.date)}
                            </div>

                        </div>

                    </div>

                    <div class="recent-amount">
                        ${formatMoney(expense.amount)}
                    </div>

                </div>

            `;

        }).join("");

}


// Expense table
function renderTable() {

    const search =
        searchInput.value.trim().toLowerCase();


    const filteredExpenses =
        expenses.filter(expense => {

            return (
                expense.title.toLowerCase().includes(search) ||
                expense.category.toLowerCase().includes(search) ||
                expense.paymentMethod.toLowerCase().includes(search)
            );

        });


    const sorted =
        [...filteredExpenses].sort(
            (a, b) =>
                new Date(b.date) - new Date(a.date)
        );


    if (sorted.length === 0) {

        expenseTableBody.innerHTML = `

            <tr>

                <td colspan="6" class="empty">
                    No expenses found.
                </td>

            </tr>

        `;

        return;
    }


    expenseTableBody.innerHTML =
        sorted.map(expense => {

            return `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(expense.title)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(expense.category)}
                    </td>

                    <td>
                        ${formatDate(expense.date)}
                    </td>

                    <td>
                        ${escapeHtml(expense.paymentMethod)}
                    </td>

                    <td class="amount-cell">
                        ${formatMoney(expense.amount)}
                    </td>

                    <td>

                        <button
                            class="delete-btn"
                            onclick="deleteExpense('${expense.id}')"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


// Delete expense
async function deleteExpense(id) {

    const confirmed =
        confirm("Are you sure you want to delete this expense?");


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(`/api/expenses/${id}`, {
                method: "DELETE"
            });


        if (!response.ok) {

            alert("Could not delete expense.");

            return;
        }


        await loadExpenses();

    } catch (error) {

        console.error(error);

        alert("Server connection failed.");

    }

}


// Search
searchInput.addEventListener("input", () => {

    renderTable();

});


// Category icons
function getCategoryIcon(category) {

    const icons = {

        Food: "🍔",

        Travel: "🚗",

        Shopping: "🛍️",

        Entertainment: "🎮",

        Bills: "📄",

        Education: "📚",

        Health: "❤️",

        Other: "📦"

    };


    return icons[category] || "💰";

}


// Security helper
function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// Initial date
dateInput.value = getTodayDate();


// Load data when website starts
loadExpenses();