// Get references to DOM elements
const grid = document.getElementById('grid');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const muteBtn = document.getElementById('mute-btn');
const restartBtn = document.getElementById('restart-btn');
const showInstructionsBtn = document.getElementById('show-instructions-btn');
const instructionsModal = document.getElementById('instructions-modal');
const closeInstructions = document.getElementById('close-instructions');

// Game variables and settings
let currentLevel = 1; // Level starts at 1
let numbers = [];
let currentNumber = 1;
let wrongClicks = 0;
let score = 0;

const baseGridSize = 25; // Initial grid size
const levelIncrement = 5; // Numbers added each level

const timeLimitSeconds = 60;

let startTime = null;
let timerInterval = null;
let moveInterval = null;

let isMuted = false;

// Audio setup
const clickSoundSuccess = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
clickSoundSuccess.volume = 0.3;

const clickSoundFail = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
clickSoundFail.volume = 0.3;

const clickSoundWin = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
clickSoundWin.volume = 0.3;

// Fisher-Yates shuffle to randomize array
function shuffle(array) {
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initialize the grid with randomized numbers for the current level
function initNumbers() {
  const totalNumbers = baseGridSize + (currentLevel - 1) * levelIncrement;
  numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);
  shuffle(numbers);
}

// Create grid cells dynamically based on numbers array length
function createGrid() {
  grid.innerHTML = ''; // Clear grid before creating cells

  for (let i = 0; i < numbers.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    // Width and height are controlled by CSS for responsiveness

    // Attach click event
    cell.addEventListener('click', () => handleCellClick(cell));

    grid.appendChild(cell);
  }

  positionCells();
}

// Position cells with numbers and styles
function positionCells() {
  const cells = grid.querySelectorAll('.cell');

  // Calculate columns based on square root rounded up for approximate square grid
  const cols = Math.ceil(Math.sqrt(numbers.length));
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; // 1fr to fill space responsively

  cells.forEach((cell, index) => {
    const numberAtPos = numbers[index];
    cell.textContent = numberAtPos;
    cell.dataset.number = numberAtPos;

    // Mark cells as correct if number already clicked
    if (numberAtPos < currentNumber) {
      cell.classList.add('correct');
      cell.style.cursor = 'default';
    } else {
      cell.classList.remove('correct');
      cell.style.cursor = 'pointer';
    }
  });
}

// Handle cell click logic
function handleCellClick(cell) {
  const clickedNumber = parseInt(cell.dataset.number, 10);

  // Start timer and moving numbers on first click on number 1
  if (!startTime && clickedNumber === 1) {
    startTimer();
    startMoving();
  }

  // If clicked correct next number
  if (clickedNumber === currentNumber) {
    cell.classList.add('correct');
    if (!isMuted) {
      clickSoundSuccess.currentTime = 0;
      clickSoundSuccess.play();
    }
    currentNumber++;
    updateScore();

    // Check if level completed
    if (currentNumber > numbers.length) {
      stopTimer();
      stopMoving();

      const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
      resultDisplay.textContent = `🎉 Level ${currentLevel} completed in ${timeTaken}s! Score: ${score}`;

      if (!isMuted) clickSoundWin.play();

      // Save best time and score
      saveBestResult(currentLevel, timeTaken, score);

      showBestResult(currentLevel);

      // Advance to next level after short delay
      setTimeout(() => {
        currentLevel++;
        resetGame();
      }, 6000);
    }
  } else if (clickedNumber > currentNumber) {
    // Wrong click - increment wrong clicks and feedback
    wrongClicks++;
    updateScore();
    if (!isMuted) {
      clickSoundFail.currentTime = 0;
      clickSoundFail.play();
    }
    animateFailure();
  }
  // else ignore clicks on numbers less than currentNumber
}

// Update the score display
function updateScore() {
  if (!startTime) return;

  score = (currentNumber -1) * 10 - wrongClicks * 5;
  resultDisplay.textContent = `Score: ${score} | Wrong clicks: ${wrongClicks}`;
}

