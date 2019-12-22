import { Engine, Render, Runner, Events, World, Bodies, Body } from "matter-js";
import { planet, house } from "./assets";

export const main = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  // create engine
  const engine = Engine.create();
  const { world } = engine;

  const zoom = 1;

  // create renderer
  const renderer = Render.create({
    element: document.body,
    engine,
    options: {
      width,
      height,
      wireframes: false,
      background: "black"
    },
    bounds: {
      min: { x: 0, y: 0 },
      max: { x: width * zoom, y: height * zoom }
    },
    canvas
  });

  Render.run(renderer);

  // create runner
  const runner = Runner.create();
  Runner.run(runner, engine);

  // remove gravity
  engine.world.gravity.y = 0;

  const planetRadius = 1000;
  const planetSpeed = 0.003;
  // planet
  const planetBody = Bodies.circle(
    width / 2,
    height / 2 + planetRadius,
    planetRadius,
    {
      render: {
        sprite: planet(planetRadius * 2 + 495)
      },
      mass: Infinity,
      label: "planet",
      restitution: 0
    }
  );

  World.add(world, planetBody);

  const spawnHouse = () => {
    const size = 2;

    const _width = 100;
    const _height = 150;

    const houseBody = Bodies.rectangle(width / 2, 400, _width, _height, {
      render: {
        sprite: house(_width, _height)
      },
      mass: 1000,
      label: "house",
      frictionAir: 0
    });

    World.add(world, houseBody);
  };

  const spawnPizza = () => {
    const ship = Bodies.rectangle(width / 2, 200, 70, 10, {
      render: {
        fillStyle: "white"
      },
      frictionAir: 0
    });

    ship.force.x += 0.002;

    // test box
    World.add(world, ship);
  };

  const houseSpacing = 0.7;
  let lastHouse = houseSpacing;

  Events.on(engine, "afterUpdate", () => {
    for (const body of world.bodies) {
      if (body !== planetBody) {
        const Dx = planetBody.position.x - body.position.x;
        const Dy = planetBody.position.y - body.position.y;
        const force = body.label === "house" ? 1 : 0.0002;
        const angle = Math.atan2(Dy, Dx);
        body.force.x += force * Math.cos(angle);
        body.force.y += force * Math.sin(angle);
      }

      if (
        body.label === "house" &&
        body.position.y > height / 2 + planetRadius * 2 - 50
      ) {
        World.remove(world, body);
      }
    }

    Body.setAngularVelocity(planetBody, planetSpeed);
    Body.setPosition(planetBody, {
      x: width / 2,
      y: height / 2 + planetRadius
    });

    lastHouse++;

    if (lastHouse >= houseSpacing / planetSpeed) {
      lastHouse = 0;
      spawnHouse();
    }
  });

  canvas.addEventListener("click", spawnPizza);
};
