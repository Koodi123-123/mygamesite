// Get references to DOM elements
const grid = document.getElementById('grid');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const muteBtn = document.getElementById('mute-btn');
const restartBtn = document.getElementById('restart-btn');

// Game variables
let numbers = [];
let currentNumber = 1;
let startTime = null;
let timerInterval = null;
let moveInterval = null;

let wrongClicks = 0;
let score = 0;

let isMuted = false;

// Game settings
let timeLimitSeconds = 60;
let gridSize = 25; // Number of cells (increases by 5 per level)
let level = 1;

// Audio setup
const clickSoundSuccess = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
clickSoundSuccess.volume = 0.3;

const clickSoundFail = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
clickSoundFail.volume = 0.3;

const clickSoundWin = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
clickSoundWin.volume = 0.3;

// Shuffle function to randomize arrays
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Starts the game timer and updates the timer display every 100ms.
 * If time runs out before level completion, ends the game with failure.
 */
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const timeLeft = Math.max(0, timeLimitSeconds - elapsed);
    timerDisplay.textContent = `Time left: ${timeLeft.toFixed(2)} s`;

    if (timeLeft <= 0) {
      // Time's up - game over failure
      stopTimer();
      stopMoving();
      showEndGame(false);
    }
  }, 100);
}

/**
 * Stops the game timer interval.
 */
function stopTimer() {
  clearInterval(timerInterval);
}

/**
 * Creates the grid with cells and sets up click handlers.
 * Cells and numbers are randomized each game start/reset.
 */
function createGrid() {
  grid.innerHTML = ''; // Clear existing grid

  // Create numbers array for current grid size
  numbers = Array.from({ length: gridSize }, (_, i) => i + 1);
  shuffle(numbers);

  // Create grid cells and add event listeners
  for (let i = 0; i < gridSize; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    // Make sure grid adjusts size to gridSize dynamically in CSS grid (handled in CSS later)

    cell.addEventListener('click', () => {
      const num = parseInt(cell.dataset.number, 10);

      // Start timer and moving only on first click on number 1
      if (!startTime && num === 1) {
        startTimer();
        startMoving();
      }

      if (num === currentNumber) {
        cell.classList.add('correct');
        if (!isMuted) {
          clickSoundSuccess.currentTime = 0;
          clickSoundSuccess.play();
        }
        currentNumber++;
        updateScore();

        if (currentNumber > gridSize) {
          // Level completed within time limit
          stopTimer();
          stopMoving();
          showEndGame(true);
        }
      } else if (num > currentNumber) {
        // Wrong click (future numbers)
        wrongClicks++;
        updateScore();
        if (!isMuted) {
          clickSoundFail.currentTime = 0;
          clickSoundFail.play();
        }
        animateFailure();
      }
      // If clicked number < currentNumber, do nothing (already clicked)
    });

    grid.appendChild(cell);
  }

  positionCells();
}

/**
 * Updates the score and displays current score and wrong clicks.
 * Score formula: (correct clicks * 10) - (wrong clicks * 5)
 */
function updateScore() {
  if (!startTime) return;

  score = (currentNumber - 1) * 10 - wrongClicks * 5;
  resultDisplay.textContent = `Score: ${score} | Wrong clicks: ${wrongClicks}`;
}

/**
 * Positions the grid cells based on the current numbers array.
 * Updates cell texts and data attributes accordingly.
 * Also marks cells as correct if already clicked.
 */
function positionCells() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach((cell, index) => {
    const numberAtPos = numbers[index];
    cell.textContent = numberAtPos;
    cell.dataset.number = numberAtPos;

    // Remove previous styles and add 'correct' if number already clicked
    if (numberAtPos < currentNumber) {
      cell.classList.add('correct');
    } else {
      cell.classList.remove('correct');
    }
  });
}

/**
 * Moves only numbers not yet clicked to random positions every few seconds.
 * Clicked numbers remain fixed.
 */
function moveNumbers() {
  const movableNumbers = numbers.filter(num => num >= currentNumber);
  shuffle(movableNumbers);

  let newPositions = [];

  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] < currentNumber) {
      // Already clicked numbers keep their position
      newPositions[i] = numbers[i];
    }
  }

  let movableIndex = 0;
  for (let i = 0; i < numbers.length; i++) {
    if (newPositions[i] === undefined) {
      newPositions[i] = movableNumbers[movableIndex];
      movableIndex++;
    }
  }

  numbers = newPositions;
  positionCells();
}

