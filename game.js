const grid = document.getElementById("grid");
const levelDisplay = document.getElementById("level-display");
const timerDisplay = document.getElementById("timer");
const resultDisplay = document.getElementById("result");
const restartBtn = document.getElementById("restart-btn");
const muteBtn = document.getElementById("mute-btn");
const showInstructionsBtn = document.getElementById("show-instructions-btn");
const instructionsModal = document.getElementById("instructions-modal");
const closeInstructions = document.getElementById("close-instructions");

let numbers = [];
let currentNumber = 1;
let level = 1;
let score = 0;
let timeLeft = 60;
let timerInterval = null;
let moveInterval = null;
let isMuted = false;
let cellPositions = {}; // Store positions {number: {row, col}}

// Initialize game
function initGame() {
  currentNumber = 1;
  score = 0;
  timeLeft = 60;
  numbers = [];

  const count = 25 + (level - 1) * 5;
  for (let i = 1; i <= count; i++) {
    numbers.push(i);
  }

  levelDisplay.textContent = `Level: ${level}`;
  resultDisplay.textContent = "";
  updateTimerDisplay();

  createGrid();
  startTimer();
  startMoveInterval();
}

// Create grid and randomly place numbers
function createGrid() {
  grid.innerHTML = "";
  cellPositions = {};

  const gridSize = Math.ceil(Math.sqrt(numbers.length));
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  const positions = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      positions.push({ row: r, col: c });
    }
  }
  // Shuffle positions
  positions.sort(() => Math.random() - 0.5);

  numbers.forEach((num, index) => {
    const pos = positions[index];
    cellPositions[num] = pos;

    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = num;
    cell.dataset.number = num;
    cell.style.gridRowStart = pos.row + 1;
    cell.style.gridColumnStart = pos.col + 1;
    cell.addEventListener("click", handleCellClick);

    grid.appendChild(cell);
  });
}

function handleCellClick(e) {
  const cell = e.target;
  const num = parseInt(cell.dataset.number, 10);

  if (num === currentNumber) {
    cell.classList.add("correct");
    cell.style.pointerEvents = "none";
    currentNumber++;
    score += 10;
    resultDisplay.textContent = `Score: ${score}`;

    if (currentNumber > numbers.length) {
      // Level completed
      stopTimer();
      stopMoveInterval();
      resultDisplay.textContent = `Level ${level} completed! Your score: ${score}`;
      level++;
      setTimeout(() => {
        initGame();
      }, 3000);
    }
  } else {
    // Wrong click
    score -= 5;
    resultDisplay.textContent = `Wrong click! Score: ${score}`;
  }
}

function updateTimerDisplay() {
  timerDisplay.textContent = `Time left: ${timeLeft.toFixed(2)} s`;
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft -= 0.01;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerDisplay();
      stopTimer();
      stopMoveInterval();
      resultDisplay.textContent = `Time's up! Your score: ${score}`;
    } else {
      updateTimerDisplay();
    }
  }, 10);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function startMoveInterval() {
  clearInterval(moveInterval);
  moveInterval = setInterval(() => {
    moveNumbers();
  }, 6000);
}

function stopMoveInterval() {
  clearInterval(moveInterval);
}

// Move only unclicked numbers to new random positions; clicked numbers stay fixed
function moveNumbers() {
  const gridSize = Math.ceil(Math.sqrt(numbers.length));
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  const allCells = Array.from(grid.querySelectorAll(".cell"));

  // Separate clicked and unclicked cells
  const clickedNumbers = allCells
    .filter(cell => cell.classList.contains("correct"))
    .map(cell => parseInt(cell.dataset.number, 10));

  const unclickedCells = allCells
    .filter(cell => !cell.classList.contains("correct"));

  // All possible positions
  const allPositions = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      allPositions.push({ row: r, col: c });
    }
  }

  // Remove positions occupied by clicked numbers
  const usedPositions = clickedNumbers.map(num => cellPositions[num]);
  const availablePositions = allPositions.filter(pos =>
    !usedPositions.some(up => up.row === pos.row && up.col === pos.col)
  );

  // Shuffle available positions
  availablePositions.sort(() => Math.random() - 0.5);

  // Assign new positions to unclicked numbers
  unclickedCells.forEach((cell, i) => {
    const num = parseInt(cell.dataset.number, 10);
    const newPos = availablePositions[i];
    cellPositions[num] = newPos;
  });

  // Clear grid and rebuild with updated positions
  grid.innerHTML = "";

  // Add clicked cells back at fixed positions
  clickedNumbers.forEach(num => {
    const pos = cellPositions[num];
    const cell = document.createElement("div");
    cell.className = "cell correct";
    cell.textContent = num;
    cell.dataset.number = num;
    cell.style.gridRowStart = pos.row + 1;
    cell.style.gridColumnStart = pos.col + 1;
    cell.style.pointerEvents = "none";
    grid.appendChild(cell);
  });

  // Add unclicked cells with new positions
  unclickedCells.forEach(cell => {
    const num = parseInt(cell.dataset.number, 10);
    const pos = cellPositions[num];
    const newCell = document.createElement("div");
    newCell.className = "cell";
    newCell.textContent = num;
    newCell.dataset.number = num;
    newCell.style.gridRowStart = pos.row + 1;
    newCell.style.gridColumnStart = pos.col + 1;
    newCell.addEventListener("click", handleCellClick);
    grid.appendChild(newCell);
  });
}

// Restart button handler
restartBtn.addEventListener("click", () => {
  stopTimer();
  stopMoveInterval();
  initGame();
});

// Instructions modal handlers
showInstructionsBtn.addEventListener("click", () => {
  instructionsModal.style.display = "block";
});

closeInstructions.addEventListener("click", () => {
  instructionsModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === instructionsModal) {
    instructionsModal.style.display = "none";
  }
});

// Mute button placeholder (no sound logic implemented here)
muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇 Muted" : "🔊 Mute";
});

// Start game on load
initGame();
