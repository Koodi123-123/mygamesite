const grid = document.getElementById("grid");
const timerDisplay = document.getElementById("timer");
const resultDisplay = document.getElementById("result");
const restartButton = document.getElementById("restart-btn");
const muteButton = document.getElementById("mute-btn");
const instructionsBtn = document.getElementById("show-instructions-btn");
const instructionsModal = document.getElementById("instructions-modal");
const closeInstructions = document.getElementById("close-instructions");

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

const levelDisplay = document.createElement("div");
levelDisplay.id = "level-display";
document.body.insertBefore(levelDisplay, grid);

// Initialize the numbers array for the current level
function initNumbers() {
  const count = 20 + currentLevel * 5;
  numbers = Array.from({ length: count }, (_, i) => i + 1);
  shuffleArray(numbers); // Initially shuffle numbers
}

// Fisher-Yates shuffle to shuffle an array in place
function shuffleArray(array) {
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Create grid cells with the current numbers array
function createGrid() {
  grid.innerHTML = "";

  // Calculate optimal column count for a square grid
  const gridSize = Math.ceil(Math.sqrt(numbers.length));
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  numbers.forEach(num => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = num;
    cell.dataset.number = num;
    cell.addEventListener("click", handleCellClick);
    grid.appendChild(cell);
  });
}

// Handle clicks on cells
function handleCellClick(e) {
  const clickedNumber = parseInt(e.target.dataset.number, 10);

  if (clickedNumber === currentNumber) {
    e.target.classList.add("correct");
    e.target.style.pointerEvents = "none";
    currentNumber++;
    score += 10;

    if (currentNumber > numbers.length) {
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
    e.target.style.backgroundColor = "#a00";
    setTimeout(() => {
      e.target.style.backgroundColor = "#333";
    }, 300);
  }
}

// Start the countdown timer
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

// Stop the timer
function stopTimer() {
  clearInterval(timer);
}

// Show the result message and handle level progression
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

// Reset the game state and start new game / level
function resetGame() {
  stopTimer();
  stopMoving();

  currentNumber = 1;
  wrongClicks = 0;
  score = 0;
  resultDisplay.textContent = '';
  timerDisplay.textContent = `Time left: ${timeLimitSeconds}.00 s`;

  levelDisplay.textContent = `Level: ${currentLevel}`;

  initNumbers();
  createGrid();

  const cells = grid.querySelectorAll(".cell");
  cells.forEach(cell => {
    cell.style.pointerEvents = "auto";
    cell.classList.remove("correct");
  });

  startTimer();
  startMoving();
}

// Shuffle only the remaining numbers (not clicked yet), and update their positions in the grid
function shuffleRemainingNumbers() {
  // Extract remaining numbers that are >= currentNumber
  const remainingNumbers = numbers.filter(num => num >= currentNumber);

  // Shuffle remaining numbers
  shuffleArray(remainingNumbers);

  // Map the current grid cells into an array (all cells)
  const allCells = Array.from(grid.querySelectorAll(".cell"));

  // For each cell, if its number is remaining, assign it a new number from the shuffled remainingNumbers
  // Otherwise, leave the cell's number and class intact (clicked numbers)
  let remIndex = 0;
  allCells.forEach(cell => {
    const cellNum = parseInt(cell.dataset.number, 10);

    if (cellNum >= currentNumber) {
      const newNum = remainingNumbers[remIndex];
      remIndex++;
      cell.textContent = newNum;
      cell.dataset.number = newNum;
      cell.classList.remove("correct");
      cell.style.pointerEvents = "auto";
    }
  });

  // Update numbers array: keep clicked numbers at front, append shuffled remaining
  const clickedNumbers = numbers.filter(num => num < currentNumber);
  numbers = clickedNumbers.concat(remainingNumbers);
}

function startMoving() {
  stopMoving();
  // Shuffle remaining numbers every 6 seconds
  moveInterval = setInterval(() => {
    shuffleRemainingNumbers();
  }, 6000);
}

function stopMoving() {
  if (moveInterval) {
    clearInterval(moveInterval);
    moveInterval = null;
  }
}

function playErrorSound() {
  const audio = new Audio("error.mp3");
  audio.volume = 0.2;
  audio.play();
}

muteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? "🔇 Unmute" : "🔊 Mute";
});

restartButton.addEventListener("click", resetGame);

instructionsBtn.addEventListener("click", () => {
  instructionsModal.style.display = "block";
});

closeInstructions.addEventListener("click", () => {
  instructionsModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === instructionsModal) {
    instructionsModal.style.display = "none";
  }
});

// Start the game on page load
resetGame();
