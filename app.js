const STORAGE_KEYS = {
  highScore: 'flashAnzanHighScore',
  bestStreak: 'flashAnzanBestStreak',
  history: 'flashAnzanHistory'
};

const state = {
  running: false,
  paused: false,
  round: 1,
  score: 0,
  streak: 0,
  bestStreak: Number(localStorage.getItem(STORAGE_KEYS.bestStreak) || 0),
  lives: 3,
  correct: 0,
  wrong: 0,
  level: 1,
  answer: '',
  challenge: null,
  inputLocked: false,
  roundTimer: null,
  flashTimer: null,
  answerDeadline: 0,
  remainingMs: 0,
  highScore: Number(localStorage.getItem(STORAGE_KEYS.highScore) || 0),
  history: JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]')
};

const ui = {
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  submitBtn: document.getElementById('submitBtn'),
  answerInput: document.getElementById('answerInput'),
  modeSelect: document.getElementById('modeSelect'),
  difficultySelect: document.getElementById('difficultySelect'),
  flashSpeed: document.getElementById('flashSpeed'),
  answerWindow: document.getElementById('answerWindow'),
  flashSpeedValue: document.getElementById('flashSpeedValue'),
  answerWindowValue: document.getElementById('answerWindowValue'),
  flashDisplay: document.getElementById('flashDisplay'),
  message: document.getElementById('message'),
  levelValue: document.getElementById('levelValue'),
  streakValue: document.getElementById('streakValue'),
  scoreValue: document.getElementById('scoreValue'),
  livesValue: document.getElementById('livesValue'),
  timerValue: document.getElementById('timerValue'),
  bestValue: document.getElementById('bestValue'),
  roundValue: document.getElementById('roundValue'),
  correctValue: document.getElementById('correctValue'),
  wrongValue: document.getElementById('wrongValue'),
  accuracyValue: document.getElementById('accuracyValue'),
  highScoreValue: document.getElementById('highScoreValue'),
  historyList: document.getElementById('historyList'),
  taskLabel: document.getElementById('taskLabel'),
  soundToggle: document.getElementById('soundToggle'),
  strictToggle: document.getElementById('strictToggle')
};

const modeConfig = {
  recall: {
    label: 'Memory Recall',
    prompt: 'Memorize the sequence' 
  },
  reverse: {
    label: 'Reverse Recall',
    prompt: 'Memorize then reverse' 
  },
  sum: {
    label: 'Sum Sprint',
    prompt: 'Add the numbers' 
  },
  equation: {
    label: 'Equation Solve',
    prompt: 'Solve the challenge' 
  }
};

function getCurrentFlashDuration() {
  const base = Number(ui.flashSpeed.value);
  const difficulty = Number(ui.difficultySelect.value);
  return Math.max(250, base - (state.level - 1) * 20 - (difficulty - 1) * 50);
}

function getAnswerWindow() {
  return Number(ui.answerWindow.value);
}

function setMessage(text, type = 'info') {
  ui.message.textContent = text;
  ui.message.className = `message ${type}`;
}

function playTone(freq = 660, duration = 0.08, gain = 0.03) {
  if (!ui.soundToggle.checked) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = freq;
  gainNode.gain.value = gain;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);

  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  setTimeout(() => ctx.close(), duration * 1500);
}

function updateStats() {
  const totalAttempts = state.correct + state.wrong;
  const accuracy = totalAttempts ? Math.round((state.correct / totalAttempts) * 100) : 0;

  ui.levelValue.textContent = String(state.level);
  ui.streakValue.textContent = String(state.streak);
  ui.scoreValue.textContent = String(state.score);
  ui.livesValue.textContent = String(state.lives);
  ui.bestValue.textContent = String(state.bestStreak);
  ui.roundValue.textContent = String(state.round);
  ui.correctValue.textContent = String(state.correct);
  ui.wrongValue.textContent = String(state.wrong);
  ui.accuracyValue.textContent = `${accuracy}%`;
  ui.highScoreValue.textContent = String(state.highScore);
  ui.flashSpeedValue.textContent = `${ui.flashSpeed.value} ms`;
  ui.answerWindowValue.textContent = `${Number(ui.answerWindow.value).toFixed(1)} s`;

  const recent = state.history.slice(0, 5);
  if (!recent.length) {
    ui.historyList.innerHTML = '<li>No runs yet</li>';
    return;
  }

  ui.historyList.innerHTML = recent
    .map((entry) => `<li>Level ${entry.level} • ${entry.score} pts • ${entry.mode}</li>`)
    .join('');
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEYS.highScore, String(state.highScore));
  localStorage.setItem(STORAGE_KEYS.bestStreak, String(state.bestStreak));
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history.slice(0, 6)));
}

