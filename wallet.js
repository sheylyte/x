
/* =====================================
   LARCK WALLET
===================================== */

// Return to the Me page.
const backButton = document.getElementById("backButton");

if (backButton) {
    backButton.addEventListener("click", function () {
        window.location.href = "page5.html";
    });
}

// Show a small message without changing the page.
const walletToast = document.getElementById("walletToast");
let toastTimeout;

function showWalletMessage(message) {
    if (!walletToast) return;

    walletToast.textContent = message;
    walletToast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(function () {
        walletToast.classList.remove("show");
    }, 2500);
}

// History button.
const historyButton = document.getElementById("historyButton");

if (historyButton) {
    historyButton.addEventListener("click", function () {
        showWalletMessage("Your coin transaction history will appear here.");
    });
}

// Coin Sellers button.
const coinSellersButton = document.getElementById("coinSellersButton");

if (coinSellersButton) {
    coinSellersButton.addEventListener("click", function () {
        showWalletMessage("Coin Sellers will be available here.");
    });
}

// Recharge packages.
const rechargeCards = document.querySelectorAll(".recharge-card");

rechargeCards.forEach(function (card) {
    card.addEventListener("click", function () {
        const coins = Number(card.dataset.coins);
        const price = Number(card.dataset.price);

        showWalletMessage(
            coins.toLocaleString() +
            " coins — $" +
            price +
            ". Payment setup is not connected yet."
        );
    });
});


/* COIN SELLERS OVERLAY */
const coinSellersOverlay = document.getElementById("coinSellersOverlay");
const closeCoinSellers = document.getElementById("closeCoinSellers");

if (coinSellersButton && coinSellersOverlay && closeCoinSellers) {
    coinSellersButton.addEventListener("click", () => {
        coinSellersOverlay.classList.add("active");
    });

    closeCoinSellers.addEventListener("click", () => {
        coinSellersOverlay.classList.remove("active");
    });

    coinSellersOverlay.addEventListener("click", (event) => {
        if (event.target === coinSellersOverlay) {
            coinSellersOverlay.classList.remove("active");
        }
    });
}



/* HISTORY OVERLAY */
const historyOverlay = document.getElementById("historyOverlay");
const closeHistory = document.getElementById("closeHistory");
const historyStartDate = document.getElementById("historyStartDate");
const historyEndDate = document.getElementById("historyEndDate");
const coinsHistoryButton = document.getElementById("coinsHistoryButton");
const pointsHistoryButton = document.getElementById("pointsHistoryButton");

if (historyOverlay && closeHistory) {
    closeHistory.addEventListener("click", () => {
        historyOverlay.classList.remove("active");
    });

    historyOverlay.addEventListener("click", (event) => {
        if (event.target === historyOverlay) {
            historyOverlay.classList.remove("active");
        }
    });
}

/* DATE DEFAULTS */
const today = new Date();
const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

if (historyStartDate && !historyStartDate.value) {
    historyStartDate.value = localToday;
}

if (historyEndDate && !historyEndDate.value) {
    historyEndDate.value = localToday;
}

if (historyStartDate && historyEndDate) {
    historyStartDate.addEventListener("change", () => {
        historyEndDate.min = historyStartDate.value;

        if (historyEndDate.value && historyEndDate.value < historyStartDate.value) {
            historyEndDate.value = historyStartDate.value;
        }
    });

    historyEndDate.addEventListener("change", () => {
        historyStartDate.max = historyEndDate.value;

        if (historyStartDate.value && historyStartDate.value > historyEndDate.value) {
            historyStartDate.value = historyEndDate.value;
        }
    });
}

/* RECORD CARD ACTIONS */
if (coinsHistoryButton) {
    coinsHistoryButton.addEventListener("click", () => {
        console.log("Coins history selected", {
            startDate: historyStartDate?.value,
            endDate: historyEndDate?.value
        });
    });
}

if (pointsHistoryButton) {
    pointsHistoryButton.addEventListener("click", () => {
        console.log("Points history selected", {
            startDate: historyStartDate?.value,
            endDate: historyEndDate?.value
        });
    });
}

/* OPEN HISTORY OVERLAY */
if (historyButton && historyOverlay) {
    historyButton.addEventListener("click", () => {
        historyOverlay.classList.add("active");
    });
}