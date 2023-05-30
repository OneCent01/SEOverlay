import {clearBoard} from '../utils.js';
import {drawWheel} from './wheel.js';

const canvas = document.createElement('canvas');
const context = canvas?.getContext('2d');
const ctx = context;

const drawMotorcycleWheels = (context, gameState, options) => {
  drawWheel(context, gameState, {x: options.x, y: options.y, lineWidth: 4, radius: 22, rotationSpeed: -3});
  drawWheel(context, gameState, {x: options.x + 36 + 66, y: options.y, lineWidth: 4, radius: 22, rotationSpeed: -3});
}

const drawFuelTank = (context, x, y) => {
  context.fillStyle = '#B53A3A';
  const scale = 5
  x *= scale;
  y *= scale;
  x -= 124;
  y -= 480;
  context.scale(1/scale, 1/scale)
  context.beginPath();
  
  context.moveTo(157 + x, 282 + y);
  context.bezierCurveTo(169 + x, 292 + y, 308 + x, 279 + y, 321 + x, 273 + y);
  context.bezierCurveTo(340 + x, 264 + y, 314 + x, 238 + y, 300 + x, 232 + y);
  context.bezierCurveTo(287 + x, 226 + y, 198 + x, 199 + y, 163 + x, 219 + y);
  context.bezierCurveTo(150 + x, 226 + y, 141 + x, 267 + y, 154 + x, 280 + y);
  context.closePath()
  context.fill();
  context.fillStyle = 'black';
  context.font = 'bold 42px serif';
  context.fillText('KDawg', 162 + x, 264 + y);
  context.setTransform(1, 0, 0, 1, 0, 0);
}

const drawSeats = (context, x, y) => {
  context.fillStyle = 'black';
  const scale = 3;
  x *= scale;
  y *= scale;
  x += 60;
  y -= 200;
  context.scale(1/scale, 1/scale)
  context.beginPath();
  
  context.moveTo(45 + x, 73 + y);
  context.bezierCurveTo(39 + x, 81 + y, 38 + x, 84 + y, 45 + x, 93 + y);
  context.bezierCurveTo(53 + x, 103 + y, 128 + x, 93 + y, 143 + x, 90 + y);
  context.bezierCurveTo(156 + x, 87 + y, 157 + x, 87 + y, 171 + x, 73 + y);
  context.bezierCurveTo(176 + x, 68 + y, 224 + x, 61 + y, 231 + x, 74 + y);
  context.bezierCurveTo(238 + x, 87 + y, 251 + x, 71 + y, 239 + x, 62 + y);
  context.bezierCurveTo(217 + x, 46 + y, 175 + x, 50 + y, 162 + x, 64 + y);
  context.bezierCurveTo(155 + x, 71 + y, 62 + x, 68 + y, 46 + x, 73 + y);
  context.closePath()
  context.fill();
  context.setTransform(1, 0, 0, 1, 0, 0);
}

const drawEngine = (context, x, y) => {
  context.fillStyle = '#777777';
  const scale = 2;
  x *= scale;
  y *= scale;
  x -= 0;
  y -= 115;
  context.scale(1/scale, 1/scale)
  context.beginPath();
  context.moveTo(35 + x, 34 + y);
  context.bezierCurveTo(34 + x, 40 + y, 34 + x, 61 + y, 35 + x, 66 + y);
  context.bezierCurveTo(36 + x, 73 + y, 58 + x, 72 + y, 59 + x, 66 + y);
  context.bezierCurveTo(60 + x, 57 + y, 61 + x, 41 + y, 57 + x, 37 + y);
  context.bezierCurveTo(53 + x, 33 + y, 39 + x, 35 + y, 35 + x, 36 + y);
  context.closePath();
  context.fill();
  context.setTransform(1, 0, 0, 1, 0, 0);
}

