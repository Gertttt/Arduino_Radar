// Переменные для порта и чтения данных
let port;
let reader;

// Угол и расстояние с датчика
let angle = 0;
let dist = 0;

// Получаем canvas и контекст для рисования
let canvas = document.getElementById('radar');
let ctx = canvas.getContext('2d');

// Центр экрана
let cx = canvas.width / 2;
let cy = canvas.height;

// Максимальное расстояние и радиус
let maxDist = 40;
let maxRadius = 200;

// Массив для хранения точек
let traces = [];

// Кнопка подключения
document.getElementById('connect').addEventListener('click', async () => {
  try {
    // Подключаемся к порту
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    reader = port.readable.getReader();
    
    // Запускаем чтение данных
    readLoop();
    
    // Запускаем анимацию
    animate();
  } catch (e) {
    alert('Ошибка подключения: ' + e);
  }
});

// Функция для чтения данных с порта
async function readLoop() {
  let decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    let result = await reader.read();
    let value = result.value;
    let done = result.done;
    
    if (done) {
      break;
    }
    
    // Добавляем новые данные в буфер
    buffer = buffer + decoder.decode(value);
    
    // Разбиваем на строки
    let lines = buffer.split('\n');
    buffer = lines[lines.length - 1];
    
    // Обрабатываем каждую строку
    for (let i = 0; i < lines.length - 1; i++) {
      let line = lines[i];
      let trimmedLine = line.trim();
      let parts = trimmedLine.split(',');
      
      if (parts.length === 2) {
        let a = parseFloat(parts[0]);
        let d = parseFloat(parts[1]);
        
        // Проверяем что числа нормальные
        if (!isNaN(a) && !isNaN(d)) {
          if (a >= 0 && a <= 180) {
            angle = a;
            dist = d;
            
            // Обновляем текст на экране
            document.getElementById('ang').textContent = a.toFixed(0);
            document.getElementById('dst').textContent = d.toFixed(1);
            
            // Если расстояние меньше 40 см, добавляем точку
            if (d < maxDist) {
              let newTrace = {};
              newTrace.a = a;
              newTrace.d = d;
              newTrace.life = 2.5;
              traces.push(newTrace);
              
              // Удаляем старые точки если их слишком много
              if (traces.length > 200) {
                traces.shift();
              }
            }
          }
        }
      }
    }
  }
}

// Рисуем сетку радара
function drawGrid() {
  ctx.strokeStyle = 'rgba(0,255,100,0.25)';
  ctx.lineWidth = 1;
  
  // Рисуем круги
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    let radius = (maxRadius / 4) * i;
    ctx.arc(cx, cy, radius, Math.PI, 0);
    ctx.stroke();
  }
  
  // Рисуем линии
  for (let a = 0; a <= 180; a = a + 15) {
    let rad = a * Math.PI / 180;
    let x = cx + maxRadius * Math.cos(rad);
    let y = cy - maxRadius * Math.sin(rad);
    
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

// Функция анимации
function animate() {
  requestAnimationFrame(animate);
  
  // Очищаем экран
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Рисуем сетку
  drawGrid();
  
  // Рисуем все точки
  for (let i = 0; i < traces.length; i++) {
    let t = traces[i];
    
    // Пропускаем если расстояние больше максимального
    if (t.d >= maxDist) {
      continue;
    }
    
    // Уменьшаем жизнь точки
    t.life = t.life - 0.005;
    
    // Пропускаем если точка умерла
    if (t.life <= 0) {
      continue;
    }
    
    // Вычисляем позицию точки
    let r = t.a * Math.PI / 180;
    let rr = (t.d / maxDist) * maxRadius;
    let x = cx + rr * Math.cos(r);
    let y = cy - rr * Math.sin(r);
    
    // Рисуем точку
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,0,0,' + t.life + ')';
    ctx.fill();
  }
  
  // Удаляем мертвые точки
  let newTraces = [];
  for (let i = 0; i < traces.length; i++) {
    let t = traces[i];
    if (t.life > 0 && t.d < maxDist) {
      newTraces.push(t);
    }
  }
  traces = newTraces;
  
  // Рисуем линию сканирования
  let rad = angle * Math.PI / 180;
  let x = cx + maxRadius * Math.cos(rad);
  let y = cy - maxRadius * Math.sin(rad);
  
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x, y);
  ctx.strokeStyle = 'rgba(0,255,0,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
}