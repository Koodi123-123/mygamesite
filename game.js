// --- Variables for game state ---
// The current size of the grid (number of cells)
let gridSize = 25;
// The next number the player must click
let nextNumber = 1;
// Interval timer for countdown
let timer;
// Remaining time in seconds for the current level
let timeLeft = 60;
// Player's current score
let score = 0;
// Interval timer for moving numbers
let moveInterval;
// Array to hold all number cell DOM elements
let numbers = [];
// Reference to the grid container element
const grid = document.getElementById('grid');

/**
 * Sets the CSS grid-template-columns property based on the grid size.
 * Uses square root rounded up to make the grid roughly square.
 * @param {number} size - The number of cells in the grid.
 */
function setGridColumns(size) {
  const columns = Math.ceil(Math.sqrt(size));
  // Set CSS variable --grid-columns dynamically on the grid container
  grid.style.setProperty('--grid-columns', columns);
}

/**
 * Creates the grid with numbers from 1 to gridSize placed randomly.
 * Resets the grid HTML and internal numbers array.
 */
function createGrid() {
  grid.innerHTML = '';  // Clear existing cells
  numbers = [];         // Reset numbers array

  setGridColumns(gridSize);  // Adjust grid columns based on size

  // Create array with numbers 1 to gridSize
  const arr = Array.from({length: gridSize}, (_, i) => i + 1);

  // Shuffle the array using Fisher-Yates algorithm
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Create a cell element for each number in shuffled order
  for (let num of arr) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = num;
    cell.dataset.number = num; // Store number for click detection
    grid.appendChild(cell);
    numbers.push(cell);
  }
}

/**
 * Starts the countdown timer for the current level.
 * Updates timeLeft every second, ends game if time runs out.
 */
function startTimer() {
  timeLeft = 60; // Reset to 60 seconds
  if(timer) clearInterval(timer); // Clear any existing timer

  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timer);
      clearInterval(moveInterval);
      alert('Time\'s up! Game over.');
      resetGame();
    }
  }, 1000);
}

/**
 * Starts interval that moves unclicked number cells randomly every 3 seconds.
 * This increases game difficulty.
 */
function startMoving() {
  if(moveInterval) clearInterval(moveInterval); // Clear previous interval

  moveInterval = setInterval(() => {
    // Calculate max rows/columns from grid size (to keep in grid)
    const maxPos = Math.ceil(Math.sqrt(gridSize));

    // For each number cell not yet clicked, assign random grid row and column
    for (let cell of numbers) {
      if (!cell.classList.contains('clicked')) {
        cell.style.gridRowStart = Math.floor(Math.random() * maxPos) + 1;
        cell.style.gridColumnStart = Math.floor(Math.random() * maxPos) + 1;
      }
    }
  }, 3000);
}

/**
 * Resets the game state for a new level or retry.
 * Resets variables, creates new grid, and starts timers.
 */
function resetGame() {
  nextNumber = 1;
  score = 0;
  createGrid();
  startTimer();
  startMoving();
}

/**
 * Handles clicks on the grid cells.
 * Checks if clicked number matches the next required number.
 * Updates score and visual feedback accordingly.
 */
grid.addEventListener('click', e => {
  // Only respond if a cell was clicked
  if (!e.target.classList.contains('cell')) return;

  const clickedNum = parseInt(e.target.dataset.number);

  if (clickedNum === nextNumber) {
    // Correct click
    e.target.classList.add('clicked');
    score += 10;
    nextNumber++;

    // Check if level is complete
    if (nextNumber > gridSize) {
      clearInterval(timer);
      clearInterval(moveInterval);
      alert('Level complete! Your score: ' + score);
      // Increase difficulty by increasing grid size by 5
      gridSize += 5;
      resetGame();
    }
  } else {
    // Wrong click
    score -= 5;
    e.target.classList.add('wrong');       // Add red shake effect
    setTimeout(() => e.target.classList.remove('wrong'), 500); // Remove effect after animation
  }
});

// --- Modal related code ---

// Button to open instructions modal
const instructionsBtn = document.getElementById('show-instructions-btn');
// Modal container element
const instructionsModal = document.getElementById('instructions-modal');
// Button to close instructions modal
const closeInstructionsBtn = document.getElementById('close-instructions-btn');

/**
 * Shows the instructions modal by removing 'hidden' class
 */
function showInstructionsModal() {
  instructionsModal.classList.remove('hidden');
}

/**
 * Hides the instructions modal by adding 'hidden' class
 * Also stores in localStorage that user has seen instructions
 */
function hideInstructionsModal() {
  instructionsModal.classList.add('hidden');
  localStorage.setItem('instructionsSeen', 'true');
}

// Event listeners for buttons
instructionsBtn.addEventListener('click', showInstructionsModal);
closeInstructionsBtn.addEventListener('click', hideInstructionsModal);

// On page load, show instructions modal only if user hasn't seen it before
window.addEventListener('load', () => {
  if (!localStorage.getItem('instructionsSeen')) {
    showInstructionsModal();
  }
});

// Initialize the game on page load
resetGame();
