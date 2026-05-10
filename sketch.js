let MAGNET_RANGE = 160;
let BALL_R       = 18;
let ENEMY_SPEED  = 1.5;   // pixels per frame for the red ball
 
 
// GAME STATE 
let gameState = "playing";
let goal      = {};
let balls     = [];        // 
let score     = 0;
let timer     = 60;
let lastSec   = 0;
let blueDied  = false;     // so the end screen knows WHY the game ended
 
 

class Ball {
  constructor(x, y, type) {
    this.x    = x;
    this.y    = y;
    this.type = type;   // "blue" | "red"
    this.r    = BALL_R;
    this.dead = false;
 
    if (type === "blue") {
      this.vx = 0;
      this.vy = 0;
    } else {
      // Red starts moving in a random direction
      let angle = random(TWO_PI);
      this.vx   = cos(angle) * ENEMY_SPEED;
      this.vy   = sin(angle) * ENEMY_SPEED;
      this.dirTimer = int(random(60, 120));  // frames until next turn
    }
  }
 
  update() {
    if (this.dead) return;
 
    //  Blue: attracted toward cursor while mouse held 
    if (this.type === "blue" && mouseIsPressed) {
      let dx = mouseX - this.x;
      let dy = mouseY - this.y;
      let d  = dist(this.x, this.y, mouseX, mouseY);
      if (d > 5 && d < MAGNET_RANGE) {
        let force = 0.6 * (1 - d / MAGNET_RANGE);
        this.vx  += force * (dx / d);
        this.vy  += force * (dy / d);
      }
    }
 
    //  Red: picks a new random direction every 1–2 seconds 
    if (this.type === "red") {
      this.dirTimer--;
      if (this.dirTimer <= 0) {
        let angle     = random(TWO_PI);
        this.vx       = cos(angle) * ENEMY_SPEED;
        this.vy       = sin(angle) * ENEMY_SPEED;
        this.dirTimer = int(random(60, 120));
      }
    }
 
    // Friction for blue only; red keeps constant speed
    if (this.type === "blue") {
      this.vx *= 0.92;
      this.vy *= 0.92;
    }
 
    this.x += this.vx;
    this.y += this.vy;
 
    // Bounce off walls (top 44px = HUD)
    if (this.x - this.r < 0)      { this.x = this.r;          this.vx *= -1; }
    if (this.x + this.r > width)  { this.x = width - this.r;  this.vx *= -1; }
    if (this.y - this.r < 44)     { this.y = 44 + this.r;     this.vy *= -1; }
    if (this.y + this.r > height) { this.y = height - this.r; this.vy *= -1; }
  }
 
  draw() {
    if (this.dead) return;
 
    let c = this.type === "blue" ? color(60, 120, 255) : color(255, 60, 60);
 
    // Glow
    noStroke();
    fill(red(c), green(c), blue(c), 45);
    circle(this.x, this.y, this.r * 3.5);
 
    // Ball
    fill(c);
    circle(this.x, this.y, this.r * 2);
  }
 
  inGoal() {
    return dist(this.x, this.y, goal.x, goal.y) < goal.r - this.r;
  }
}
 
 
//  setup
function setup() {
  createCanvas(600, 640);
  textFont("Arial");
  resetGame();
}
 
function resetGame() {
  goal      = { x: width - 70, y: height / 2, r: 50 };
  gameState = "playing";
  score     = 0;
  timer     = 60;
  lastSec   = millis();
  blueDied  = false;
 
  balls = [
    new Ball(80,  height / 2,        "blue"),
    new Ball(300, height / 2 + 100,  "red"),
  ];
}


//  Draw
function draw() {
  background(20, 20, 35);
 
  if (gameState === "playing") {
    tickTimer();
 
    for (let b of balls) b.update();
 
    checkCollisions();   // ← new
 
    drawGoal();
    drawMagnetIndicator();
    for (let b of balls) b.draw();
    drawHUD();
 
    checkWin();
  } else {
    drawEndScreen();
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



//  collision detection 
function checkCollisions() {
  let blue = balls.find(b => b.type === "blue");
  let red  = balls.find(b => b.type === "red");
 
  if (!blue || !red) return;
 
  let d = dist(blue.x, blue.y, red.x, red.y);
 
  if (d < blue.r + red.r) {
    blue.dead = true;
    blueDied  = true;
    gameState = "destroyed";
  }
}
 

//  check win
function checkWin() {
  let blue = balls.find(b => b.type === "blue");
  if (blue && blue.inGoal()) {
    score     = timer * 10;
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
 
  } else if (gameState === "destroyed") {
    fill(80, 130, 255);
    textSize(36);
    text("Blue Ball Destroyed! 💥", width / 2, height / 2 - 50);
    fill(180, 200, 255);
    textSize(16);
    text("Avoid the red enemy!", width / 2, height / 2 + 10);
 
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
  if (gameState !== "playing") resetGame();
}

