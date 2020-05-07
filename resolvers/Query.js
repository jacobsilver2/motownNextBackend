const { forwardTo } = require("prisma-binding");

const Querys = {
  songs: forwardTo("db"),
  artists: forwardTo("db"),
  albums: forwardTo("db"),
  composers: forwardTo("db"),
  song: forwardTo("db"),
  artist: forwardTo("db"),
  album: forwardTo("db"),
  composer: forwardTo("db"),
  songsConnection: forwardTo("db"),
  albumsConnection: forwardTo("db"),
  artistsConnection: forwardTo("db"),
  composersConnection: forwardTo("db"),
  me(parent, args, ctx, info) {
    // check if there is a current user id
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info
    );
  },
};

module.exports = Querys;
