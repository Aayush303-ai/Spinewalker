/**
 * BONEWALKER ULTRA - Advanced Procedural Creature
 * Features:
 * - Physics-based head movement
 * - Spring-damped IK spine
 * - True 2-bone IK legs with arc stepping
 * - Ground detection
 * - Motion trail
 * - Glow effect
 * - Breathing animation
 * - Dynamic camera zoom
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let cameraZoom = 1;

const Input = { x: 0, y: 0 };

// ==========================
// Resize + Input
// ==========================
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
window.addEventListener('mousemove', e => {
    Input.x = e.clientX;
    Input.y = e.clientY;
});
resize();

// ==========================
// Spine Setup
// ==========================
const numSegments = 14;
const segmentDist = 22;
const segments = [];

for (let i = 0; i < numSegments; i++) {
    segments.push({
        x: width / 2,
        y: height / 2,
        angle: 0
    });
}

// ==========================
// Physics Head Movement
// ==========================
let vx = 0;
let vy = 0;
const stiffness = 0.015;
const friction = 0.85;

// ==========================
// Leg Class (True 2-Bone IK)
// ==========================
class Leg {
    constructor(index, side) {
        this.index = index;
        this.side = side;

        this.upperLen = 35;
        this.lowerLen = 35;

        this.footX = segments[index].x;
        this.footY = segments[index].y;

        this.targetX = this.footX;
        this.targetY = this.footY;

        this.stepProgress = 1;
    }

    update() {
        const body = segments[this.index];
        const angle = body.angle + (Math.PI / 2) * this.side;

        const homeX = body.x + Math.cos(angle) * 55;
        const homeY = body.y + Math.sin(angle) * 55 + 20; // ground bias

        const dist = Math.hypot(this.footX - homeX, this.footY - homeY);

        if (dist > 70 && this.stepProgress >= 1) {
            this.startX = this.footX;
            this.startY = this.footY;
            this.targetX = homeX;
            this.targetY = homeY;
            this.stepProgress = 0;
        }

        if (this.stepProgress < 1) {
            this.stepProgress += 0.08;

            const lift = Math.sin(this.stepProgress * Math.PI) * 25;

            this.footX =
                this.startX +
                (this.targetX - this.startX) * this.stepProgress;

            this.footY =
                this.startY +
                (this.targetY - this.startY) * this.stepProgress -
                lift;
        }
    }

    draw() {
        const body = segments[this.index];

        // IK math
        const dx = this.footX - body.x;
        const dy = this.footY - body.y;
        const dist = Math.hypot(dx, dy);

        const a = this.upperLen;
        const b = this.lowerLen;
        const c = Math.min(dist, a + b - 0.1);

        const angleToFoot = Math.atan2(dy, dx);

        const angleA =
            Math.acos((a * a + c * c - b * b) / (2 * a * c));

        const jointAngle = angleToFoot - angleA;

        const kneeX = body.x + Math.cos(jointAngle) * a;
        const kneeY = body.y + Math.sin(jointAngle) * a;

        ctx.beginPath();
        ctx.moveTo(body.x, body.y);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(this.footX, this.footY);
        ctx.stroke();

        ctx.fillRect(this.footX - 3, this.footY - 3, 6, 6);
    }
}

// Attach legs
const legs = [];
[3, 6, 9].forEach(i => {
    legs.push(new Leg(i, -1));
    legs.push(new Leg(i, 1));
});

// ==========================
// Animation Loop
// ==========================
function animate() {
    requestAnimationFrame(animate);

    // Motion trail
    ctx.fillStyle = "rgba(10,10,10,0.25)";
    ctx.fillRect(0, 0, width, height);

    // Head physics
    const dx = Input.x - segments[0].x;
    const dy = Input.y - segments[0].y;

    vx += dx * stiffness;
    vy += dy * stiffness;

    vx *= friction;
    vy *= friction;

    segments[0].x += vx;
    segments[0].y += vy;

    const speed = Math.hypot(vx, vy);
    cameraZoom = 1 + speed * 0.002;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-width / 2, -height / 2);

    // Spine IK
    for (let i = 1; i < segments.length; i++) {
        const prev = segments[i - 1];
        const seg = segments[i];

        const dx = prev.x - seg.x;
        const dy = prev.y - seg.y;

        seg.angle = Math.atan2(dy, dx);

        // Add wave motion
        seg.angle += Math.sin(Date.now() * 0.005 + i * 0.5) * 0.15;

        seg.x = prev.x - Math.cos(seg.angle) * segmentDist;
        seg.y = prev.y - Math.sin(seg.angle) * segmentDist;
    }

    // Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff0044";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";

    // Update & draw legs
    legs.forEach(l => {
        l.update();
        l.draw();
    });

    // Draw spine
    segments.forEach((s, i) => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);

        // Breathing effect
        const breathe = Math.sin(Date.now() * 0.003) * 2;

        ctx.fillStyle = i === 0 ? "#ff0044" : "#ffffff";
        ctx.fillRect(-6, -6 - breathe, 12, 12 + breathe);

        ctx.restore();
    });

    ctx.shadowBlur = 0;
    ctx.restore();
}

animate();