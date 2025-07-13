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
let clickedNumbers = new Set();  // Tracks clicked cell positions (indexes)
let gameStarted = false; // Tracks if timer & shuffle started

function initGame() {
  levelDisplay.textContent = `Level ${level}`;
  gridSize = 25 + (level - 1) * 5;
  nextNumber = 1;
  correctClicks = 0;
  wrongClicks = 0;
  timer = 60.0;
  clickedNumbers.clear();
  resultDisplay.textContent = '';
  timerDisplay.textContent = `Time left: ${timer.toFixed(2)} s`;
  gameStarted = false;  // Reset start flag
  restartBtn.disabled = true; // Disable restart until game ends
  setupGrid();
  stopTimer();
  stopShuffle();
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

    // Remove 'correct' class for new game
    cell.classList.remove('correct');

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

function handleClick(cell) {
  const number = parseInt(cell.dataset.number);

  if (!gameStarted && number === 1) {
    // Start timer and shuffle when first number clicked
    gameStarted = true;
    startTimer();
    startShuffle();
  }

  if (!gameStarted) {
    // Ignore clicks if game not started and number !=1
    return;
  }

  if (number === nextNumber) {
    if (!clickedNumbers.has(cell.dataset.position)) {
      cell.classList.add('correct');
      clickedNumbers.add(cell.dataset.position);
      nextNumber++;
      correctClicks++;
      if (nextNumber > gridSize) {
        endGame(true);
      }
    }
  } else {
    wrongClicks++;
    flashBackground();
  }
  updateResult();
}

function flashBackground() {
  if (isMuted) return;
  const originalColor = document.body.style.backgroundColor;
  document.body.style.backgroundColor = '#ff4c4c';
  setTimeout(() => {
    document.body.style.backgroundColor = originalColor || '#222';
  }, 200);
}

function updateResult() {
  resultDisplay.textContent = `Correct: ${correctClicks} | Wrong: ${wrongClicks}`;
}

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

function stopTimer() {
  clearInterval(timerInterval);
}

function endGame(success) {
  stopTimer();
  stopShuffle();
  gameStarted = false;
  restartBtn.disabled = false; // Enable restart button when game ends

  if (success) {
    resultDisplay.textContent += ' - Level Completed! 🎉';
    level++;
  } else {
    resultDisplay.textContent += " - Time's up! Try again.";
  }
}

function startShuffle() {
  clearInterval(shuffleInterval);
  shuffleInterval = setInterval(() => {
    shuffleUnclickedNumbers();
  }, 6000);
}

function stopShuffle() {
  clearInterval(shuffleInterval);
}

function shuffleUnclickedNumbers() {
  const cells = Array.from(grid.children);

  // Filter out clicked cells by position
  const unclickedCells = cells.filter(c => !clickedNumbers.has(c.dataset.position));
  if (unclickedCells.length <= 1) return;

  // Get numbers only from unclicked cells
  const unclickedNumbers = unclickedCells.map(c => parseInt(c.dataset.number));

  shuffle(unclickedNumbers);

  // Assign shuffled numbers back to unclicked cells ONLY (positions stay same)
  for (let i = 0; i < unclickedCells.length; i++) {
    unclickedCells[i].textContent = unclickedNumbers[i];
    unclickedCells[i].dataset.number = unclickedNumbers[i];
  }
}

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Mute';
});

restartBtn.addEventListener('click', () => {
  restartBtn.disabled = true;
  initGame();
});

showInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'block';
});

closeInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'none';
});

// Initialize game on page load
window.onload = () => {
  initGame();
};
