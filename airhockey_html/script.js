const canvas = document.getElementById("hockeyTable");
const ctx = canvas.getContext("2d");

const paddleSize = 50;
const puckSize = 20;
const friction = 0.99;
let paddle1, paddle2, puck;
let isGameRunning = false;
let activePaddle = null;

class Paddle {
    constructor(x, y, color, side) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.side = side;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, paddleSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

}

class Puck {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, puckSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#3498db";
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < puckSize / 2 || this.x > canvas.width - puckSize / 2) {
            this.vx *= -1;
        }
        if (this.y < puckSize / 2 || this.y > canvas.height - puckSize / 2) {
            this.vy *= -1;
        }
        this.vx *= friction;
        this.vy *= friction;
    }

    setVelocity(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    }
}

function detectCollision(paddle, puck) {
    const dx = paddle.x - puck.x;
    const dy = paddle.y - puck.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < paddleSize / 2 + puckSize / 2) {
        puck.setVelocity(dx * 0.1, dy * 0.1);
    }
}

function startGame() {
    isGameRunning = true;
    document.getElementById("startButton").style.display = "none";

    paddle1 = new Paddle(canvas.width / 4, canvas.height / 2, "#e74c3c", "left");
    paddle2 = new Paddle((canvas.width * 3) / 4, canvas.height / 2, "#2ecc71", "right");
    puck = new Puck(canvas.width / 2, canvas.height / 2);

    animate();
}

function animate() {
    if (!isGameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paddle1.draw();
    paddle2.draw();
    puck.update();
    puck.draw();
    detectCollision(paddle1, puck);
    detectCollision(paddle2, puck);
    requestAnimationFrame(animate);
}

document.getElementById("startButton").addEventListener("click", startGame);

canvas.addEventListener("mouseup", () => {
    activePaddle = null;
});
