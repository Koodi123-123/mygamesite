/*!
 * Number Grid Click Game - game.js
 * 
 * Copyright (c) 2025 Koodi123-123
 * 
 * Licensed under the MIT License.
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
let clickedNumbers = new Set();
let gameStarted = false;
let score = 0;

// Äänet
const soundCorrect = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
const soundWrong = new Audio('https://actions.google.com/sounds/v1/cartoon/boing.ogg');
const soundGameOver = new Audio('https://actions.google.com/sounds/v1/cartoon/concussive_drum_hit.ogg');
const soundLevelUp = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');

function preloadSounds() {
  [soundCorrect, soundWrong, soundGameOver, soundLevelUp].forEach(sound => {
    sound.load();
    sound.addEventListener('error', () => {
      console.error(`Äänen lataus epäonnistui: ${sound.src}`);
    });
  });

  // Aktivoi selaimen äänet käyttäjän ensimmäisestä klikkauksesta
  document.body.addEventListener('click', () => {
    [soundWrong, soundGameOver, soundLevelUp].forEach(snd => {
      snd.play().then(() => {
        snd.pause();
        snd.currentTime = 0;
      }).catch(() => {});
    });
  }, { once: true });
}

// Päivitetty playSound-funktio, joka varmistaa äänen toiston paremmin
function playSound(audio) {
  if (isMuted) return;

  try {
    if (audio.readyState >= 2) {  // HAVE_CURRENT_DATA tai parempi
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.warn('Äänen toisto epäonnistui:', err);
      });
    } else {
      // Jos ääni ei ole valmis, yritä ladata ja toistaa kun valmis
      audio.load();
      audio.addEventListener('canplaythrough', () => {
        audio.pause();
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.warn('Äänen toisto epäonnistui canplaythrough-tapahtumassa:', err);
        });
      }, { once: true });
    }
  } catch (e) {
    console.warn('Virhe playSound-funktiossa:', e);
  }
}

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
  updateBestScore(); // Näytetään best score alussa myös
  timerDisplay.textContent = `Time left: ${timer.toFixed(2)} s`;
  gameStarted = false;
  setupGrid();
  stopTimer();
  stopShuffle();
  hideOverlay();
  restartBtn.disabled = true; // Estä restart alussa
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

  let overlay = document.getElementById('game-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    overlay.classList.add('hidden');
    grid.appendChild(overlay);
  } else {
    if (overlay.parentElement !== grid) {
      grid.appendChild(overlay);
    }
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
    gameStarted = true;
    startTimer();
    startShuffle();
    restartBtn.disabled = false; // Käynnistä restart-nappi pelin alkaessa
  }

  if (!gameStarted) return;

  if (number === nextNumber) {
    cell.classList.add('correct');
    clickedNumbers.add(cell.dataset.position);
    nextNumber++;
    correctClicks++;
    score += 10;
    playSound(soundCorrect);

    if (nextNumber > gridSize) {
      playSound(soundLevelUp);
      endGame(true);
    }
  } else {
    wrongClicks++;
    score -= 5;
    if (score < 0) score = 0;
    flashBackground();
    playSound(soundWrong);
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
  resultDisplay.textContent = `Score: ${score} | Correct: ${correctClicks} | Wrong: ${wrongClicks}`;
  updateBestScore();
}

function updateBestScore() {
  let bestScore = localStorage.getItem('bestScore');
  bestScore = bestScore ? parseInt(bestScore, 10) : 0;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('bestScore', bestScore);
  }

  // Näytetään paras tulos resultDisplayin alapuolella
  let bestScoreEl = document.getElementById('best-score');
  if (!bestScoreEl) {
    bestScoreEl = document.createElement('div');
    bestScoreEl.id = 'best-score';
    bestScoreEl.style.marginTop = '6px';
    bestScoreEl.style.fontWeight = 'bold';
    resultDisplay.parentNode.insertBefore(bestScoreEl, resultDisplay.nextSibling);
  }
  bestScoreEl.textContent = `Best Score: ${bestScore}`;
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer -= 0.01;
    if (timer <= 0) {
      timer = 0;
      playSound(soundGameOver);
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
  restartBtn.disabled = false;

  if (!success) {
    playSound(soundGameOver);
    showOverlay(`<strong>⏱️ Time's up! Try again to reach next level.</strong><br/>`, true);
  } else {
    showOverlay(`<strong>🎉 Congratulations! You completed Level ${level}!</strong><br/>`, false);
    level++;
    setTimeout(() => {
      hideOverlay();
      initGame();
    }, 3000);
  }

  resultDisplay.innerHTML = `
    Final Score: ${score}<br/>
    Correct Clicks: ${correctClicks}<br/>
    Wrong Clicks: ${wrongClicks}
  `;
  updateBestScore();
}

function showOverlay(message, showRestartBtn = false) {
  const overlay = document.getElementById('game-overlay');
  overlay.innerHTML = `
    <div class="overlay-content">
      ${message}
      ${showRestartBtn ? '<button id="restart-btn" class="restart-button" style="background-color: #1DB954; color: white; border: none; padding: 10px 20px; font-size: 1.1em; border-radius: 5px; cursor: pointer;">🔄 Restart</button>' : ''}
    </div>
  `;
  overlay.classList.remove('hidden');
  overlay.style.pointerEvents = 'auto';

  if (showRestartBtn) {
    const btn = document.getElementById('restart-btn');
    btn.addEventListener('click', () => {
      hideOverlay();
      initGame();
    });
  }
}

function hideOverlay() {
  const overlay = document.getElementById('game-overlay');
  overlay.classList.add('hidden');
  overlay.style.pointerEvents = 'none';
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
  const unclickedCells = cells.filter(c => c.classList.contains('cell') && c.dataset.position !== undefined && !clickedNumbers.has(c.dataset.position));
  if (unclickedCells.length <= 1) return;

  const unclickedNumbers = unclickedCells.map(c => parseInt(c.dataset.number));
  shuffle(unclickedNumbers);

  for (let i = 0; i < unclickedCells.length; i++) {
    const num = unclickedNumbers[i];
    if (!isNaN(num)) {
      unclickedCells[i].textContent = num;
      unclickedCells[i].dataset.number = num;
    }
  }
}

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Mute';
});

showInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'block';
});

closeInstructionsBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'none';
});

window.addEventListener('load', () => {
  preloadSounds();
  initGame();
});
