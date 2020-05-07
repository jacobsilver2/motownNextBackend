const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Mutations = {
  async createSong(parent, args, ctx, info) {
    // TODO: Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const song = await ctx.db.mutation.createSong({ data: { ...args } }, info);
    return song;
  },
  updateSong(parent, args, ctx, info) {
    console.log(args);
    // take a copy of the updates
    const updates = { ...args };
    // remove the id from the updates, we don't want to update it
    delete updates.id;
    //run the update method
    return ctx.db.mutation.updateSong(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async deleteSong(parent, args, ctx, info) {
    const where = { id: args.id };
    //find the item
    const song = await ctx.db.query.song({ where }, `{ id, title }`);
    // check if they own the item, or have permissions
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    //todo
    // delete it
    return ctx.db.mutation.deleteSong({ where }, info);
  },
  async createArtist(parent, args, ctx, info) {
    // TODO: Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const artist = await ctx.db.mutation.createArtist(
      { data: { ...args } },
      info
    );
    return artist;
  },
  updateArtist(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const updates = { ...args };
    delete updates.id;
    return ctx.db.mutation.updateArtist(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async deleteArtist(parent, args, ctx, info) {
    const where = { id: args.id };
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const artist = await ctx.db.query.song({ where }, `{id, name}`);
    // check if they own the item of have permissions
    return ctx.db.mutation.deleteArtist({ where }, info);
  },

  async createAlbum(parent, args, ctx, info) {
    // TODO: Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const album = await ctx.db.mutation.createAlbum(
      { data: { ...args } },
      info
    );
    return album;
  },
  updateAlbum(parent, args, ctx, info) {
    // console.log(args);
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const updates = { ...args };
    delete updates.id;
    return ctx.db.mutation.updateAlbum(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async joinTwoSingles(parent, args, ctx, info) {
    // 1. Make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be logged in to do that");
    }
    // 2. Get the album you want to add songs to
    // const albumToAddSongsTo = await ctx.db.query.album({
    //   where: { id: args.albumOneId },
    // });
    // 3. Get the album you want to take songs from
    const albumOneSongs = await ctx.db.query.album(
      {
        where: { id: args.albumOneId },
      },
      `{id songs {id, title}}`
    );
    const albumTwoSongs = await ctx.db.query.album(
      {
        where: { id: args.albumTwoId },
      },
      `{id songs {id, title}}`
    );
    ctx.db.mutation.updateAlbum({
      where: { id: args.albumTwoId },
      data: { songs: { connect: { id: albumOneSongs.songs[0].id } } },
    });
    return ctx.db.mutation.updateAlbum({
      where: { id: args.albumOneId },
      data: { songs: { connect: { id: albumTwoSongs.songs[0].id } } },
    });
  },
  async turnSingleIntoAlbum(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const where = { id: args.id };
    const album = await ctx.db.query.album({ where }, `{id}`);
    return ctx.db.mutation.updateAlbum(
      { data: { single: false }, where: { id: args.id } },
      info
    );
  },
  async deleteAlbum(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const where = { id: args.id };
    const album = await ctx.db.query.album({ where }, `{id, title}`);
    // check if they own the item of have permissions
    return ctx.db.mutation.deleteAlbum({ where }, info);
  },

  async createComposer(parent, args, ctx, info) {
    // TODO: Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const composer = await ctx.db.mutation.createComposer(
      { data: { ...args } },
      info
    );
    return composer;
  },
  updateComposer(parent, args, ctx, info) {
    // console.log(args);
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const updates = { ...args };
    delete updates.id;
    return ctx.db.mutation.updateComposer(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async deleteComposer(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that");
    }
    const where = { id: args.id };
    const composer = await ctx.db.query.composer({ where }, `{id, name}`);
    // check if they own the item of have permissions
    return ctx.db.mutation.deleteComposer({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the db
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] },
        },
      },
      info
    );
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set the jwt as a cookie on the response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // return the user to the browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // 1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. Check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid Password!");
    }
    // 3. generate the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 5. Return the user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Goodbye!" };
  },
};

module.exports = Mutations;
