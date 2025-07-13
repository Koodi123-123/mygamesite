const grid = document.getElementById('grid');
const levelDisplay = document.getElementById('level-display');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const restartBtn = document.getElementById('restart-btn');
const muteBtn = document.getElementById('mute-btn');
const showInstructionsBtn = document.getElementById('show-instructions-btn');
const instructionsModal = document.getElementById('instructions-modal');
const closeInstructionsBtn = document.getElementById('close-instructions');
const gameOverlay = document.getElementById('game-overlay'); // NEW overlay element

let level = 1;
let gridSize = 25;
let numbers = [];
let correctClicks = 0;
let wrongClicks = 0;
let nextNumber = 1;
let timer = 60.0;
let timerInterval = null;
let shuffleInterval = null;
let isMuted = false;
let clickedNumbers = new Set();  // Tracks clicked cell positions
let gameStarted = false; // Tracks if timer & shuffle started
let score = 0; // Player score

function initGame() {
  levelDisplay.textContent = `Level ${level}`;
  gridSize = 25 + (level - 1) * 5;
  nextNumber = 1;
  correctClicks = 0;
  wrongClicks = 0;
  timer = 60.0;
  score = 0;
  clickedNumbers.clear();
  resultDisplay.textContent = `Score: ${score} | Correct: ${correctClicks} | Wrong: ${wrongClicks}`;
  timerDisplay.textContent = `Time left: ${timer.toFixed(2)} s`;
  gameStarted = false;  // Reset start flag
  setupGrid();
  stopTimer();
  stopShuffle();
  restartBtn.disabled = true; // Disable restart until game ends
  hideOverlay();  // Piilotetaan overlay pelin alkaessa
}

function setupGrid() {
  numbers = [];
  for (let i = 1; i <= gridSize; i++) {
    numbers.push(i);
  }

  shuffle(numbers);

  grid.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(gridSize))}, 1fr)`;
  grid.innerHTML = '';

  for (let i = 0; i < numbers.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = numbers[i];
    cell.dataset.number = numbers[i];
    cell.dataset.position = i;

    cell.addEventListener('click', () => handleClick(cell));

    grid.appendChild(cell);
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Handles clicks on cells
function handleClick(cell) {
  const number = parseInt(cell.dataset.number);

  if (!gameStarted && number === 1) {
    // Start timer and shuffle when first number clicked
    gameStarted = true;
    startTimer();
    startShuffle();
    restartBtn.disabled = false; // Allow restart once started
  }

  if (!gameStarted) {
    // Ignore clicks if game not started and number != 1
    return;
  }

  if (number === nextNumber) {
    cell.classList.add('correct');
    clickedNumbers.add(cell.dataset.position);
    nextNumber++;
    correctClicks++;
    score += 10; // +10 points for correct click
    if (nextNumber > gridSize) {
      endGame(true);
    }
  } else {
    wrongClicks++;
    score -= 5; // -5 points for wrong click
    if (score < 0) score = 0; // Prevent negative score
    flashBackground();
  }
  updateResult();
}

// Flash background red on wrong click (unless muted)
function flashBackground() {
  if (isMuted) return;
  const originalColor = document.body.style.backgroundColor;
  document.body.style.backgroundColor = '#ff4c4c';
  setTimeout(() => {
    document.body.style.backgroundColor = originalColor || '#222';
  }, 200);
}

// Updates the score and clicks display
function updateResult() {
  resultDisplay.textContent = `Score: ${score} | Correct: ${correctClicks} | Wrong: ${wrongClicks}`;
}

// Starts the countdown timer
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer -= 0.01;
    if (timer <= 0) {
      timer = 0;
      endGame(false);
    }
    timerDisplay.textContent = `Time left: ${timer.toFixed(2)} s`;
  }, 10);
}

// Stops the countdown timer
function stopTimer() {
  clearInterval(timerInterval);
}

// Ends the game, shows message overlay and updates result stats
function endGame(success) {
  stopTimer();
  stopShuffle();
  gameStarted = false;
  restartBtn.disabled = false;

  if (success) {
    showOverlay(`<strong>🎉 Congratulations! You completed Level ${level}!</strong><br/>`);

    resultDisplay.innerHTML = `
      Final Score: ${score}<br/>
      Correct Clicks: ${correctClicks}<br/>
      Wrong Clicks: ${wrongClicks}
    `;

    level++;

    // Automatically start next level after 3 seconds
    setTimeout(() => {
      hideOverlay();
      initGame();
    }, 3000);

  } else {
    showOverlay(`<strong>⏱️ Time's up! Try again to reach next level.</strong><br/>`);

    resultDisplay.innerHTML = `
      Final Score: ${score}<br/>
      Correct Clicks: ${correctClicks}<br/>
      Wrong Clicks: ${wrongClicks}
    `;
  }
}

// Shows the overlay with given message and enables pointer-events to block clicks
function showOverlay(message) {
  gameOverlay.innerHTML = message;
  gameOverlay.classList.remove('hidden');
  gameOverlay.style.pointerEvents = 'auto';  // Block clicks on underlying grid/buttons
}

// Hides the overlay and disables pointer-events
function hideOverlay() {
  gameOverlay.classList.add('hidden');
  gameOverlay.style.pointerEvents = 'none';
}

// Starts the interval that shuffles unclicked numbers every 6 seconds
function startShuffle() {
  clearInterval(shuffleInterval);
  shuffleInterval = setInterval(() => {
    shuffleUnclickedNumbers();
  }, 6000);
}

// Stops the shuffle interval
function stopShuffle() {
  clearInterval(shuffleInterval);
}

// Shuffle only numbers in cells that haven't been clicked yet
function shuffleUnclickedNumbers() {
  const cells = Array.from(grid.children);

  const unclickedCells = cells.filter(c => !clickedNumbers.has(c.dataset.position));
  if (unclickedCells.length <= 1) return;

  const unclickedNumbers = unclickedCells.map(c => parseInt(c.dataset.number));

  shuffle(unclickedNumbers);

  for (let i = 0; i < unclickedCells.length; i++) {
    unclickedCells[i].textContent = unclickedNumbers[i];
    unclickedCells[i].dataset.number = unclickedNumbers[i];
  }
}

// Mute/unmute button toggler
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Mute';
});

// Restart button reloads the game
restartBtn.addEventListener('click', () => {
  restartBtn.disabled = true;
  hideOverlay(); // Piilotetaan overlay kun uudelleenpeluu alkaa
  initGame();
});

// Show and close instructions modal
showInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'block';
});

closeInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'none';
});

// Initialize the game on page load
initGame();
