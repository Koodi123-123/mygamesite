// Get references to DOM elements
const grid = document.getElementById('grid');
const timerDisplay = document.getElementById('timer');
const resultDisplay = document.getElementById('result');
const muteBtn = document.getElementById('mute-btn');

// Array of numbers 1 through 25
let numbers = Array.from({ length: 25 }, (_, i) => i + 1);

// Tracks the current number the player should click next
let currentNumber = 1;

// Variables for timing
let startTime = null;
let timerInterval = null;

// Mute flag, true if sounds are off
let isMuted = false;

// Load click sound from external source
const clickSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
clickSound.volume = 0.3;  // Set volume lower for subtle sound

// Fisher-Yates shuffle algorithm to randomize array elements
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements i and j
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

// Creates the clickable number grid dynamically
function createGrid() {
  shuffle(numbers);             // Shuffle the numbers array
  grid.innerHTML = '';          // Clear previous grid if any
  currentNumber = 1;            // Reset expected number
  startTime = null;             // Reset timer start
  timerDisplay.textContent = 'Time: 0.00 s';  // Reset timer display
  resultDisplay.textContent = '';              // Clear previous result

  // Create each cell div with a number
  numbers.forEach(num => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = num;

    // Add click event listener for each cell
    cell.addEventListener('click', () => {
      // Start timer if first number clicked
      if (!startTime && num === 1) {
        startTimer();
      }

      // If clicked number is the expected current number
      if (num === currentNumber) {
        cell.classList.add('correct'); // Mark cell as correct (green)

        // Play click sound if not muted
        if (!isMuted) {
          clickSound.currentTime = 0;  // Reset sound to start
          clickSound.play();
        }

        currentNumber++;  // Increase to expect next number

        // If finished all numbers (past 25)
        if (currentNumber > 25) {
          stopTimer();
          const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
          resultDisplay.textContent = `Congratulations! You finished in ${timeTaken} seconds.`;
        }
      }
    });

    // Append cell to the grid container
    grid.appendChild(cell);
  });
}

// Mute button toggles sound on/off and changes button text accordingly
