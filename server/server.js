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
    cookie: {httpOnly: true, maxAge: tenMinutes, sameSite: 'lax', secure: false},
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/sessions'})
  })
);

const CommunitiesModel = require("./models/communities.js");
const PostsModel = require("./models/posts.js");
const CommentsModel = require("./models/comments.js");
const LinkFlairsModel = require("./models/linkflairs.js");
const comments = require('./models/comments.js');
const users = require('./models/users');

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
    const community = await CommunitiesModel.findById(communityID);
    if (!community) {
      console.error("Community not found");
      return res.status(404).send("Community not found");
    }

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

    if (post.commentIDs.length > 0) {
      post.commentIDs = post.commentIDs.map(truncateCommenter)
    }

    post.postedBy = post.postedBy.displayName
    res.json({ post: post, commName: community.name});

  } catch (err) {
    console.error("ERROR in /post-page route:", err);
    res.status(500).send("Server error retrieving post");
  }
});

function truncateCommenter(comment) {
  comment.commentedBy = comment.commentedBy.displayName;
  if (comment.commentIDs.length > 0)
    comment.commentIDs = comment.commentIDs.map(truncateCommenter);
  return comment;
}

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
  let comment = await CommentsModel.findById(commentID).populate('commentedBy')
  if (comment.commentIDs.length > 0)
    comment.commentIDs = await Promise.all(comment.commentIDs.map(populateComments));
  return comment;
}

app.post("/new-community", async function (req, res) {
  console.log("POST /new-community");

  if(!req.session.user){
    return res.status(401).json({error: "User not logged in.", welcomePage: true});
  }
  try {
    //check for unique community name
    const existing = await CommunitiesModel.findOne({ name: req.body.name });
    if (existing) {
      return res.status(409).json({ error: "Community name already exists." });
    }

    //get logged-in user
    const user = await UserModel.findOne({ displayName: req.session.user });
    if (!user) {
      return res.status(404).json({ error: "User not found.", welcomePage: true });
    }

    //create community
    const newComm = new CommunitiesModel({
      name: req.body.name,
      description: req.body.description,
      postIDs: [],
      members: [user._id],
      memberCount: 1,
      startDate: new Date(),
      createdBy: user._id
    });

    await newComm.save();

    //update user's community list
    user.communities.push(newComm._id);
    await user.save();

    res.status(201).send(newComm);
  } catch (err) {
    console.error("Error creating community:", err);
    res.status(500).send("Failed to create community");
  }
})

app.post("/communities/:communityID/new-post", async function (req, res) {
  console.log(`POST /communities/${req.params.communityID}/new-post`);

  //ensure user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: "User not logged in.", welcomePage: true });
  }

  try {
    //retrieve the community
    const community = await CommunitiesModel.findById(req.params.communityID);
    if (!community) {
      return res.status(404).json({ error: "Community not found." });
    }

    //get the user 
    const user = await UserModel.findOne({ displayName: req.session.user });
    if (!user) {
      return res.status(404).json({ error: "User not found.", welcomePage: true });
    }

    //pull required post fields from the request
    const { title, content, linkFlairID } = req.body;

    //input validation
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    //create the post using backend
    const newPost = new PostsModel({
      title,
      content,
      communityId: community._id,
      postedBy: user._id, //set from session
      linkFlairID: linkFlairID || null,
      createdAt: new Date(),
      views: 0,
      voteCount: 0,
      upvoters: [],
      downvoters: [],
      commentIDs: []
    });

    await newPost.save();

    //add post to the community
    await CommunitiesModel.updateOne(
      { _id: req.params.communityID },
      { $push: { postIDs: newPost._id } }
    );

    user.posts.push(newPost._id);
    await user.save();
    
    res.status(201).send(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).send({error: "Failed to create post", welcomePage: true});
  }
});

app.post("/communities/:communityID/join", async function (req, res) {
  console.log("POST /join")
  try {
    const { communityID } = req.params;
    const user = await UserModel.findOne({ displayName: req.session.user });
    const userID = user._id;
    await CommunitiesModel.findByIdAndUpdate(
      communityID,
      { $addToSet: { members: userID } } //prevents duplicates
    );

    user.communities.push(communityID);
    await user.save()

    res.sendStatus(200);
  } catch (err) {
    console.error("Error joining community:", err);
    res.status(500).send("Failed to join community");
  }
});

