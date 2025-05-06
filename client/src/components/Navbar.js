import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
//import "../models/model.js";
import "../stylesheets/navbar.css";
import axios from 'axios';

const NavBar = () => {
  const location = useLocation()
  const [loadedCommunities, setLoadedCommunities] = useState([]);

  // Ensure communities are loaded into state when received
  useEffect(() => {
    axios.get('http://localhost:8000/communities')
      .then(res => {
        setLoadedCommunities(res.data)
      })
      .catch(err => {console.log("Could not retrieve communities: " + err)});
  }, [location]);
  
  const pathname = location.pathname;
  if (pathname === "/"){
    return (<></>)
  }

  return (
    <nav className="nav-bar">
      {/* Home Link */}
      <Link 
        to="/" 
        className={`nav-link ${location.pathname === "/home" ? "active" : ""}`}
      >
        Home
      </Link>

      {/* Divider */}
      <hr className="nav-divider" />

      {/* Communities Section */}
      <div className="communities-section">
        <h3>Communities</h3>

        {/* Styled Create Community Button */}
        <Link
          to="/create-community" 
          className={`create-community-btn ${location.pathname === "/create-community" ? "active" : ""}`}
        >
          Create Community
        </Link>

        {/* List of Communities */}
        <ul className="community-list">
          {loadedCommunities.length > 0 ? (
            loadedCommunities.map((community) => (
              <li key={community._id}>
                <Link 
                  to={`/${encodeURIComponent(community._id)}`} 
                  className={`community-link ${location.pathname === `/${encodeURIComponent(community._id)}` ? "selected" : ""}`}
                >
                  {community.name}
                </Link>
              </li>
            ))
          ) : (
            <p  key={"none"} className="no-communities">No communities available.</p>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;