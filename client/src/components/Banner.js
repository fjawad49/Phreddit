import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // For navigation
import "../stylesheets/banner.css";
import axios from "axios";

const Banner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  
  const user = JSON.parse(localStorage.getItem("user"));
  console.log(localStorage.getItem("user"))

  const pathname = location.pathname;
  if (pathname === "/" || pathname === "/register" || pathname === "/login"){
    return (<></>)
  }

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
  const handleLogout = async () => {
    try {
      localStorage.removeItem("user");
      console.log("logging out")
      const res = await axios.get("http://localhost:8000/logout")
      console.log("success")
      navigate("/")
    } catch (err) {
      console.log("failure")
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
        className={`create-post ${!user ? "disabled" : ""}`}
        onClick={() => {
          if (user) navigate("/profile");
        }}
        disabled={!user}
        style={{
          marginLeft: "10px",
          fontWeight: "bold",
          cursor: !user ? "not-allowed" : "pointer",
          opacity: !user ? 0.6 : 1,
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