/**
 * Starts the interval that moves numbers every 3 seconds.
 */
function startMoving() {
  moveInterval = setInterval(() => {
    moveNumbers();
  }, 3000);
}

/**
 * Stops the interval moving numbers.
 */
function stopMoving() {
  clearInterval(moveInterval);
}

/**
 * Shows end game message with stats.
 * @param {boolean} success - Whether player finished the level within time.
 * Shows score, time, wrong clicks, level reached, and best stats.
 */
function showEndGame(success) {
  const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

  if (success) {
    // Player finished level on time
    resultDisplay.innerHTML = `
      🎉 Level ${level} completed!<br>
      Time: ${timeTaken} s<br>
      Score: ${score}<br>
      Wrong clicks: ${wrongClicks}<br>
      <strong>Next level will have ${gridSize + 5} numbers!</strong><br>
      Click Restart to play next level.
    `;

    // Save best time and score for this level
    saveBestStats(level, timeTaken, score);

    if (!isMuted) clickSoundWin.play();
    animateSuccess();
  } else {
    // Player failed (timeout)
    resultDisplay.innerHTML = `
      ⏰ Time's up!<br>
      Level reached: ${level}<br>
      Time: ${timeTaken} s<br>
      Score: ${score}<br>
      Wrong clicks: ${wrongClicks}<br>
      Try again to reach next level.<br>
      Click Restart to retry.
    `;

    if (!isMuted) clickSoundFail.play();
    animateFailure();
  }

  // Show best stats for this level
  showBestStats(level);
}

/**
 * Saves best time and score per level in localStorage.
 * Updates only if current is better.
 */
function saveBestStats(level, time, score) {
  const bestKey = `bestLevel_${level}`;
  const bestDataRaw = localStorage.getItem(bestKey);
  const bestData = bestDataRaw ? JSON.parse(bestDataRaw) : null;

  if (!bestData || time < bestData.time || score > bestData.score) {
    // Save better stats
    localStorage.setItem(bestKey, JSON.stringify({ time: parseFloat(time), score }));
  }
}

/**
 * Shows best stats (time and score) for a given level below the result.
 */
function showBestStats(level) {
  const bestKey = `bestLevel_${level}`;
  const bestDataRaw = localStorage.getItem(bestKey);
  if (bestDataRaw) {
    const bestData = JSON.parse(bestDataRaw);
    resultDisplay.innerHTML += `<br><small>Best Time: ${bestData.time.toFixed(2)} s | Best Score: ${bestData.score}</small>`;
  }
}

/**
 * Resets the game for either retrying current level or advancing to next level.
 * If levelUp=true, increases level and gridSize by 5.
 */
function resetGame(levelUp = false) {
  if (levelUp) {
    level++;
    gridSize += 5;
    // Optional: adjust time limit or keep same
    // timeLimitSeconds = Math.max(30, timeLimitSeconds - 5); // example
  }

  currentNumber = 1;
  wrongClicks = 0;
  score = 0;
  startTime = null;

  timerDisplay.textContent = `Time left: ${timeLimitSeconds.toFixed(2)} s`;
  resultDisplay.textContent = '';

  stopTimer();
  stopMoving();

  createGrid();
}

/**
 * Animates success by flashing background green.
 */
function animateSuccess() {
  let flashes = 0;
  const maxFlashes = 6;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = flashes % 2 === 0 ? '#4caf50' : '#111';
    flashes++;
    if (flashes > maxFlashes) {
      clearInterval(interval);
      document.body.style.backgroundColor = '#111';
    }
  }, 300);
}

/**
 * Animates failure by flashing background red.
 */
function animateFailure() {
  let flashes = 0;
  const maxFlashes = 4;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = flashes % 2 === 0 ? '#f44336' : '#111';
    flashes++;
    if (flashes > maxFlashes) {
      clearInterval(interval);
      document.body.style.backgroundColor = '#111';
    }
  }, 150);
}

// Mute toggle button
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
});

// Restart game button event handler:
// Checks if player completed level or failed to decide next action
restartBtn.addEventListener('click', () => {
  if (currentNumber > gridSize) {
    // Level completed -> go to next level
    resetGame(true);
  } else {
    // Retry current level
    resetGame(false);
  }
});

// On page load initialize game
window.addEventListener('load', () => {
  resetGame(false);
});
