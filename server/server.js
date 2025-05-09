// Run this script to launch the server.
// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.
const express = require('express');
const cors = require('cors');
const app = express();
const bcrypt = require("bcrypt")
const UserModel = require("./models/users");
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(cors({origin: "http://localhost:3000", credentials:true}));
app.use(express.json());

let mongoose = require('mongoose');
let mongoDB = "mongodb://127.0.0.1:27017/phreddit";
mongoose.connect(mongoDB);
let db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('connected', function() {
  console.log('Connected to database');
});

app.use(express.urlencoded({ extended: false }));

const tenMinutes = 1000 * 1000;

app.use(
  session({
    secret: "treesfloorcat2020shakespeareuniverseoctagon",
    cookie: {httpOnly: true, maxAge: tenMinutes},
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/sessions'})
  })
);

const CommunitiesModel = require("./models/communities.js");
const PostsModel = require("./models/posts.js");
const CommentsModel = require("./models/comments.js");
const LinkFlairsModel = require("./models/linkflairs.js");

app.get("/communities", async function (req, res) {
    console.log("GET /communities");
    // Obtain list of all communities
    let communities = await CommunitiesModel.find({}).exec();
    res.send(communities);
});

app.get("/all-post-cards", async function (req, res) {
  console.log("GET /all-post-cards");
  // Obtain list of all communities and their posts
  let communities = await CommunitiesModel.find({}).populate("postIDs").exec();
  await Promise.all(
    communities.map(async (community) => {
      if (community.postIDs && community.postIDs.length > 0){
        await Promise.all(
            community.postIDs.map(async (post) => {
              if (post.linkFlairID){
                post.linkFlairID = await LinkFlairsModel.findById(post.linkFlairID);
              }
              if (post.postedBy){
                post.postedBy = await UserModel.findById(post.postedBy);
              }
              if (post.commentIDs.length > 0) {
                post.commentIDs = await Promise.all(    
                  post.commentIDs.map(populateComments)
                )
              }
            })
        )
      }
    })
  );

  // Affix postedBy User object to map to only displayName, preventing access to hashedPasswords ands sensitive information
  communities = communities.map((community) => community.toObject());
  communities.forEach(community => community.postIDs.forEach(post => post.postedBy = post.postedBy.displayName))
  res.send(communities);
});

app.get("/:communityID/post/:postID", async function (req, res) {
  const { communityID, postID } = req.params;

  try {
    console.log("Looking for community:", communityID);
    const community = await CommunitiesModel.findById(communityID);
    if (!community) {
      console.error("Community not found");
      return res.status(404).send("Community not found");
    }

    console.log("Looking for post:", postID);
    var post = await PostsModel.findById(postID);
    if (!post) {
      console.error("Post not found");
      return res.status(404).send("Post not found");
    }

    post.views += 1;
    await post.save();

    if (post.linkFlairID){
      post.linkFlairID = await LinkFlairsModel.findById(post.linkFlairID);
    }

    if (post.postedBy){
      post.postedBy = await UserModel.findById(post.postedBy);
    }

    if (post.commentIDs.length > 0) {
      post.commentIDs = await Promise.all(    
        post.commentIDs.map(populateComments)
      )
    }

    post = post.toObject()
    console.log(post)

    post.postedBy = post.postedBy.displayName
    res.json({ post: post, commName: community.name});

  } catch (err) {
    console.error("ERROR in /post-page route:", err);
    res.status(500).send("Server error retrieving post");
  }
});

app.get("/linkflairs", async function (req, res) {
  console.log("GET /linkflairs");
  try {
    const flairs = await LinkFlairsModel.find({}).exec();
    res.send(flairs);
  } catch (err) {
    console.error("Error fetching link flairs:", err);
    res.status(500).send("Failed to fetch link flairs");
  }
});


app.post("/new-linkflair", async function (req, res) {
  console.log("POST /new-linkflair");
  try {
    const newFlair = new LinkFlairsModel(req.body);
    await newFlair.save();
    res.status(201).send(newFlair);
  } catch (err) {
    console.error("Error creating link flair:", err);
    res.status(500).send("Failed to create link flair");
  }
});

async function populateComments(commentID) {
  let comment = await CommentsModel.findById(commentID);
  if (comment.commentIDs.length > 0)
    comment.commentIDs = await Promise.all(comment.commentIDs.map(populateComments));
  return comment;
}

app.post("/new-community", async function (req, res) {
  console.log("POST /new-community");
  try{
    const newComm = new CommunitiesModel(req.body);
    await newComm.save();
    res.status(201).send(newComm);
  }catch (err){
    console.error("Error creating community:", err);
    res.status(500).send("Failed to create community");
  }
})

app.post("/communities/:communityID/new-post", async function (req, res) {
  console.log(`POST /communities/${req.params.communityID}/new-post`);
  try {
    const newPost = new PostsModel(req.body);
    await newPost.save();
    await CommunitiesModel.updateOne({ _id: req.params.communityID }, {$push: { postIDs: newPost._id }});
    res.status(201).send(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).send("Failed to create post");
  }
})

