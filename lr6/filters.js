// Готовые пресеты свертки
export const presets = {
    identity: [[0,0,0],[0,1,0],[0,0,0]],
    sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]],
    gauss: [[1,2,1],[2,4,2],[1,2,1]].map(r=>r.map(v=>v/16)),
    blur: Array(3).fill().map(()=>Array(3).fill(1/9)),
    prewittX: [[-1,0,1],[-1,0,1],[-1,0,1]],
    prewittY: [[-1,-1,-1],[0,0,0],[1,1,1]]
  };
  
  // свертка
  export function convolve(imageData, kernel) {
    let {width, height, data} = imageData;
    let out = new Uint8ClampedArray(data.length);
    let k = 1;
    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        let r=0,g=0,b=0;
        for (let ky=-k; ky<=k; ky++) {
          for (let kx=-k; kx<=k; kx++) {
            let px = Math.min(width-1, Math.max(0, x+kx));
            let py = Math.min(height-1, Math.max(0, y+ky));
            let idx = (py*width+px)*4;
            let kval = kernel[ky+k][kx+k];
            r += data[idx]*kval;
            g += data[idx+1]*kval;
            b += data[idx+2]*kval;
          }
        }
        let i = (y*width+x)*4;
        out[i]   = Math.min(255, Math.max(0, r));
        out[i+1] = Math.min(255, Math.max(0, g));
        out[i+2] = Math.min(255, Math.max(0, b));
        out[i+3] = data[i+3];
      }
    }
    return new ImageData(out, width, height);
  }
  
  // медианный фильтр (3х3)
  export function medianFilter(imageData) {
    let {width, height, data} = imageData;
    let out = new Uint8ClampedArray(data.length);
    let k=1;
    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        let winR=[], winG=[], winB=[];
        for (let ky=-k; ky<=k; ky++) {
          for (let kx=-k; kx<=k; kx++) {
            let px = Math.min(width-1, Math.max(0, x+kx));
            let py = Math.min(height-1, Math.max(0, y+ky));
            let idx = (py*width+px)*4;
            winR.push(data[idx]);
            winG.push(data[idx+1]);
            winB.push(data[idx+2]);
          }
        }
        winR.sort((a,b)=>a-b);
        winG.sort((a,b)=>a-b);
        winB.sort((a,b)=>a-b);
        let mid=4;
        let i=(y*width+x)*4;
        out[i]=winR[mid]; out[i+1]=winG[mid]; out[i+2]=winB[mid]; out[i+3]=255;
      }
    }
    return new ImageData(out,width,height);
  }