const grid = document.getElementById("grid");
const timerDisplay = document.getElementById("timer");
const resultDisplay = document.getElementById("result");
const restartButton = document.getElementById("restart-btn");
const muteButton = document.getElementById("mute-btn");
const instructionsBtn = document.getElementById("show-instructions-btn");
const instructionsModal = document.getElementById("instructions-modal");
const closeInstructions = document.getElementById("close-instructions");
const levelDisplay = document.getElementById("level-display");

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

// Initialize numbers array with random order depending on current level
function initNumbers() {
  const count = 20 + currentLevel * 5;
  numbers = Array.from({ length: count }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
}

// Create the grid and display numbers as clickable cells
function createGrid() {
  grid.innerHTML = "";

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

// Handle clicks on number cells
function handleCellClick(e) {
  const clickedNumber = parseInt(e.target.dataset.number, 10);

  if (clickedNumber === currentNumber) {
    // Correct click: mark cell, disable clicking, increase score and current number
    e.target.classList.add("correct");
    e.target.style.pointerEvents = "none";
    currentNumber++;
    score += 10;

    // Check if all numbers are clicked => level complete
    const remainingCells = Array.from(grid.querySelectorAll(".cell:not(.correct)"));
    if (remainingCells.length === 0) {
      stopTimer();
      stopMoving();
      showResult(true);
    }
  } else {
    // Wrong click: increment wrongClicks, decrease score, show feedback
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

  // Update score and wrong clicks display below game
  updateScoreDisplay();
}

// Update the score and wrong click counters on screen
function updateScoreDisplay() {
  resultDisplay.innerHTML = `
    🎯 Score: ${score} &nbsp;&nbsp; ❌ Wrong clicks: ${wrongClicks}
  `;
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

// Stop the countdown timer
function stopTimer() {
  clearInterval(timer);
}

// Show results after time runs out or level completes
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

// Reset game state and start a new round
function resetGame() {
  stopTimer();
  stopMoving();

  currentNumber = 1;
  wrongClicks = 0;
  score = 0;
  resultDisplay.textContent = "";
  timerDisplay.textContent = `Time left: ${timeLimitSeconds}.00 s`;
  levelDisplay.textContent = `Level: ${currentLevel}`;

  initNumbers();
  createGrid();
  startTimer();
  startMoving();
  updateScoreDisplay();
}

// Move only the numbers that are not clicked yet every 6 seconds
function moveNumbers() {
  const allCells = Array.from(grid.querySelectorAll(".cell"));

  // Separate clicked (correct) and unclicked cells
  const correctCells = allCells.filter(cell => cell.classList.contains("correct"));
  const activeCells = allCells.filter(cell => !cell.classList.contains("correct"));

  // Get numbers from active cells and shuffle them
  const activeNumbers = activeCells.map(cell => parseInt(cell.dataset.number, 10));
  for (let i = activeNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activeNumbers[i], activeNumbers[j]] = [activeNumbers[j], activeNumbers[i]];
  }

  // Clear grid
  grid.innerHTML = "";

  // Calculate grid size
  const totalCells = correctCells.length + activeNumbers.length;
  const gridSize = Math.ceil(Math.sqrt(totalCells));
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  // Append clicked cells in original positions (no pointer events)
  correctCells.forEach(cell => {
    const newCell = document.createElement("div");
    newCell.className = "cell correct";
    newCell.textContent = cell.textContent;
    newCell.dataset.number = cell.dataset.number;
    newCell.style.pointerEvents = "none";
    grid.appendChild(newCell);
  });

  // Append active (unclicked) cells shuffled with event listeners
  activeNumbers.forEach(num => {
    const newCell = document.createElement("div");
    newCell.className = "cell";
    newCell.textContent = num;
    newCell.dataset.number = num;
    newCell.addEventListener("click", handleCellClick);
    grid.appendChild(newCell);
  });
}

// Start the interval to move numbers every 6 seconds
function startMoving() {
  stopMoving();
  moveInterval = setInterval(moveNumbers, 6000);
}

// Stop the interval for moving numbers
function stopMoving() {
  if (moveInterval) {
    clearInterval(moveInterval);
    moveInterval = null;
  }
}

// Play sound on wrong click if not muted
function playErrorSound() {
  const audio = new Audio("error.mp3");
  audio.volume = 0.2;
  audio.play();
}

// Mute/unmute toggle button
muteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? "🔇 Unmute" : "🔊 Mute";
});

// Restart game button
restartButton.addEventListener("click", resetGame);

// Show/hide instructions modal
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

// Start the game on load
resetGame();