app.post("/communities/:communityID/leave", async function (req, res) {
  console.log("POST /join")
  try {
    const { communityID } = req.params;
    const user = await UserModel.findOne({ displayName: req.session.user });
    const userID = user._id;
    await CommunitiesModel.findByIdAndUpdate(
      communityID,
      { $pull: { members: userID } }
    );
    await UserModel.findByIdAndUpdate(
      userID,
      { $pull: { communities: communityID } }
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Error leaving community:", err);
    res.status(500).send("Failed to leave community");
  }
});

app.get("/search", async function (req, res) {
  try {
    //get and validate search query string
    const query = req.query.q;
    if (!query || query.trim() === "") {
      return res.status(400).send("Missing search query");
    }

    //remove common stop words
    const stopWords = ["is", "the", "a", "an", "of", "to", "and", "in", "on", "for", "at", "by", "with", "about", "as", "not", "this"];
    const searchTerms = query
      .toLowerCase()
      .split(" ")
      .filter(word => !stopWords.includes(word));

    //convert terms to case-insensitive regexes
    const regexes = searchTerms.map(term => new RegExp("\\b" + term + "\\b", "i"));

    //load all posts (with flair + community metadata)
    const allPosts = await PostsModel.find({})
      .populate("linkFlairID")
      .populate("communityId");

    const matches = [];

    //recursive helper function to fetch ALL nested comments
    async function getAllNestedComments(commentIDs) {
      const all = [];
      for (const id of commentIDs) {
        const comment = await CommentsModel.findById(id);
        if (comment) {
          all.push(comment); //include current comment
          if (comment.commentIDs && comment.commentIDs.length > 0) {
            //recursively get children
            const nested = await getAllNestedComments(comment.commentIDs);
            all.push(...nested);
          }
        }
      }
      return all;
    }
    //for each post, search in title, content, and all nested comments
    for (const post of allPosts) {
      const titleMatch = regexes.some(regex => regex.test(post.title));
      const contentMatch = regexes.some(regex => regex.test(post.content));
      console.log(titleMatch)
      console.log(contentMatch)

      //get all comments (recursively)
      const allComments = await getAllNestedComments(post.commentIDs || []);

      //search inside each comment’s content
      const commentMatch = allComments.some(comment =>
        regexes.some(regex => regex.test(comment.content))
      );

      //if match in title or content or any comment — include this post
      if (titleMatch || contentMatch || commentMatch) {
        const user = await UserModel.findById(post.postedBy)
        const postComments = await Promise.all( 
          post.commentIDs.map(populateComments)
        )
        JSONpost = post.toObject()
        JSONpost.commentIDs = postComments
        JSONpost.postedBy = user.displayName
        console.log(JSONpost.commentIDs)
        matches.push(JSONpost);
      }
    }
    //send matching posts back to frontend
    res.json(matches);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).send("Server error during search.");
  }
});

app.post("/vote/post/:postID", async (req, res) => {
  const { postID } = req.params;
  console.log(`POST /vote/post/${postID}`);
  const { voteType } = req.body;
  //voter has sufficient reputation
  const user = await UserModel.findOne({ displayName: req.session.user });
  if (!user || user.reputation < 50) {
    return res.status(403).send("Insufficient reputation to vote.");
  }
  //vote type
  if (!["upvote", "downvote", "no-vote"].includes(voteType)) {
    return res.status(400).send("Invalid vote type.");
  }

    //fetch post/comment to vote on
    const target = await PostsModel.findById(postID);
    if (!target) return res.status(404).send(`Post not found.`);
    //prevent duplicate votes 
    const hasUpvoted = target.upvoters?.some(id => id.equals(user._id));
    const hasDownvoted = target.downvoters?.some(id => id.equals(user._id));
        console.log(`voteType: ${voteType}`)
                  console.log(`${hasUpvoted} ${hasDownvoted}`)

    if (voteType !== "no-vote" && (hasUpvoted || hasDownvoted)) {
      return res.status(400).send("You have already voted.");
    }

    if (voteType === "no-vote" && !hasUpvoted && !hasDownvoted) {
      return res.status(400).send("You have no vote.");
    }

  try {
    const voteInfo = await handleVotes(postID, target, voteType, hasUpvoted, user)
    //return the updated vote count to the client
    res.status(200).json({ userVote: voteInfo[0], voteCount: voteInfo[1] });
  } catch (err) {
    console.error("Voting error:", err);
    res.status(500).send("Voting failed.");
  }
});

