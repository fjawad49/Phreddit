import React, { useEffect, useState } from "react";
import axios from "axios";
import "../stylesheets/profile.css";
import TimeStamp from './TimeStamp';
import { Link } from "react-router-dom";


export default function UserProfilePage() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("posts");
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

    //fetch user profile info
    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await axios.get("http://localhost:8000/user/profile", { withCredentials: true });
                setUser(res.data);
            } catch (err) {
                console.error("Failed to load user info", err);
                setError("Could not load profile.");
            }
        }
        fetchUser();
    }, []);

    //fetch posts/communities/comments based on active tab
    useEffect(() => {
        async function fetchItems() {
            try {
                let endpoint = "";
                if (activeTab === "posts") endpoint = "/user/posts";
                if (activeTab === "communities") endpoint = "/user/communities";
                if (activeTab === "comments") endpoint = "/user/comments";

                const res = await axios.get(`http://localhost:8000${endpoint}`, { withCredentials: true });
                setItems(res.data);
            } catch (err) {
                console.error("Failed to load items", err);
                setItems([]);
                setError("Could not load " + activeTab);
            }
        }

        if (user) fetchItems(); //only run if user info is available
    }, [activeTab, user]);

    if (error) {
        return <div className="profile-page"><p style={{ color: "red" }}>{error}</p></div>;
    }

    if (!user) {
        return <div className="profile-page"><p>Loading user profile...</p></div>;
    }

    async function handleDelete(id) {
        if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    
        let endpoint = "";
        if (activeTab === "posts") endpoint = `/delete-post/${id}`;
        else if (activeTab === "communities") endpoint = `/delete-community/${id}`;
        else if (activeTab === "comments") endpoint = `/delete-comment/${id}`;
    
        try {
            await axios.delete(`http://localhost:8000${endpoint}`, { withCredentials: true });
            setItems(prev => prev.filter(item => item._id !== id));
        } catch (err) {
            console.error("Delete error:", err);
            setError(`Failed to delete ${activeTab.slice(0, -1)}.`);
        }
    }
    
    return (
        <div className="profile-page">
          <h2>User Profile</h2>
      
          <div className="user-info">
            <p><strong>Display Name:</strong> {user.displayName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Reputation:</strong> {user.reputation}</p>
            <p><strong>Member Since:</strong> {TimeStamp(user.dateJoined)}</p>
          </div>
      
          <div className="tab-buttons" style={{ marginTop: "1rem" }}>
            <button
              onClick={() => setActiveTab("posts")}
              className={activeTab === "posts" ? "active-tab" : ""}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("communities")}
              className={activeTab === "communities" ? "active-tab" : ""}
            >
              Communities
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={activeTab === "comments" ? "active-tab" : ""}
            >
              Comments
            </button>
          </div>

      
          <div className="listing-section" style={{ marginTop: "2rem" }}>
            {items.length === 0 ? (
              <p>No {activeTab} found.</p>
            ) : (
              <ul>
                {items.map((item, idx) => (
                  <li key={item._id || idx} className="profile-list-item">
                    {activeTab === "posts" && (
                      <div className="item-row">
                        <Link to={`/edit-post/${item._id}`}>{item.title}</Link>
                        <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                      </div>
                    )}
                    {activeTab === "communities" && (
                      <div className="item-row">
                        <Link to={`/edit-community/${item._id}`}>{item.name}</Link>
                        <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                      </div>
                    )}
                    {activeTab === "comments" && (
                      <div className="item-row">
                        <Link to={`/edit-comment/${item._id}`}>
                          On: <em>{item.postTitle || "Unknown Post"}</em> — "
                          {item.content ? item.content.slice(0, 20) : "[No content]"}..."
                        </Link>
                        <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }      