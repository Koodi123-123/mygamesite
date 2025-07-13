// Get references to DOM elements
const grid = document.getElementById('grid'); // The container for the number grid
const timerDisplay = document.getElementById('timer'); // Timer display element
const resultDisplay = document.getElementById('result'); // Display for score and messages
const muteBtn = document.getElementById('mute-btn'); // Button to mute/unmute sounds
const restartBtn = document.getElementById('restart-btn'); // Button to restart game
const showInstructionsBtn = document.getElementById('show-instructions-btn'); // Button to show instructions modal
const instructionsModal = document.getElementById('instructions-modal'); // Modal element for instructions
const closeInstructions = document.getElementById('close-instructions'); // Close button inside the modal

// Game variables and settings
let currentLevel = 1; // Current level number, starts from 1
let numbers = []; // Array holding numbers in the grid
let currentNumber = 1; // The next number player must click
let wrongClicks = 0; // Count of wrong clicks
let score = 0; // Player's score

const baseGridSize = 25; // Starting number of cells
const levelIncrement = 5; // Numbers added each next level

const timeLimitSeconds = 60; // Time limit per level in seconds

let startTime = null; // Timestamp when level started
let timerInterval = null; // Interval ID for timer updates
let moveInterval = null; // Interval ID for moving numbers

let isMuted = false; // Sound mute state

// Audio files for game feedback
const clickSoundSuccess = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
clickSoundSuccess.volume = 0.3;

const clickSoundFail = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
clickSoundFail.volume = 0.3;

const clickSoundWin = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
clickSoundWin.volume = 0.3;

// Fisher-Yates shuffle algorithm to randomize array elements
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initialize the numbers array for current level, shuffled randomly
function initNumbers() {
  const totalNumbers = baseGridSize + (currentLevel - 1) * levelIncrement;
  numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);
  shuffle(numbers);
}

// Create grid cells dynamically based on current numbers array length
function createGrid() {
  grid.innerHTML = ''; // Clear previous cells

  for (let i = 0; i < numbers.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.width = '60px';
    cell.style.height = '60px';

    // Attach click handler to each cell
    cell.addEventListener('click', () => handleCellClick(cell));

    grid.appendChild(cell);
  }

  // Set grid columns and populate numbers
  positionCells();
}

// Positions numbers inside cells and updates styling for clicked/correct cells
function positionCells() {
  const cells = grid.querySelectorAll('.cell');

  // Calculate number of columns to form roughly square grid
  const cols = Math.ceil(Math.sqrt(numbers.length));
  grid.style.gridTemplateColumns = `repeat(${cols}, 60px)`;

  cells.forEach((cell, index) => {
    const numberAtPos = numbers[index];
    cell.textContent = numberAtPos;
    cell.dataset.number = numberAtPos;

    // Style cells already clicked as correct and disable pointer
    if (numberAtPos < currentNumber) {
      cell.classList.add('correct');
      cell.style.cursor = 'default';
    } else {
      cell.classList.remove('correct');
      cell.style.cursor = 'pointer';
    }
  });
}

// Handle clicks on grid cells
function handleCellClick(cell) {
  const clickedNumber = parseInt(cell.dataset.number, 10);

  // Start timer and number movement only when player clicks number 1 for the first time
  if (!startTime && clickedNumber === 1) {
    startTimer();
    startMoving();
  }

  // Correct click: clicked number is exactly the expected current number
  if (clickedNumber === currentNumber) {
    cell.classList.add('correct'); // Mark cell visually as correct
    if (!isMuted) {
      clickSoundSuccess.currentTime = 0;
      clickSoundSuccess.play();
    }
    currentNumber++;
    updateScore();

    // Check if all numbers clicked -> level completed
    if (currentNumber > numbers.length) {
      stopTimer();
      stopMoving();

      const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
      resultDisplay.textContent = `🎉 Level ${currentLevel} completed in ${timeTaken}s! Score: ${score}`;

      if (!isMuted) clickSoundWin.play();

      // Save best results in localStorage
      saveBestResult(currentLevel, timeTaken, score);

      // Show best results under the grid
      showBestResult(currentLevel);

      // Advance to next level after 6 seconds delay
      setTimeout(() => {
        currentLevel++;
        resetGame();
      }, 6000);
    }
  } else if (clickedNumber > currentNumber) {
    // Wrong click (clicked number is bigger than expected) - penalize player
    wrongClicks++;
    updateScore();
    if (!isMuted) {
      clickSoundFail.currentTime = 0;
      clickSoundFail.play();
    }
    animateFailure();
  }
  // Ignore clicks on numbers less than currentNumber (already clicked)
}

