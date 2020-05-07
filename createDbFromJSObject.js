const { prisma } = require("./generated/prisma-client");
const motownData = require("./motownData.js");

const moment = require("moment");
const allowedDateFormats = ["DD-MMM-YY", "MMM-YY", "YYYY"];
require("dotenv").config({ path: ".env" });

async function main() {
  for (const song of motownData.motownData) {
    // console.log(song.title.title);
    const recordingsArray = [];
    song.artists.forEach((artist) => {
      if (artist.recordingInfo && artist.recordingInfo.completed) {
        let completed = moment(
          artist.recordingInfo.completed,
          allowedDateFormats
        ).toISOString();
        if (moment(completed).years() > 2020) {
          completed = moment(completed)
            .subtract(100, "years")
            .toISOString();
        }
        artist.recordingInfo.completed = completed;
      }
      recordingsArray.push(artist.recordingInfo);
    });

    const composers = song.title.composer ? song.title.composer.split("-") : [];
    let publishedDate = moment(
      song.title.publishedDate,
      allowedDateFormats
    ).toISOString();

    if (moment(publishedDate).year() > 2020) {
      publishedDate = moment(publishedDate)
        .subtract(100, "years")
        .toISOString();
    }

    const newSong = await prisma.createSong({
      title: song.title.title,
      publisher: song.title.publisher
        ? song.title.publisher.replace("published ", "")
        : "",
      publishedDate: moment(publishedDate).isValid() ? publishedDate : null,
      altTitle: song.title.altTitle || "",
      instrumental: song.title.instrumental ? true : false,
      fromFilm: song.title.fromFilm || "",
      tribute: song.title.tribute || "",
      recordings: {
        create: recordingsArray,
      },
    });
    console.log(`Song title: ${newSong.title}`);

    for (const composer of composers) {
      const theComposer = await upsertComposer(composer, newSong);
      console.log(theComposer);
    }

    const recordings = await prisma.song({ id: newSong.id }).recordings();

    for (const [i, artist] of song.artists.entries()) {
      const theArtist = await upsertArtists(artist, newSong, recordings, i);
      console.log(theArtist);

      for (const album of artist.albums) {
        const theAlbum = await upsertAlbums(
          album,
          newSong,
          theArtist,
          recordings,
          i
        );
        console.log(theAlbum);
      }
    }
  }
}

main().catch((e) => console.error(e));

async function upsertComposer(composer, song) {
  let newComposer = composer;
  if (composer.includes("? ")) {
    newComposer = composer.replace("? ", "");
  }
  const currentComposer = await prisma.upsertComposer({
    where: {
      name: newComposer,
    },
    update: {
      songs: { connect: { id: song.id } },
    },
    create: {
      name: newComposer,
      songs: { connect: { id: song.id } },
    },
  });
  return currentComposer;
}

async function upsertArtists(artist, newSong, recordings, index) {
  let newArtistName = artist.artistName;
  if (artist.artistName.charAt(0) === ">") {
    newArtistName = artist.artistName.slice(1);
  }
  const currentArtist = await prisma.upsertArtist({
    where: {
      name: newArtistName,
    },
    update: {
      songs: { connect: { id: newSong.id } },
      recordings: { connect: { id: recordings[index].id || null } },
    },
    create: {
      name: newArtistName,
      songs: { connect: { id: newSong.id } },
      recordings: { connect: { id: recordings[index].id || null } },
    },
  });
  return currentArtist;
}

async function upsertAlbums(album, newSong, currentArtist, recordings, index) {
  console.log(recordings);
  console.log(index);
  let releaseDate = moment(album.releaseDate, allowedDateFormats).toISOString();

  if (moment(releaseDate).year() > 2020) {
    console.log("yep");
    releaseDate = moment(releaseDate)
      .subtract(100, "years")
      .toISOString();
  }

  let theTitle;
  if (!album.albumTitle) {
    if (album.format && album.format.includes("45")) {
      theTitle = `${newSong.title} (single)`;
    } else if (album.info.includes("45")) {
      theTitle = `${newSong.title} (single)`;
    }
  } else theTitle = album.albumTitle;

  let isSingle;
  if (album.format && album.format.includes("45")) {
    isSingle = true;
  } else if (album.info.includes("45")) {
    isSingle = true;
  } else isSingle = false;

  const currentAlbum = await prisma.upsertAlbum({
    where: {
      info: album.info,
    },
    update: {
      songs: { connect: { id: newSong.id } },
      artists: { connect: { id: currentArtist.id } },
      recordings: { connect: { id: recordings[index].id || null } },
    },
    create: {
      title: theTitle,
      catalogNumber: album.catalogNumber,
      format: album.format || null,
      releaseDate: moment(releaseDate).isValid() ? releaseDate : null,
      // releaseDate: album.releaseDate || null,
      recordLabel: album.recordLabel || null,
      info: album.info,
      single: isSingle,
      songs: { connect: { id: newSong.id } },
      artists: { connect: { id: currentArtist.id } },
      recordings: { connect: { id: recordings[index].id || null } },
    },
  });
  return currentAlbum;
}
