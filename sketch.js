const BALL_R       = 16;
const GOAL_R       = 32;
const FORCE_STR    = 0.30;
const FRICTION     = 0.91;
const FIELD_RADIUS = 160;
const GOAL_X       = 500;
const GOAL_Y       = 500;
const TIME_LIMIT   = 20;

let ball;
let attractMode = true;
let timeLeft    = TIME_LIMIT;
let timer;
let tick = 0;
let gameOver = false;

function setup() {
  createCanvas(600, 600);
  loadLevel();
}

function draw() {
  tick++;
  background(12, 14, 26);
  drawGrid();
  drawGoal();
  applyMagneticForce();
  updateBall();
  checkGoal();
  drawBall();
  drawFieldRing();
  drawTimerBar();
}

function loadLevel() {
  ball        = { x: 80, y: 80, vx: 0, vy: 0, r: BALL_R };
  attractMode = true;
  timeLeft    = TIME_LIMIT;
  gameOver    = false;
  clearInterval(timer);
  timer = setInterval(() => {
    if (gameOver) return;
    timeLeft = max(0, timeLeft - 1);
    if (timeLeft <= 0) {
      gameOver = true;
      clearInterval(timer);
    }
  }, 1000);
}

function applyMagneticForce() {
  if (gameOver) return;
  let dx   = mouseX - ball.x;
  let dy   = mouseY - ball.y;
  let dist = sqrt(dx * dx + dy * dy);
  if (dist < FIELD_RADIUS && dist > 1) {
    let dir = attractMode ? 1 : -1;
    ball.vx += (dx / dist) * FORCE_STR * dir;
    ball.vy += (dy / dist) * FORCE_STR * dir;
  }
}

function updateBall() {
  if (gameOver) return;
  ball.vx *= FRICTION;
  ball.vy *= FRICTION;
  ball.x  += ball.vx;
  ball.y  += ball.vy;
  if (ball.x - ball.r < 0)      { ball.x = ball.r;          ball.vx =  abs(ball.vx) * 0.55; }
  if (ball.x + ball.r > width)   { ball.x = width - ball.r;  ball.vx = -abs(ball.vx) * 0.55; }
  if (ball.y - ball.r < 0)      { ball.y = ball.r;           ball.vy =  abs(ball.vy) * 0.55; }
  if (ball.y + ball.r > height)  { ball.y = height - ball.r; ball.vy = -abs(ball.vy) * 0.55; }
}

function checkGoal() {
  if (gameOver) return;
  let dx = ball.x - GOAL_X;
  let dy = ball.y - GOAL_Y;
  if (sqrt(dx * dx + dy * dy) < GOAL_R * 0.85) {
    gameOver = true;
    clearInterval(timer);
  }
}

function drawGrid() {
  stroke(30, 38, 60);
  strokeWeight(1);
  for (let x = 0; x < width; x += 40)
    for (let y = 0; y < height; y += 40)
      point(x, y);
}

function drawGoal() {
  fill(80, 255, 160, 35);
  stroke(80, 255, 160);
  strokeWeight(2);
  ellipse(GOAL_X, GOAL_Y, GOAL_R * 2);
}

function drawBall() {
  fill(80, 200, 255);
  stroke(200, 240, 255, 120);
  strokeWeight(1);
  ellipse(ball.x, ball.y, ball.r * 2);
}

function drawFieldRing() {
  let rc = attractMode ? [255, 100, 100] : [100, 180, 255];
  noFill();
  stroke(...rc, 70);
  strokeWeight(1);
  ellipse(mouseX, mouseY, FIELD_RADIUS * 2);
  noStroke();
  fill(...rc);
  ellipse(mouseX, mouseY, 7);
}

function drawTimerBar() {
  let barW   = map(timeLeft, 0, TIME_LIMIT, 0, width);
  let barCol = timeLeft > 8 ? color(80, 200, 120) :
               timeLeft > 4 ? color(255, 200, 60) : color(255, 60, 60);
  noStroke();
  fill(barCol);
  rect(0, 0, barW, 4);
}

function mousePressed() {
  if (gameOver) {
    loadLevel();
  } else {
    attractMode = !attractMode;
  }
}