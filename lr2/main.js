const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const scaleRange = document.getElementById('scaleRange');
const resizeBtn = document.getElementById('resizeBtn');
const resizeDialog = document.getElementById('resizeDialog');
const newWidthInput = document.getElementById('newWidth');
const newHeightInput = document.getElementById('newHeight');
const keepRatioCheck = document.getElementById('keepRatio');
const interpSelect = document.getElementById('interpSelect');

let originalImage = null;   // ImageData оригинального изображения
let currentImage = null;    // текущая картинка
let origWidth = 0, origHeight = 0;

// 📌 Загрузка картинки
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    origWidth = img.width;
    origHeight = img.height;

    canvas.width = window.innerWidth - 100;
    canvas.height = window.innerHeight - 150;

    // Центрируем и отрисовываем с масштабом 100%
    setScale(100, img);

    statusEl.textContent = `Загружено: ${file.name}, ${origWidth}x${origHeight}`;
  };
  img.src = URL.createObjectURL(file);
});

// 📌 Масштаб через range
scaleRange.addEventListener('input', () => {
  if (!originalImage) return;
  drawScaled(scaleRange.value);
});

// 📌 Открыть модалку
resizeBtn.addEventListener('click', () => {
  if (!originalImage) return;
  newWidthInput.value = origWidth;
  newHeightInput.value = origHeight;
  resizeDialog.showModal();
});

// 📌 Закрытие модалки
resizeDialog.addEventListener('close', () => {
  if (resizeDialog.returnValue === 'ok') {
    const newW = parseInt(newWidthInput.value);
    const newH = parseInt(newHeightInput.value);
    const algo = interpSelect.value;
    if (newW > 0 && newH > 0) {
      currentImage = resizeImage(originalImage, newW, newH, algo);
      origWidth = newW;
      origHeight = newH;
      originalImage = currentImage; // теперь это новое "оригинальное"
      drawScaled(scaleRange.value);
    }
  }
});


// ======================
// 🔹 Вспомогательные функции
// ======================

// Установить масштаб
function setScale(percent, img) {
  canvas.width = window.innerWidth - 100;
  canvas.height = window.innerHeight - 150;

  const scale = percent / 100;
  const w = img.width * scale;
  const h = img.height * scale;

  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, x, y, w, h);

  // Запоминаем оригинал в ImageData
  ctx.drawImage(img, 0, 0);
  originalImage = ctx.getImageData(0, 0, img.width, img.height);
}

// Перерисовка по масштабу
function drawScaled(percent) {
  const scale = percent / 100;
  const w = origWidth * scale;
  const h = origHeight * scale;
  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(
    resizeImage(originalImage, w, h, interpSelect.value),
    x, y
  );
}

// ⬇ Алгоритмы интерполяции
function resizeImage(imgData, newW, newH, algo) {
  if (algo === 'nearest') return resizeNearest(imgData, newW, newH);
  else return resizeBilinear(imgData, newW, newH);
}

// Ближайший сосед
function resizeNearest(imgData, newW, newH) {
  const src = imgData.data;
  const sw = imgData.width;
  const sh = imgData.height;

  const out = ctx.createImageData(newW, newH);
  const dst = out.data;

  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const srcX = Math.floor(x / newW * sw);
      const srcY = Math.floor(y / newH * sh);
      const srcI = (srcY * sw + srcX) * 4;
      const dstI = (y * newW + x) * 4;
      dst[dstI] = src[srcI];
      dst[dstI+1] = src[srcI+1];
      dst[dstI+2] = src[srcI+2];
      dst[dstI+3] = src[srcI+3];
    }
  }
  return out;
}

// Билинейная интерполяция (чуть сложнее)
function resizeBilinear(imgData, newW, newH) {
  const src = imgData.data;
  const sw = imgData.width;
  const sh = imgData.height;

  const out = ctx.createImageData(newW, newH);
  const dst = out.data;

  for (let y = 0; y < newH; y++) {
    const gy = (y / (newH - 1)) * (sh - 1);
    const y0 = Math.floor(gy);
    const y1 = Math.min(y0 + 1, sh - 1);
    const dy = gy - y0;

    for (let x = 0; x < newW; x++) {
      const gx = (x / (newW - 1)) * (sw - 1);
      const x0 = Math.floor(gx);
      const x1 = Math.min(x0 + 1, sw - 1);
      const dx = gx - x0;

      const i00 = (y0 * sw + x0) * 4;
      const i01 = (y0 * sw + x1) * 4;
      const i10 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;

      for (let c = 0; c < 4; c++) {
        const v00 = src[i00 + c];
        const v01 = src[i01 + c];
        const v10 = src[i10 + c];
        const v11 = src[i11 + c];

        const v0 = v00 * (1 - dx) + v01 * dx;
        const v1 = v10 * (1 - dx) + v11 * dx;
        const val = v0 * (1 - dy) + v1 * dy;

        dst[(y * newW + x) * 4 + c] = val;
      }
    }
  }
  return out;
}