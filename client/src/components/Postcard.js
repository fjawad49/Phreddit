import { useNavigate } from "react-router-dom";
import "../stylesheets/postcard.css"; 
//import Model from "../models/model.js";
import { useEffect, useState } from "react";
import { validateLinks } from "./FormComponents.js";
import TimeStamp from "./TimeStamp.js";

export default function Postcard({post, includeCommunity=true}){
    const navigate = useNavigate();
    const [linkedDescription, setLinkedDescription] = useState([]);
    
    useEffect(() => {
      let description = [], startIndex = 0;
      const hyperLinks = validateLinks(post.content, true);
      console.log(hyperLinks)
      const linkTexts = Object.keys(hyperLinks)

      linkTexts.forEach(text => {
          if (text !== "success")
              description.push(post.content.substring(startIndex, hyperLinks[text]["startIndex"]));
              description.push(hyperLinks[text]["link"]);
              startIndex = hyperLinks[text]["endIndex"] + 1;
      });
      description.push(post.content.substring(startIndex));
      setLinkedDescription(description.join(""))
    }, [post]);

    return(
    <div key={post.postID} className="post-item" onClick={() => navigate(`/${encodeURIComponent(post.communityID)}/posts/${encodeURIComponent(post._id)}`)}> 
    <p className="post-meta">
      <strong>{includeCommunity ? `${post.communityName} • ` : ""}</strong>{post.postedBy} • {TimeStamp(post.timestamp)}
    </p>
    <h3 className="post-title">{post.title}</h3>
    {post.linkFlair && <p className="post-flair">{post.linkFlair}</p>}
    <p className="post-content">{linkedDescription.length > 80 ? linkedDescription.substring(0, 80) + "..." : linkedDescription}</p>
    <p className="post-stats"><strong>Views:</strong> {post.views} | <strong>Comments:</strong> {post.commentCount} | <strong>Votes:</strong> {post.voteCount ?? 0} </p>
    </div>
    );
}