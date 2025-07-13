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

    // Highlight the next number to click (optional)
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