function generateSequence(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
}

function sumNumbers(values) {
  return values.reduce((acc, value) => acc + value, 0);
}

function randomOperator() {
  const ops = ['+', '-', '*'];
  return ops[Math.floor(Math.random() * ops.length)];
}

function evaluateExpression(expr) {
  return Function(`"use strict"; return (${expr});`)();
}

function makeChallenge() {
  const mode = ui.modeSelect.value;
  const difficulty = Number(ui.difficultySelect.value);
  const baseLength = 3 + difficulty + Math.floor(state.level / 2);

  if (mode === 'recall') {
    const values = generateSequence(baseLength);
    return {
      mode,
      text: values.join(' '),
      displayText: values.join(' '),
      answer: values.join('')
    };
  }

  if (mode === 'reverse') {
    const values = generateSequence(baseLength);
    const answer = [...values].reverse().join('');
    return {
      mode,
      text: values.join(' '),
      displayText: values.join(' '),
      answer
    };
  }

  if (mode === 'sum') {
    const count = Math.min(7, Math.max(3, baseLength));
    const values = Array.from({ length: count }, () => Math.floor(Math.random() * 9) + 1);
    return {
      mode,
      text: values.join(' + '),
      displayText: values.join('  '),
      answer: String(sumNumbers(values))
    };
  }

  const opCount = Math.min(3, Math.max(2, difficulty));
  let expr = '';
  const values = Array.from({ length: opCount + 1 }, () => Math.floor(Math.random() * 9) + 1);
  expr = `${values[0]}`;

  for (let i = 1; i < values.length; i += 1) {
    const op = randomOperator();
    expr += ` ${op} ${values[i]}`;
  }

  const answer = String(Math.round(evaluateExpression(expr)));
  return {
    mode,
    text: expr,
    displayText: expr,
    answer
  };
}

function animateDisplay(text, flash = true) {
  ui.flashDisplay.textContent = text;
  ui.flashDisplay.classList.toggle('visible', flash);
}

function clearRoundTimers() {
  if (state.flashTimer) {
    clearTimeout(state.flashTimer);
    state.flashTimer = null;
  }
  if (state.roundTimer) {
    clearInterval(state.roundTimer);
    state.roundTimer = null;
  }
}

function startAnswerWindow() {
  clearRoundTimers();
  state.inputLocked = false;
  state.answerDeadline = Date.now() + getAnswerWindow() * 1000;
  ui.answerInput.disabled = false;
  ui.answerInput.value = '';
  ui.answerInput.focus();

  state.roundTimer = setInterval(() => {
    const remaining = (state.answerDeadline - Date.now()) / 1000;
    ui.timerValue.textContent = `${Math.max(0, remaining).toFixed(1)}s`;

    if (remaining <= 0) {
      clearInterval(state.roundTimer);
      state.roundTimer = null;
      handleRoundOutcome(false, 'Time is up!');
    }
  }, 100);
}

function revealChallenge() {
  const current = state.challenge;
  if (!current) return;

  animateDisplay(current.displayText, true);
  ui.taskLabel.textContent = modeConfig[current.mode].label;
  ui.answerInput.disabled = true;
  ui.answerInput.value = '';

  const flashDuration = getCurrentFlashDuration();
  state.flashTimer = setTimeout(() => {
    animateDisplay('?', false);
    startAnswerWindow();
  }, flashDuration);
}

function advanceRound() {
  state.round += 1;
  state.level = Math.max(1, Math.floor(state.round / 3) + 1);
  state.challenge = makeChallenge();
  revealChallenge();
  updateStats();
}

function triggerWin() {
  playTone(660, 0.08, 0.04);
  playTone(820, 0.12, 0.03);
  state.streak += 1;
  state.correct += 1;
  state.score += 10 + state.level * 5;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.highScore = Math.max(state.highScore, state.score);
  saveProgress();

  setMessage(`Correct! +${10 + state.level * 5} points`, 'success');
  updateStats();

  setTimeout(() => {
    if (!state.running) return;
    advanceRound();
  }, 700);
}

