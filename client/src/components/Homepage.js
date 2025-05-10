import React, { useState, useEffect } from "react";
import "../stylesheets/homepage.css"; 
import Postcard from './Postcard.js'
import { getEarliestDate } from "./CommentThread.js";
import axios from 'axios';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");
  const [communitiesInfo, setCommunitiesInfo] = useState([]);
  const [userCommunities, setUserCommunities] = useState(null);
  //logged in user
  const user = JSON.parse(localStorage.getItem("user"));
  //track split
  const [joinedPostCount, setJoinedPostCount] = useState(0);


  useEffect(() => {
        // Retrieve communities, posts, and linkflairs from server
        //var communities = [];
        axios.get('http://localhost:8000/all-post-cards')
          .then(res => {
            console.log("Backend returned:", res.data);
            setCommunitiesInfo(res.data);
          })
          .catch(err => {console.log("Could not retrieve all posts metadata: " + err)});
  }, []);

  useEffect(() => {
    if(user){
      axios.get('http://localhost:8000/user-communities', { withCredentials: true })
        .then(res =>
          {setUserCommunities(res.data.map(community => community.name))}
        )
        .catch(err => {
          console.log("Could not fetch user communities:",err);
          setUserCommunities([]);
        });
    }
  }, []);

  useEffect(() => {
    if (communitiesInfo.length < 1 || (user && userCommunities === null)){
      return
    }
    try{
      const postsData = []

      //const seen = new Set();
      communitiesInfo.forEach(c => {
        c.postIDs.forEach(post => {
            post.communityName = c.name;
            post.communityID = c._id;
            postsData.push(post);
          });
      });
      /*communitiesInfo.forEach(c => {
        if (Array.isArray(c.postIDs)) {
          c.postIDs.forEach(post => {
            const id = post._id?.toString();
            if (id && !seen.has(id)) {
              seen.add(id);
              post.communityName = c.name;
              post.communityID = c._id;
              postsData.push(post);
            }
          });
        }
      });
      console.log("Unique post count (deduped):", postsData.length);
*/
      const formattedPosts = postsData.map((post) => {            
          let commentCount = 0;
          function incrementCommCount(){
              commentCount += 1;
          }
          const commentEarliestDates = post.commentIDs?.map(comment => getEarliestDate(comment, incrementCommCount));
          const sortedComments = commentEarliestDates?.sort((a,b) => b-a);
          console.log(post.postedDate)
          return {
              ...post,
              timestamp: new Date(post.postedDate),
              latestComment: (post.commentIDs.length > 0 ?
                new Date(sortedComments[0])
                : null),
              commentCount: commentCount,
              communityName: post.communityName,
              communityID: post.communityID,
              communityMembers: post.communityMembers,
              linkFlair: post.linkFlairID?.content,
          };
      });

      //split into joined and not-joined
      let joinedPosts = [];
      let notJoinedPosts = [];

      if (user && user._id) {
        formattedPosts.forEach(post => {
          if (userCommunities.includes(post.communityName)) {
            joinedPosts.push(post);
          } else {
            notJoinedPosts.push(post);
          }
        });
      } else {
        joinedPosts = formattedPosts; //guests see all as joined
      }


      // Sorting function
      const sortFunc = (a, b) => {
        if (sortOrder === "newest") return b.timestamp - a.timestamp;
        if (sortOrder === "oldest") return a.timestamp - b.timestamp;
        if (sortOrder === "active") {
          const aTime = a.latestComment || a.timestamp;
          const bTime = b.latestComment || b.timestamp;
          return bTime - aTime;
        }
        return 0;
      };

      joinedPosts.sort(sortFunc);
      notJoinedPosts.sort(sortFunc);

      setJoinedPostCount(joinedPosts.length); //boundary for divider
      setPosts([...joinedPosts, ...notJoinedPosts]);
      console.log([joinedPosts])
    } catch (error) {
      console.error("Error in useEffect:", error);
    }
  }, [communitiesInfo, sortOrder]);

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

return (
    <div className="homepage-container">
      <div className="homepage-header">
        <h2>All Posts</h2>
        <div className="sort-buttons">
          <button className={sortOrder === "newest" ? "active" : ""} onClick={() => setSortOrder("newest")}> Newest </button>
          <button className={sortOrder === "oldest" ? "active" : ""} onClick={() => setSortOrder("oldest")}> Oldest </button>
          <button className={sortOrder === "active" ? "active" : ""} onClick={() => setSortOrder("active")}> Active </button>
        </div>
      </div>

      <p className="post-count">{sortedPosts.length} posts</p>

      <div className="post-listing">
        {sortedPosts.length === 0 ? (
          <p>No posts available.</p>
        ) : (
          sortedPosts.map((post, index) => (
            <React.Fragment key={post._id}>
              {index === 0 && user && joinedPostCount !== 0 && (
                <div className="sublist-divider">Posts from your communities</div>
              )}
              {index === joinedPostCount && user && (
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

export default HomePage;