const drawTransmission = (context, x, y) => {
  context.fillStyle = '#555555';
  
  const scale = 2;
  x *= scale;
  y *= scale;
  x -= 20;
  y -= 130;
  context.scale(1/scale, 1/scale)
  context.beginPath();
  context.moveTo(37 + x, 54 + y);
  const xoff = x;
  const yoff = y;
  context.bezierCurveTo(37 + xoff, 69 + yoff, 43 + xoff, 126 + yoff, 49 + xoff, 130 + yoff);
  context.bezierCurveTo(57 + xoff, 135 + yoff, 143 + xoff, 129 + yoff, 145 + xoff, 125 + yoff);
  context.bezierCurveTo(158 + xoff, 100 + yoff, 179 + xoff, 64 + yoff, 174 + xoff, 60 + yoff);
  context.bezierCurveTo(171 + xoff, 58 + yoff, 89 + xoff, 57 + yoff, 88 + xoff, 64 + yoff);
  context.bezierCurveTo(87 + xoff, 72 + yoff, 99 + xoff, 79 + yoff, 97 + xoff, 81 + yoff);
  context.bezierCurveTo(93 + xoff, 85 + yoff, 58 + xoff, 85 + yoff, 51 + xoff, 83 + yoff);
  context.bezierCurveTo(46 + xoff, 81 + yoff, 47 + xoff, 66 + yoff, 43 + xoff, 47 + yoff);
  context.closePath();
  context.fill();
  context.setTransform(1, 0, 0, 1, 0, 0);
}

const drawBackShaft = (context, x, y) => {
  context.fillStyle = 'black';

  const scale = 4;
  x *= scale;
  y *= scale;
  x += 228;
  y -= 235;
  const xoff = x;
  const yoff = y;
  const ctx = context;
  context.scale(1/scale, 1/scale)
  context.beginPath();
  ctx.moveTo(70 + xoff, 66 + yoff);
  ctx.bezierCurveTo(72 + xoff, 76 + yoff, 118 + xoff, 179 + yoff, 124 + xoff, 188 + yoff);
  ctx.bezierCurveTo(127 + xoff, 193 + yoff, 135 + xoff, 187 + yoff, 135 + xoff, 183 + yoff);
  ctx.bezierCurveTo(134 + xoff, 173 + yoff, 87 + xoff, 65 + yoff, 82 + xoff, 53 + yoff);
  ctx.bezierCurveTo(80 + xoff, 48 + yoff, 66 + xoff, 62 + yoff, 70 + xoff, 64 + yoff);
  context.closePath();
  context.fill();
  context.setTransform(1, 0, 0, 1, 0, 0);
}

const drawFrontShaft = (context, x, y) => {
  const scale = 3;
  x *= scale;
  y *= scale;
  x -= 185;
  y -= 290;
  const xoff = x;
  const yoff = y;
  const ctx = context;
  context.scale(1/scale, 1/scale);
  ctx.beginPath();
  ctx.moveTo(146 + xoff, 256 + yoff);
  ctx.bezierCurveTo(147 + xoff, 261 + yoff, 151 + xoff, 264 + yoff, 154 + xoff, 263 + yoff);
  ctx.bezierCurveTo(159 + xoff, 261 + yoff, 204 + xoff, 140 + yoff, 212 + xoff, 124 + yoff);
  ctx.bezierCurveTo(214 + xoff, 120 + yoff, 200 + xoff, 112 + yoff, 199 + xoff, 115 + yoff);
  ctx.bezierCurveTo(191 + xoff, 131 + yoff, 156 + xoff, 230 + yoff, 150 + xoff, 247 + yoff);
  context.closePath();
  context.fill();
  context.setTransform(1, 0, 0, 1, 0, 0);
}

const drawHandleBars = (context, x, y) => {
  context.fillStyle = 'black';

  const scale = 3;
  x *= scale;
  y *= scale;
  x -= 110;
  y -= 270;
  const xoff = x;
  const yoff = y;
  const ctx = context;
  context.scale(1/scale, 1/scale)
  ctx.beginPath();
  ctx.moveTo(118 + xoff, 101 + yoff);
  ctx.bezierCurveTo(137 + xoff, 104 + yoff, 183 + xoff, 108 + yoff, 198 + xoff, 108 + yoff);
  ctx.bezierCurveTo(206 + xoff, 108 + yoff, 206 + xoff, 105 + yoff, 200 + xoff, 98 + yoff);
  ctx.bezierCurveTo(195 + xoff, 92 + yoff, 161 + xoff, 98 + yoff, 163 + xoff, 88 + yoff);
  ctx.bezierCurveTo(165 + xoff, 76 + yoff, 154 + xoff, 80 + yoff, 129 + xoff, 77 + yoff);
  ctx.bezierCurveTo(123 + xoff, 76 + yoff, 117 + xoff, 81 + yoff, 115 + xoff, 94 + yoff);
  context.closePath();
  context.fill();
  context.setTransform(1, 0, 0, 1, 0, 0);
}

