let port, reader;
let angle = 0, dist = 0;
const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const cx = canvas.width / 2;
const cy = canvas.height;
const maxDist = 40;
const maxRadius = 200;
let traces = [];

document.getElementById('connect').addEventListener('click', async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    reader = port.readable.getReader();
    readLoop();
    animate();
  } catch (e) {
    alert('Ошибка подключения: ' + e);
  }
});

async function readLoop() {
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value);
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const parts = line.trim().split(',');
      if (parts.length === 2) {
        const a = parseFloat(parts[0]);
        const d = parseFloat(parts[1]);
        if (!isNaN(a) && !isNaN(d) && a >= 0 && a <= 180) {
          angle = a;
          dist = d;
          document.getElementById('ang').textContent = a.toFixed(0);
          document.getElementById('dst').textContent = d.toFixed(1);

          // add dot < 40 см
          if (d < maxDist) {
            traces.push({ a, d, life: 2.5 });
            if (traces.length > 200) traces.shift();
          }
        }
      }
    }
  }
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(0,255,100,0.25)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (maxRadius / 4) * i, Math.PI, 0);
    ctx.stroke();
  }
  for (let a = 0; a <= 180; a += 15) {
    const rad = a * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + maxRadius * Math.cos(rad), cy - maxRadius * Math.sin(rad));
    ctx.stroke();
  }
}

function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  for (let t of traces) {
    if (t.d >= maxDist) continue;
    t.life -= 0.005;
    if (t.life <= 0) continue;
    const r = t.a * Math.PI / 180;
    const rr = (t.d / maxDist) * maxRadius;
    const x = cx + rr * Math.cos(r);
    const y = cy - rr * Math.sin(r);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255,0,0,${t.life})`;
    ctx.fill();
  }

  traces = traces.filter(t => t.life > 0 && t.d < maxDist);

  const rad = angle * Math.PI / 180;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + maxRadius * Math.cos(rad), cy - maxRadius * Math.sin(rad));
  ctx.strokeStyle = 'rgba(0,255,0,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
}