const canvas = document.getElementById("hockeyTable");
const ctx = canvas.getContext("2d");

const paddleSize = 50;
const puckSize = 20;
const friction = 0.99;
let goalSize = canvas.height / 3;
let paddle1, paddle2, puck;
let isGameRunning = false;
let activePaddle = null;

class Paddle {
    constructor(x, y, color, side) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
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

    updatePosition(mouseX, mouseY) {
        this.vx = mouseX - this.x;
        this.vy = mouseY - this.y;
        this.x = mouseX;
        this.y = mouseY;
        if (this.side === 'left') {
            if (this.x > canvas.width / 2 - paddleSize / 2) this.x = canvas.width / 2 - paddleSize / 2;
        } else {
            if (this.x < canvas.width / 2 + paddleSize / 2) this.x = canvas.width / 2 + paddleSize / 2;
        }

        if (this.x < paddleSize / 2) this.x = paddleSize / 2;
        if (this.y < paddleSize / 2) this.y = paddleSize / 2;
        if (this.y > canvas.height - paddleSize / 2) this.y = canvas.height - paddleSize / 2;
    }
}

class Puck {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
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

        if (this.y < puckSize / 2 || this.y > canvas.height - puckSize / 2) {
            this.vy *= -1;
        }

        if ((this.x < puckSize / 2 && !isInGoal(this.y)) || 
            (this.x > canvas.width - puckSize / 2 && !isInGoal(this.y))) {
            this.vx *= -1;
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
    const dx = puck.x - paddle.x;
    const dy = puck.y - paddle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < paddleSize / 2 + puckSize / 2) {
        const normalX = dx / distance;
        const normalY = dy / distance;
        const relativeVx = puck.vx - paddle.vx;
        const relativeVy = puck.vy - paddle.vy;
        const dotProduct = relativeVx * normalX + relativeVy * normalY;
        puck.vx = relativeVx - 2 * dotProduct * normalX;
        puck.vy = relativeVy - 2 * dotProduct * normalY;
        puck.vx += paddle.vx;
        puck.vy += paddle.vy;
    }
}


function startGame() {
    isGameRunning = true;
    goalSize = canvas.height / 3; 
    document.getElementById("startButton").style.display = "none";

    paddle1 = new Paddle(canvas.width / 4, canvas.height / 2, "#e74c3c", "left");
    paddle2 = new Paddle((canvas.width * 3) / 4, canvas.height / 2, "#2ecc71", "right");
    puck = new Puck(canvas.width / 2, canvas.height / 2);

    animate();
}

function animate() {
    if (!isGameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGoals();
    paddle1.draw();
    paddle2.draw();

    puck.update();
    puck.draw();

    detectCollision(paddle1, puck);
    detectCollision(paddle2, puck);
    checkGoal();

    requestAnimationFrame(animate);
}


document.getElementById("startButton").addEventListener("click", startGame);

canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (Math.hypot(mouseX - paddle1.x, mouseY - paddle1.y) < paddleSize / 2) {
        activePaddle = paddle1;
    } else if (Math.hypot(mouseX - paddle2.x, mouseY - paddle2.y) < paddleSize / 2) {
        activePaddle = paddle2;
    }
});

canvas.addEventListener("mousemove", (event) => {
    if (!activePaddle) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    activePaddle.updatePosition(mouseX, mouseY);
});

canvas.addEventListener("mouseup", () => {
    activePaddle = null;
});

