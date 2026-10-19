
/* =========================================
   LARCK POINTS PAGE
   DESIGN DEMO - NOT CONNECTED TO SUPABASE
========================================= */

const backButton = document.getElementById("backButton");
const historyButton = document.getElementById("historyButton");
const historyOverlay = document.getElementById("historyOverlay");
const closeHistory = document.getElementById("closeHistory");
const historyItems = document.getElementById("historyItems");
const seeAllButton = document.getElementById("seeAllButton");

const messageOverlay = document.getElementById("messageOverlay");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const closeMessage = document.getElementById("closeMessage");
const messageOk = document.getElementById("messageOk");


/* BACK TO ME PAGE */

if (backButton) {
    backButton.addEventListener("click", function () {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "page5.html";
        }
    });
}

/* OPEN HISTORY */

function openHistory() {
    historyOverlay.classList.add("active");
    historyOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    renderHistory("all");
}

function closeHistoryOverlay() {
    historyOverlay.classList.remove("active");
    historyOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

if (historyButton) {
    historyButton.addEventListener("click", openHistory);
}

if (seeAllButton) {
    seeAllButton.addEventListener("click", openHistory);
}

if (closeHistory) {
    closeHistory.addEventListener("click", closeHistoryOverlay);
}

/* RENDER SAMPLE HISTORY */


/* REAL HISTORY WILL BE CONNECTED LATER */


/* HISTORY — NO DEMO TRANSACTIONS */

function renderHistory(filter) {
    if (!historyItems) return;

    historyItems.innerHTML = `
        <p class="history-note">No recent activity yet.</p>
    `;


    filteredTransactions.forEach(function (transaction) {
        const row = document.createElement("article");
        row.className = "activity-item";

        const icon = document.createElement("div");
        icon.className = "gift-icon";
        icon.textContent = "🎁";

        const details = document.createElement("div");
        details.className = "activity-details";

        const title = document.createElement("h3");
        title.textContent = transaction.title;

        const description = document.createElement("p");
        description.textContent = transaction.description;

        details.append(title, description);

        const amount = document.createElement("div");
        amount.className = "activity-amount";

        const value = document.createElement("strong");
        value.textContent = transaction.amount;

        const status = document.createElement("span");
        status.textContent = "Done";

        amount.append(value, status);
        row.append(icon, details, amount);
        historyItems.appendChild(row);
    });
}

/* HISTORY FILTERS */

document.querySelectorAll(".filter-button").forEach(function (button) {
    button.addEventListener("click", function () {
        document.querySelectorAll(".filter-button").forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");
        renderHistory(button.dataset.filter);
    });
});

/* ACTION MESSAGE */

function showMessage(title, message) {
    messageTitle.textContent = title;
    messageText.textContent = message;
    messageOverlay.classList.add("active");
    messageOverlay.setAttribute("aria-hidden", "false");
}

function closeActionMessage() {
    messageOverlay.classList.remove("active");
    messageOverlay.setAttribute("aria-hidden", "true");
}

if (closeMessage) {
    closeMessage.addEventListener("click", closeActionMessage);
}

if (messageOk) {
    messageOk.addEventListener("click", closeActionMessage);
}

/* EXCHANGE AND WITHDRAW ARE DESIGN-ONLY */

document.getElementById("exchangeButton").addEventListener("click", function () {
    showMessage(
        "Exchange Points",
        "The points-to-coins exchange feature will be connected when LARCK's points system is ready."
    );
});

document.getElementById("withdrawButton").addEventListener("click", function () {
    showMessage(
        "Withdraw Points",
        "Withdrawal options will be added when LARCK's points and wallet systems are ready."
    );
});

/* CLOSE OVERLAYS WITH ESCAPE */

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeHistoryOverlay();
        closeActionMessage();
    }
});

/* DEMO NOTICE IN CONSOLE */

console.log("LARCK Points page loaded in design-demo mode.");