function triggerLoss(message, isWrong = false) {
  playTone(220, 0.12, 0.05);
  state.lives -= 1;
  if (isWrong) {
    state.wrong += 1;
    state.streak = 0;
  }

  setMessage(message || 'Not this time.', 'error');
  updateStats();

  if (state.lives <= 0) {
    finishSession();
    return;
  }

  setTimeout(() => {
    if (!state.running) return;
    advanceRound();
  }, 800);
}

function handleRoundOutcome(isCorrect, customMessage) {
  clearRoundTimers();
  ui.answerInput.disabled = true;

  if (isCorrect) {
    triggerWin();
    return;
  }

  triggerLoss(customMessage || 'Wrong answer. Keep going!', true);
}

function checkAnswer() {
  if (!state.challenge || state.inputLocked) return;

  const value = ui.answerInput.value.trim();
  if (!value) {
    setMessage('Type an answer first.', 'info');
    return;
  }

  state.inputLocked = true;
  const normalized = value.toLowerCase();
  const answerNormalized = state.challenge.answer.toLowerCase();
  const correct = normalized === answerNormalized || normalized === answerNormalized.replace(/\s+/g, '');

  handleRoundOutcome(correct, correct ? 'Nice!' : `Incorrect — the answer was ${state.challenge.answer}`);
}

function startSession() {
  if (state.running && !state.paused) {
    return;
  }

  state.running = true;
  state.paused = false;
  if (state.lives <= 0) {
    resetSession(false);
  }

  ui.startBtn.textContent = 'Session Active';
  ui.startBtn.disabled = true;
  ui.pauseBtn.textContent = 'Pause';
  setMessage('The challenge is live. Watch carefully and answer fast.', 'success');

  if (!state.challenge) {
    state.challenge = makeChallenge();
  }

  revealChallenge();
}

function resetSession(soft = true) {
  clearRoundTimers();
  state.running = false;
  state.paused = false;
  state.round = 1;
  state.score = 0;
  state.streak = 0;
  state.lives = 3;
  state.correct = 0;
  state.wrong = 0;
  state.level = 1;
  state.challenge = null;
  state.inputLocked = false;
  ui.answerInput.disabled = true;
  ui.answerInput.value = '';
  ui.startBtn.disabled = false;
  ui.startBtn.textContent = 'Start Session';
  ui.pauseBtn.textContent = 'Pause';
  ui.flashDisplay.textContent = 'Ready';
  ui.timerValue.textContent = '0.0s';
  setMessage(soft ? 'Session reset. Ready when you are.' : 'Session ended. Try another round.', 'info');
  updateStats();
}

function finishSession() {
  state.running = false;
  clearRoundTimers();
  ui.startBtn.disabled = false;
  ui.startBtn.textContent = 'Play Again';
  ui.answerInput.disabled = true;

  state.history = [
    {
      score: state.score,
      level: state.level,
      mode: ui.modeSelect.value
    },
    ...state.history
  ].slice(0, 6);

  saveProgress();
  updateStats();
  setMessage(`Session complete! Final score: ${state.score}. Press play again to chase a higher record.`, 'success');
}

function togglePause() {
  if (!state.running) {
    return;
  }

  state.paused = !state.paused;
  if (state.paused) {
    clearRoundTimers();
    ui.pauseBtn.textContent = 'Resume';
    setMessage('Session paused. Resume when ready.', 'info');
    ui.answerInput.disabled = true;
    return;
  }

  ui.pauseBtn.textContent = 'Pause';
  setMessage('Back in motion.', 'success');
  revealChallenge();
}

ui.startBtn.addEventListener('click', () => {
  if (state.running && state.paused) {
    togglePause();
    return;
  }
  startSession();
});

ui.pauseBtn.addEventListener('click', togglePause);
ui.resetBtn.addEventListener('click', () => resetSession(true));
ui.submitBtn.addEventListener('click', checkAnswer);
ui.answerInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    checkAnswer();
  }
});

ui.modeSelect.addEventListener('change', () => {
  if (!state.running) {
    setMessage(`${modeConfig[ui.modeSelect.value].label} is selected.`, 'info');
  }
});

ui.flashSpeed.addEventListener('input', () => {
  updateStats();
});

ui.answerWindow.addEventListener('input', () => {
  updateStats();
});

ui.strictToggle.addEventListener('change', () => {
  setMessage(ui.strictToggle.checked ? 'Strict mode enabled.' : 'Strict mode disabled.', 'info');
});

updateStats();
setMessage('Choose a mode and hit start to begin.', 'success');
ui.answerInput.disabled = true;

window.addEventListener('beforeunload', saveProgress);
