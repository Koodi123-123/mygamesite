const grid = document.getElementById('grid');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const muteBtn = document.getElementById('mute-btn');

let numbers = Array.from({ length: 25 }, (_, i) => i + 1);
let currentNumber = 1;
let startTime = null;
let timerInterval = null;
let isMuted = false;

// Ääniefekti napille (sopiva pieni plop-ääni)
const clickSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
clickSound.volume = 0.3;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = `Time: ${elapsed.toFixed(2)} s`;
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function createGrid() {
  shuffle(numbers);
  grid.innerHTML = '';
  currentNumber = 1;
  startTime = null;
  timerDisplay.textContent = 'Time: 0.00 s';
  resultDisplay.textContent = '';

  numbers.forEach(num => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = num;
    cell.addEventListener('click', () => {
      if (!startTime && num === 1) {
        startTimer();
      }
      if (num === currentNumber) {
        cell.classList.add('correct');
        if (!isMuted) {
          clickSound.currentTime = 0;
          clickSound.play();
        }
        currentNumber++;
        if (currentNumber > 25) {
          stopTimer();
          const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
          resultDisplay.textContent = `Congratulations! You finished in ${timeTaken} seconds.`;
        }
      }
    });
    grid.appendChild(cell);
  });
}

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
});

createGrid();