app.post("/vote/comment/:commentID", async (req, res) => {
  const { commentID } = req.params;
  console.log(`POST /vote/comment/${commentID}`);
  const { voteType } = req.body;
  //voter has sufficient reputation
  const user = await UserModel.findOne({ displayName: req.session.user });
  if (!user || user.reputation < 50) {
    return res.status(403).send("Insufficient reputation to vote.");
  }
  console.log(user)
  //vote type
  if (!["upvote", "downvote", "no-vote"].includes(voteType)) {
    return res.status(400).send("Invalid vote type.");
  }

    //fetch post/comment to vote on
    const target = await CommentsModel.findById(commentID);
    if (!target) return res.status(404).send(`Comment not found.`);
    console.log(target.upvoters)
    //prevent duplicate votes 
    const hasUpvoted = target.upvoters?.some(id => id.equals(user._id));
    const hasDownvoted = target.downvoters?.some(id => id.equals(user._id));
        console.log(`voteType: ${voteType}`)
          console.log(`${hasUpvoted} ${hasDownvoted}`)

    if (voteType !== "no-vote" && (hasUpvoted || hasDownvoted)) {
      return res.status(400).send("You have already voted.");
    }
    if (voteType === "no-vote" && !hasUpvoted && !hasDownvoted) {
      return res.status(400).send("You have no vote.");
    }

  try {
    const voteInfo = await handleVotes(commentID, target, voteType, hasUpvoted, user, CommentsModel)
    //return the updated vote count to the client
    res.status(200).json({ userVote: voteInfo[0], voteCount: voteInfo[1] });
  } catch (err) {
    console.error("Voting error:", err);
    res.status(500).send("Voting failed.");
  }
});

async function handleVotes(id, target, voteType, hasUpvoted, user, model=PostsModel){
    var userVote;
    var noneVote = false
    //add voter to the appropriate list
    if (voteType === "upvote") {
      console.log("add upvote")
      userVote = "upvote"
      target.upvoters.push(user._id);
      //recalculate total vote count (upvotes - downvotes)
      target.voteCount = (target.upvoters.length) - (target.downvoters.length);
      await target.save();
    } else if (voteType === "downvote") {
      console.log("add downvote")
      userVote = "downvote"
      target.downvoters.push(user._id);
      //recalculate total vote count (upvotes - downvotes)
      target.voteCount = (target.upvoters.length) - (target.downvoters.length);
      await target.save();
    } else if (hasUpvoted) {
      userVote = "no-vote"
      console.log("remove upvote")
      noneVote = true
      target.voteCount = (target.upvoters.length) - (target.downvoters.length) - 1
      await model.findByIdAndUpdate(
        id,
        {  
          $set : {voteCount : (target.upvoters.length) - (target.downvoters.length) - 1},
          $pull: {upvoters: user._id} 
        }
      )
    } else {
      userVote = "no-vote"
      console.log("remove downvote")
      noneVote = true
      target.voteCount = (target.upvoters.length) - (target.downvoters.length) + 1
      await model.findByIdAndUpdate(
        id,
        {  
          $set : {voteCount : (target.upvoters.length) - (target.downvoters.length) + 1},
          $pull: {downvoters: user._id} 
        }
      )
    }

    //update the author's reputation 
    const author = await UserModel.findById(model === PostsModel ? target.postedBy : target.commentedBy);
    if (!noneVote && author) {
      const repChange = voteType === "upvote" ? 5 : -10;
      author.reputation += repChange;
      await author.save();
    } else {
      const repChange = hasUpvoted ? -5 : 10;
      author.reputation += repChange;
      await author.save();
    }

    return [userVote, target.voteCount]
}

