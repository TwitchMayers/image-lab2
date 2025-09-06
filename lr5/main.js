const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Для демонстрации заполняем канву картинкой или градиентом
const img = new Image();
img.src = "https://picsum.photos/500/400"; // Тестовое изображение
img.onload = () => {
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

// Кнопка открытия диалога
document.getElementById("openCurves").addEventListener("click", () => {
  document.getElementById("curvesDialog").style.display = "block";
  updateHistogramAndCurve();
});

// Кнопки диалога
document.getElementById("closeCurves").addEventListener("click", () => {
  document.getElementById("curvesDialog").style.display = "none";
});

document.getElementById("resetCurves").addEventListener("click", () => {
  document.getElementById("x1").value = 0;
  document.getElementById("y1").value = 0;
  document.getElementById("x2").value = 255;
  document.getElementById("y2").value = 255;
  updateHistogramAndCurve();
});

document.getElementById("applyCurves").addEventListener("click", () => {
  applyCorrection();
});

document.getElementById("preview").addEventListener("change", () => {
  if (document.getElementById("preview").checked) {
    applyCorrection(true);
  } else {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // сброс
  }
});

// ====== Логика гистограммы и коррекции =======
function computeHistogram(imageData) {
  let histR = new Array(256).fill(0);
  let histG = new Array(256).fill(0);
  let histB = new Array(256).fill(0);
  let d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    histR[d[i]]++;
    histG[d[i + 1]]++;
    histB[d[i + 2]]++;
  }
  return { histR, histG, histB };
}

function drawHistogram(histR, histG, histB, curvePoints) {
  const hCanvas = document.getElementById("histogramCanvas");
  const hCtx = hCanvas.getContext("2d");
  hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);

  let maxVal = Math.max(
    Math.max(...histR),
    Math.max(...histG),
    Math.max(...histB)
  );

  function drawHist(hist, color) {
    hCtx.beginPath();
    hCtx.strokeStyle = color;
    for (let x = 0; x < 256; x++) {
      let y = (hist[x] / maxVal) * 256;
      hCtx.moveTo(x, 256);
      hCtx.lineTo(x, 256 - y);
    }
    hCtx.stroke();
  }

  drawHist(histR, "red");
  drawHist(histG, "green");
  drawHist(histB, "blue");

  // Диагональ y=x
  hCtx.beginPath();
  hCtx.strokeStyle = "blue";
  hCtx.moveTo(0, 256);
  hCtx.lineTo(256, 0);
  hCtx.stroke();

  // Линия коррекции по точкам
  let [x1, y1, x2, y2] = curvePoints;
  y1 = 255 - y1; // инверсия по оси
  y2 = 255 - y2;
  hCtx.beginPath();
  hCtx.strokeStyle = "black";
  hCtx.moveTo(0, 255);
  hCtx.lineTo(x1, y1);
  hCtx.lineTo(x2, y2);
  hCtx.lineTo(255, 0);
  hCtx.stroke();
}

function buildLUT(x1, y1, x2, y2) {
  const lut = new Array(256);
  for (let i = 0; i < 256; i++) {
    if (i < x1) lut[i] = (y1 / x1) * i;
    else if (i > x2) lut[i] = y2 + ((255 - y2) / (255 - x2)) * (i - x2);
    else lut[i] = y1 + ((y2 - y1) / (x2 - x1)) * (i - x1);
    lut[i] = Math.max(0, Math.min(255, Math.round(lut[i])));
  }
  return lut;
}

function applyCorrection(previewOnly = false) {
  const x1 = parseInt(document.getElementById("x1").value);
  const y1 = parseInt(document.getElementById("y1").value);
  const x2 = parseInt(document.getElementById("x2").value);
  const y2 = parseInt(document.getElementById("y2").value);

  // Восстанавливаем исходное изображение
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let lut = buildLUT(x1, y1, x2, y2);

  let d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]];       // R
    d[i + 1] = lut[d[i+1]]; // G
    d[i + 2] = lut[d[i+2]]; // B
  }
  ctx.putImageData(imageData, 0, 0);

  if (!previewOnly) {
    // применённые изменения – обновляем картинку img
    let tmp = canvas.toDataURL();
    img.src = tmp;
  }
  updateHistogramAndCurve();
}

function updateHistogramAndCurve() {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let {histR, histG, histB} = computeHistogram(imageData);

  const x1 = parseInt(document.getElementById("x1").value);
  const y1 = parseInt(document.getElementById("y1").value);
  const x2 = parseInt(document.getElementById("x2").value);
  const y2 = parseInt(document.getElementById("y2").value);

  drawHistogram(histR, histG, histB, [x1, y1, x2, y2]);
}

// При изменении значений полей — обновляем график
["x1","y1","x2","y2"].forEach(id=>{
  document.getElementById(id).addEventListener("input", updateHistogramAndCurve);
});