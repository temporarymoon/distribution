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

const withContextSave = (
  context: CanvasRenderingContext2D,
  callback: () => void
) => {
  context.save();
  callback();
  context.restore();
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

const random = (max: number) => Math.floor(Math.random() * max);

const completedLayout = (layout: Layout) =>
  layout.cells.reduce((prev, curr) => prev && curr !== CellType.empty, true);

const generateLayout = (probability = 3): Layout => {
  // generate new layout
  const [w, h] = [3 + random(6), 2 + random(7)];
  const result = {
    width: w,
    height: h,
    cells: Array(w * h)
      .fill(1)
      .map(() => {
        const v = random(10);

        return v <= probability ? CellType.empty : CellType.frozen;
      })
  };

  if (completedLayout(result)) {
    return generateLayout(probability + 1);
  }

  return result;
};

const wait = (amount: number) =>
  new Promise(resolve => setTimeout(resolve, amount));

const drawTile = (
  _type: CellType,
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) => {
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
  let score = 0;
  let width: number, height: number;
  let running = true;
  const initialTime = 100;
  let time = initialTime;
  let maxTime = time;

  const heal = (amount: number) => {
    time += amount;
    if (time > maxTime) {
      maxTime = time;
    } else if (time < 5) {
      time = 5;
    }
  };

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const context = canvas.getContext("2d");

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;
  };

  await Promise.all(thingsToLoad);

  const renderLayout = (layout: Layout) => {
    context.fillStyle = "#333333";
    context.fillRect(0, 0, width, height);

    const minD = Math.min(width, height);
    const side = minD / (Math.max(layout.height, layout.width) + 2);

    for (let x = 0; x < width / side; x++) {
      for (let y = 0; y < height / side; y++) {
        drawTile(CellType.frozen, context, x * side, y * side, side, side);
      }
    }

    const tilesFitting = [width / side, height / side].map(Math.floor);

    withContextSave(context, () => {
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
    });
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

  const resolveState = async () => {
    const lost = time <= 5;
    const won = completedLayout(base) && !lost;

    if (lost) {
      const originals: string[] = [];

      for (const element of Array.from(document.querySelectorAll(".end"))) {
        originals.push(element.className);
        element.className += " visible";
      }

      mouseDown = false;
      running = false;
      canvas.className = "full lost";
      document.getElementById("end-score").textContent = String(score);
      const button = document.getElementById("play-again");

      button.onclick = async () => {
        canvas.className = "full";
        const elements = Array.from(document.querySelectorAll(".end"));
        for (let i = 0; i < elements.length; i++) {
          elements[i].className += originals[i];
        }

        base = generateLayout();

        for (let i = 0; i < 100; i++) {
          time += (initialTime - time) / 10;
          maxTime = time;
          await wait(1);
        }

        running = true;

        time = initialTime;
        maxTime = time;
        score = 0;

        button.onclick = null;
      };
    } else if (won) {
      const points = base.cells.reduce((a, b) => a + b, 0);
      score += points;
      mouseDown = false;
      base = generateLayout();
      time += points * 3.1;

      // transition
      const original = canvas.className;
      canvas.className += " won";
      running = false;
      await wait(500);
      canvas.className = original;
      await wait(500);
      running = true;
      last = performance.now();
    }
  };

  const renderTime = () => {
    withContextSave(context, () => {
      const barLength = (0.8 * width * time) / maxTime;
      context.translate(0.1 * width, 20);
      context.fillStyle = "red";
      context.fillRect(0, 0, barLength, 40);
    });
  };

  let last = performance.now();
  let timeCoefficient = 0.01;

  const loop = async () => {
    const now = performance.now();
    const delta = now - last;

    heal(-delta * timeCoefficient);

    if (running) {
      renderLayout(base);

      await resolveState();
    }

    renderTime();

    last = now;

    requestAnimationFrame(loop);
  };

  resize();
  loop();

  window.onresize = resize;

  const doTurn = (e: MouseEvent) => {
    if (!running) {
      return;
    }

    const layout = base;
    const minD = Math.min(width, height);
    const side = minD / (Math.max(layout.height, layout.width) + 2);

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
