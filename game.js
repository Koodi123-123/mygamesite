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

function initNumbers() {
  const count = 20 + currentLevel * 5;
  numbers = Array.from({ length: count }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
}

function createGrid() {
  grid.innerHTML = "";
  numbers.forEach(num => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = num;
    cell.dataset.number = num;
    cell.addEventListener("click", handleCellClick);
    grid.appendChild(cell);
  });
}

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

function stopTimer() {
  clearInterval(timer);
}

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
  });

  startTimer();
  startMoving();
}

function moveNumbers() {
  const remainingCells = Array.from(grid.querySelectorAll(".cell")).filter(
    cell => parseInt(cell.dataset.number, 10) >= currentNumber
  );

  remainingCells.forEach(cell => {
    const x = Math.random() * 20 - 10;
    const y = Math.random() * 20 - 10;
    cell.style.transform = `translate(${x}px, ${y}px)`;
  });
}

function startMoving() {
  stopMoving();
  moveInterval = setInterval(moveNumbers, 6000);
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
