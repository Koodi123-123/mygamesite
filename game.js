// Get references to DOM elements
const grid = document.getElementById('grid');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const muteBtn = document.getElementById('mute-btn');

// Constants for game configuration
const TIME_LIMIT = 30; // seconds total time to finish
const MOVE_INTERVAL = 5000; // milliseconds between number moves

// Array of numbers 1 through 25
let numbers = Array.from({ length: 25 }, (_, i) => i + 1);

// Game state variables
let currentNumber = 1;  // The next number the player must click
let score = 0;          // Player score (increases with speed)
let penalty = 0;        // Penalty points for wrong clicks
let startTime = null;   // Time when the game starts
let lastClickTime = null; // Time of last correct click
let timerInterval = null; // Interval for countdown timer
let moveInterval = null;  // Interval to move numbers periodically
let isMuted = false;      // Sound mute flag

// Load audio clips for sounds
const sounds = {
  correct: new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg'),
  wrong: new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'),
  finish: new Audio('https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_hit.ogg'),
  fail: new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg')
};

// Set volumes lower for all sounds
for (let key in sounds) {
  sounds[key].volume = 0.3;
}

/**
 * Shuffle the elements of an array in-place using Fisher-Yates algorithm.
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Render the grid cells with current numbers.
 * Adds click event listeners for gameplay.
 */
function renderGrid() {
  grid.innerHTML = ''; // Clear the grid

  numbers.forEach(num => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = num;

    // Click event listener for each cell
    cell.addEventListener('click', () => {
      if (!startTime && num === 1) {
        // Game starts when player clicks '1' first time
        startGame();
      }

      if (!startTime) {
        // Ignore clicks before game start except '1'
        return;
      }

      if (num === currentNumber) {
        // Correct number clicked
        cell.classList.add('correct');

        // Play success sound if not muted
        if (!isMuted) {
          sounds.correct.currentTime = 0;
          sounds.correct.play();
        }

        // Calculate score based on speed (faster clicks = more points)
        let now = Date.now();
        if (lastClickTime) {
          const diff = now - lastClickTime;
          // Faster than 1 second: +5 points, else +1 point
          score += diff < 1000 ? 5 : 1;
        } else {
          // First click gives base 1 point
          score += 1;
        }
        lastClickTime = now;

        currentNumber++;

        if (currentNumber > 25) {
          // Game finished successfully
          finishGame(true);
        }
      } else {
        // Wrong number clicked
        penalty += 3; // Penalize 3 points

        if (!isMuted) {
          sounds.wrong.currentTime = 0;
          sounds.wrong.play();
        }
      }
    });

    grid.appendChild(cell);
  });
}

/**
 * Moves numbers randomly in the grid every MOVE_INTERVAL milliseconds.
 * Called repeatedly during the game.
 */
function moveNumbersPeriodically() {
  numbers = shuffle(numbers);
  renderGrid();
}

/**
 * Starts the game timer and periodic movement of numbers.
 */
function startGame() {
  startTime = Date.now();
  lastClickTime = startTime;

  // Update timer display every 100ms counting down
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const timeLeft = Math.max(TIME_LIMIT - elapsed, 0);
    timerDisplay.textContent = `Time left: ${timeLeft.toFixed(2)} s`;

    if (timeLeft <= 0) {
      // Time's up - game over fail
      finishGame(false);
    }
  }, 100);

  // Start moving numbers every MOVE_INTERVAL ms
  moveInterval = setInterval(() => {
    moveNumbersPeriodically();
  }, MOVE_INTERVAL);
}

/**
 * Ends the game, stops intervals and shows result message.
 * @param {boolean} success True if player finished successfully.
 */
function finishGame(success) {
  clearInterval(timerInterval);
  clearInterval(moveInterval);

  // Calculate final time taken or time expired
  let finalTime;
  if (success) {
    finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  } else {
    finalTime = TIME_LIMIT.toFixed(2);
  }

  // Calculate final score subtracting penalty points, min 0
  let finalScore = Math.max(score - penalty, 0);

  // Load and save best time from localStorage
  const bestTimeKey = 'numberGridBestTime';
  let bestTime = localStorage.getItem(bestTimeKey);

  if (success) {
    if (!bestTime || finalTime < bestTime) {
      bestTime = finalTime;
      localStorage.setItem(bestTimeKey, bestTime);
    }
  }

  // Disable all grid clicks after game ends by removing event listeners
  grid.querySelectorAll('.cell').forEach(cell => {
    cell.style.cursor = 'default';
    cell.replaceWith(cell.cloneNode(true)); // Remove all listeners
  });

  if (success) {
    resultDisplay.innerHTML = `
      <div class="result-message success">
        🎉 Congratulations! You finished in ${finalTime} seconds.<br />
        Your score: ${finalScore} (Points: ${score}, Penalties: ${penalty})<br />
        Best time: ${bestTime} seconds
      </div>
    `;

    if (!isMuted) {
      sounds.finish.currentTime = 0;
      sounds.finish.play();
    }

    animateGridSuccess();

  } else {
    resultDisplay.innerHTML = `
      <div class="result-message fail">
        ⏰ Time's up! Game over.<br />
        Score: ${finalScore} (Points: ${score}, Penalties: ${penalty})
      </div>
    `;

    if (!isMuted) {
      sounds.fail.currentTime = 0;
      sounds.fail.play();
    }

    animateGridFail();
  }
}

/**
 * Animate grid for success: scale up and flash green cells sequentially.
 */
function animateGridSuccess() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach((cell, index) => {
    setTimeout(() => {
      cell.style.transition = 'transform 0.3s, background-color 0.3s';
      cell.style.transform = 'scale(1.3)';
      cell.style.backgroundColor = '#4caf50';

      setTimeout(() => {
        cell.style.transform = 'scale(1)';
        cell.style.backgroundColor = '#333';
      }, 300);
    }, index * 50);
  });
}

/**
 * Animate grid failure by shaking the entire grid horizontally.
 */
function animateGridFail() {
  grid.style.animation = 'shake 0.5s';
  grid.addEventListener('animationend', () => {
    grid.style.animation = '';
  }, { once: true });
}

// Shake animation CSS keyframes injected dynamically
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    50% { transform: translateX(8px); }
    75% { transform: translateX(-8px); }
    100% { transform: translateX(0); }
  }
`;
document.head.appendChild(styleSheet);

// Toggle mute state and update button text
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
});

// Initialize game on page load
window.addEventListener('DOMContentLoaded', () => {
  numbers = shuffle(numbers);
  currentNumber = 1;
  score = 0;
  penalty = 0;
  startTime = null;
  lastClickTime = null;
  timerDisplay.textContent = `Time left: ${TIME_LIMIT}.00 s`;
  resultDisplay.textContent = '';
  renderGrid();
});