// Move numbers randomly except already clicked ones
function moveNumbers() {
  // Numbers not clicked yet
  const movableNumbers = numbers.filter(num => num >= currentNumber);
  shuffle(movableNumbers);

  // Initialize new positions array with same length
  let newPositions = new Array(numbers.length);

  // Place already clicked numbers in original positions
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] < currentNumber) {
      newPositions[i] = numbers[i];
    }
  }

  // Fill undefined slots with shuffled movable numbers
  let movableIndex = 0;
  for (let i = 0; i < newPositions.length; i++) {
    if (newPositions[i] === undefined) {
      newPositions[i] = movableNumbers[movableIndex];
      movableIndex++;
    }
  }

  numbers = newPositions;

  positionCells();
}

// Start the countdown timer and update display every 50ms
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = (timeLimitSeconds - elapsed).toFixed(2);
    timerDisplay.textContent = `Time left: ${remaining} s`;

    if (remaining <= 0) {
      stopTimer();
      stopMoving();
      showTryAgain();
    }
  }, 50);
}

// Stop the timer interval
function stopTimer() {
  clearInterval(timerInterval);
}

// Start interval that moves numbers every 3 seconds (adjustable)
function startMoving() {
  moveInterval = setInterval(moveNumbers, 3000);
}

// Stop number moving interval
function stopMoving() {
  clearInterval(moveInterval);
}

// Disable all grid cells (after game over)
function disableGrid() {
  const cells = grid.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.style.pointerEvents = 'none';
    cell.style.cursor = 'default';
  });
}

// Reset and start new game or new level
function resetGame() {
  stopTimer();
  stopMoving();

  currentNumber = 1;
  wrongClicks = 0;
  score = 0;
  resultDisplay.textContent = '';
  timerDisplay.textContent = `Time left: ${timeLimitSeconds}.00 s`;

  initNumbers();
  createGrid();

  // Enable all cells again
  const cells = grid.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.style.pointerEvents = 'auto';
  });
}

// Animate failure feedback on wrong click
function animateFailure() {
  grid.style.animation = 'shake 0.3s';
  setTimeout(() => {
    grid.style.animation = '';
  }, 300);
}

// Save best time and score in localStorage
function saveBestResult(level, time, score) {
  const keyTime = `bestTime_level${level}`;
  const keyScore = `bestScore_level${level}`;

  const bestTime = localStorage.getItem(keyTime);
  const bestScore = localStorage.getItem(keyScore);

  if (!bestTime || time < parseFloat(bestTime)) {
    localStorage.setItem(keyTime, time);
  }
  if (!bestScore || score > parseInt(bestScore)) {
    localStorage.setItem(keyScore, score);
  }
}

// Show best result under the grid
function showBestResult(level) {
  const bestTime = localStorage.getItem(`bestTime_level${level}`) || 'N/A';
  const bestScore = localStorage.getItem(`bestScore_level${level}`) || 'N/A';

  resultDisplay.textContent += ` | Best Time: ${bestTime}s | Best Score: ${bestScore}`;
}

// Show the "try again" message and button when time runs out
function showTryAgain() {
  resultDisplay.innerHTML = `
    ⏰ Time's up! Game Over. Your score: ${score} <br/>
    <strong>Try again! Complete the level within the time limit to reach the next level.</strong><br/>
    <button id="try-again-btn">Try Again</button>
  `;

  disableGrid();

  const tryAgainBtn = document.getElementById('try-again-btn');
  tryAgainBtn.addEventListener('click', () => {
    resetGame(); // Restart current level
  });
}

// Toggle mute button sound
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
});

// Restart button resets game completely
restartBtn.addEventListener('click', () => {
  currentLevel = 1;
  resetGame();
});

// Show instructions modal
showInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'block';
});

// Close modal on close button click
closeInstructions.addEventListener('click', () => {
  instructionsModal.style.display = 'none';
});

// Close modal when clicking outside modal content
window.addEventListener('click', (e) => {
  if (e.target === instructionsModal) {
    instructionsModal.style.display = 'none';
  }
});

// Initialize game on page load
window.onload = () => {
  resetGame();
};
