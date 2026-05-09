//  Settings 
let MAGNET_RANGE = 160;   // how far the attraction reaches (px)
let BALL_R       = 18;    // ball radius


//  Game states
let ball = {};    // the one blue ball  { x, y, vx, vy }
let goal = {};    // the goal zone      { x, y, r }
let won  = false; // has the player won?


//  Setup — runs once at the start
function setup() {
  createCanvas(600, 640);
  textFont("Arial");

  // Place the ball on the left side
  ball = { x: 80, y: height / 2, vx: 0, vy: 0 };

  // Place the goal on the right side
  goal = { x: width - 70, y: height / 2, r: 50 };
}


//  Draw — runs every frame 
function draw() {
  background(20, 20, 35);

  if (won) {
    drawWinScreen();
    return;
  }

  updateBall();
  drawGoal();
  drawMagnetIndicator();
  drawBall();
  checkWin();
}



//  Update ball physics
function updateBall() {

  // While the mouse is held down, pull the ball toward the cursor
  if (mouseIsPressed) {
    let dx = mouseX - ball.x;
    let dy = mouseY - ball.y;
    let d  = dist(ball.x, ball.y, mouseX, mouseY);

    if (d > 5 && d < MAGNET_RANGE) {
      let force = 0.6 * (1 - d / MAGNET_RANGE);  // stronger when closer
      ball.vx  += force * (dx / d);
      ball.vy  += force * (dy / d);
    }
  }

  // Apply friction so the ball slows down naturally
  ball.vx *= 0.92;
  ball.vy *= 0.92;

  // Move the ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Bounce off the four walls
  if (ball.x - BALL_R < 0)      { ball.x = BALL_R;          ball.vx *= -1; }
  if (ball.x + BALL_R > width)  { ball.x = width - BALL_R;  ball.vx *= -1; }
  if (ball.y - BALL_R < 0)      { ball.y = BALL_R;          ball.vy *= -1; }
  if (ball.y + BALL_R > height) { ball.y = height - BALL_R; ball.vy *= -1; }
}



//  Check win
function checkWin() {
  if (dist(ball.x, ball.y, goal.x, goal.y) < goal.r - BALL_R) {
    won = true;
  }
}



//  drawing helper


function drawGoal() {
  // Filled circle
  noStroke();
  fill(60, 210, 80, 28);
  circle(goal.x, goal.y, goal.r * 2);

  // Outline
  noFill();
  stroke(60, 210, 80, 130);
  strokeWeight(2);
  circle(goal.x, goal.y, goal.r * 2);

  // Label
  fill(60, 210, 80);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  text("GOAL", goal.x, goal.y);
}

function drawBall() {
  // Soft glow
  noStroke();
  fill(60, 120, 255, 45);
  circle(ball.x, ball.y, BALL_R * 3.5);

  // Main ball
  fill(60, 120, 255);
  circle(ball.x, ball.y, BALL_R * 2);
}

function drawMagnetIndicator() {
  // Show a dashed ring around the cursor while the mouse is held
  if (mouseIsPressed) {
    noFill();
    stroke(80, 140, 255, 110);
    strokeWeight(1.5);
    circle(mouseX, mouseY, MAGNET_RANGE * 2);
  }
}

function drawWinScreen() {
  // Dim overlay
  fill(0, 0, 0, 160);
  noStroke();
  rect(0, 0, width, height);

  // Win message
  fill(60, 210, 80);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("You Win!", width / 2, height / 2 - 30);

  fill(200);
  textSize(18);
  text("Click to play again", width / 2, height / 2 + 30);
}



// input

function mouseReleased() {
  if (won) {
    ball = { x: 80, y: height / 2, vx: 0, vy: 0 };
    won  = false;
  }
}

