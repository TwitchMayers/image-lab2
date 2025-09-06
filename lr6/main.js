import {presets, convolve, medianFilter} from "./filters.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Загружаем тестовое изображение
const img = new Image();
img.crossOrigin="anonymous";
img.src = "https://picsum.photos/500/400";
img.onload = ()=> ctx.drawImage(img,0,0,canvas.width,canvas.height);

// Диалог управления ядром
const dialog = document.getElementById("kernelDialog");

document.getElementById("openKernel").onclick = ()=>openDialog();
document.getElementById("closeKernel").onclick = ()=>closeDialog();
document.getElementById("applyKernel").onclick = ()=>applyKernel();
document.getElementById("resetKernel").onclick = ()=>fillGrid(presets.identity);
document.getElementById("presetSelect").onchange = e=>{
  fillGrid(presets[e.target.value]);
};

function openDialog(){
  dialog.style.display="flex";
  fillGrid(presets.identity);
}
function closeDialog(){ dialog.style.display="none"; }

function fillGrid(kernel){
  let table="";
  for(let y=0;y<3;y++){
    table+="<tr>";
    for(let x=0;x<3;x++){
      table+=`<td><input class="kcell" data-x="${x}" data-y="${y}" value="${kernel[y][x]}"></td>`;
    }
    table+="</tr>";
  }
  document.getElementById("kernelGrid").innerHTML=table;
}

function applyKernel(){
  let inputs=[...document.querySelectorAll(".kcell")];
  let kernel=[ [0,0,0],[0,0,0],[0,0,0] ];
  inputs.forEach(el=>{
    kernel[el.dataset.y][el.dataset.x]=parseFloat(el.value);
  });
  let imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
  let out = convolve(imgData,kernel);
  ctx.putImageData(out,0,0);
  closeDialog();
}

// медианный фильтр
document.getElementById("applyMedian").onclick = ()=>{
  let imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
  let out = medianFilter(imgData);
  ctx.putImageData(out,0,0);
};

// сохранение
function download(blob, filename){
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=filename;
  a.click();
}

document.getElementById("savePng").onclick=()=>{
  canvas.toBlob(b=>download(b,"result.png"),"image/png");
};
document.getElementById("saveJpg").onclick=()=>{
  canvas.toBlob(b=>download(b,"result.jpg"),"image/jpeg");
};
document.getElementById("saveGb7").onclick=()=>{
  let imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
  let header = new Uint32Array([imgData.width,imgData.height]);
  let pixels = new Uint8Array(imgData.data.buffer);
  let blob = new Blob([header,pixels],{type:"application/octet-stream"});
  download(blob,"result.gb7");
};