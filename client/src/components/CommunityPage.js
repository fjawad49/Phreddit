import "../stylesheets/forms.css"; 
import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Postcard from './Postcard.js'
//import Model from "../models/model.js";
import { validateLinks } from "./FormComponents.js";
import axios from "axios";
import TimeStamp from "./TimeStamp.js";
import { getEarliestDate } from "./CommentThread.js";

export default function CommunityPage() {
    /* Retrieve community name from pathname */
    const { communityID } = useParams();
    const [community, setCommunity] = useState(null);
    const user = JSON.parse(localStorage.getItem("user"));
    const [error, setError] = useState(null);

    /* Keep track of filtered posts to display (i.e. posts from community) */
    const [posts, setPosts] = useState([]);
    const [linkedDescription, setLinkedDescription] = useState([])
    const [sortOrder, setSortOrder] = useState("newest");

    /* Map each postID from community to respective post data */
    useEffect(() => {
        async function fetchCommunityData() {
            try {
                const communityRes = await axios.get(`http://localhost:8000/communities/${communityID}`);
                const communityData = communityRes.data;
                setCommunity(communityData);

               

                //fetch posts for the community
                const postResponses = await Promise.all(
                    communityData.postIDs.map(postID => axios.get(`http://localhost:8000/posts/${postID}`))
                );
                const fetchedPosts = postResponses.map(res => res.data);

                
                const flairRes = await axios.get("http://localhost:8000/linkflairs");
                const flairs = flairRes.data;

                const formattedPosts = await Promise.all(fetchedPosts.map(async (post) => {
                    const flair = flairs.find(f => f._id === post.linkFlairID);
                    let commentCount = 0;
                    function incrementCommCount(){
                        commentCount += 1;
                    }
                    const commentEarliestDates = post.commentIDs?.map(comment => getEarliestDate(comment, incrementCommCount));
                    const sortedComments = commentEarliestDates?.sort((a,b) => b-a);
                    return {
                        ...post,
                        timestamp: new Date(post.postedDate),
                        latestComment:(post.commentIDs.length > 0 ?
                            new Date(sortedComments[0])
                            : null),
                        commentCount: commentCount,
                        communityName: communityData.name,
                        communityID: communityData._id,
                        linkFlair: flair?.content,
                    };
                }));                

                setPosts(formattedPosts);
                console.log("Formatted Posts:", formattedPosts);
            } catch (error) {
                console.error("Failed to fetch community or post data:", error);
                setError("Failed to load community. Please try again later.");
            }
        }

        fetchCommunityData();
    }, [communityID]);

    async function handleJoinCommunity() {
        try {
          await axios.post(`http://localhost:8000/communities/${communityID}/join`, {
            userID: user._id
          });
          setCommunity(prev => ({
            ...prev,
            members: [...prev.members, user._id],
            memberCount: prev.memberCount + 1
          }));
        } catch (err) {
          console.error("Error joining community:", err);
        }
      }
      
      async function handleLeaveCommunity() {
        try {
          await axios.post(`http://localhost:8000/communities/${communityID}/leave`, {
            userID: user._id
          });
          setCommunity(prev => ({
            ...prev,
            members: prev.members.filter(id => id !== user._id),
            memberCount: prev.memberCount - 1
          }));
        } catch (err) {
          console.error("Error leaving community:", err);
        }
      }
      

    useEffect(() => {
        if (!community) return;
        let description = [], startIndex = 0;
        const hyperLinks = validateLinks(community.description, false);
        const linkTexts = Object.keys(hyperLinks);
        linkTexts.forEach(text => {
            if (text !== "success") {
                description.push(community.description.substring(startIndex, hyperLinks[text]["startIndex"]));
                description.push(hyperLinks[text]["link"]);
                startIndex = hyperLinks[text]["endIndex"] + 1;
            }
        });
        description.push(community.description.substring(startIndex));
        setLinkedDescription(description);
    }, [community]);

    /* Sort posts based on specified sortOrder state, causing rerender on change */
    const sortedPosts = [...posts].sort((a, b) => {
        if (sortOrder === "newest") return b.timestamp - a.timestamp;
        if (sortOrder === "oldest") return a.timestamp - b.timestamp;
        if (sortOrder === "active") {
            if (a.latestComment && b.latestComment){
              let diff = b.latestComment - a.latestComment;
              if (diff === 0)
                return b.timestamp - a.timestamp;
              else
                return diff;
            }else{
              const aNewestDate = a.latestComment ? a.latestComment : a.timestamp;
              const bNewestDate = b.latestComment ? b.latestComment : b.timestamp;
              return bNewestDate - aNewestDate
            }
        }
        return 0;
    });

    if (error) {
      return (
        <div className="error-screen">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = "/"}>Return to Welcome Page</button>
        </div>
      );
    }
    
    if (!community) return <div>Loading...</div>;

    return (
        /* Reuse homepage structure */
        <div className="homepage-container">
        <div className="homepage-header">
            <h2>{community.name}</h2>
            <div className="sort-buttons">
            <button className={sortOrder === "newest" ? "active" : ""} onClick={() => setSortOrder("newest")}> Newest </button>
            <button className={sortOrder === "oldest" ? "active" : ""} onClick={() => setSortOrder("oldest")}> Oldest </button>
            <button className={sortOrder === "active" ? "active" : ""} onClick={() => setSortOrder("active")}> Active </button>
            </div>
        </div>
        <div>
            <p>
                {linkedDescription.map((part, index) =>
                    typeof part === "string" ? (
                    part
                    ) : (
                    <React.Fragment key={index}>{part}</React.Fragment>
                    )
                )}
            </p>
            <div className="community-meta">Created by {community.creatorName} • {TimeStamp(community.startDate)}</div>
            {user && (
                community.members.includes(user._id) ? (
                    <button onClick={handleLeaveCommunity}>Leave Community</button>
                ) : (
                    <button onClick={handleJoinCommunity}>Join Community</button>
                )
                )}
        </div>

        <p className="post-count">{sortedPosts.length} posts  • {community.memberCount} members</p>
        
        <div className="post-listing">
            {sortedPosts.length === 0 ? (
            <p>No posts available.</p>
            ) : (
            sortedPosts.map((post) => (
                /* Do not include community name on displayed Postcard */
                <Postcard key={post._id} post={post} includeCommunity={false} communityID={community._id} />
            ))
            )}
        </div>
        </div>
    );
}