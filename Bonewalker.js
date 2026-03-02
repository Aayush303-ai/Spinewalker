/**
 * SHADOW DRAKE - Stable Version
 * Procedural Dragon with:
 * - Physics head
 * - IK spine
 * - Safe 2-bone IK legs
 * - Rotating wings
 * - Fire breath
 */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height;
const Input = { x: 0, y: 0 };

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
window.addEventListener("mousemove", e => {
  Input.x = e.clientX;
  Input.y = e.clientY;
});
resize();

// ================= SPINE =================
const segmentCount = 20;
const segmentLength = 18;
const segments = [];

for (let i = 0; i < segmentCount; i++) {
  segments.push({
    x: width / 2,
    y: height / 2,
    angle: 0
  });
}

// ================= HEAD PHYSICS =================
let vx = 0;
let vy = 0;
const stiffness = 0.02;
const friction = 0.9;

// ================= SAFE IK LEG =================
class Leg {
  constructor(index, side) {
    this.index = index;
    this.side = side;

    this.upper = 30;
    this.lower = 30;

    this.footX = segments[index].x;
    this.footY = segments[index].y;

    this.stepProgress = 1;
  }

  update() {
    const body = segments[this.index];
    const angle = body.angle + (Math.PI / 2) * this.side;

    const homeX = body.x + Math.cos(angle) * 45;
    const homeY = body.y + Math.sin(angle) * 45 + 30;

    const dist = Math.hypot(this.footX - homeX, this.footY - homeY);

    if (dist > 60 && this.stepProgress >= 1) {
      this.startX = this.footX;
      this.startY = this.footY;
      this.targetX = homeX;
      this.targetY = homeY;
      this.stepProgress = 0;
    }

    if (this.stepProgress < 1) {
      this.stepProgress += 0.08;
      const lift = Math.sin(this.stepProgress * Math.PI) * 18;

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

    const dx = this.footX - body.x;
    const dy = this.footY - body.y;
    const dist = Math.hypot(dx, dy);

    const a = this.upper;
    const b = this.lower;

    const maxReach = a + b - 0.001;
    const c = Math.min(dist, maxReach);

    const angleToFoot = Math.atan2(dy, dx);

    // Safe clamp for acos
    let cosAngle = (a * a + c * c - b * b) / (2 * a * c);
    cosAngle = Math.max(-1, Math.min(1, cosAngle));

    const angleA = Math.acos(cosAngle);
    const jointAngle = angleToFoot - angleA;

    const kneeX = body.x + Math.cos(jointAngle) * a;
    const kneeY = body.y + Math.sin(jointAngle) * a;

    ctx.lineWidth = 5;
    ctx.strokeStyle = "#111";

    ctx.beginPath();
    ctx.moveTo(body.x, body.y);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(this.footX, this.footY);
    ctx.stroke();
  }
}

const legs = [];
[6, 12].forEach(i => {
  legs.push(new Leg(i, -1));
  legs.push(new Leg(i, 1));
});

// ================= BODY =================
function drawBody() {
  ctx.beginPath();

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const thickness = 22 - i * 0.9;

    const offsetX =
      Math.cos(s.angle + Math.PI / 2) * thickness;
    const offsetY =
      Math.sin(s.angle + Math.PI / 2) * thickness;

    if (i === 0)
      ctx.moveTo(s.x + offsetX, s.y + offsetY);
    else
      ctx.lineTo(s.x + offsetX, s.y + offsetY);
  }

  for (let i = segments.length - 1; i >= 0; i--) {
    const s = segments[i];
    const thickness = 22 - i * 0.9;

    const offsetX =
      Math.cos(s.angle - Math.PI / 2) * thickness;
    const offsetY =
      Math.sin(s.angle - Math.PI / 2) * thickness;

    ctx.lineTo(s.x + offsetX, s.y + offsetY);
  }

  ctx.closePath();

  const grad = ctx.createLinearGradient(
    segments[0].x,
    segments[0].y,
    segments[segments.length - 1].x,
    segments[segments.length - 1].y
  );

  grad.addColorStop(0, "#ff0044");
  grad.addColorStop(1, "#220011");

  ctx.fillStyle = grad;
  ctx.fill();
}

// ================= WINGS =================
function drawWings() {
  const base = segments[5];
  const flap = Math.sin(Date.now() * 0.006) * 30;

  ctx.save();
  ctx.translate(base.x, base.y);
  ctx.rotate(base.angle);

  ctx.fillStyle = "rgba(100,0,50,0.6)";

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-120, -60 + flap, -200, 40);
  ctx.lineTo(-60, 30);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(120, -60 + flap, 200, 40);
  ctx.lineTo(60, 30);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ================= FIRE =================
function drawFire(speed) {
  if (speed < 6) return;

  const head = segments[0];

  ctx.fillStyle = "rgba(255,120,0,0.6)";
  ctx.beginPath();
  ctx.arc(
    head.x + Math.cos(head.angle) * 45,
    head.y + Math.sin(head.angle) * 45,
    20 + Math.random() * 15,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// ================= MAIN LOOP =================
function animate() {
  requestAnimationFrame(animate);

  ctx.fillStyle = "rgba(5,5,10,0.25)";
  ctx.fillRect(0, 0, width, height);

  const dx = Input.x - segments[0].x;
  const dy = Input.y - segments[0].y;

  vx += dx * stiffness;
  vy += dy * stiffness;

  vx *= friction;
  vy *= friction;

  segments[0].x += vx;
  segments[0].y += vy;

  const speed = Math.hypot(vx, vy);

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const seg = segments[i];

    const dx = prev.x - seg.x;
    const dy = prev.y - seg.y;

    seg.angle = Math.atan2(dy, dx);
    seg.angle += Math.sin(Date.now() * 0.004 + i * 0.5) * 0.1;

    seg.x = prev.x - Math.cos(seg.angle) * segmentLength;
    seg.y = prev.y - Math.sin(seg.angle) * segmentLength;
  }

  ctx.shadowBlur = 25;
  ctx.shadowColor = "#ff0044";

  drawWings();

  legs.forEach(l => {
    l.update();
    l.draw();
  });

  drawBody();
  drawFire(speed);

  // Eye
  const head = segments[0];
  ctx.beginPath();
  ctx.arc(
    head.x + Math.cos(head.angle) * 18,
    head.y + Math.sin(head.angle) * 18,
    6,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.shadowBlur = 0;
}

animate();