// Types
type Theme = "Numbers" | "Icons";

interface Config {
  theme: Theme;
  players: number;
  size: [number, number];
}

interface GameState {
  currentPlayer: number;
  scores: number[];
  flipped: HTMLDivElement[];
  matchedCount: number;
  moves: number;
  seconds: number;
  timerInterval: number | null;
  isProcessing: boolean;
}

// Config  State
const config: Config = {
  theme: "Numbers",
  players: 1,
  size: [4, 4],
};

const gameState: GameState = {
  currentPlayer: 0,
  scores: [],
  flipped: [],
  matchedCount: 0,
  moves: 0,
  seconds: 0,
  timerInterval: null,
  isProcessing: false,
};

function qs<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el as T;
}

document.querySelectorAll<HTMLElement>(".buttons").forEach((group) => {
  group.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("option-btn")) return;

    const active = group.querySelector(".active");
    active?.classList.remove("active");
    target.classList.add("active");
  });
});

qs<HTMLButtonElement>(".start-btn").addEventListener("click", () => {
  config.theme = qs<HTMLElement>('[data-group="theme"] .active')
    .innerText as Theme;

  config.players = Number(
    qs<HTMLElement>('[data-group="players"] .active').innerText
  );

  const sizeText = qs<HTMLElement>(
    '[data-group="grid"] .active'
  ).innerText.split(" x ");

  config.size = [Number(sizeText[0]), Number(sizeText[1])];

  qs<HTMLElement>(".main-page").classList.add("hidden");
  qs<HTMLElement>(".game-list").classList.remove("hidden");

  initGame();
});

function initGame(): void {
  if (gameState.timerInterval !== null) {
    clearInterval(gameState.timerInterval);
  }

  gameState.currentPlayer = 0;
  gameState.scores = new Array<number>(config.players).fill(0);
  gameState.flipped = [];
  gameState.matchedCount = 0;
  gameState.moves = 0;
  gameState.seconds = 0;
  gameState.isProcessing = false;

  const grid = qs<HTMLDivElement>(".grid");
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${config.size[1]}, 1fr)`;

  if (config.players === 1) {
    qs<HTMLElement>(".player-one-stats").classList.remove("hidden");
    qs<HTMLElement>(".multi-player-stats").classList.add("hidden");
    startTimer();
  } else {
    qs<HTMLElement>(".player-one-stats").classList.add("hidden");
    qs<HTMLElement>(".multi-player-stats").classList.remove("hidden");
    updatePlayerUI();
  }

  const totalCards = config.size[0] * config.size[1];
  const items: number[] = [];

  for (let i = 1; i <= totalCards / 2; i++) {
    items.push(i, i);
  }

  items.sort(() => Math.random() - 0.5);

  items.forEach((val) => {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    cell.dataset.id = String(val);

    if (config.theme === "Icons") {
      cell.innerHTML = `<img src="img/icons/icon-${val}.svg" />`;
    } else {
      cell.innerText = String(val);
    }

    cell.addEventListener("click", () => handleFlip(cell));
    grid.appendChild(cell);
  });
}

function handleFlip(cell: HTMLDivElement): void {
  if (
    gameState.isProcessing ||
    cell.classList.contains("open") ||
    cell.classList.contains("matched")
  )
    return;

  cell.classList.add("open");
  gameState.flipped.push(cell);

  if (gameState.flipped.length === 2) {
    gameState.isProcessing = true;
    gameState.moves++;
    qs<HTMLElement>("#moves").innerText = String(gameState.moves);
    checkMatch();
  }
}

function checkMatch(): void {
  if (gameState.flipped.length < 2) return;
  const [c1, c2] = gameState.flipped as [HTMLDivElement, HTMLDivElement];
  const isMatch = c1.dataset.id === c2.dataset.id;

  if (isMatch) {
    setTimeout(() => {
      c1.classList.add("matched");
      c2.classList.add("matched");

      gameState.scores[gameState.currentPlayer]++;
      gameState.matchedCount += 2;
      gameState.flipped = [];
      gameState.isProcessing = false;

      if (config.players > 1) updatePlayerUI();
      if (gameState.matchedCount === config.size[0] * config.size[1]) {
        endGame();
      }
    }, 400);
  } else {
    setTimeout(() => {
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

function updatePlayerUI(): void {
  const container = qs<HTMLDivElement>(".multi-player-stats");
  container.innerHTML = "";

  for (let i = 0; i < config.players; i++) {
    const div = document.createElement("div");
    div.className =
      "player-card" + (i === gameState.currentPlayer ? " active" : "");

    div.innerHTML = `
      <span>Player ${i + 1}</span>
      <span>${gameState.scores[i]}</span>
    `;
    container.appendChild(div);
  }
}

// Timer

function startTimer(): void {
  gameState.timerInterval = window.setInterval(() => {
    gameState.seconds++;
    const m = Math.floor(gameState.seconds / 60);
    const s = gameState.seconds % 60;
    qs<HTMLElement>("#timer").innerText = m + ":" + (s < 10 ? "0" + s : s);
  }, 1000);
}

// End Game

function endGame(): void {
  if (gameState.timerInterval !== null) {
    clearInterval(gameState.timerInterval);
  }

  const modal = qs<HTMLElement>("#modal");
  const list = qs<HTMLElement>("#results-list");
  const text = qs<HTMLElement>("#winner-text");

  modal.classList.remove("hidden");
  list.innerHTML = "";

  if (config.players === 1) {
    text.innerText = "You did it!";
    list.innerHTML = `
      <div>Time: ${qs<HTMLElement>("#timer").innerText}</div>
      <div>Moves: ${gameState.moves}</div>
    `;
  } else {
    const results = gameState.scores
      .map((s, i) => ({ name: `Player ${i + 1}`, score: s }))
      .sort((a, b) => b.score - a.score);

    text.innerText =
      results[0].score === results[1]?.score
        ? "It's a Tie!"
        : `${results[0].name} Wins!`;

    results.forEach((r) => {
      const div = document.createElement("div");
      div.innerText = `${r.name}: ${r.score}`;
      list.appendChild(div);
    });
  }
}

// Restart
function restartGame(): void {
  qs<HTMLElement>("#modal").classList.add("hidden");
  initGame();
}

// Compiler Options
// Compiler options belong in a separate tsconfig.json file, not in source.
