// DOM references
const grid = document.getElementById('grid');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const muteBtn = document.getElementById('mute-btn');

// Game constants
const GRID_SIZE = 25;       // Number of cells (5x5)
const TIME_LIMIT = 30;      // Time limit in seconds
const MOVE_INTERVAL = 5000; // Interval for moving numbers in ms (5s)
const FAST_CLICK_THRESHOLD = 800; // ms threshold for bonus points

// Game state variables
let numbers = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
let currentNumber = 1;
let startTime = null;
let timerInterval = null;
let moveInterval = null;
let isMuted = false;
let score = 0;
let penalty = 0;
let lastClickTime = null;

// Sounds setup
const sounds = {
  click: new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg'),
  error: new Audio('https://actions.google.com/sounds/v1/cartoon/boing.ogg'),
  success: new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'),
  fail: new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg'),
};

for (const sound of Object.values(sounds)) {
  sound.volume = 0.3;
}

// Shuffle function using Fisher-Yates algorithm
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Start the main game timer and update display every 100ms
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const timeLeft = Math.max(0, (TIME_LIMIT - elapsed));
    timerDisplay.textContent = `Time left: ${timeLeft.toFixed(2)} s`;

    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 100);
}

// Stop all intervals and timers
function stopAllTimers() {
  clearInterval(timerInterval);
  clearInterval(moveInterval);
}

// Move numbers to new random positions (reshuffle and re-render)
function moveNumbers() {
  shuffle(numbers);
  renderGrid();
}

// Render the grid based on the current numbers array
function renderGrid() {
  grid.innerHTML = '';

  numbers.forEach(num => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = num;

    // Highlight the next number to click
    if (num === currentNumber) {
      cell.style.border = '2px solid #FFD700'; // gold highlight
      cell.style.fontWeight = 'bold';
    } else {
      cell.style.border = '';
      cell.style.fontWeight = '';
    }

    cell.addEventListener('click', () => handleClick(num, cell));

    grid.appendChild(cell);
  });
}

// Handle a click on a cell with number 'num'
function handleClick(num, cell) {
  const now = Date.now();

  // If game hasn't started yet and player clicks '1', start timer and move interval
  if (!startTime && num === 1) {
    startTimer();
    moveInterval = setInterval(moveNumbers, MOVE_INTERVAL);
    lastClickTime = now;
  }

  // Ignore clicks if game not started or already ended
  if (!startTime || currentNumber > GRID_SIZE) return;

  if (num === currentNumber) {
    // Correct click
    cell.classList.add('correct');

    // Calculate if fast click bonus applies (click within threshold ms from last click)
    if (lastClickTime && (now - lastClickTime) <= FAST_CLICK_THRESHOLD) {
      score += 2; // bonus points for fast click
    } else {
      score += 1;
    }
    lastClickTime = now;

    // Play success click sound
    if (!isMuted) {
      sounds.click.currentTime = 0;
      sounds.click.play();
    }

    currentNumber++;

    // Check if game finished successfully
    if (currentNumber > GRID_SIZE) {
      endGame(true);
    } else {
      renderGrid(); // Update grid to highlight next number
    }
  } else {
    // Wrong click
    penalty++;

    // Play error sound
    if (!isMuted) {
      sounds.error.currentTime = 0;
      sounds.error.play();
    }

    // Flash red animation on clicked cell to indicate error
    cell.classList.add('error');
    setTimeout(() => cell.classList.remove('error'), 300);
  }
}

// End the game either success or fail
function endGame(success) {
  stopAllTimers();

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const finalScore = Math.max(0, score - penalty);

  // Save best time if success and time is better
  if (success) {
    let bestTime = localStorage.getItem('bestTime');
    if (!bestTime || elapsedTime < bestTime) {
      localStorage.setItem('bestTime', elapsedTime);
      bestTime = elapsedTime;
    }

    resultDisplay.innerHTML = `
      <div class="result-message success">
        🎉 Congratulations! You finished in ${elapsedTime} seconds.<br />
        Score: ${finalScore} (Points: ${score}, Penalties: ${penalty})<br />
        Best time: ${bestTime} seconds
      </div>
    `;

    // Play success sound
    if (!isMuted) {
      sounds.success.currentTime = 0;
      sounds.success.play();
    }

    // Success animation
    animateGridSuccess();
  } else {
    resultDisplay.innerHTML = `
      <div class="result-message fail">
        ⏰ Time's up! Game over.<br />
        Score: ${finalScore} (Points: ${score}, Penalties: ${penalty})
      </div>
    `;

    // Play fail sound
    if (!isMuted) {
      sounds.fail.currentTime = 0;
      sounds.fail.play();
    }

    // Failure animation
    animateGridFail();
  }
}

// Success animation - scale up and color flash green on all cells
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

// Failure animation - shake grid container horizontally
function animateGridFail() {
  grid.style.animation = 'shake 0.5s';
  grid.addEventListener('animationend', () => {
    grid.style.animation = '';
  }, { once: true });
}

// Shake animation keyframes
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

// Toggle mute state and button text
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
});

// Initialize the game grid on page load
window.addEventListener('DOMContentLoaded', () => {
  shuffle(numbers);
  renderGrid();
  timerDisplay.textContent = `Time left: ${TIME_LIMIT}.00 s`;
  resultDisplay.textContent = '';
  score = 0;
  penalty = 0;
  currentNumber = 1;
  startTime = null;
});