app.get("/communities/:communityID", async function (req, res) {
  const { communityID } = req.params;

  //prevent CastError by validating ObjectId
  if (!mongoose.Types.ObjectId.isValid(communityID)) {
    return res.status(400).send("Invalid community ID.");
  }

  console.log("GET /communities/" + communityID);
  try {
    const communityDoc = await CommunitiesModel.findById(communityID).populate("createdBy", "displayName");
    if (!communityDoc) {
      return res.status(404).send("Community not found");
    }

    const community = communityDoc.toObject();
    community.memberCount = community.members.length;

    //add creator name from user object
    community.creatorName = communityDoc.createdBy.displayName;


    res.json(community);
  } catch (err) {
    console.error("Error fetching community:", err);
    res.status(500).send("Failed to fetch community");
  }
});

app.get("/posts/:postID", async function (req, res) {
  console.log("GET /posts/" + req.params.postID);
  console.log("Fetching post with ID:", req.params.postID);
  try {
    const post = await PostsModel.findById(req.params.postID).populate('postedBy');
    if (!post) {
      return res.status(404).send("Post not found");
    }
    post.commentIDs = await Promise.all(    
      post.commentIDs.map(populateComments)
    )
    const jsonPost = post.toObject();
    jsonPost.postedBy = post.postedBy.displayName
    res.json(jsonPost);
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
    res.send({comment});
  } catch (err) {
    console.error("Error fetching comment:", err);
    res.status(500).send("Failed to fetch comment");
  }
});

app.post("/comment/:communityID/:postID/:commentID/reply", async function (req, res) {
  console.log(`POST comment/${req.params.commentID}/reply`);
  try {
    const comment = await CommentsModel.findById(req.params.commentID);
    if (!req.session.user) {
      return res.status(401).send("User not logged in");
    }
    const user = await UserModel.findOne({ displayName: req.session.user });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const community = await CommunitiesModel.findById(req.params.communityID);
    if (!community) {
      return res.status(404).send("Community not found");
    }
    const post = await PostsModel.findById(req.params.postID);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    if (!comment) {
      return res.status(404).send("Comment not found");
    }
    
    
    const newComment = new CommentsModel({
      content: req.body.content,
      commentedBy: user._id,
      commentedDate: new Date(),
      commentIDs: [],
      community: community._id,
      post: post._id,
      parentComment: comment._id
    });
    
    user.comments.push(newComment._id);
    await user.save();
    await newComment.save();
    comment.commentIDs.unshift(newComment._id);
    await comment.save()
    res.status(201).send(newComment);
  } catch (err) {
    console.error("Error creating comment reply:", err);
    res.status(500).send("Failed to create comment reply");
  }
})

app.post("/post/:communityID/:postID/new-comment", async function (req, res) {
  console.log(`POST post/${req.params.postID}/new-comment`);
  try {
    if (!req.session.user) {
      return res.status(401).send("User not logged in");
    }
    const user = await UserModel.findOne({ displayName: req.session.user });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const community = await CommunitiesModel.findById(req.params.communityID);
    if (!community) {
      return res.status(404).send("Community not found");
    }
    const post = await PostsModel.findById(req.params.postID);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    const newComment = new CommentsModel({
      content: req.body.content,
      commentedBy: user._id,
      commentedDate: new Date(),
      commentIDs: [],
      community: community._id,
      post: post._id
    });
    await newComment.save();
    post.commentIDs.unshift(newComment._id);
    await post.save()
    user.comments.push(newComment._id);
    await user.save();
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

app.get("/user-data", async function (req, res) {
  console.log("POST /user-data");

  if (!req.session.user){
    res.status(400).json({ error: "No account associated with request." });
    return
  }

  try {
    const user = await UserModel.findOne({ displayName: req.session.user });

    if (!user) {
      return res.status(400).json({ error: "No account found with that user." });
    }
    //exclude passwordHash from response
    const { passwordHash, ...safeUser } = user.toObject();
    res.status(200).json(safeUser);

  } catch (err) {
    console.error("Error retrieving user data:", err);
    res.status(500).json({ error: "Server error during user data retrieval." });
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
    res.status(400).send("User not logged in.")
  }
})

app.get("/user/profile", async function (req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in." });
  }

  try {
    const user = await UserModel.findOne({ displayName: req.session.user });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const { _id, displayName, email, dateJoined, reputation, role } = user;
    res.status(200).json({ _id, displayName, email, dateJoined, reputation, role });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).send("Failed to fetch user profile");
  }
});

app.get("/user/posts", async function (req, res) {
  console.log("GET user/posts")
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in.", welcomePage: true  });
  }

  try {
    const user = await UserModel.findOne({ displayName: req.session.user }).populate('posts');
    res.status(200).json(user.posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).send({error: "Failed to fetch user posts"});
  }
});

