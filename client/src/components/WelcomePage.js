import React from "react";
import "../stylesheets/welcome.css"; 
import { Link } from "react-router-dom";

export default function WelcomePage(){

    return(
        <div className="welcome">
            Welcome to Phreddit!
            <div className="button-margin">
                <Link to={`/register`} className={"welcome-button"}> Register </Link>
                <Link to={`/login`} className={"welcome-button"}> Login </Link>
                <Link to={`/home`} className={"welcome-button"}> Enter as Guest </Link>
            </div>
        </div>
    );
}

export function ErrorPage({error}){
    return(
        <div className="homepage-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="welcome-button colored" onClick={() => window.location.href = "/"}>Return to Welcome Page</button>
        </div>
    );
}