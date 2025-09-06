// --- Глобальные переменные ---
let activeTool = null; // hand | pipette
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");

const handBtn = document.getElementById("handTool");
const pipetteBtn = document.getElementById("pipetteTool");
const colorInfoPanel = document.getElementById("colorInfo");

let img = null;
let scale = 1.0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX, dragStartY;

const swatchA = document.getElementById("colorA-swatch");
const swatchB = document.getElementById("colorB-swatch");
const coordsA = document.getElementById("colorA-coords");
const coordsB = document.getElementById("colorB-coords");
const rgbA = document.getElementById("colorA-rgb");
const rgbB = document.getElementById("colorB-rgb");
const xyzA = document.getElementById("colorA-xyz");
const xyzB = document.getElementById("colorB-xyz");
const labA = document.getElementById("colorA-lab");
const labB = document.getElementById("colorB-lab");
const oklchA = document.getElementById("colorA-oklch");
const oklchB = document.getElementById("colorB-oklch");
const contrastInfo = document.getElementById("contrastInfo");

let hasColorA = false;
let hasColorB = false;

// --- Отобразить картинку ---
function redrawImage() {
  if (!img) return;
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight * 0.6;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
}

// --- Установка инструмента ---
function setActiveTool(tool) {
  activeTool = tool;
  handBtn.classList.remove("active");
  pipetteBtn.classList.remove("active");

  if (tool === "hand") handBtn.classList.add("active");
  if (tool === "pipette") {
    pipetteBtn.classList.add("active");
    colorInfoPanel.classList.remove("hidden");
  }
}

// --- Кнопки/горячие клавиши ---
handBtn.addEventListener("click", () => setActiveTool("hand"));
pipetteBtn.addEventListener("click", () => setActiveTool("pipette"));
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "h") setActiveTool("hand");
  if (e.key.toLowerCase() === "i") setActiveTool("pipette");
});

// --- Рука (перемещение) ---
canvas.addEventListener("mousedown", (e) => {
  if (activeTool === "hand") {
    isDragging = true;
    dragStartX = e.clientX - offsetX;
    dragStartY = e.clientY - offsetY;
  }
});
canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    offsetX = e.clientX - dragStartX;
    offsetY = e.clientY - dragStartY;
    redrawImage();
  }
});
canvas.addEventListener("mouseup", () => {
  isDragging = false;
});

// --- Пипетка ---
canvas.addEventListener("click", (e) => {
  if (activeTool === "pipette") {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const x = Math.floor((cx - offsetX) / scale);
    const y = Math.floor((cy - offsetY) / scale);

    if (x >= 0 && y >= 0 && x < img.width && y < img.height) {
      const pixel = ctx.getImageData(cx, cy, 1, 1).data;
      const rgbArr = [pixel[0], pixel[1], pixel[2]];

      // Конвертации
      const xyz = rgbToXyz(rgbArr);
      const lab = xyzToLab(xyz);
      const oklch = labToOklch(lab);

      const rgbStr = `${rgbArr[0]}, ${rgbArr[1]}, ${rgbArr[2]}`;
      const xyzStr = `X=${xyz[0].toFixed(2)}, Y=${xyz[1].toFixed(2)}, Z=${xyz[2].toFixed(2)}`;
      const labStr = `L=${lab[0].toFixed(2)}, a=${lab[1].toFixed(2)}, b=${lab[2].toFixed(2)}`;
      const oklchStr = `L=${oklch[0].toFixed(2)}, C=${oklch[1].toFixed(2)}, H=${oklch[2].toFixed(2)}`;

      if (!hasColorA || (!e.altKey && !e.shiftKey && !e.ctrlKey)) {
        swatchA.style.backgroundColor = `rgb(${rgbStr})`;
        coordsA.innerText = `Координаты: x=${x}, y=${y}`;
        rgbA.innerText = rgbStr;
        xyzA.innerText = xyzStr;
        labA.innerText = labStr;
        oklchA.innerText = oklchStr;
        hasColorA = true;
      } else {
        swatchB.style.backgroundColor = `rgb(${rgbStr})`;
        coordsB.innerText = `Координаты: x=${x}, y=${y}`;
        rgbB.innerText = rgbStr;
        xyzB.innerText = xyzStr;
        labB.innerText = labStr;
        oklchB.innerText = oklchStr;
        hasColorB = true;
      }

      if (hasColorA && hasColorB) {
        const cA = swatchA.style.backgroundColor;
        const cB = swatchB.style.backgroundColor;
        const r1 = rgbArrFromCss(cA);
        const r2 = rgbArrFromCss(cB);
        const ratio = contrastRatio(r1, r2);
        if (ratio < 4.5) {
          contrastInfo.innerText = `Контраст: ${ratio.toFixed(2)} (⚠ недостаточный)`;
        } else {
          contrastInfo.innerText = `Контраст: ${ratio.toFixed(2)} (хороший)`;
        }
      }
    }
  }
});

// --- Загрузка изображения ---
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  img = new Image();
  reader.onload = (event) => {
    img.onload = () => {
      offsetX = 0;
      offsetY = 0;
      scale = 1.0;
      redrawImage();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// --- Масштабирование ---
document.getElementById("scaleRange").addEventListener("input", (e) => {
  scale = parseFloat(e.target.value) / 100.0;
  redrawImage();
});

// ---------- Цветовые конвертации -----------

// Гамма-коррекция sRGB → линейное
function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// RGB → XYZ
function rgbToXyz(rgb) {
  let r = srgbToLinear(rgb[0]);
  let g = srgbToLinear(rgb[1]);
  let b = srgbToLinear(rgb[2]);
  // матрица D65
  return [
    r * 0.4124 + g * 0.3576 + b * 0.1805,
    r * 0.2126 + g * 0.7152 + b * 0.0722,
    r * 0.0193 + g * 0.1192 + b * 0.9505,
  ];
}

// XYZ → Lab
function xyzToLab(xyz) {
  const refX = 0.95047, refY = 1.00000, refZ = 1.08883;
  let x = xyz[0] / refX;
  let y = xyz[1] / refY;
  let z = xyz[2] / refZ;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : (903.3 * t + 16) / 116);
  let fx = f(x), fy = f(y), fz = f(z);
  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz)
  ];
}

// Lab → OKLch (упрощённо через Lab)
function labToOklch(lab) {
  let L = lab[0];
  let a = lab[1];
  let b = lab[2];
  let C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

// Разбор цвета rgb(x,y,z) → массив
function rgbArrFromCss(css) {
  let m = css.match(/(\d+),\s*(\d+),\s*(\d+)/);
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

// Яркость для контраста
function relativeLuminance(rgb) {
  let rs = srgbToLinear(rgb[0]);
  let gs = srgbToLinear(rgb[1]);
  let bs = srgbToLinear(rgb[2]);
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Контраст WCAG
function contrastRatio(rgb1, rgb2) {
  let L1 = relativeLuminance(rgb1);
  let L2 = relativeLuminance(rgb2);
  let bright = Math.max(L1, L2);
  let dark = Math.min(L1, L2);
  return (bright + 0.05) / (dark + 0.05);
}