app.get("/communities/:communityID", async function (req, res) {
  const { communityID } = req.params;

  // Prevent CastError by validating ObjectId
  if (!mongoose.Types.ObjectId.isValid(communityID)) {
    return res.status(400).send("Invalid community ID.");
  }

  console.log("GET /communities/" + communityID);
  try {
    const communityDoc = await CommunitiesModel.findById(communityID);
    if (!communityDoc) {
      return res.status(404).send("Community not found");
    }

    const community = communityDoc.toObject();
    community.memberCount = community.members.length;

    res.json(community);
  } catch (err) {
    console.error("Error fetching community:", err);
    res.status(500).send("Failed to fetch community");
  }
});

app.get("/posts/:postID", async function (req, res) {
  console.log("GET /posts/" + req.params.postID);
  try {
    const post = await PostsModel.findById(req.params.postID);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    post.commentIDs = await Promise.all(    
      post.commentIDs.map(populateComments)
    )
    res.json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).send("Failed to fetch post");
  }
});

app.get("/comments/:commentID", async function (req, res) {
  console.log("GET /comments/" + req.params.commentID);
  try {
    const comment = await CommentsModel.findById(req.params.commentID);
    if (!comment) {
      return res.status(404).send("Comment not found");
    }
    res.send(comment);
  } catch (err) {
    console.error("Error fetching comment:", err);
    res.status(500).send("Failed to fetch comment");
  }
});

app.post("/comment/:commentID/reply", async function (req, res) {
  console.log(`POST comment/${req.params.commentID}/reply`);
  try {
    const comment = await CommentsModel.findById(req.params.commentID);
    if (!comment) {
      return res.status(404).send("Comment not found");
    }
    const newComment = new CommentsModel(req.body);
    await newComment.save();
    comment.commentIDs.unshift(newComment._id);
    await comment.save()
    res.status(201).send(newComment);
  } catch (err) {
    console.error("Error creating comment reply:", err);
    res.status(500).send("Failed to create comment reply");
  }
})

app.post("/post/:postID/new-comment", async function (req, res) {
  console.log(`POST post/${req.params.postID}/new-comment`);
  try {
    const post = await PostsModel.findById(req.params.postID);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    const newComment = new CommentsModel(req.body);
    await newComment.save();
    post.commentIDs.unshift(newComment._id);
    await post.save()
    res.status(201).send(newComment);
  } catch (err) {
    console.error("Error creating new comment:", err);
    res.status(500).send("Failed to add new comment");
  }
})

const saltRounds = 10; 

app.post("/register", async function (req, res) {
  console.log("POST /register");
  const { firstName, lastName, email, displayName, password } = req.body;

  //basic checks
  if (!firstName || !lastName || !email || !password || !displayName) {
      return res.status(400).json({ error: "Required fields missing." });
  }

  //password must not contain personal info
  const lowerPassword = password.toLowerCase();
  const forbiddenTerms = [firstName, lastName, displayName, email].filter(Boolean);

  if (forbiddenTerms.some(term => lowerPassword.includes(term.toLowerCase()))) {
      return res.status(400).json({ error: "Password contains personal info." });
  }

  try {
      const existingEmail = await UserModel.findOne({ email });
      if (existingEmail) {
          return res.status(400).json({ error: "Email already in use." });
      }

      const existingDisplay = await UserModel.findOne({ displayName });
      if (existingDisplay) {
          return res.status(400).json({ error: "Display name already in use." });
      }
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new UserModel({
          firstName,
          lastName,
          email,
          displayName,
          passwordHash: hashedPassword
      });

      await newUser.save();
      res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
      console.error("Error in registration:", err);
      res.status(500).json({ error: "Server error during registration." });
  }
});

app.post("/login", async function (req, res) {
  console.log("POST /login");

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "No account found with that email." });
    }

    const verdict = await bcrypt.compare(password, user.passwordHash);
    if (!verdict) {
      return res.status(400).json({ error: "Incorrect password." });
    }

    req.session.user = user.displayName.trim();
      req.session.save(function (err) {
        if (err) {
            return next(err);
        }
        //exclude passwordHash from response
        const { passwordHash, ...safeUser } = user.toObject();
        res.status(200).json(safeUser);
    });


  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Server error during login." });
  }
});

app.get("/logout", async function (req, res) {
  console.log("GET /logout");
  req.session.destroy(err => {
      if (err) {
          res.status(500).json({ error: "Server error logging out." });
      }
  });
  console.log("done")
  res.status(200).send("Logout successful.")
})

app.get("/user-communities", async function (req, res) {
  console.log("GET /user-communities");
    console.log(req.session)

  if (req.session.user){
    try{
      const user = await UserModel.findOne({displayName : req.session.user}).populate("communities")
      res.status(200).json(user.communities)
    } catch(err){
      res.status(500).send("Server error returning user communities.")
    }
  }else{
    res.status(400).send("No valid session found.")
  }
})

const server = app.listen(8000, () => {console.log("Server listening on port 8000...");});

process.on('SIGINT', async () => {
  await server.close();
  await mongoose.disconnect();
  console.log("Server closed. Database instance disconnected.");
})