// Update score display: correct clicks * 10 points minus wrong clicks * 5 points
function updateScore() {
  if (!startTime) return; // Don't update if game not started

  score = (currentNumber - 1) * 10 - wrongClicks * 5;
  resultDisplay.textContent = `Score: ${score} | Wrong clicks: ${wrongClicks}`;
}

// Move numbers randomly every interval except already clicked ones
function moveNumbers() {
  // Get numbers not yet clicked
  const movableNumbers = numbers.filter(num => num >= currentNumber);
  shuffle(movableNumbers);

  // Create new array for positions, keeping clicked numbers fixed
  let newPositions = new Array(numbers.length);

  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] < currentNumber) {
      newPositions[i] = numbers[i]; // Already clicked numbers stay fixed
    }
  }

  // Fill the remaining empty positions with shuffled movable numbers
  let movableIndex = 0;
  for (let i = 0; i < newPositions.length; i++) {
    if (newPositions[i] === undefined) {
      newPositions[i] = movableNumbers[movableIndex];
      movableIndex++;
    }
  }

  numbers = newPositions;

  // Update grid display after moving numbers
  positionCells();
}

// Start the countdown timer, updating every 50ms
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = (timeLimitSeconds - elapsed).toFixed(2);
    timerDisplay.textContent = `Time left: ${remaining} s`;

    if (remaining <= 0) {
      stopTimer();
      stopMoving();
      resultDisplay.textContent = `⏰ Time's up! Game Over. Your score: ${score}`;
      disableGrid(); // Disable further clicks
    }
  }, 50);
}

// Stop the timer interval
function stopTimer() {
  clearInterval(timerInterval);
}

// Start interval to move numbers every 3 seconds (adjust time here if needed)
function startMoving() {
  moveInterval = setInterval(moveNumbers, 3000);
}

// Stop moving numbers interval
function stopMoving() {
  clearInterval(moveInterval);
}

// Disable all grid cells, e.g. after game over
function disableGrid() {
  const cells = grid.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.style.pointerEvents = 'none';
    cell.style.cursor = 'default';
  });
}

// Reset the game state for new level or restart
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

  // Re-enable clicking on all cells
  const cells = grid.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.style.pointerEvents = 'auto';
  });
}

// Visual feedback animation on wrong click
function animateFailure() {
  grid.style.animation = 'shake 0.3s';
  setTimeout(() => {
    grid.style.animation = '';
  }, 300);
}

// Save best time and score for current level to localStorage
function saveBestResult(level, time, score) {
  const keyTime = `bestTime_level${level}`;
  const keyScore = `bestScore_level${level}`;

  const bestTime = localStorage.getItem(keyTime);
  const bestScore = localStorage.getItem(keyScore);

  // Update best time if current is better or none saved
  if (!bestTime || time < parseFloat(bestTime)) {
    localStorage.setItem(keyTime, time);
  }
  // Update best score if current is better or none saved
  if (!bestScore || score > parseInt(bestScore)) {
    localStorage.setItem(keyScore, score);
  }
}

// Show best time and score under the result display
function showBestResult(level) {
  const bestTime = localStorage.getItem(`bestTime_level${level}`) || 'N/A';
  const bestScore = localStorage.getItem(`bestScore_level${level}`) || 'N/A';

  resultDisplay.textContent += ` | Best Time: ${bestTime}s | Best Score: ${bestScore}`;
}

// Toggle mute/unmute sounds when mute button clicked
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
});

// Restart button resets the game to level 1
restartBtn.addEventListener('click', () => {
  currentLevel = 1;
  resetGame();
});

// Show the instructions modal when button clicked
showInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'block';
});

// Close the instructions modal when clicking the close (X) button
closeInstructions.addEventListener('click', () => {
  instructionsModal.style.display = 'none';
});

// Close the instructions modal when clicking outside the modal content area
window.addEventListener('click', (e) => {
  if (e.target === instructionsModal) {
    instructionsModal.style.display = 'none';
  }
});

// Initialize the game when the page loads
window.onload = () => {
  resetGame();
};
