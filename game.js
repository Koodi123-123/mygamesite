// Get references to DOM elements
const grid = document.getElementById('grid');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const muteBtn = document.getElementById('mute-btn');

// Array of numbers 1 through 25 - represents numbers on grid
let numbers = Array.from({ length: 25 }, (_, i) => i + 1);

// Current number to be clicked next
let currentNumber = 1;

// Variables for timer
let startTime = null;
let timerInterval = null;

// Interval for moving numbers periodically
let moveInterval = null;

// Game settings
const timeLimitSeconds = 60; // Total time limit in seconds for the game

// Score tracking
let wrongClicks = 0;
let score = 0;

// Mute flag for sounds
let isMuted = false;

// Audio setup for different sounds
const clickSoundSuccess = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
clickSoundSuccess.volume = 0.3;

const clickSoundFail = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
clickSoundFail.volume = 0.3;

const clickSoundWin = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
clickSoundWin.volume = 0.3;

// Fisher-Yates shuffle to randomize an array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Starts the game timer and updates display every 100 ms
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const timeLeft = Math.max(0, timeLimitSeconds - elapsed);
    timerDisplay.textContent = `Time left: ${timeLeft.toFixed(2)} s`;

    if (timeLeft <= 0) {
      // Time is up - game over failure
      stopTimer();
      stopMoving();
      resultDisplay.textContent = `Time's up! You clicked ${currentNumber - 1} numbers. Score: ${score}`;
      if (!isMuted) clickSoundFail.play();
      animateFailure();
    }
  }, 100);
}

// Stops the game timer
function stopTimer() {
  clearInterval(timerInterval);
}

// Creates the grid cells only once
function createGrid() {
  grid.innerHTML = ''; // Clear grid just in case

  numbers.forEach(num => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = num;
    cell.dataset.number = num; // Store number in data attribute

    // If this number was already clicked, mark it green
    if (num < currentNumber) {
      cell.classList.add('correct');
    }

    // Handle click on each cell
    cell.addEventListener('click', () => {
      // Start timer and movement only when first correct number is clicked
      if (!startTime && num === 1) {
        startTimer();
        startMoving();
      }

      if (num === currentNumber) {
        // Correct click
        cell.classList.add('correct');
        if (!isMuted) {
          clickSoundSuccess.currentTime = 0;
          clickSoundSuccess.play();
        }

        currentNumber++;
        updateScore();

        if (currentNumber > 25) {
          // Game finished successfully
          stopTimer();
          stopMoving();
          const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
          resultDisplay.textContent = `🎉 Congratulations! You finished in ${timeTaken} seconds with score ${score}.`;
          if (!isMuted) clickSoundWin.play();
          animateSuccess();
          saveBestTime(timeTaken);
          showBestTime();
        }
      } else if (num >= currentNumber) {
        // Wrong click - penalize
        wrongClicks++;
        updateScore();
        if (!isMuted) {
          clickSoundFail.currentTime = 0;
          clickSoundFail.play();
        }
        animateFailure();
      }
      // Clicking numbers less than currentNumber (already clicked) does nothing
    });

    grid.appendChild(cell);
  });

  // Position cells initially
  positionCells();
}

// Update score display based on correct and wrong clicks and speed
function updateScore() {
  // Simple formula: +10 points per correct click, -5 per wrong click
  // Bonus: +1 point for every 0.1 second saved (fast clicks)
  if (!startTime) return;

  const elapsed = (Date.now() - startTime) / 1000;
  score = (currentNumber - 1) * 10 - wrongClicks * 5 + Math.max(0, Math.floor((25 - (currentNumber - 1)) * 1)); // Simplified bonus for remaining numbers
  // Just show the score for now
  resultDisplay.textContent = `Score: ${score} | Wrong clicks: ${wrongClicks}`;
}

// Position each cell in the grid based on the numbers array
function positionCells() {
  const cells = document.querySelectorAll('.cell');

  cells.forEach(cell => {
    const num = parseInt(cell.dataset.number, 10);
    const index = numbers.indexOf(num);
    const row = Math.floor(index / 5) + 1;
    const col = (index % 5) + 1;

    cell.style.gridRowStart = row;
    cell.style.gridColumnStart = col;
  });
}

// Move numbers periodically except those already clicked (numbers < currentNumber)
function moveNumbers() {
  // Extract numbers not yet clicked
  const movableNumbers = numbers.filter(num => num >= currentNumber);
  shuffle(movableNumbers);

  // Build new positions array preserving clicked numbers in place
  let newPositions = [];

  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] < currentNumber) {
      // Already clicked numbers stay at their position
      newPositions[i] = numbers[i];
    }
  }

  // Fill remaining positions with shuffled movable numbers
  let movableIndex = 0;
  for (let i = 0; i < numbers.length; i++) {
    if (!newPositions[i]) {
      newPositions[i] = movableNumbers[movableIndex];
      movableIndex++;
    }
  }

  numbers = newPositions;

  // Update the cell positions on screen
  positionCells();
}

// Starts the interval that moves numbers every few seconds
function startMoving() {
  // Move numbers every 3 seconds (can adjust difficulty by changing interval)
  moveInterval = setInterval(() => {
    moveNumbers();
  }, 3000);
}

// Stops the number moving interval
function stopMoving() {
  clearInterval(moveInterval);
}

// Save the best time to localStorage if it's better than previous best
function saveBestTime(timeTaken) {
  const best = localStorage.getItem('bestTime');
  if (!best || timeTaken < best) {
    localStorage.setItem('bestTime', timeTaken);
  }
}

// Show the best time saved in localStorage
function showBestTime() {
  const best = localStorage.getItem('bestTime');
  if (best) {
    resultDisplay.textContent += ` | Best time: ${best} s`;
  }
}

// Animate success (game finished)
function animateSuccess() {
  // Example: flash the background green a few times
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

// Animate failure (wrong click or timeout)
function animateFailure() {
  // Example: flash red background quickly
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

// Toggle mute button and sounds
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
});

// Reset game state and start fresh game
function resetGame() {
  // Reset variables
  numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  currentNumber = 1;
  wrongClicks = 0;
  score = 0;
  startTime = null;
  resultDisplay.textContent = '';
  timerDisplay.textContent = `Time left: ${timeLimitSeconds}.00 s`;

  // Clear intervals
  stopTimer();
  stopMoving();

  // Create grid fresh
  createGrid();

  // Show best time if any
  showBestTime();
}

// On page load, initialize the grid and best time display
window.addEventListener('load', () => {
  resetGame();
});
