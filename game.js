// Get DOM elements once
const grid = document.getElementById("grid");
const timerDisplay = document.getElementById("timer");
const resultDisplay = document.getElementById("result");
const restartButton = document.getElementById("restart-btn");
const muteButton = document.getElementById("mute-btn");
const instructionsBtn = document.getElementById("show-instructions-btn");
const instructionsModal = document.getElementById("instructions-modal");
const closeInstructions = document.getElementById("close-instructions");
const levelDisplay = document.getElementById("level-display");

// Game state variables
let numbers = [];
let currentNumber = 1;
let timer;
let timeLeft = 60;
let score = 0;
let wrongClicks = 0;
let currentLevel = 1;
let moveInterval;
const timeLimitSeconds = 60;
let isMuted = false;

/**
 * Initialize the numbers array based on current level.
 * The count is 20 + (currentLevel * 5)
 */
function initNumbers() {
  const count = 20 + currentLevel * 5;
  // Generate numbers 1 to count and shuffle randomly
  numbers = Array.from({ length: count }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
}

/**
 * Creates the grid elements in the DOM according to the numbers array.
 */
function createGrid() {
  grid.innerHTML = ""; // Clear old grid

  // Calculate grid columns to make a square-ish grid
  const gridSize = Math.ceil(Math.sqrt(numbers.length));
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  // Create each cell with number and event listener
  numbers.forEach(num => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = num;
    cell.dataset.number = num;
    cell.addEventListener("click", handleCellClick);
    grid.appendChild(cell);
  });
}

/**
 * Handler for clicking a grid cell.
 * - Checks if clicked number matches currentNumber.
 * - Updates score and styles accordingly.
 * - Ends level if all numbers clicked.
 */
function handleCellClick(e) {
  const clickedNumber = parseInt(e.target.dataset.number, 10);

  if (clickedNumber === currentNumber) {
    e.target.classList.add("correct");
    e.target.style.pointerEvents = "none"; // Prevent clicking again
    currentNumber++;
    score += 10;

    // Check if all numbers clicked
    const unclickedCells = Array.from(grid.querySelectorAll(".cell"))
      .filter(cell => !cell.classList.contains("correct"));

    if (unclickedCells.length === 0) {
      stopTimer();
      stopMoving();
      showResult(true);
    }

  } else {
    wrongClicks++;
    score -= 5;
    if (!isMuted) {
      playErrorSound();
    }
    // Visual feedback for wrong click
    e.target.style.backgroundColor = "#a00";
    setTimeout(() => {
      e.target.style.backgroundColor = "#333";
    }, 300);
  }
}

/**
 * Starts the countdown timer with updates every 100ms.
 */
function startTimer() {
  timeLeft = timeLimitSeconds;
  timerDisplay.textContent = `Time left: ${timeLeft.toFixed(2)} s`;
  timer = setInterval(() => {
    timeLeft -= 0.1;
    timerDisplay.textContent = `Time left: ${timeLeft.toFixed(2)} s`;

    if (timeLeft <= 0) {
      stopTimer();
      stopMoving();
      showResult(false);
    }
  }, 100);
}

/**
 * Stops the countdown timer interval.
 */
function stopTimer() {
  clearInterval(timer);
}

/**
 * Displays result message based on win or lose.
 * Advances level if won.
 */
function showResult(won) {
  const timeUsed = (timeLimitSeconds - timeLeft).toFixed(2);
  if (won) {
    resultDisplay.innerHTML = `✅ Level ${currentLevel} complete!<br>
    ⏱ Time used: ${timeUsed} s<br>
    🎯 Score: ${score}<br>
    ▶️ Advancing to level ${currentLevel + 1}...`;
    currentLevel++;
    setTimeout(resetGame, 3000);
  } else {
    resultDisplay.innerHTML = `❌ Time's up!<br>
    🎯 Score: ${score}<br>
    🔁 Try again to complete the level within time and unlock the next one!`;
  }
}

/**
 * Resets the game state for current level (or next level if won).
 * Initializes numbers, grid, timer, and moving numbers.
 */
function resetGame() {
  stopTimer();
  stopMoving();

  currentNumber = 1;
  wrongClicks = 0;
  score = 0;
  resultDisplay.textContent = "";
  timerDisplay.textContent = `Time left: ${timeLimitSeconds.toFixed(2)} s`;
  levelDisplay.textContent = `Level: ${currentLevel}`;

  initNumbers();
  createGrid();
  startTimer();
  startMoving();
}

/**
 * Moves the unclicked numbers randomly every 6 seconds.
 * Keeps clicked numbers fixed and non-interactive.
 */
function moveNumbers() {
  const allCells = Array.from(grid.querySelectorAll(".cell"));

  // Cells that are already clicked (correct)
  const correctCells = allCells.filter(cell =>
    parseInt(cell.dataset.number, 10) < currentNumber
  );
  // Cells still active (not yet clicked)
  const activeCells = allCells.filter(cell =>
    parseInt(cell.dataset.number, 10) >= currentNumber
  );

  const remainingNumbers = activeCells.map(cell =>
    parseInt(cell.dataset.number, 10)
  );

  // Shuffle remaining numbers for randomness
  for (let i = remainingNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingNumbers[i], remainingNumbers[j]] = [remainingNumbers[j], remainingNumbers[i]];
  }

  // Clear and re-render grid with shuffled active numbers + correct numbers
  grid.innerHTML = "";

  const total = correctCells.length + remainingNumbers.length;
  const gridSize = Math.ceil(Math.sqrt(total));
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  // Render already clicked numbers (green and disabled)
  correctCells.forEach(cell => {
    const newCell = document.createElement("div");
    newCell.className = "cell correct";
    newCell.textContent = cell.textContent;
    newCell.dataset.number = cell.dataset.number;
    newCell.style.pointerEvents = "none";
    grid.appendChild(newCell);
  });

  // Render remaining numbers shuffled with click listeners
  remainingNumbers.forEach(num => {
    const newCell = document.createElement("div");
    newCell.className = "cell";
    newCell.textContent = num;
    newCell.dataset.number = num;
    newCell.addEventListener("click", handleCellClick);
    grid.appendChild(newCell);
  });
}

/**
 * Starts the interval that moves numbers every 6 seconds.
 */
function startMoving() {
  stopMoving();
  moveInterval = setInterval(moveNumbers, 6000);
}

/**
 * Stops the interval moving numbers.
 */
function stopMoving() {
  if (moveInterval) {
    clearInterval(moveInterval);
    moveInterval = null;
  }
}

/**
 * Plays an error sound when wrong number clicked.
 */
function playErrorSound() {
  const audio = new Audio("error.mp3");
  audio.volume = 0.2;
  audio.play();
}

// Mute button toggles mute state and button text
muteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? "🔇 Unmute" : "🔊 Mute";
});

// Restart button resets game
restartButton.addEventListener("click", resetGame);

// Instructions modal show/hide
instructionsBtn.addEventListener("click", () => {
  instructionsModal.style.display = "block";
});
closeInstructions.addEventListener("click", () => {
  instructionsModal.style.display = "none";
});

// Close modal if clicking outside content
window.addEventListener("click", (event) => {
  if (event.target === instructionsModal) {
    instructionsModal.style.display = "none";
  }
});

// Start game initially
resetGame();
