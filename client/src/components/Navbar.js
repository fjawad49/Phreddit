import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
//import "../models/model.js";
import "../stylesheets/navbar.css";
import axios from 'axios';

const NavBar = (props) => {
  const location = useLocation()
  const [loadedCommunities, setLoadedCommunities] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));


  // Ensure communities are loaded into state when received
  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user")));
    try{
      axios.get('http://localhost:8000/communities')
        .then(res => {
          //if user logged in, sort communities so that joined ones appear first
          if (user && user._id) {
            axios.get('http://localhost:8000/user-data')
              .then(res=>{
                setUser(res.data)
                localStorage.setItem('user', JSON.stringify(res.data));
              })
              .catch(err=>{
                setUser(null)
                console.log("Could not fetch user data: " + err);
              })

    
            const joined = [];
            const notJoined = [];
            console.log(true)
            res.data.forEach(comm => {
              if (comm.members && comm.members.includes(user._id)) {
                joined.push(comm);
              } else {
                notJoined.push(comm);
              }
            });
            setLoadedCommunities([...joined, ...notJoined]);
          } else {
            //guest user sees original order
            setLoadedCommunities(res.data);
          }
        })
        .catch(err => {
          console.log("Could not retrieve communities: " + err);
        });
      }catch (err){
        console.log("Error loading Navbar")
      }
      props.setReload(false);
  }, [location, props.reload]);
  
  const pathname = location.pathname;
  if (pathname === "/" || pathname === "/register" || pathname === "/login"){
    return (<></>)
  }

  return (
    <nav className="nav-bar">
      {/* Home Link */}
      <Link 
        to="/home" 
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
        {user ? (
          <Link
            to="/create-community"
            className={`create-community-btn ${location.pathname === "/create-community" ? "active" : ""}`}
          >
            Create Community
          </Link>
        ) : (
          <button className="create-community-btn disabled" disabled>
            Create Community
          </button>
        )}


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