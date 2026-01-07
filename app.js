// Config  State
var config = {
    theme: "Numbers",
    players: 1,
    size: [4, 4],
};
var gameState = {
    currentPlayer: 0,
    scores: [],
    flipped: [],
    matchedCount: 0,
    moves: 0,
    seconds: 0,
    timerInterval: null,
    isProcessing: false,
};
function qs(selector) {
    var el = document.querySelector(selector);
    if (!el)
        throw new Error("Element not found: ".concat(selector));
    return el;
}
document.querySelectorAll(".buttons").forEach(function (group) {
    group.addEventListener("click", function (e) {
        var target = e.target;
        if (!target.classList.contains("option-btn"))
            return;
        var active = group.querySelector(".active");
        active === null || active === void 0 ? void 0 : active.classList.remove("active");
        target.classList.add("active");
    });
});
qs(".start-btn").addEventListener("click", function () {
    config.theme = qs('[data-group="theme"] .active')
        .innerText;
    config.players = Number(qs('[data-group="players"] .active').innerText);
    var sizeText = qs('[data-group="grid"] .active').innerText.split(" x ");
    config.size = [Number(sizeText[0]), Number(sizeText[1])];
    qs(".main-page").classList.add("hidden");
    qs(".game-list").classList.remove("hidden");
    initGame();
});
function initGame() {
    if (gameState.timerInterval !== null) {
        clearInterval(gameState.timerInterval);
    }
    gameState.currentPlayer = 0;
    gameState.scores = new Array(config.players).fill(0);
    gameState.flipped = [];
    gameState.matchedCount = 0;
    gameState.moves = 0;
    gameState.seconds = 0;
    gameState.isProcessing = false;
    var grid = qs(".grid");
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = "repeat(".concat(config.size[1], ", 1fr)");
    if (config.players === 1) {
        qs(".player-one-stats").classList.remove("hidden");
        qs(".multi-player-stats").classList.add("hidden");
        startTimer();
    }
    else {
        qs(".player-one-stats").classList.add("hidden");
        qs(".multi-player-stats").classList.remove("hidden");
        updatePlayerUI();
    }
    var totalCards = config.size[0] * config.size[1];
    var items = [];
    for (var i = 1; i <= totalCards / 2; i++) {
        items.push(i, i);
    }
    items.sort(function () { return Math.random() - 0.5; });
    items.forEach(function (val) {
        var cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.dataset.id = String(val);
        if (config.theme === "Icons") {
            cell.innerHTML = "<img src=\"img/icons/icon-".concat(val, ".svg\" />");
        }
        else {
            cell.innerText = String(val);
        }
        cell.addEventListener("click", function () { return handleFlip(cell); });
        grid.appendChild(cell);
    });
}
function handleFlip(cell) {
    if (gameState.isProcessing ||
        cell.classList.contains("open") ||
        cell.classList.contains("matched"))
        return;
    cell.classList.add("open");
    gameState.flipped.push(cell);
    if (gameState.flipped.length === 2) {
        gameState.isProcessing = true;
        gameState.moves++;
        qs("#moves").innerText = String(gameState.moves);
        checkMatch();
    }
}
function checkMatch() {
    var _a = gameState.flipped, c1 = _a[0], c2 = _a[1];
    var isMatch = c1.dataset.id === c2.dataset.id;
    if (isMatch) {
        setTimeout(function () {
            c1.classList.add("matched");
            c2.classList.add("matched");
            gameState.scores[gameState.currentPlayer]++;
            gameState.matchedCount += 2;
            gameState.flipped = [];
            gameState.isProcessing = false;
            if (config.players > 1)
                updatePlayerUI();
            if (gameState.matchedCount === config.size[0] * config.size[1]) {
                endGame();
            }
        }, 400);
    }
    else {
        setTimeout(function () {
            c1.classList.remove("open");
            c2.classList.remove("open");
            gameState.flipped = [];
            gameState.isProcessing = false;
            if (config.players > 1) {
                gameState.currentPlayer =
                    (gameState.currentPlayer + 1) % config.players;
                updatePlayerUI();
            }
        }, 1000);
    }
}
function updatePlayerUI() {
    var container = qs(".multi-player-stats");
    container.innerHTML = "";
    for (var i = 0; i < config.players; i++) {
        var div = document.createElement("div");
        div.className =
            "player-card" + (i === gameState.currentPlayer ? " active" : "");
        div.innerHTML = "\n      <span>Player ".concat(i + 1, "</span>\n      <span>").concat(gameState.scores[i], "</span>\n    ");
        container.appendChild(div);
    }
}
// Timer
function startTimer() {
    gameState.timerInterval = window.setInterval(function () {
        gameState.seconds++;
        var m = Math.floor(gameState.seconds / 60);
        var s = gameState.seconds % 60;
        qs("#timer").innerText = m + ":" + (s < 10 ? "0" + s : s);
    }, 1000);
}
// End Game
function endGame() {
    var _a;
    if (gameState.timerInterval !== null) {
        clearInterval(gameState.timerInterval);
    }
    var modal = qs("#modal");
    var list = qs("#results-list");
    var text = qs("#winner-text");
    modal.classList.remove("hidden");
    list.innerHTML = "";
    if (config.players === 1) {
        text.innerText = "You did it!";
        list.innerHTML = "\n      <div>Time: ".concat(qs("#timer").innerText, "</div>\n      <div>Moves: ").concat(gameState.moves, "</div>\n    ");
    }
    else {
        var results = gameState.scores
            .map(function (s, i) { return ({ name: "Player ".concat(i + 1), score: s }); })
            .sort(function (a, b) { return b.score - a.score; });
        text.innerText =
            results[0].score === ((_a = results[1]) === null || _a === void 0 ? void 0 : _a.score)
                ? "It's a Tie!"
                : "".concat(results[0].name, " Wins!");
        results.forEach(function (r) {
            var div = document.createElement("div");
            div.innerText = "".concat(r.name, ": ").concat(r.score);
            list.appendChild(div);
        });
    }
}
// Restart
function restartGame() {
    qs("#modal").classList.add("hidden");
    initGame();
}