app.get("/user/comments", async function (req, res) {
    console.log("GET user/comments")
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in." , welcomePage: true });
  }

  try {
    const user = await UserModel.findOne({ displayName: req.session.user }).populate('comments');
    const comments = user.comments;
    console.log(comments)
    //find the post title for each top-level comment
    const commentPostPairs = [];

    for (const comment of comments) {
      const post = await PostsModel.findById(comment.post)

      //include comments that belong to a known post
      commentPostPairs.push({
        _id: comment._id,
        content: comment.content,
        postTitle: post.title
      });
    }

    res.status(200).json(commentPostPairs);
  } catch (err) {
    console.error("Error fetching user comments:", err);
    res.status(500).send({error: "Failed to fetch user comments", welcomePage: true });
  }
});

app.get("/user/communities", async function (req, res) {
  console.log("GET user/communities")
  if (!req.session.user) {
    console.log("NO SESSION FOUND");
    console.log("Full session object:", req.session);
    return res.status(401).json({ error: "Not logged in.", welcomePage: true  });
  }

  try {
    const user = await UserModel.findOne({ displayName: req.session.user });
    const communities = await CommunitiesModel.find({ createdBy: user._id }, "_id name");
    res.status(200).json(communities);
  } catch (err) {
    console.error("Error fetching user communities:", err);
    res.status(500).send({error: "Failed to fetch user communities", welcomePage: true });
  }
});

app.get("/admin/users/:user/posts", async function (req, res) {
  console.log("GET /admin/users/:user/posts")
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in.", welcomePage: true  });
  }
  const user = await UserModel.findOne({ displayName: req.session.user });
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only.", welcomePage: true });
  }
  try {
    const reqUser = await UserModel.findById(req.params.user).populate('posts');
    res.status(200).json(reqUser.posts);
  } catch (err) {
    console.error("Error fetching requested user's posts:", err);
    res.status(500).send({error: "Failed to fetch requested user's posts", welcomePage: true });
  }
});

app.get("/admin/users/:user/communities", async function (req, res) {
  console.log("GET /admin/users/:user/communities")
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in.", welcomePage: true  });
  }
  const user = await UserModel.findOne({ displayName: req.session.user });
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only.", welcomePage: true });
  }
  try {
    const reqUser = await UserModel.findById(req.params.user).populate('communities');
    const communities = await CommunitiesModel.find({createdBy: reqUser._id})
    res.status(200).json(communities);
  } catch (err) {
    console.error("Error fetching requested user's communities:", err);
    res.status(500).send({error: "Failed to fetch requested user's communities", welcomePage: true });
  }
});

app.get("/admin/users/:user/comments", async function (req, res) {
  console.log("GET /admin/users/:user/comments")
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in.", welcomePage: true  });
  }
  const user = await UserModel.findOne({ displayName: req.session.user });
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only.", welcomePage: true });
  }
  try {
    const reqUser = await UserModel.findById(req.params.user).populate('comments');
    console.log(reqUser.comments)
    res.status(200).json(reqUser.comments);
  } catch (err) {
    console.error("Error fetching requested user's comments:", err);
    res.status(500).send({error: "Failed to fetch requested user's comments", welcomePage: true });
  }
});

app.put("/update-post/:id", async function (req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in." });
  }

  try {
    const post = await PostsModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    const user = await UserModel.findOne({ displayName: req.session.user });
    if (!user || !post.postedBy.equals(user._id)) {
      return res.status(403).json({ error: "Unauthorized to edit this post." });
    }

    const { title, content, linkFlairID } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    post.title = title;
    post.content = content;
    post.linkFlairID = linkFlairID || null;

    await post.save();
    res.status(200).send("Post updated successfully");
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).send("Failed to update post");
  }
});