const drawLight = (context, x, y) => {
  context.fillStyle = '#555555';
  const scale = 4;
  x *= scale;
  y *= scale;
  x -= 200;
  y -= 380;
  const xoff = x;
  const yoff = y;
  const ctx = context;
  context.scale(1/scale, 1/scale)
  ctx.beginPath();
  ctx.moveTo(214 + xoff, 163 + yoff);
  ctx.bezierCurveTo(212 + xoff, 154 + yoff, 189 + xoff, 115 + yoff, 184 + xoff, 127 + yoff);
  ctx.bezierCurveTo(181 + xoff, 133 + yoff, 173 + xoff, 191 + yoff, 179 + xoff, 200 + yoff);
  ctx.bezierCurveTo(186 + xoff, 210 + yoff, 208 + xoff, 185 + yoff, 213 + xoff, 178 + yoff);
  context.closePath();
  context.fill();
  context.setTransform(1, 0, 0, 1, 0, 0);
}

const drawExhaust = (context, x, y) => {
  context.fillStyle = '#999999';
  const scale = 2;
  x *= scale;
  y *= scale;
  x -= 150;
  y -= 185;
  const xoff = x;
  const yoff = y;
  const ctx = context;
  context.scale(1/scale, 1/scale)
  ctx.beginPath();
  ctx.moveTo(222 + xoff, 127 + yoff);
  ctx.bezierCurveTo(207 + xoff, 127 + yoff, 175 + xoff, 128 + yoff, 174 + xoff, 130 + yoff);
  ctx.bezierCurveTo(172 + xoff, 133 + yoff, 176 + xoff, 173 + yoff, 183 + xoff, 180 + yoff);
  ctx.bezierCurveTo(187 + xoff, 184 + yoff, 278 + xoff, 175 + yoff, 282 + xoff, 174 + yoff);
  ctx.bezierCurveTo(291 + xoff, 172 + yoff, 342 + xoff, 141 + yoff, 344 + xoff, 142 + yoff);
  ctx.bezierCurveTo(350 + xoff, 145 + yoff, 356 + xoff, 161 + yoff, 353 + xoff, 163 + yoff);
  ctx.bezierCurveTo(349 + xoff, 165 + yoff, 295 + xoff, 182 + yoff, 287 + xoff, 184 + yoff);
  ctx.bezierCurveTo(283 + xoff, 185 + yoff, 187 + xoff, 191 + yoff, 180 + xoff, 189 + yoff);
  ctx.bezierCurveTo(177 + xoff, 188 + yoff, 164 + xoff, 127 + yoff, 167 + xoff, 124 + yoff);
  ctx.bezierCurveTo(171 + xoff, 120 + yoff, 203 + xoff, 119 + yoff, 222 + xoff, 120 + yoff);
  context.closePath();
  context.fill();
  context.setTransform(1, 0, 0, 1, 0, 0);
}

const drawMotorcycleBody = (context, gameState, options) => {
  drawFuelTank(context, options.x, options.y);
  drawSeats(context, options.x, options.y);
  drawTransmission(context, options.x, options.y);
  drawBackShaft(context, options.x, options.y);
  drawFrontShaft(context, options.x, options.y);
  drawHandleBars(context, options.x, options.y);
  drawLight(context, options.x, options.y);
  drawExhaust(context, options.x, options.y);
  drawEngine(context, options.x, options.y);
}

export const drawMotorcycle = (mainContext, gameState, options) => {
  clearBoard(context)
  const motorcyclePosition = {x: 32, y: 65};
  drawMotorcycleWheels(context, gameState, motorcyclePosition);
  drawMotorcycleBody(context, gameState, motorcyclePosition);

  mainContext.drawImage(context.canvas, options.x, options.y, canvas.width * (options.scale || 1), canvas.height * (options.scale || 1));

}
