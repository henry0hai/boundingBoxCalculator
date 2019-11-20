# Bounding Box Calculator

## Prerequirement

- Node: >= v10.13.0
- npm: >= 6.10.2
- yarn: >= 1.19.1

## Install missing package

```sh
yarn
```

## Run with input lat, lon, and zoom

```sh
node . 25.552 53.723 7
```

### Result

```txt
16:10:47 tileNumber:         : { xTile: 83, yTile: 54, zoom: 7 }
16:10:47 tileToBoundingBox:  : 53.438,24.527,56.250,27.059
16:10:47 temp:               : { west: 53.4375,
  south: 24.527134822597795,
  east: 56.25,
  north: 27.05912578437406 }
```
