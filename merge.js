const Knex = require('knex');
const moment = require('moment');
const path = require('path');

const padTitle = title => `${title}                       `.substr(0, 20);
const log = (title, ...args) =>
  console.log(`\x1b[2m${moment().format('HH:mm:ss')}\x1b[0m \x1b[32m${padTitle(title)}\x1b[0m:`, ...args);

// node -> argv[0]
// x.js -> argv[1]
const patchFile = process.argv[2];
const destFile = process.argv[3];

log('patchFile', patchFile);
log('destFile', destFile);

const patchKnex = Knex({
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: patchFile,
  },
});

const destKnex = Knex({
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: destFile,
  },
});

const run = async () => {
  log('Query patch database');
  log('Patch file', patchFile);

  // TODO: incase patchFile is large, select with offset, limit
  const patchRows = await patchKnex.from('map').select('*');

  log('Map > Total rows', patchRows.length);
  log('Map > Sample row', patchRows[0]);

  let totalUpdate = 0;
  let totalInsert = 0;

  for (let i = 0; i < patchRows.length; i++) {
    const row = patchRows[i];
    const { tile_id, zoom_level, tile_column, tile_row, grid_id } = row;

    const queryRes = await patchKnex
      .from('images')
      .select('*')
      .where('tile_id', tile_id);

    const firstRes = queryRes[0];

    const newTileData = firstRes['tile_data'];

    const tileId = await destKnex('map')
      .where({ zoom_level, tile_column, tile_row })
      .select('tile_id')
      .first();

    if (tileId) {
      await destKnex('images')
        .where(tileId)
        .update({ tile_data: newTileData });
    } else {
      if (zoom_level >= 14) {
        await destKnex('map').insert({
          zoom_level,
          tile_column,
          tile_row,
          tile_id,
          grid_id,
        });

        try {
          await destKnex('images').insert({
            tile_id,
            tile_data: newTileData,
          });
        } catch (error) {
          console.log(error);
        }
      }
    }

    // if (!updateRes) {
    //   // @insertRes: [ 411194 ]
    //   const insertRawRes = await destKnex('images').insert({
    //     tile_id: newTileId,
    //     tile_data: newTileData,
    //   });
    //   log('insertRawRes', insertRawRes);
    // }

    tileId ? totalUpdate++ : totalInsert++;
    log('totalUpdate', totalUpdate);
    log('totalInsert', totalInsert);
  }

  // const updateResList = await Promise.all(
  //   queryRes.map(async row => {
  //     const { tile_id } = row;
  //     const queryRes = await patchKnex
  //       .from('images')
  //       .select('*')
  //       .where('tile_id', tile_id);

  //     const firstRes = queryRes[0];
  //     const { zoom_level, tile_column, tile_row } = row;

  //     const newTileId = `${zoom_level}/${tile_column}/${tile_row}`;
  //     const newTileData = firstRes['tile_data'];

  //     // @updateRes: 0
  //     const updateRes = await destKnex('images')
  //       .where({ tile_id: newTileId })
  //       .update({ tile_data: newTileData });

  //     log('updateRes', updateRes);

  //     let insertRes = 0;

  //     if (!updateRes) {
  //       // @insertRes: [ 411194 ]
  //       const insertRawRes = await destKnex('images').insert({
  //         tile_id: newTileId,
  //         tile_data: newTileData,
  //       });

  //       log('insertRawRes', insertRawRes);

  //       // Get insert id
  //       insertRes = insertRawRes[0];
  //     }

  //     return {
  //       newTileId,
  //       updateRes,
  //       insertRes,
  //     };
  //   }),
  // );

  const totalRows = totalUpdate + totalInsert;
  log('totalRows', totalRows);
  log('totalUpdate', totalUpdate);
  log('totalInsert', totalInsert);
};

// Grateful shutdown
const exitCb = () => {
  patchKnex.destroy();
  destKnex.destroy();
};

// Inspect
const inspect = async () => {
  const queryRes = await destKnex
    .from('map')
    .where({
      zoom_level: 5,
      tile_column: 24,
    })
    .select('*');

  log('queryRes', queryRes);
};

run()
  .then(exitCb)
  .catch(err => {
    log('run', 'ERR');
    log('run', err.message);
  })
  .finally(exitCb);
