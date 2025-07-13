/*!
 * Number Grid Click Game - game.js
 * 
 * Copyright (c) 2025 Koodi123-123
 * 
 * Licensed under the MIT License.
 * You may use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of this software under the conditions of the MIT License.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

const grid = document.getElementById('grid');
const levelDisplay = document.getElementById('level-display');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const restartBtn = document.getElementById('restart-btn');
const muteBtn = document.getElementById('mute-btn');
const showInstructionsBtn = document.getElementById('show-instructions-btn');
const instructionsModal = document.getElementById('instructions-modal');
const closeInstructionsBtn = document.getElementById('close-instructions');

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
  hideOverlay();  // Hide overlay when starting the game
}

function setupGrid() {
  numbers = [];
  for (let i = 1; i <= gridSize; i++) {
    numbers.push(i);
  }

  shuffle(numbers);

  // Set grid columns based on square root of grid size (for layout)
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

  // Add overlay back to grid if it doesn't exist
  let overlay = document.getElementById('game-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    overlay.classList.add('hidden');
    grid.appendChild(overlay);
  } else {
    // If overlay exists but is not child of grid, add it back
    if (overlay.parentElement !== grid) {
      grid.appendChild(overlay);
    }
  }
}

// Fisher-Yates shuffle algorithm for randomizing arrays
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Handles clicking a cell
function handleClick(cell) {
  const number = parseInt(cell.dataset.number);

  // Start the game timer and shuffle only after first correct click (number 1)
  if (!gameStarted && number === 1) {
    gameStarted = true;
    startTimer();
    startShuffle();
    restartBtn.disabled = false;
  }

  if (!gameStarted) {
    return;  // Ignore clicks before game started
  }

  if (number === nextNumber) {
    cell.classList.add('correct');
    clickedNumbers.add(cell.dataset.position);
    nextNumber++;
    correctClicks++;
    score += 10;
    if (nextNumber > gridSize) {
      endGame(true);  // Player completed all numbers correctly
    }
  } else {
    wrongClicks++;
    score -= 5;
    if (score < 0) score = 0;
    flashBackground();  // Visual feedback for wrong click
  }
  updateResult();
}

// Flashes background red on wrong click if not muted
function flashBackground() {
  if (isMuted) return;
  const originalColor = document.body.style.backgroundColor;
  document.body.style.backgroundColor = '#ff4c4c';
  setTimeout(() => {
    document.body.style.backgroundColor = originalColor || '#222';
  }, 200);
}

// Updates score and click counts display
function updateResult() {
  resultDisplay.textContent = `Score: ${score} | Correct: ${correctClicks} | Wrong: ${wrongClicks}`;
}

// Starts countdown timer
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer -= 0.01;
    if (timer <= 0) {
      timer = 0;
      endGame(false);  // Time ran out
    }
    timerDisplay.textContent = `Time left: ${timer.toFixed(2)} s`;
  }, 10);
}

// Stops the timer
function stopTimer() {
  clearInterval(timerInterval);
}

// Ends the game and shows overlay with results
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

// Shows the overlay with a message
function showOverlay(message) {
  const overlay = document.getElementById('game-overlay');
  overlay.innerHTML = message;
  overlay.classList.remove('hidden');
  overlay.style.pointerEvents = 'auto';  // Prevent clicks passing through
}

// Hides the overlay
function hideOverlay() {
  const overlay = document.getElementById('game-overlay');
  overlay.classList.add('hidden');
  overlay.style.pointerEvents = 'none';
}

// Starts the shuffle interval for unclicked numbers every 6 seconds
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

// *** Fixed shuffle function that only considers .cell elements that are unclicked ***
function shuffleUnclickedNumbers() {
  const cells = Array.from(grid.children);
  // Filter only cells with class 'cell' and with dataset.position, excluding clicked ones
  const unclickedCells = cells.filter(c => c.classList.contains('cell') && c.dataset.position !== undefined && !clickedNumbers.has(c.dataset.position));

  if (unclickedCells.length <= 1) return; // No point shuffling if 0 or 1 cells left

  // Extract the numbers of unclicked cells
  const unclickedNumbers = unclickedCells.map(c => parseInt(c.dataset.number));

  shuffle(unclickedNumbers);

  // Reassign shuffled numbers back to the unclicked cells
  for (let i = 0; i < unclickedCells.length; i++) {
    const num = unclickedNumbers[i];
    if (!isNaN(num)) {
      unclickedCells[i].textContent = num;
      unclickedCells[i].dataset.number = num;
    }
  }
}

// Mute button toggles sound effects
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Mute';
});

// Restart button restarts the game
restartBtn.addEventListener('click', () => {
  restartBtn.disabled = true;
  hideOverlay();
  initGame();
});

// Instructions modal show/hide handlers
showInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'block';
});

closeInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'none';
});

// Initialize the game when the page loads
initGame();
