(function() {
  let gameContainer, ball, paddle, target, message;
  let ballX, ballY, ballSpeedX, ballSpeedY, paddleX, paddleSpeed;
  let gameRunning = false;
  const containerWidth = 400;
  const containerHeight = 600;
  const ballSize = 20;
  const paddleWidth = 100;
  const paddleHeight = 10;
  const targetSize = 50;

  function createGameElements() {
    gameContainer = document.getElementById('gameContainer');

    ball = document.createElement('div');
    ball.style.cssText = `
      position: absolute;
      width: ${ballSize}px;
      height: ${ballSize}px;
      background-color: red;
      border-radius: 50%;
    `;

    paddle = document.createElement('div');
    paddle.style.cssText = `
      position: absolute;
      width: ${paddleWidth}px;
      height: ${paddleHeight}px;
      background-color: blue;
      bottom: 50px; /* Adjusted to make room for buttons */
    `;

    target = document.createElement('div');
    target.style.cssText = `
      position: absolute;
      width: ${targetSize}px;
      height: ${targetSize}px;
      background-color: green;
      top: 0;
      left: ${(containerWidth - targetSize) / 2}px;
    `;

    message = document.createElement('div');
    message.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 36px;
      font-weight: bold;
      color: #000;
      text-align: center;
      display: none;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: space-around;
    `;

    const startButton = createButton('Start', startGame);
    const stopButton = createButton('Stop', stopGame);
    const resetButton = createButton('Reset', resetGame);

    buttonContainer.appendChild(startButton);
    buttonContainer.appendChild(stopButton);
    buttonContainer.appendChild(resetButton);

    gameContainer.appendChild(ball);
    gameContainer.appendChild(paddle);
    gameContainer.appendChild(target);
    gameContainer.appendChild(message);
    gameContainer.appendChild(buttonContainer);
  }

  function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  function initGame() {
    ballX = containerWidth / 2 - ballSize / 2;
    ballY = containerHeight / 2 - ballSize / 2;
    ballSpeedX = 2;
    ballSpeedY = -2;
    paddleX = (containerWidth - paddleWidth) / 2;
    paddleSpeed = 0;
    gameRunning = false;
    message.style.display = 'none';
    updateGameElements();
  }

  function updateGame() {
    if (!gameRunning) return;

    // Move the ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Move the paddle
    paddleX += paddleSpeed;
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > containerWidth) paddleX = containerWidth - paddleWidth;

    // Ball collision with walls
    if (ballX <= 0 || ballX + ballSize >= containerWidth) {
      ballSpeedX = -ballSpeedX;
    }
    if (ballY <= 0) {
      ballSpeedY = -ballSpeedY;
    }

    // Ball collision with paddle
    if (
      ballY + ballSize >= containerHeight - paddleHeight &&
      ballX + ballSize >= paddleX &&
      ballX <= paddleX + paddleWidth
    ) {
      ballSpeedY = -ballSpeedY;
      
      // Change ball direction based on paddle movement
      const paddleCenter = paddleX + paddleWidth / 2;
      const ballCenter = ballX + ballSize / 2;
      const hitPosition = (ballCenter - paddleCenter) / (paddleWidth / 2);
      ballSpeedX = hitPosition * 5; // Adjust this multiplier to change the angle of reflection
    }

    // Ball hits the floor
    if (ballY + ballSize >= containerHeight) {
      showMessage('YOU LOST');
      stopGame();
      return;
    }

    // Ball collision with target
    if (
      ballY <= targetSize &&
      ballX + ballSize >= (containerWidth - targetSize) / 2 &&
      ballX <= (containerWidth + targetSize) / 2
    ) {
      showMessage('YOU WON');
      stopGame();
      return;
    }

    updateGameElements();
    requestAnimationFrame(updateGame);
  }

  function updateGameElements() {
    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;
    paddle.style.left = `${paddleX}px`;
  }

  function showMessage(text) {
    message.textContent = text;
    message.style.display = 'block';
    message.style.width = `${containerWidth * 0.5}px`;
  }

  function handleKeyPress(e) {
    if (e.key === 'ArrowLeft') {
      paddleSpeed = -5;
    } else if (e.key === 'ArrowRight') {
      paddleSpeed = 5;
    }
  }

  function handleKeyRelease(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      paddleSpeed = 0;
    }
  }

  function startGame() {
    if (!gameRunning) {
      gameRunning = true;
      updateGame();
    }
  }

  function stopGame() {
    gameRunning = false;
  }

  function resetGame() {
    stopGame();
    initGame();
  }

  createGameElements();
  initGame();
  document.addEventListener('keydown', handleKeyPress);
  document.addEventListener('keyup', handleKeyRelease);
})();
