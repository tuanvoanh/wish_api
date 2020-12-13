const syncDataService = require("../services/syncData");
const shopService = require("../services/shop");
const axios = require("axios");
const moment = require("moment");

const syncScheduleData = async () => {
  const listScheduleShop = await shopService.getScheduleShop();
  console.log("heheheh");
  const now = moment.utc().format("YYYY-MM-DDTHH:mm:ss");
  const since = moment.utc().subtract(12, "hours").format("YYYY-MM-DDTHH:mm:ss");
  console.log(`START ${listScheduleShop.length} SCHEDULE SYNC AT ${now} SINCE ${since}`);
  if (listScheduleShop && listScheduleShop.length) {
    // let chunkListShop = chunk(listScheduleShop, 5);
    let chunkListShop = splitArrayIntoChunksOfLen(listScheduleShop, 5);
    // console.log(chunkListShop)
    // let chunkListShop = [[1,2,3],[4,5,6],[7,8,9]]
    for (listShop of chunkListShop) {
      try {
        await Promise.all(
          listShop.map(async (theShop) => {
            try {
              await syncDataService.syncDateByDate(
                theShop.accessToken, since, theShop
              );
            } catch (error) {
              console.log("error: ", error);
            }
          })
        );
      } catch (error) {
        console.log("error: ", error);
      }
    }
    console.log("=== SYNCED ==== ");
    setTimeout(() => {
      syncScheduleData()
    }, 79000);
  }
};

// const chunk = (arr, size) => {
//   Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
//     arr.slice(i * size, i * size + size)
//   );
// };
function splitArrayIntoChunksOfLen(arr, len) {
  var chunks = [], i = 0, n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }
  return chunks;
}

module.exports = {
syncScheduleData
}
