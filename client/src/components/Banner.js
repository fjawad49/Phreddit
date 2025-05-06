import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // For navigation
import "../stylesheets/banner.css";

const Banner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const pathname = location.pathname;
  if (pathname === "/"){
    return (<></>)
  }

  //check login state
  const user = JSON.parse(localStorage.getItem("user"));

  // Handle search on Enter key press
  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${searchQuery.trim()}`);
    }
  };

  const handleCreatePost = () => {
    if (!user) return; //do nothing if not logged in
    navigate("/create-post");
  };

  //logout
  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
      navigate("/");
    } catch (err) {
      alert("Logout failed. Please try again.");
    }
  };


  return (
    <div className="banner">
      {/* App Name with link behavior */}
      <h1 className="app-name" onClick={() => navigate("/")} role="link" tabIndex={0}>
        phreddit
      </h1>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search Phreddit…"
        className="search-box"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearch}
      />
      {/* Profile Button */}
      <button
        className="create-post"
        disabled
        style={{
          marginLeft: "10px",
          backgroundColor: "#eee",
          color: "#333",
          fontWeight: "bold",
          cursor: "default"
        }}
      >
        {user ? user.displayName : "Guest"}
      </button>

      {/* Create Post Button */}
      <button
        className={`create-post ${!user ? "disabled" : ""}`}
        onClick={handleCreatePost}
        disabled={!user}
      >
        Create Post
      </button>
      {/* Logout Button if logged in */}
      {user && (
        <button className="create-post" onClick={handleLogout} style={{ marginLeft: "10px" }}>
          Log Out
        </button>
      )}
    </div>
  );
};

export default Banner;