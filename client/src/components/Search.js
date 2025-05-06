import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Postcard from "./Postcard"; 
import "./../stylesheets/search.css";
import { getAllChildComments, getEarliestDate } from "./CommentThread.js";
import axios from 'axios';

const SearchResults = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get("q"); //query from URL

  // List of stop words to exclude
  const stopWords = ["is", "the", "a", "an", "of", "to", "and", "in", "on", "for", "at", "by", "with", "about", "as", "not", "this"];

  // Function to clean search query by removing stop words
  const cleanSearchQuery = (query) => {
    return query
      ? query
          .toLowerCase()
          .split(" ")
          .filter(word => !stopWords.includes(word))
          .join(" ")
      : "";
  };

  const cleanedQuery = cleanSearchQuery(searchQuery);

  //hold all post/community info fetched from backend
  const [communitiesInfo, setCommunitiesInfo] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [sortType, setSortType] = useState("newest");

  //fetch all community/post data
  useEffect(() => {
    axios.get("http://localhost:8000/all-post-cards")
      .then((res) => {
        setCommunitiesInfo(res.data); //conatains all communities with embedded posts
      })
      .catch((err) => {
        console.error("Failed to fetch post data:", err);
      });
  }, []);

  //filter posts based on query
  useEffect(() => {
    if (communitiesInfo.length < 1) return;

    const matchedPosts = [];

    //loop through each community
    communitiesInfo.forEach((community) => {
      //loop through each post in the community
      community.postIDs.forEach((post) => {
        //child comments for this post
        const comments = getAllChildComments(post);
        //check if post title, content, or any comment content includes the search term
        const safeComments = Array.isArray(comments) ? comments : [];

        const query = cleanedQuery.split(" ")
        for (const term of query){
          const commentMatch = safeComments.some(comment =>
            comment.content?.toLowerCase().includes(term)
          );


          const titleMatch = post.title?.toLowerCase().includes(term);
          const contentMatch = post.content?.toLowerCase().includes(term);

          if (titleMatch || contentMatch || commentMatch) {
            //add community metadata directly to the post
            post.communityName = community.name;
            post.communityID = community._id;
            matchedPosts.push(post);
            break;
          }
        }
        
      });
    });

    //matched post to be displayed in Postcard
    const formattedPosts = matchedPosts.map((post) => {
      let commentCount = 0;
      function incrementCommCount() {
        commentCount += 1;
      }

      //latest comment timestamp
      const commentEarliestDates = post.commentIDs?.map((comment) =>
        getEarliestDate(comment, incrementCommCount)
      );
      const sortedComments = commentEarliestDates?.sort((a, b) => b - a);

      return {
        ...post,
        timestamp: new Date(post.postedDate),
        latestComment: post.commentIDs ? sortedComments[0] : null,
        commentCount: commentCount,
        communityName: post.communityName,
        communityID: post.communityID,
        linkFlair: post.linkFlair?.content,
      };
    });

    setFilteredPosts(formattedPosts);
  }, [communitiesInfo, cleanedQuery]);

  //sorting logic
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortType === "newest") return b.timestamp - a.timestamp;
    if (sortType === "oldest") return a.timestamp - b.timestamp;
    if (sortType === "active") {
      const aLatest = a.latestComment || a.timestamp;
      const bLatest = b.latestComment || b.timestamp;
      return bLatest - aLatest;
    }
    return 0;
  });

  return (
    <div className="homepage-container">
      {/* Search Header with Sorting Buttons */}
      <div className="homepage-header">
        <h2>
          {sortedPosts.length === 0
            ? `No results found for: "${searchQuery}"`
            : `Search Results for "${searchQuery}"`}
        </h2>
        <div className="sorting-buttons">
          <button
            className={sortType === "newest" ? "active" : ""}
            onClick={() => setSortType("newest")}
          >
            Newest
          </button>
          <button
            className={sortType === "oldest" ? "active" : ""}
            onClick={() => setSortType("oldest")}
          >
            Oldest
          </button>
          <button
            className={sortType === "active" ? "active" : ""}
            onClick={() => setSortType("active")}
          >
            Active
          </button>
        </div>
      </div>

      <p className="post-count">{filteredPosts.length} posts found</p>

      {/* Post Listings */}
      <div className="post-listing">
        {sortedPosts.length === 0 ? (
          <p>Oops! We couldn't find any results. Try a different search.</p>
        ) : (
          sortedPosts.map(post => <Postcard key={post.postID} post={post} />)
        )}
      </div>
    </div>
  );
};

export default SearchResults;