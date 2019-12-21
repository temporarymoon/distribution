import { Engine, Render, Runner, Events, World, Bodies, Body } from "matter-js";
import { planet } from "./assets";

export const main = () => {
  // create engine
  const engine = Engine.create();
  const { world } = engine;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const zoom = 1;

  // create renderer
  const renderer = Render.create({
    element: document.body,
    engine,
    options: {
      width,
      height,
      wireframes: false
    },
    bounds: {
      min: { x: 0, y: 0 },
      max: { x: width * zoom, y: height * zoom }
    }
  });

  Render.run(renderer);

  // create runner
  const runner = Runner.create();
  Runner.run(runner, engine);

  // remove gravity
  engine.world.gravity.y = 0;

  const planetRadius = 1000;
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
      restitution: 0.2
    }
  );

  World.add(world, planetBody);

  const ship = Bodies.rectangle(200, 200, 70, 10, {
    render: {
      fillStyle: "white"
    }
  });

  // test box
  World.add(world, ship);

  Events.on(engine, "afterUpdate", () => {
    const body2 = planetBody;

    for (const body1 of world.bodies) {
      if (body1 !== body2) {
        const Dx = body2.position.x - body1.position.x;
        const Dy = body2.position.y - body1.position.y;
        const force = 0.0002;
        const angle = Math.atan2(Dy, Dx);
        body1.force.x += force * Math.cos(angle);
        body1.force.y += force * Math.sin(angle);
      }
    }

    Body.setAngularVelocity(planetBody, 0.002);
  });
};
