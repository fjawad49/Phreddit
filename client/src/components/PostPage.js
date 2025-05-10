import "../stylesheets/postpage.css"; 
import React, { useState, useEffect } from "react";
//import Model from "../models/model.js";
import { validateLinks } from "./FormComponents.js";
import { useParams, useNavigate } from "react-router-dom";
import CommentThread, { getEarliestDate } from "./CommentThread.js";
import axios from "axios";
import TimeStamp from "./TimeStamp.js";

export default function PostPage() {
    const { postID, communityID } = useParams();
    const navigate = useNavigate();

    const [postInfo, setPostInfo] = useState(null);
    const [linkedDescription, setLinkedDescription] = useState([]);
    const [commCount, setCommCount] = useState(0);
    const [sortedThreads, setSortedThreads] = useState([]);
    const user = JSON.parse(localStorage.getItem("user")); //null if guest
    const [error, setError] = useState(null);

    const isGuest = !user;


    //post + comments + metadata from backend
    useEffect(() => {
      axios
        .get(`http://localhost:8000/${communityID}/post/${postID}`)
        .then((res) => {
          const post = res.data.post;
          const communityName = res.data.commName;
          setPostInfo({
            ...post,
            linkFlair: post.linkFlairID?.content,
            community: communityName
          });
        })
        .catch((err) => {
          console.log("Error fetching post data:", err);
          setError("Failed to load post. Please try again later.");
        });

    }, [communityID, postID]);

    
    useEffect(() => {
        if (!postInfo?.content) return;
        console.log(postInfo)
        let commentCount = 0;

        function incrementCommCount(){
            commentCount += 1;
        }
        
        const commentEarliestTimes = postInfo.commentIDs.map((comment) => getEarliestDate(comment,incrementCommCount));
        console.log(commentEarliestTimes)
        const indices = commentEarliestTimes.map((_, index) => index);
        indices.sort((a, b) => (commentEarliestTimes[b] - commentEarliestTimes[a]));
        console.log("yolo");
        const commentThreads = postInfo.commentIDs.map(comment => (<CommentThread key={comment._id} cID={communityID} pID={postID} comment={comment}  hideReply={isGuest} showVoteCount={true} hideVoting={isGuest || (user?.reputation < 50)}/>));
        setSortedThreads(indices.map(index => commentThreads[index]));
        setCommCount(commentCount);


        const description = [];
        let startIndex = 0;
    
        const hyperLinks = validateLinks(postInfo.content, false);
        const linkTexts = Object.keys(hyperLinks);
    
        linkTexts.forEach((text) => {
          if (text !== "success") {
            description.push(
              postInfo.content.substring(startIndex, hyperLinks[text].startIndex)
            );
            description.push(hyperLinks[text].link);
            startIndex = hyperLinks[text].endIndex + 1;
          }
        });

        description.push(postInfo.content.substring(startIndex));
        setLinkedDescription(description);
    }, [postInfo]);

    const handleAddComment = () => {
        navigate(`/${communityID}/posts/${postID}/comment/new`);
    };
    
    if (error) {
      return (
        <div className="error-screen">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => (window.location.href = "/")}>
            Return to Welcome Page
          </button>
        </div>
      );
    }  

    if (!postInfo){
      return (<div>Loading...</div>)
    }

    const handlePostVote = async (type) => {
      try {
        const res = await axios.post(`http://localhost:8000/vote/post/${postID}`, {
          voterID: user._id,
          voteType: type,
        });
    
        setPostInfo((prev) => ({
          ...prev,
          voteCount: res.data.updatedVoteCount,
        }));
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Voting failed. Try again later.");
      }
    };


    return (
      <div key={postID} className="post-container">
          <div className="post-card" id="expanded-post">
              <div className="post-meta">
                  {`${postInfo.community} • ${TimeStamp(new Date(postInfo.postedDate))}`}
              </div>
              <div>User: {postInfo.postedBy}</div>
              <h2 className="title">{postInfo.title}</h2>
              {postInfo.linkFlair && (
                  <p className="post-flair">{postInfo.linkFlair}</p>
              )}
              <div className="post-content">{linkedDescription}</div>

              <div className="post-footer">
                <span className="post-stats">
                  <strong>Views:</strong> {postInfo.views} |{" "}
                  <strong>Comments:</strong> {commCount} |{" "}
                  <strong>Votes:</strong> {postInfo.voteCount ?? 0}
                </span>

                {!isGuest && user.reputation >= 50 && (
                  <span className="post-vote-inline">
                    <button className="vote-button small" onClick={() => handlePostVote("upvote")}>▲</button>
                    <button className="vote-button small" onClick={() => handlePostVote("downvote")}>▼</button>
                  </span>
                )}
              </div>

              <hr className="divider" />
              {sortedThreads}
          </div>
      </div>
  );
      
}