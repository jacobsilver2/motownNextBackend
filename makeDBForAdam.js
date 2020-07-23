const { prisma } = require("./generated/prisma-client");
const motownData = require("./motownData.js");
const moment = require("moment");
const otcsv = require("objects-to-csv");
const allowedDateFormats = ["DD-MMM-YY", "MMM-YY", "YYYY"];
require("dotenv").config({ path: ".env" });

async function main() {
  const songsArr = [];
  for (const song of motownData.motownData) {
    // console.log(song.title.title);
    song.artists.forEach((artist) => {
      if (artist.albums) {
        // console.log(song.title.title);
        for (const album of artist.albums) {
          songsArr.push({
            title: song.title.title,
            artist: artist.artistName,
            album: album.albumTitle,
            "release date": album.releaseDate
              ? createDate(album.releaseDate)
              : "",
            "record label": album.recordLabel,
            "catalog #": album.catalogNumber,
            info: album.info,
            location: artist.recordingInfo.location,
            producer: artist.recordingInfo.producer,
            composer: song.title.composer,
            "completed date": artist.recordingInfo.completed
              ? createDate(artist.recordingInfo.completed)
              : "",
            publisher: song.title.publisher,
            "published date": song.title.publishedDate
              ? createDate(song.title.publishedDate)
              : "",
            "Alt Title": song.title.altTitle,
          });
        }
      }
    });
  }
  return songsArr;
}

function createDate(theDate) {
  let newDate = moment(theDate, allowedDateFormats).toISOString();
  if (moment(newDate).year() > 2020) {
    newDate = moment(newDate)
      .subtract(100, "years")
      .toISOString();
  }
  return newDate;
}

main()
  .then((result) => {
    const transformed = new otcsv(result);
    return transformed.toDisk("output.csv");
  })
  .catch((e) => console.error(e));
