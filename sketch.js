// Settings
let MAGNET_RANGE = 160;
let BALL_R       = 18;


//  Game states
//  used a single boolean `won`.
//  introduces a gameState string so we can handle
//  multiple outcomes (won vs time's up) cleanly.
let gameState = "playing";   // "playing" | "won" | "timeUp"
let ball      = {};
let goal      = {};
let score     = 0;
let timer     = 60;          // seconds remaining
let lastSec   = 0;           // millis() timestamp of last tick



//  Setup
function setup() {
  createCanvas(600, 640);
  textFont("Arial");
  resetGame();
}

function resetGame() {
  ball      = { x: 80, y: height / 2, vx: 0, vy: 0 };
  goal      = { x: width - 70, y: height / 2, r: 50 };
  gameState = "playing";
  score     = 0;
  timer     = 60;
  lastSec   = millis();
}


//  Draw
function draw() {
  background(20, 20, 35);

  if (gameState === "playing") {
    tickTimer();
    updateBall();
    drawGoal();
    drawMagnetIndicator();
    drawBall();
    drawHUD();        
    checkWin();
  } else {
    drawEndScreen();  // covers both "won" and "timeUp"
  }
}



//  Timer — counts down once per second
function tickTimer() {
  if (millis() - lastSec > 1000) {
    timer--;
    lastSec = millis();
    if (timer <= 0) {
      timer     = 0;
      gameState = "timeUp";
    }
  }
}



//   Ball physics 
function updateBall() {
  if (mouseIsPressed) {
    let dx = mouseX - ball.x;
    let dy = mouseY - ball.y;
    let d  = dist(ball.x, ball.y, mouseX, mouseY);
    if (d > 5 && d < MAGNET_RANGE) {
      let force = 0.6 * (1 - d / MAGNET_RANGE);
      ball.vx  += force * (dx / d);
      ball.vy  += force * (dy / d);
    }
  }

  ball.vx *= 0.92;
  ball.vy *= 0.92;
  ball.x  += ball.vx;
  ball.y  += ball.vy;

  if (ball.x - BALL_R < 0)      { ball.x = BALL_R;          ball.vx *= -1; }
  if (ball.x + BALL_R > width)  { ball.x = width - BALL_R;  ball.vx *= -1; }
  if (ball.y - BALL_R < 44)     { ball.y = 44 + BALL_R;     ball.vy *= -1; } // top = HUD
  if (ball.y + BALL_R > height) { ball.y = height - BALL_R; ball.vy *= -1; }
}


//  Check win
function checkWin() {
  if (dist(ball.x, ball.y, goal.x, goal.y) < goal.r - BALL_R) {
    score     = timer * 10;   // more time left = higher score
    gameState = "won";
  }
}


//  HUD 
function drawHUD() {
  // Dark background bar
  noStroke();
  fill(0, 0, 0, 160);
  rect(0, 0, width, 44);

  // Score (left)
  fill(255);
  textSize(16);
  textAlign(LEFT, CENTER);
  text("Score: " + score, 14, 22);

  // Timer (right) — turns red when under 10 seconds
  fill(timer <= 10 ? color(255, 80, 80) : color(255));
  textAlign(RIGHT, CENTER);
  text(timer + "s", width - 14, 22);
}



//  Drawing helpers

function drawGoal() {
  noStroke();
  fill(60, 210, 80, 28);
  circle(goal.x, goal.y, goal.r * 2);
  noFill();
  stroke(60, 210, 80, 130);
  strokeWeight(2);
  circle(goal.x, goal.y, goal.r * 2);
  fill(60, 210, 80);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  text("GOAL", goal.x, goal.y);
}

function drawBall() {
  noStroke();
  fill(60, 120, 255, 45);
  circle(ball.x, ball.y, BALL_R * 3.5);
  fill(60, 120, 255);
  circle(ball.x, ball.y, BALL_R * 2);
}

function drawMagnetIndicator() {
  if (mouseIsPressed) {
    noFill();
    stroke(80, 140, 255, 110);
    strokeWeight(1.5);
    circle(mouseX, mouseY, MAGNET_RANGE * 2);
  }
}


//  End screen
function drawEndScreen() {
  fill(0, 0, 0, 160);
  noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);

  if (gameState === "won") {
    fill(60, 210, 80);
    textSize(48);
    text("You Win!", width / 2, height / 2 - 50);

    fill(255, 215, 70);
    textSize(22);
    text("Score: " + score, width / 2, height / 2 + 10);
  } else {
    fill(255, 80, 80);
    textSize(48);
    text("Time's Up!", width / 2, height / 2 - 50);

    fill(200);
    textSize(18);
    text("You didn't make it in time.", width / 2, height / 2 + 10);
  }

  fill(160);
  textSize(16);
  text("Click to play again", width / 2, height / 2 + 65);
}


//  Input
function mouseReleased() {
  if (gameState === "won" || gameState === "timeUp") {
    resetGame();
  }
}

