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

  // Lisää overlay takaisin gridin sisään, jos sitä ei ole olemassa
  let overlay = document.getElementById('game-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    overlay.classList.add('hidden');
    grid.appendChild(overlay);
  } else {
    // Jos overlay löytyy mutta ei ole gridin lapsi, lisää se takaisin
    if (overlay.parentElement !== grid) {
      grid.appendChild(overlay);
    }
  }
}

// Sekoitusfunktio
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Käsittelee solun klikkauksen
function handleClick(cell) {
  const number = parseInt(cell.dataset.number);

  if (!gameStarted && number === 1) {
    gameStarted = true;
    startTimer();
    startShuffle();
    restartBtn.disabled = false;
  }

  if (!gameStarted) {
    return;
  }

  if (number === nextNumber) {
    cell.classList.add('correct');
    clickedNumbers.add(cell.dataset.position);
    nextNumber++;
    correctClicks++;
    score += 10;
    if (nextNumber > gridSize) {
      endGame(true);
    }
  } else {
    wrongClicks++;
    score -= 5;
    if (score < 0) score = 0;
    flashBackground();
  }
  updateResult();
}

// Välähdyseffektin tausta väärästä klikkauksesta (pois päältä, jos mykistetty)
function flashBackground() {
  if (isMuted) return;
  const originalColor = document.body.style.backgroundColor;
  document.body.style.backgroundColor = '#ff4c4c';
  setTimeout(() => {
    document.body.style.backgroundColor = originalColor || '#222';
  }, 200);
}

// Päivittää piste- ja klikkaustiedot
function updateResult() {
  resultDisplay.textContent = `Score: ${score} | Correct: ${correctClicks} | Wrong: ${wrongClicks}`;
}

// Käynnistää ajastimen
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

// Pysäyttää ajastimen
function stopTimer() {
  clearInterval(timerInterval);
}

// Lopettaa pelin, näyttää overlayn ja päivittää tulokset
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

// Näyttää overlayn viestillä
function showOverlay(message) {
  const overlay = document.getElementById('game-overlay');
  overlay.innerHTML = message;
  overlay.classList.remove('hidden');
  overlay.style.pointerEvents = 'auto';  // Estää klikkaukset alla
}

// Piilottaa overlayn
function hideOverlay() {
  const overlay = document.getElementById('game-overlay');
  overlay.classList.add('hidden');
  overlay.style.pointerEvents = 'none';
}

// Käynnistää sekoitusintervallin
function startShuffle() {
  clearInterval(shuffleInterval);
  shuffleInterval = setInterval(() => {
    shuffleUnclickedNumbers();
  }, 6000);
}

// Pysäyttää sekoitusintervallin
function stopShuffle() {
  clearInterval(shuffleInterval);
}

// Sekoittaa klikkaamattomat numerot ruudukossa
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

// Mute-painike togglaa äänen
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Mute';
});

// Restart-painike käynnistää pelin uudelleen
restartBtn.addEventListener('click', () => {
  restartBtn.disabled = true;
  hideOverlay();
  initGame();
});

// Ohjeiden näyttö ja piilotus
showInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'block';
});

closeInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'none';
});

// Aloita peli sivun latautuessa
initGame();
