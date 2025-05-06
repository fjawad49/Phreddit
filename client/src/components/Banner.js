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

  // Handle search on Enter key press
  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${searchQuery.trim()}`);
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

      {/* Create Post Button */}
      <button
        className={`create-post ${location.pathname === "/create-post" ? "active" : ""}`}
        onClick={() => navigate("/create-post")}
      >
        Create Post
      </button>
    </div>
  );
};

export default Banner;