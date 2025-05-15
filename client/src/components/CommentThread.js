import { useEffect, useState } from "react";
import "../stylesheets/postpage.css"
//import Model from "../models/model";
import { useNavigate } from "react-router-dom";
import { validateLinks } from "./FormComponents";
import TimeStamp from "./TimeStamp";
import axios from 'axios';

export default function CommentThread ( {cID, pID, comment, level = 0, hideReply = false, showVoteCount = false, hideVoting = false} ){
  const [childComments, setChildComments] = useState([]);
  
  useEffect(() => {
      setChildComments(comment.commentIDs);
  }, [comment])
  return (
    <>
      <Comment key={comment._id} cID={cID} pID={pID} comment={comment} level={level} hideReply={hideReply} showVoteCount={showVoteCount} hideVoting={hideVoting} />
      {childComments.map((child) => (
        <CommentThread key={child._id} cID={cID} pID={pID} comment={child} level={level + 1} hideReply={hideReply} showVoteCount={showVoteCount} hideVoting={hideVoting} />
      ))}
    </>
  );
}

function Comment ( {cID, pID, comment, level, hideReply, showVoteCount, hideVoting} ) {
  const navigate = useNavigate();
  const [linkedDescription, setLinkedDescription] = useState([]);
  const [voteCount, setVoteCount] = useState(comment.voteCount || 0);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const [userVote, setUserVote] = useState(null)

  const handleReply = () => {
      navigate(`/${cID}/posts/${pID}/comment/${comment._id}/reply`);
  };  

  useEffect(() => {
      let description = [], startIndex = 0;
      const hyperLinks = validateLinks(comment.content, false);
      const linkTexts = Object.keys(hyperLinks)


      linkTexts.forEach(text => {
          if (text !== "success")
              description.push(comment.content.substring(startIndex, hyperLinks[text]["startIndex"]));
              description.push(hyperLinks[text]["link"]);
              startIndex = hyperLinks[text]["endIndex"] + 1;
      });
      description.push(comment.content.substring(startIndex));
      setLinkedDescription(description);

      if (user){
        if (comment.upvoters.includes(user._id))
          setUserVote("upvote")
        else if (comment.downvoters.includes(user._id))
          setUserVote("downvote")
        else
          setUserVote("no-vote")
      }
  }, [comment]);

  const vote = async (type) => {
    try {
      if (userVote === "no-vote" || userVote === "upvote" && type === "no-vote" || userVote === "downvote" && type === "no-vote"){
        const res = await axios.post(
          `http://localhost:8000/vote/comment/${comment._id}`,{voteType: type},{withCredentials: true}
        );
        setUserVote(res.data.userVote)
        setVoteCount(res.data.voteCount);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Voting failed. Try again later."
      );
    }
  };

  return (
    <div key={comment._id} className="comment-container" style={{ marginLeft: `${level * 60}px` }}>
      {!hideVoting && (
        <div className="vote-column">
          <button className={userVote === "upvote" ? "vote-button clicked" : "vote-button"} onClick={() => {user && vote(userVote === "upvote" ? "no-vote" : "upvote")}}>▲</button>
          <div className="vote-count">{voteCount}</div>
          <button className={userVote === "downvote" ? "vote-button clicked" : "vote-button"} onClick={ () => {user && vote(userVote === "downvote" ? "no-vote" : "downvote")}}>▼</button>
        </div>
      )}
      <div className="comment-body">
        <div className="comment-meta">
          {comment.commentedBy} • {TimeStamp(new Date(comment.commentedDate))}
          {showVoteCount && (
            <span className="vote-count"> • Votes: {voteCount}</span>
          )}
        </div>
        <div className="comment-content">{linkedDescription}</div>
        {!hideReply && (
          <button className="reply-button" onClick={user && handleReply}>Reply</button>
        )}
        {error && <div className="error-text">{error}</div>}
      </div>
    </div>
  );
}  

export function getEarliestDate(comment, increment){
    let earliestDate = comment.commentedDate;
    increment();
    const childComments = comment.commentIDs;
    if (childComments){
        childComments.forEach(childComment => {
            let childEarliestDate = getEarliestDate(childComment, increment)
            if (childEarliestDate > earliestDate){
                earliestDate = childEarliestDate;
            }
        })
    }
    return earliestDate;
}

export function getAllChildComments(post) {
    const allComments = [];
  
    function traverse(comment) {
      if (!comment) return;
  
      allComments.push(comment);
  
      if (Array.isArray(comment.commentIDs)) {
        for (const child of comment.commentIDs) {
          traverse(child); // 
          //recursively fetch children
        }
      }
    }
  
    if (Array.isArray(post.commentIDs)) {
      for (const comment of post.commentIDs) {
        traverse(comment);
      }
    }
  
    return allComments;
  }