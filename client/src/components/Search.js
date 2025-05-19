import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Postcard from "./Postcard"; 
import "./../stylesheets/search.css";
//import { getAllChildComments, getEarliestDate } from "./CommentThread.js";
import axios from 'axios';
import { getEarliestDate } from "./CommentThread";
import { ErrorPage } from "./WelcomePage";

const SearchResults = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get("q"); //query from URL

  const [error, setError] = useState(null);


  // List of stop words to exclude
  //const stopWords = ["is", "the", "a", "an", "of", "to", "and", "in", "on", "for", "at", "by", "with", "about", "as", "not", "this"];

  // Function to clean search query by removing stop words
  //const cleanSearchQuery = (query) => {
    //return query
      //? query
        //  .toLowerCase()
          //.split(" ")
          //.filter(word => !stopWords.includes(word))
          //.join(" ")
      //: "";
  //};

  //const cleanedQuery = cleanSearchQuery(searchQuery);

  //hold all post/community info fetched from backend
  //const [communitiesInfo, setCommunitiesInfo] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [sortType, setSortType] = useState("newest");
  const [joinedCount, setJoinedCount] = useState(0);
  const user = JSON.parse(localStorage.getItem("user"));
  /*
  //fetch all community/post data
  useEffect(() => {
    axios.get("http://localhost:8000/all-post-cards")
      .then((res) => {
        setCommunitiesInfo(res.data); //conatains all communities with embedded posts
      })
      .catch((err) => {
        console.error("Failed to fetch post data:", err);
        setError("A system error occurred while loading search results.");
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
        voteCount: post.voteCount
      };
    });

    setFilteredPosts(formattedPosts);
  }, [communitiesInfo, cleanedQuery]);

  */

  useEffect(() => {
    if (!searchQuery) {
      setError("Missing search term.");
      return;
    }
  
    const fetchData = async () => {
      try {
        let joined = [];
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          const res = await axios.get("http://localhost:8000/user-communities", { withCredentials: true });
          joined = res.data.map(comm => comm.name);
        }
  
        const res = await axios.get(`http://localhost:8000/search?q=${searchQuery}`);
        const formattedPosts = res.data.map(post => {
          let commentCount = 0;
          function incrementCommCount(){
              commentCount += 1;
          }
          const commentEarliestDates = post.commentIDs?.map(comment => getEarliestDate(comment, incrementCommCount));
          const sortedComments = commentEarliestDates?.sort((a,b) => b-a);
          return {
            ...post,
            timestamp: new Date(post.postedDate),
            latestComment: (post.commentIDs.length > 0 ?
                new Date(sortedComments[0])
                : null),
            commentCount,
            communityName: post.communityId?.name || "",
            communityID: post.communityId?._id || post.communityId,
            linkFlair: post.linkFlairID?.content,
            voteCount: post.voteCount,
            views: post.views
          };
        });
  
        //group posts by joined/unjoined
        let joinedPosts = [];
        let notJoinedPosts = [];
  
        if (user && joined.length > 0) {
          formattedPosts.forEach(post => {
            if (joined.includes(post.communityName)) {
              joinedPosts.push(post);
            } else {
              notJoinedPosts.push(post);
            }
          });
        } else {
          joinedPosts = formattedPosts;
        }

        //sort joinedPosts and notJoinedPosts separately
        const sortFunc = (a, b) => {
          if (sortType === "newest") return b.timestamp - a.timestamp;
          if (sortType === "oldest") return a.timestamp - b.timestamp;
          if (sortType === "active") {
            const aLatest = a.latestComment || a.timestamp;
            const bLatest = b.latestComment || b.timestamp;
            return bLatest - aLatest;
          }
          return 0;
        };

        joinedPosts.sort(sortFunc);
        notJoinedPosts.sort(sortFunc);


        setJoinedCount(joinedPosts.length);
        setFilteredPosts([...joinedPosts, ...notJoinedPosts]);
      } catch (err) {
        console.error("Search or user-community fetch failed:", err);
        setError("A system error occurred while loading search results.");
      }
    };
    fetchData();
  }, [searchQuery, sortType]);  


  if (error) {
    return (
      <ErrorPage error={error}/>
    );
  }  

  return (
    <div className="homepage-container">
      {/* Search Header with Sorting Buttons */}
      <div className="homepage-header">
        <h2>
          {filteredPosts.length === 0
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
        {filteredPosts.length === 0 ? (
          <p>Oops! We couldn't find any results. Try a different search.</p>
        ) : (
          filteredPosts.map((post, index) => (
            <React.Fragment key={post._id}>
              {index === 0 && user && joinedCount > 0 && (
                <div className="sublist-divider">Posts from your communities</div>
              )}
              {index === joinedCount && user && (
                <div className="sublist-divider">Posts from communities you haven’t joined</div>
              )}
              <Postcard post={post} />
            </React.Fragment>
          ))          
        )}
      </div>
    </div>
  );
};

export default SearchResults;