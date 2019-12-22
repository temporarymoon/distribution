import { Engine, Render, Runner, Events, World, Bodies, Body } from "matter-js";
import { planet, house } from "./assets";

enum CellType {
  frozen,
  full,
  empty
}

type Cell = CellType;

type Layout = {
  width: number;
  height: number;
  cells: Cell[];
};

const loadImage = (w: number, h: number, url: string) => {
  const img = new Image(w, h);

  img.src = url;

  return [
    img,
    new Promise(resolve => {
      img.onload = resolve;
    })
  ] as const;
};

const [snow, snowLoaded] = loadImage(
  256,
  256,
  require("../../assets/snow.png")
);

const [present, presentLoaded] = loadImage(
  16,
  16,
  require("../../assets/present.png")
);

const thingsToLoad = [presentLoaded, snowLoaded];

const drawTile = (
  _type: CellType,
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  // console.log({ _type });

  if (_type === CellType.frozen) {
    context.drawImage(snow, 32, 0, 32, 32, x, y, width, height);
  } else if (_type === CellType.empty) {
    context.fillStyle = "black";
    context.fillRect(x, y, width, height);
  } else {
    context.drawImage(present, x, y, width, height);
  }
};

const getTilePosition = (index: number, width: number) => {
  const x = index % width;
  const y = Math.floor(index / width);
  return [x, y];
};

export const main = async () => {
  let width: number, height: number;

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const context = canvas.getContext("2d");

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;
  };

  await Promise.all(thingsToLoad);

  const render = (layout: Layout) => {
    context.fillStyle = "#333333";
    context.fillRect(0, 0, width, height);

    const minD = Math.min(width, height);
    const side = minD / (Math.min(layout.height, layout.width) + 2);

    for (let x = 0; x < width / side; x++) {
      for (let y = 0; y < height / side; y++) {
        drawTile(CellType.frozen, context, x * side, y * side, side, side);
      }
    }

    const tilesFitting = [width / side, height / side].map(Math.floor);

    context.save();
    context.translate(
      Math.round((tilesFitting[0] - layout.width) / 2) * side,
      Math.round((tilesFitting[1] - layout.height) / 2) * side
    );

    for (let index = 0; index < layout.cells.length; index++) {
      const cell = layout.cells[index];

      const [x, y] = getTilePosition(index, layout.width);

      drawTile(cell, context, x * side, y * side, side, side);
    }

    context.restore();
  };

  let base = {
    width: 3,
    height: 3,
    cells: [
      CellType.frozen,
      CellType.empty,
      CellType.frozen,
      CellType.empty,
      CellType.empty,
      CellType.empty,
      CellType.frozen,
      CellType.empty,
      CellType.frozen
    ]
  };

  const loop = () => {
    render(base);

    requestAnimationFrame(loop);
  };

  resize();
  loop();

  window.onresize = resize;

  const doTurn = (e: MouseEvent) => {
    const layout = base;
    const minD = Math.min(width, height);
    const side = minD / (Math.min(layout.height, layout.width) + 2);

    const tilesFitting = [width / side, height / side].map(Math.floor);

    const [x, y] = [
      e.clientX - Math.round((tilesFitting[0] - layout.width) / 2) * side,
      e.clientY - Math.round((tilesFitting[1] - layout.height) / 2) * side
    ];

    const [cx, cy] = [x / side, y / side].map(Math.floor);
    const mouseIndex = cy * layout.width + cx;
    const newLayout = {
      ...layout,
      cells: layout.cells.map((v, i) =>
        mouseIndex === i && v === CellType.empty ? CellType.full : v
      )
    };

    base = newLayout;
  };

  let mouseDown = false;

  canvas.addEventListener("mouseup", () => {
    mouseDown = false;
  });

  canvas.addEventListener("mousedown", e => {
    mouseDown = true;

    doTurn(e);
  });

  canvas.addEventListener("mousemove", e => {
    if (mouseDown) {
      doTurn(e);
    }
  });
};
