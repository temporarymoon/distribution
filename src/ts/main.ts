import {
  Engine,
  Render,
  Runner,
  Constraint,
  MouseConstraint,
  Mouse,
  World,
  Bodies
} from "matter-js";
import { planet } from "./assets";

export const main = () => {
  // create engine
  const engine = Engine.create();
  const { world } = engine;

  const width = window.innerWidth;
  const height = window.innerHeight;

  // create renderer
  const renderer = Render.create({
    element: document.body,
    engine,
    options: {
      width,
      height,
      wireframes: false
    }
  });

  Render.run(renderer);

  // create runner
  const runner = Runner.create();
  Runner.run(runner, engine);

  // remove gravity
  engine.world.gravity.y = 0;

  const planetRadius = 1000;

  World.add(world, [
    Bodies.circle(width / 2, height / 2 + planetRadius, planetRadius, {
      render: {
        sprite: planet(planetRadius * 2)
      },
      mass: 1000
    })
  ]);

  // fit the render viewport to the scene
  renderer.bounds = {
    min: { x: 0, y: 0 },
    max: { x: width, y: height }
  };
};
