const canvas = document.getElementById('game_board');
const context = canvas?.getContext('2d');

export const resizePage = () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
}

export const clearBoard = (context) => context.clearRect(0, 0, context.canvas.width, context.canvas.height);

const calcPercentVal = (val1, val2, percent) =>
  Math.min(val1, val2) + (Math.abs(val1 - val2) * percent);

export const arrayPartialTransformation = (arr1, arr2, percent) =>
  arr1.map((val, i) => calcPercentVal(val, arr2[i], percent));

export const HSVtoRGB = (h, s, v) => {
    var r, g, b, i, f, p, q, t;
    if (h && !s && !v) {
        s = h.s, v = h.v, h = h.h;
    };

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    };

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
};

export const getRandomColor = () => {
  const r1 = Math.random();
  const r2 = Math.random();
  const r3 = Math.random();

  const h = r1 * 360;
  const s = 50 + 50 * r2;
  const v = 40 + 40 * r2;

  return HSVtoRGB(h, s / 100, v / 100);
};

export const hexToDecimal = hex => parseInt(hex, 16);

export const rfcToUnix = (rfcDate) => (new Date(rfcDate)).getTime();
