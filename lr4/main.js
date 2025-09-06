const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const layersList = document.getElementById("layers");
const addColorLayerBtn = document.getElementById("addColorLayer");
const uploadLayerInput = document.getElementById("uploadLayer");

let layers = [];
let activeLayer = null;

// === Rendering ===
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  layers.forEach(layer => {
    if (!layer.hidden) {
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      ctx.drawImage(layer.image, 0, 0, canvas.width, canvas.height);
    }
  });

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
}

// === Layer Management ===
function addLayer(imageSrc = null, color = null) {
  if (layers.length >= 2) {
    alert("Макс. 2 слоя!");
    return;
  }

  const img = document.createElement("canvas");
  img.width = canvas.width;
  img.height = canvas.height;
  const imgCtx = img.getContext("2d");

  if (imageSrc) {
    const imageElement = new Image();
    imageElement.src = imageSrc;
    imageElement.onload = () => {
      imgCtx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      render();
    };
  } else if (color) {
    imgCtx.fillStyle = color;
    imgCtx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const layer = {
    id: Date.now(),
    name: "Слой " + (layers.length + 1),
    image: img,
    opacity: 1.0,
    hidden: false,
    blendMode: "normal"
  };

  layers.push(layer);
  setActiveLayer(layer);
  updateUI();
  render();
}

function deleteLayer(layer) {
  layers = layers.filter(l => l.id !== layer.id);
  if (activeLayer === layer) activeLayer = null;
  updateUI();
  render();
}

function moveLayer(layer, direction) {
  const index = layers.indexOf(layer);
  if (direction === "up" && index < layers.length - 1) {
    [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
  } else if (direction === "down" && index > 0) {
    [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
  }
  updateUI();
  render();
}

function setActiveLayer(layer) {
  activeLayer = layer;
  updateUI();
}

// === UI ===
function updateUI() {
  layersList.innerHTML = "";

  layers.slice().reverse().forEach(layer => {
    const li = document.createElement("li");
    if (layer === activeLayer) li.classList.add("active");

    // Заголовок
    const header = document.createElement("div");
    header.className = "layer-header";
    header.innerHTML = `<span>${layer.name}</span>`;
    header.onclick = () => setActiveLayer(layer);

    const buttonsDiv = document.createElement("div");

    const hideBtn = document.createElement("button");
    hideBtn.textContent = layer.hidden ? "👁" : "🚫";
    hideBtn.title = "Скрыть/показать";
    hideBtn.onclick = (e) => {
      e.stopPropagation();
      layer.hidden = !layer.hidden;
      updateUI();
      render();
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑";
    delBtn.title = "Удалить";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteLayer(layer);
    };

    const upBtn = document.createElement("button");
    upBtn.textContent = "⬆";
    upBtn.title = "Вверх";
    upBtn.onclick = (e) => {
      e.stopPropagation();
      moveLayer(layer, "up");
    };

    const downBtn = document.createElement("button");
    downBtn.textContent = "⬇";
    downBtn.title = "Вниз";
    downBtn.onclick = (e) => {
      e.stopPropagation();
      moveLayer(layer, "down");
    };

    buttonsDiv.appendChild(hideBtn);
    buttonsDiv.appendChild(upBtn);
    buttonsDiv.appendChild(downBtn);
    buttonsDiv.appendChild(delBtn);

    header.appendChild(buttonsDiv);
    li.appendChild(header);

    // превью
    const preview = document.createElement("canvas");
    preview.className = "preview";
    preview.width = 60;
    preview.height = 40;
    const pctx = preview.getContext("2d");
    pctx.drawImage(layer.image, 0, 0, 60, 40);
    li.appendChild(preview);

    // opacity slider
    const opacity = document.createElement("input");
    opacity.type = "range";
    opacity.min = 0;
    opacity.max = 1;
    opacity.step = 0.1;
    opacity.value = layer.opacity;
    opacity.oninput = (e) => {
      layer.opacity = parseFloat(e.target.value);
      render();
    };
    li.appendChild(opacity);

    // blend mode select
    const blend = document.createElement("select");
    [
      {mode:"normal", tip:"Стандартное наложение"},
      {mode:"multiply", tip:"Умножение: затемнение"},
      {mode:"screen", tip:"Экран: осветление"},
      {mode:"overlay", tip:"Наложение: комбинированный эффект"}
    ].forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.mode;
      option.textContent = opt.mode;
      option.title = opt.tip;
      if (layer.blendMode === opt.mode) option.selected = true;
      blend.appendChild(option);
    });
    blend.onchange = e => {
      layer.blendMode = e.target.value;
      render();
    };
    li.appendChild(blend);

    layersList.appendChild(li);
  });
}

// === Buttons ===
addColorLayerBtn.onclick = () => {
  const color = prompt("Введите цвет (например, red или #ff0000):", "#"+Math.floor(Math.random()*16777215).toString(16));
  if (color) addLayer(null, color);
};

uploadLayerInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => addLayer(reader.result, null);
  reader.readAsDataURL(file);
};

// стартовый слой по умолчанию
addLayer(null, "#ffffff");