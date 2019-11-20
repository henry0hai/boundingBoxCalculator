const moment = require('moment');

const padTitle = title => `${title}                       `.substr(0, 20);
const log = (title, ...args) =>
  console.log(
    `\x1b[2m${moment().format('HH:mm:ss')}\x1b[0m \x1b[32m${padTitle(
      title
    )}\x1b[0m:`,
    ...args
  );

const lat = process.argv[2]; // 25.552
const lon = process.argv[3]; // 53.723
const zoom = process.argv[4]; // 7

const getLat = () => {
  return +lat;
};
const getLon = () => {
  return +lon;
};
const getZoom = () => {
  return +zoom;
};

const run = () => {
  const tileNumber = getTileNumber(getLat(), getLon(), getZoom());
  const { xTile, yTile, zoom } = tileNumber;
  log('tileNumber: ', tileNumber);
  const boundingBox = tileToBoundingBox(xTile, yTile, zoom);
  log('boundingBox: ', boundingBox);
};

const getTileNumber = (lat, lon, zoom) => {
  const xTile = Math.floor(((lon + 180) / 360) * (1 << zoom));
  const yTile = Math.floor(
    ((1 -
      Math.log(Math.tan(toRadians(lat)) + 1 / Math.cos(toRadians(lat))) /
        Math.PI) /
      2) *
      (1 << zoom)
  );
  if (xTile < 0) xTile = 0;
  if (xTile >= 1 << zoom) xTile = (1 << zoom) - 1;
  if (yTile < 0) yTile = 0;
  if (yTile >= 1 << zoom) yTile = (1 << zoom) - 1;
  const result = '' + zoom + '/' + xTile + '/' + yTile;
  return { xTile, yTile, zoom };
};

const tileToBoundingBox = (xTile, yTile, zoom) => {
  const north = tileToLat(yTile, zoom);
  const south = tileToLat(yTile + 1, zoom);
  const west = tileToLon(xTile, zoom);
  const east = tileToLon(xTile + 1, zoom);
  const result = `${west.toFixed(3)},${south.toFixed(3)},${east.toFixed(
    3
  )},${north.toFixed(3)}`;
  log('tileToBoundingBox: ', result);
  return { west, south, east, north };
};

const tileToLon = (xTile, zoom) => {
  return (xTile / Math.pow(2.0, zoom)) * 360.0 - 180;
};

const tileToLat = (yTile, zoom) => {
  const n = Math.PI - (2.0 * Math.PI * yTile) / Math.pow(2.0, zoom);
  return toDegrees(Math.atan(Math.sinh(n)));
};

const toDegrees = radians => {
  const pi = Math.PI;
  return radians * (180 / pi);
};

const toRadians = value => {
  const pi = Math.PI;
  return (value * pi) / 180;
};

run();
