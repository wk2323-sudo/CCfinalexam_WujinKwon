  //  Blue  = guide into the goal
      //  Red   = moving enemy  (kills blue on contact)
      //  Black = fixed obstacle (kills blue on contact)

      let MAGNET_RANGE = 180; // how far the attraction reaches (px)
      let BALL_R = 18; // radius for every ball

      //  blue  = balls to collect
      //  red   = moving enemies
      //  black = fixed obstacles
      //  time  = seconds on the clock
      //  speed = enemy movement speed
      let levels = [
        { blue: 2, red: 1, black: 0, time: 60, speed: 1.0 },
        { blue: 3, red: 2, black: 0, time: 55, speed: 1.4 },
        { blue: 3, red: 2, black: 1, time: 45, speed: 1.7 },
        { blue: 4, red: 3, black: 2, time: 40, speed: 2.0 },
        { blue: 5, red: 4, black: 2, time: 35, speed: 2.4 },
      ];

      // game state
      let gameState = "start"; // start | playing | levelDone | gameOver | allDone
      let level = 1;
      let score = 0;
      let timer = 60;
      let lastSec = 0;
      let blueDied = false; // true if blue was destroyed (vs timer ran out)

      let balls = [];
      let particles = []; // simple death-burst dots
      let goal = {}; // { x, y, r }

      // ball class
      class Ball {
        constructor(x, y, type, speed = 0) {
          this.x = x;
          this.y = y;
          this.type = type; // "blue" | "red" | "black"
          this.r = BALL_R;
          this.speed = speed;
          this.dead = false;

          // starting velocity
          if (type === "blue") {
            this.vx = random(-0.5, 0.5);
            this.vy = random(-0.5, 0.5);
          } else if (type === "red") {
            let angle = random(TWO_PI);
            this.vx = cos(angle) * speed;
            this.vy = sin(angle) * speed;
            this.dirTimer = int(random(60, 120)); // frames until next direction change
          } else {
            this.vx = 0;
            this.vy = 0;
          }
        }

        update() {
          if (this.dead || this.type === "black") return;

          // Blue: pulled toward cursor while mouse is held
          if (this.type === "blue" && mouseIsPressed) {
            let dx = mouseX - this.x;
            let dy = mouseY - this.y;
            let d = dist(this.x, this.y, mouseX, mouseY);
            if (d > 5 && d < MAGNET_RANGE) {
              let force = 0.6 * (1 - d / MAGNET_RANGE);
              this.vx += force * (dx / d);
              this.vy += force * (dy / d);
            }
          }

          // Red: wander by picking a new random direction every 1–2 seconds
          if (this.type === "red") {
            this.dirTimer--;
            if (this.dirTimer <= 0) {
              let angle = random(TWO_PI);
              this.vx = cos(angle) * this.speed;
              this.vy = sin(angle) * this.speed;
              this.dirTimer = int(random(60, 120));
            }
          }

          // Blue slows down over time; red keeps constant speed
          if (this.type === "blue") {
            let friction = this.inGoal() ? 0.75 : 0.92;
            this.vx *= friction;
            this.vy *= friction;
          }

          this.x += this.vx;
          this.y += this.vy;

          // Bounce off walls (top 44px = HUD)
          if (this.x - this.r < 0) {
            this.x = this.r;
            this.vx *= -1;
          }
          if (this.x + this.r > width) {
            this.x = width - this.r;
            this.vx *= -1;
          }
          if (this.y - this.r < 44) {
            this.y = 44 + this.r;
            this.vy *= -1;
          }
          if (this.y + this.r > height) {
            this.y = height - this.r;
            this.vy *= -1;
          }
        }

        draw() {
          if (this.dead) return;

          let c;
          if (this.type === "blue") c = color(60, 120, 255);
          else if (this.type === "red") c = color(255, 60, 60);
          else c = color(90, 90, 90);

          // Soft glow
          noStroke();
          fill(red(c), green(c), blue(c), 45);
          circle(this.x, this.y, this.r * 3.5);

          // Main ball
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
      }

      // start level — resets everything and spawns ball
      function startLevel(lvl) {
        balls = [];
        particles = [];
        blueDied = false;
        timer = levels[lvl - 1].time;
        lastSec = millis();
        goal = { x: width - 70, y: height / 2, r: 50 };

        let data = levels[lvl - 1];

        for (let i = 0; i < data.blue; i++) {
          balls.push(
            new Ball(random(50, 170), random(60, height - 40), "blue"),
          );
        }
        for (let i = 0; i < data.red; i++) {
          balls.push(
            new Ball(
              random(200, width - 190),
              random(60, height - 40),
              "red",
              data.speed,
            ),
          );
        }
        for (let i = 0; i < data.black; i++) {
          balls.push(
            new Ball(
              random(180, width - 180),
              random(60, height - 40),
              "black",
            ),
          );
        }

        gameState = "playing";
      }

      //  draw — runs every frame, routes to the right screen
      function draw() {
        background(20, 20, 35);

        if (gameState === "start") drawStartScreen();
        else if (gameState === "playing") drawPlaying();
        else if (gameState === "levelDone") drawLevelDoneScreen();
        else if (gameState === "gameOver") drawGameOverScreen();
        else if (gameState === "allDone") drawAllDoneScreen();
      }

      //  playing
      function drawPlaying() {
        // Count down once per second
        if (millis() - lastSec > 1000) {
          timer--;
          lastSec = millis();
          if (timer <= 0) {
            gameState = "gameOver";
            return;
          }
        }

        // Update balls
        for (let b of balls) b.update();

        // Collision: death check + push-apart
        checkCollisions();

        // Remove dead balls and spawn a small burst of particles
        for (let i = balls.length - 1; i >= 0; i--) {
          if (balls[i].dead) {
            spawnParticles(balls[i].x, balls[i].y);
            balls.splice(i, 1);
          }
        }

        // Goal zone
        noFill();
        stroke(60, 210, 80, 130);
        strokeWeight(2);
        circle(goal.x, goal.y, goal.r * 2);
        fill(60, 210, 80, 28);
        noStroke();
        circle(goal.x, goal.y, goal.r * 2);
        fill(60, 210, 80);
        textAlign(CENTER, CENTER);
        textSize(13);
        text("GOAL", goal.x, goal.y);

        // Magnet indicator
        if (mouseIsPressed) {
          noFill();
          stroke(80, 140, 255, 110);
          strokeWeight(1.5);
          circle(mouseX, mouseY, MAGNET_RANGE * 2);
        }

        // Particles
        drawParticles();

        // Balls
        for (let b of balls) b.draw();

        // HUD
        noStroke();
        fill(0, 0, 0, 160);
        rect(0, 0, width, 44);
        fill(255);
        textSize(16);
        textAlign(LEFT, CENTER);
        text("Level " + level, 14, 22);
        textAlign(CENTER, CENTER);
        text("Score: " + score, width / 2, 22);
        fill(timer <= 10 ? color(255, 80, 80) : color(255));
        textAlign(RIGHT, CENTER);
        text(timer + "s", width - 14, 22);

        // transition checks (after drawing so the last frame is visible)
        if (blueDied) {
          gameState = "gameOver";
          return;
        }

        let blues = balls.filter((b) => b.type === "blue");
        if (blues.length > 0 && blues.every((b) => b.inGoal())) {
          score += timer * 10 + level * 50;
          gameState = level >= levels.length ? "allDone" : "levelDone";
        }
      }

      //  collision detection
      //  called once per frame after all balls update.
      //  blue dies if it touches red or black.
      //  non-black balls push each other apart so they don't stack.
      function checkCollisions() {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            let a = balls[i];
            let b = balls[j];
            let d = dist(a.x, a.y, b.x, b.y);

            if (d < a.r + b.r) {
              // death rule
              if (a.type === "blue" && b.type !== "blue") {
                a.dead = true;
                blueDied = true;
              }
              if (b.type === "blue" && a.type !== "blue") {
                b.dead = true;
                blueDied = true;
              }

              // push-apart (skip if either ball is the fixed black type)
              if (d > 0 && a.type !== "black" && b.type !== "black") {
                let push = (a.r + b.r - d) / 2;
                let nx = (b.x - a.x) / d;
                let ny = (b.y - a.y) / d;
                a.x -= nx * push;
                a.y -= ny * push;
                b.x += nx * push;
                b.y += ny * push;
              }
            }
          }
        }
      }

      //  particles — simple plain objects, no class needed
      function spawnParticles(x, y) {
        for (let i = 0; i < 10; i++) {
          particles.push({
            x: x,
            y: y,
            vx: random(-3, 3),
            vy: random(-3, 3),
            life: 220,
          });
        }
      }

      function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
          let p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 8;
          noStroke();
          fill(80, 130, 255, p.life);
          circle(p.x, p.y, 7);
          if (p.life <= 0) particles.splice(i, 1);
        }
      }

      //  screens

      function drawStartScreen() {
        textAlign(CENTER, CENTER);

        fill(255);
        textSize(42);
        text("Magnetic Game", width / 2, 120);

        fill(170, 200, 255);
        textSize(15);
        text("Hold mouse to attract blue balls into the goal!", width / 2, 175);

        // Ball type legend
        noStroke();
        fill(60, 120, 255);
        circle(width / 2 - 50, 250, 26);
        fill(255, 60, 60);
        circle(width / 2 - 50, 295, 26);
        fill(90, 90, 90);
        circle(width / 2 - 50, 340, 26);

        fill(220);
        textAlign(LEFT, CENTER);
        textSize(14);
        text("Blue  — attract to goal", width / 2 - 30, 250);
        text("Red   — moving enemy", width / 2 - 30, 295);
        text("Black — fixed obstacle", width / 2 - 30, 340);

        fill(255, 100, 100);
        textAlign(CENTER, CENTER);
        textSize(13);
        text("Blue dies on contact with Red or Black!", width / 2, 380);

        // Start button
        noStroke();
        fill(55, 160, 55);
        rect(width / 2 - 80, 420, 160, 42, 8);
        fill(255);
        textSize(18);
        text("START", width / 2, 441);
      }

      function drawLevelDoneScreen() {
        textAlign(CENTER, CENTER);
        fill(255);
        textSize(42);
        text("Level Clear! ", width / 2, height / 2 - 60);
        fill(255, 215, 70);
        textSize(20);
        text("Score: " + score, width / 2, height / 2);
        fill(160);
        textSize(16);
        text("Click to continue", width / 2, height / 2 + 60);
      }

      function drawGameOverScreen() {
        drawParticles(); // finish playing the death burst

        textAlign(CENTER, CENTER);

        if (blueDied) {
          fill(80, 130, 255);
          textSize(36);
          text("Blue Ball Destroyed ", width / 2, height / 2 - 60);
          fill(180, 200, 255);
          textSize(14);
          text(
            "Avoid red enemies and black obstacles!",
            width / 2,
            height / 2 - 18,
          );
        } else {
          fill(255, 80, 80);
          textSize(42);
          text("Time's Up!", width / 2, height / 2 - 60);
        }

        fill(255);
        textSize(20);
        text("Score: " + score, width / 2, height / 2 + 20);
        fill(160);
        textSize(16);
        text("Click to try again", width / 2, height / 2 + 65);
      }

      function drawAllDoneScreen() {
        textAlign(CENTER, CENTER);
        fill(255, 215, 60);
        textSize(46);
        text("You Win! ", width / 2, height / 2 - 70);
        fill(255);
        textSize(22);
        text("All levels cleared!", width / 2, height / 2 - 15);
        text("Final Score: " + score, width / 2, height / 2 + 25);
        fill(160);
        textSize(16);
        text("Click to play again", width / 2, height / 2 + 75);
      }

      //  input — clicking advances the screen state
      function mouseReleased() {
        if (gameState === "start") {
          level = 1;
          score = 0;
          startLevel(level);
        }
        if (gameState === "levelDone") {
          level++;
          startLevel(level);
        }
        if (gameState === "gameOver") {
          score = 0;
          blueDied = false;
          startLevel(level);
        }
        if (gameState === "allDone") {
          level = 1;
          score = 0;
          startLevel(level);
        }
      }