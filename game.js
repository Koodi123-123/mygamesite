// Get references to DOM elements
const grid = document.getElementById('grid');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const muteBtn = document.getElementById('mute-btn');

// Array of numbers 1 through 25
let numbers = Array.from({ length: 25 }, (_, i) => i + 1);

// Tracks the current number the player should click next
let currentNumber = 1;

// Set to track which numbers have been clicked already
const clickedNumbers = new Set();

// Variables for timing
let startTime = null;
let timerInterval = null;

// Mute flag, true if sounds are off
let isMuted = false;

// Load sound effects
const clickSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
clickSound.volume = 0.3;  // subtle click sound

const errorSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
errorSound.volume = 0.4;

const finishSound = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
finishSound.volume = 0.5;

// Fisher-Yates shuffle algorithm to randomize array elements
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Starts the timer by capturing start time and updating display every 100 ms
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = `Time: ${elapsed.toFixed(2)} s`;
  }, 100);
}

// Stops the timer interval to freeze the timer
function stopTimer() {
  clearInterval(timerInterval);
}

// Best time tracking using localStorage
function saveBestTime(time) {
  const bestTime = localStorage.getItem('bestTime');
  if (!bestTime || time < parseFloat(bestTime)) {
    localStorage.setItem('bestTime', time);
    return true; // New record
  }
  return false;
}

function getBestTime() {
  return localStorage.getItem('bestTime');
}

// Variables for scoring
let score = 0;
let wrongClicks = 0;

// Updates score and displays it
function updateScore() {
  const scoreDisplay = document.getElementById('score');
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${score}`;
  }
  const wrongDisplay = document.getElementById('wrong-clicks');
  if (wrongDisplay) {
    wrongDisplay.textContent = `Wrong clicks: ${wrongClicks}`;
  }
}

// Creates or updates the grid keeping clicked numbers fixed in place and shuffling others
function createGrid() {
  // Separate fixed (clicked) and movable numbers
  const fixedNumbers = Array.from(clickedNumbers);
  const movableNumbers = numbers.filter(n => !clickedNumbers.has(n));

  // Shuffle only movable numbers
  shuffle(movableNumbers);

  // Create new array to hold new layout
  let newNumbers = new Array(numbers.length);

  // Place fixed numbers in their original positions
  for (let i = 0; i < numbers.length; i++) {
    if (clickedNumbers.has(numbers[i])) {
      newNumbers[i] = numbers[i];
    }
  }

  // Fill the rest of the positions with shuffled movable numbers
  let movableIndex = 0;
  for (let i = 0; i < newNumbers.length; i++) {
    if (newNumbers[i] === undefined) {
      newNumbers[i] = movableNumbers[movableIndex];
      movableIndex++;
    }
  }

  // Update global numbers array to new layout
  numbers = newNumbers;

  // Clear previous grid
  grid.innerHTML = '';

  // Determine the current number to click (lowest number not clicked)
  currentNumber = 1;
  while (clickedNumbers.has(currentNumber)) {
    currentNumber++;
  }

  // Create cells
  numbers.forEach(num => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = num;

    // Mark already clicked numbers green
    if (clickedNumbers.has(num)) {
      cell.classList.add('correct');
    }

    cell.addEventListener('click', () => {
      // Ignore clicks on already clicked numbers
      if (clickedNumbers.has(num)) {
        return;
      }

      // If game not started and number 1 clicked, start timer
      if (!startTime && num === 1) {
        startTimer();
      }

      // Check if clicked number is the correct next number
      if (num === currentNumber) {
        cell.classList.add('correct');
        clickedNumbers.add(num);

        // Increase score for quick click (less than 1s after previous)
        if (startTime) {
          const elapsedSinceStart = (Date.now() - startTime) / 1000;
          if (elapsedSinceStart < 1 + (currentNumber - 1) * 0.5) {
            score += 10; // Quick click bonus
          } else {
            score += 5; // Normal correct click
          }
        } else {
          score += 5; // First click
        }

        if (!isMuted) {
          clickSound.currentTime = 0;
          clickSound.play();
        }

        currentNumber++;

        updateScore();

        // If all numbers clicked
        if (currentNumber > 25) {
          stopTimer();
          const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
          const isRecord = saveBestTime(timeTaken);
          resultDisplay.innerHTML = `🎉 Congratulations! You finished in ${timeTaken} seconds.<br>` +
                                   (isRecord ? '🏆 New Best Time!' : `Best Time: ${getBestTime()} s`) +
                                   `<br>Final Score: ${score} (Wrong clicks: ${wrongClicks})`;

          if (!isMuted) {
            finishSound.play();
          }

          // Add success animation to grid
          grid.classList.add('success-animation');

          // Stop the shuffle interval if active
          clearInterval(shuffleInterval);
        }
      } else {
        // Wrong click
        wrongClicks++;
        score = Math.max(score - 5, 0); // Deduct points but don't go below 0

        updateScore();

        if (!isMuted) {
          errorSound.currentTime = 0;
          errorSound.play();
        }

        // Add fail animation to clicked cell
        cell.classList.add('fail-animation');
        setTimeout(() => cell.classList.remove('fail-animation'), 500);
      }
    });

    grid.appendChild(cell);
  });
}

// Mute toggle button functionality
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
});

// Initialize score and wrong clicks display under timer/result
function createScoreboard() {
  const scoreDiv = document.createElement('div');
  scoreDiv.id = 'score';
  scoreDiv.textContent = 'Score: 0';
  scoreDiv.style.marginTop = '10px';

  const wrongDiv = document.createElement('div');
  wrongDiv.id = 'wrong-clicks';
  wrongDiv.textContent = 'Wrong clicks: 0';

  // Insert after resultDisplay
  resultDisplay.insertAdjacentElement('afterend', scoreDiv);
  scoreDiv.insertAdjacentElement('afterend', wrongDiv);
}

// Periodic shuffle interval ID
let shuffleInterval = null;

// Start the game and shuffle timer once DOM content loaded
window.addEventListener('DOMContentLoaded', () => {
  createScoreboard();
  createGrid();

  // Shuffle the movable numbers every 5 seconds during the game
  shuffleInterval = setInterval(() => {
    if (startTime && currentNumber <= 25) {
      createGrid();
    }
  }, 5000);
});