app.delete("/delete-post/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authorized" });
  }

  try {
    const post = await PostsModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    await UserModel.updateOne({_id: post.postedBy},{$pull:{posts: post._id}})


    const community = await CommunitiesModel.findById(post.communityId);
    community.postIDs = community.postIDs.filter(pID => pID !== post._id)

    post.commentIDs.forEach(commentID => deleteComments(commentID))
    

    const deleted = await PostsModel.findByIdAndDelete(req.params.id);
    console.log(deleted)
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

app.put("/update-community/:id", async function (req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in.", welcomePage:true });
  }

  try {
    const community = await CommunitiesModel.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: "Community not found.", welcomePage:true });
    }

    const user = await UserModel.findOne({ displayName: req.session.user });
    if (!user || !community.createdBy.equals(user._id)) {
      return res.status(403).json({ error: "Unauthorized to edit this community.", welcomePage:true });
    }

    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required." });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: "Name cannot exceed 100 characters" });
    }

    community.name = name;
    community.description = description;

    await community.save();
    res.status(200).json({ message: "Community updated successfully" });
  } catch (err) {
    console.error("Error updating community:", err);
    res.status(500).send("Failed to update community");
  }
});

async function deleteComments(commentID, commenter=null, checkParent=false) {
  let comment = await CommentsModel.findById(commentID)
  if (comment.commentIDs.length > 0)
    comment.commentIDs = await Promise.all(comment.commentIDs.map(cID => deleteComments(cID, null)));
  if (!commenter){
    console.log("---------------------------")
    console.log(commentID)
    console.log(comment)
    commenter = await UserModel.findById(comment.commentedBy);
    if (commenter){
      await UserModel.updateOne({_id: comment.commentedBy}, {$pull:{comments: commentID}})
    }
  }
  await CommentsModel.findByIdAndDelete(comment._id)
  return comment;
}

