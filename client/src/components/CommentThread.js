import { useEffect, useState } from "react";
import "../stylesheets/postpage.css"
//import Model from "../models/model";
import { useNavigate } from "react-router-dom";
import { validateLinks } from "./FormComponents";
import TimeStamp from "./TimeStamp";
import axios from 'axios';

export default function CommentThread ( {cID, pID, comment, level = 0} ){
  const [childComments, setChildComments] = useState([]);
  
  useEffect(() => {
      console.log(comment)
      setChildComments(comment.commentIDs);
  }, [comment])
  return (
    <>
      <Comment key={comment._id} cID={cID} pID={pID} comment={comment} level={level} />
      {childComments.map((child) => (
        <CommentThread key={child._id} cID={cID} pID={pID} comment={child} level={level + 1} />
      ))}
    </>
  );
}

function Comment ( {cID, pID, comment, level} ) {
  const navigate = useNavigate();
  const [linkedDescription, setLinkedDescription] = useState([]);

  const handleReply = () => {
      navigate(`/${cID}/posts/${pID}/comment/${comment._id}/reply`);
  };  

  useEffect(() => {
      let description = [], startIndex = 0;
      const hyperLinks = validateLinks(comment.content, false);
      console.log(hyperLinks)
      const linkTexts = Object.keys(hyperLinks)


      linkTexts.forEach(text => {
          if (text !== "success")
              description.push(comment.content.substring(startIndex, hyperLinks[text]["startIndex"]));
              description.push(hyperLinks[text]["link"]);
              startIndex = hyperLinks[text]["endIndex"] + 1;
      });
      description.push(comment.content.substring(startIndex));
      setLinkedDescription(description)
  }, [comment]);

  return (
      <div key={comment._id} style={{marginLeft: `${level * 20}px`}}>
          <div className="comment-meta">{comment.commentedBy} • {TimeStamp(new Date(comment.commentedDate))}</div>
          <div className="comment-content">{linkedDescription}</div>
          <button className="reply-button" onClick={handleReply}>Reply</button>
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