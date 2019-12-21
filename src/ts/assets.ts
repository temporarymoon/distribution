const scaledImage = (width: number, height: number, path: string) => (
  scaledWidth: number,
  scaledHeight: number
) => ({
  xScale: scaledWidth / width,
  yScale: scaledHeight / height,
  texture: path
});

const scaledPlanet = scaledImage(800, 800, require("../../assets/planet.png"));

export const planet = (radius: number) => scaledPlanet(radius, radius);