app.delete("/delete-community/:id", async function (req, res) {
  try {
    const community = await CommunitiesModel.findById(req.params.id);
    const creator = await UserModel.findById(community.createdBy);
    
    creator.communities = creator.communities.filter(c => c !== community._id);
    await creator.save()
    community.postIDs.forEach(async (pID) =>{
      console.log("deleting post")
      const post = await PostsModel.findById(pID);
      post.commentIDs.forEach(commentID => deleteComments(commentID))

      await UserModel.updateOne({_id: post.postedBy}, {$pull:{posts: pID}})
      await PostsModel.findByIdAndDelete(post._id)
    })

    community.members.forEach(async (memID) =>{
      await UserModel.updateOne({_id: memID},{$pull:{communities: community._id}})
    })


    const deleted = await CommunitiesModel.findByIdAndDelete(community._id);
    if (!deleted) {
      return res.status(404).send("Community not found");
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error deleting community:", err);
    res.status(500).send("Failed to delete community");
  }
});

app.put("/update-comment/:id", async function (req, res) {
    console.log("PUT update comment")
  try{
    if (!req.session.user) return res.status(401).send("Not authorized");
    const comment = await CommentsModel.findById(req.params.id);
    if (!comment) return res.status(404).send("Comment not found");

    comment.content = req.body.content;
    await comment.save();
    res.sendStatus(200);
  }catch(err){
    res.status(500).send("Server error")
  }
});

async function deleteCommentAndReplies(commentId) {
  const comment = await CommentsModel.findById(commentId);
  if (comment.commentIDs.length > 0) {
    for (const childId of comment.commentIDs) {
      deleteCommentAndReplies(childId);
    }
  }
  await UserModel.updateOne({_id: comment.commentedBy}, {$pull: {comments: comment._id}});
  await CommentsModel.findByIdAndDelete(commentId);
}

app.delete("/delete-comment/:id", async (req, res) => {
  console.log("delete comment")
  try{
    if (!req.session.user) return res.status(401).send("Not authorized");
    const comment = await CommentsModel.findById(req.params.id);
    if (comment.parentComment === null){
      await PostsModel.updateOne({_id: comment.post},{$pull: {commentIDs: comment._id}});
    }else{
     await CommentsModel.updateOne({_id: comment.parentComment},{$pull: {commentIDs: comment._id}});
    }
    await UserModel.updateOne({_id: comment.commentedBy}, {$pull:{comments: comment._id}})

    await deleteCommentAndReplies(req.params.id);
    res.sendStatus(200);
  }catch (err){
    console.log(err)
    res.status(500).send("Internal server error")
  }
});


//get all users
app.delete("/admin/users/delete/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in.", welcomePage: true });
  }

  const currentUser = await UserModel.findOne({ displayName: req.session.user });
  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "Admin access only.", welcomePage: true });
  }
  try {
      async function removePosts (pID, poster=null) {
        const post = await PostsModel.findById(pID);
        post.commentIDs.forEach(commentID => deleteComments(commentID))
        if (!poster){
          poster = await UserModel.findById(post.postedBy);
          await UserModel.updateOne({_id: post.postedBy}, {$pull:{posts: pID}})
        }else{
          await UserModel.updateOne({_id: post.postedBy}, {$pull:{posts: pID}})
        }
        await PostsModel.findByIdAndDelete(post._id)
      }

    const user = await UserModel.findById(req.params.id);
    console.log(user)
    console.log("------------")

    user.comments.forEach(async (commentID) => {
      const comment = await CommentsModel.findById(commentID)  
      if (comment.parentComment === null){
          await PostsModel.updateOne({_id: comment.post},{$pull: {commentIDs: comment._id}});
        }else{
          console.log("remove parent\n\n")
          await CommentsModel.updateOne({_id: comment.parentComment},{$pull: {commentIDs: comment._id}});
        }
      deleteComments(commentID, user, true)
    }
    )

    user.posts.forEach((pID)=>{removePosts(pID, user)})

    user.communities.forEach(async (cID) => {
      await CommunitiesModel.updateOne({_id: cID},{$pull: {members: user._id}})
    })

    const communities = await CommunitiesModel.find({createdBy: user._id})
    communities.forEach(async (community) =>{
      const creator = user
      
      creator.communities = creator.communities.filter(c => c !== community._id);
      await creator.save()
      community.postIDs.forEach((pID) =>removePosts(pID))

      community.members.forEach(async (memID) =>{
        await UserModel.updateOne({_id: memID},{$pull:{communities: community._id}})
      })

      await CommunitiesModel.findByIdAndDelete(community._id);
    })

    console.log("--------")
    console.log(user.comments)

    const deleted = await UserModel.findByIdAndDelete(user._id)
    if (deleted)
      res.status(200).json({success: true})
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user.", welcomePage: true });
  }
});
//get all users
app.get("/admin/users", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in.", welcomePage: true });
  }

  const currentUser = await UserModel.findOne({ displayName: req.session.user });
  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "Admin access only.", welcomePage: true });
  }

  try {
    const users = await UserModel.find({}, "displayName email reputation");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to load users.", welcomePage: true });
  }
});

//specific users profile
app.get("/admin/users/:id/profile", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in.", welcomePage: true  });
  }

  const currentUser = await UserModel.findOne({ displayName: req.session.user });
  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "Admin access only.", welcomePage: true  });
  }

  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found.", welcomePage: true  });

    const { _id, displayName, email, dateJoined, reputation, role } = user;
    res.json({ _id, displayName, email, dateJoined, reputation, role });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch user profile.", welcomePage: true  });
  }
});

app.get("/check-login", async (req, res) => {
  console.log ("GET /check-login")
  console.log(req.session.user)
  if (req.session.user) {
    try {
      const user = await UserModel.findOne({ displayName: req.session.user });
      const { passwordHash, ...safeUser } = user.toObject();
      res.status(200).json(safeUser);
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ error: "Server error during login." });
    }
  }else{
    res.send(null);
  }
});

const server = app.listen(8000, () => {console.log("Server listening on port 8000...");});

process.on('SIGINT', async () => {
  await server.close();
  await mongoose.disconnect();
  console.log("Server closed. Database instance disconnected.");
})

