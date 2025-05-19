const PostsModel = require("./models/posts.js");
const CommentsModel = require("./models/comments.js");
const UserModel = require("./models/users.js");
const CommunitiesModel = require("./models/communities.js");
const app = require("./server.js")
const request = require('supertest');
const agent   = request.agent(app);   

let mongoose = require('mongoose');
let mongoDB = "mongodb://127.0.0.1:27017/phreddit";
mongoose.connect(mongoDB);
let db = mongoose.connection;

describe('Post deletion testing', () => {
    // Server must be running
    var postID;
    beforeAll(async () => {
        const user = await UserModel.findOne({displayName: "wonderz"});
        const community = await CommunitiesModel.findOne({name: "Community1"});

        const newPost = new PostsModel({
            title: "Test",
            content: "CSE 316",
            communityId: community._id,
            postedBy: user._id,
            linkFlairID: null,
            createdAt: new Date(),
            views: 0,
            voteCount: 0,
            upvoters: [],
            downvoters: [],
            commentIDs: []
        })

        const comment1 = new CommentsModel({
            content: "Test Comment",
            commentedBy: user._id,
            commentedDate: new Date(),
            commentIDs: [],
            community: community._id,
            post: newPost._id
        })

        const comment2 = new CommentsModel({
            content: "Test Comment2",
            parentComment: comment1._id,
            commentedBy: user._id,
            commentedDate: new Date(),
            commentIDs: [],
            community: community._id,
            post: newPost._id
        })
        newPost.commentIDs.push(comment1._id);
        await newPost.save()

        comment1.commentIDs.push(comment2._id)
        await comment1.save()
        await comment2.save()
        postID = newPost._id;

        await agent.post('/login').send({ email: 'user2@icloud.com', password: 'pswrd22' }).expect(200);
    }); 
    
    test('Check if post and comments deleted', async () => {
        const post = await PostsModel.findOne({title: "Test"});
        const commentIDs = []
        console.log("hello")
        async function iterateComments(commentID){
            const comment = await CommentsModel.findById(commentID);
            comment.commentIDs.forEach(cID => iterateComments(cID));
            commentIDs.push(commentID);
        }

        post.commentIDs.forEach(cID => iterateComments(cID));
        await agent.delete(`/delete-post/${post._id}`).expect(200);
        console.log("hello")
        var allDeleted = true;

        const retrievedPost = await PostsModel.findById(post._id);
        if (retrievedPost)
            allDeleted = false;
        console.log(allDeleted)
        for (let i = 0; i < commentIDs.length; i++){
            const retrievedComment = await CommentsModel.findById(commentIDs[i]);
            console.log(retrievedComment)
            if (retrievedComment)
                allDeleted = false;
        }

        expect(allDeleted).toBe(true);
    });


}); 