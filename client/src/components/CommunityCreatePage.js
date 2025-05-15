import "../stylesheets/forms.css";
import React, { useState } from "react";
import {TextBox, validateLinks} from "./FormComponents";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ErrorPage } from "./WelcomePage";

export default function CommunityCreatePage() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [errorPage, setErrorPage] = useState(null)


    async function handleForm(e){
        e.preventDefault();
        const data = new FormData(e.target);
        const description = data.get("Community Description");
        const links = validateLinks(description);
        if (!links.success){
            setError(links.error);
        }else{
            const newComm = {
                name: data.get("Community Name"),
                description: data.get("Community Description"),
                //postIDs: [],
                //startDate: new Date(),
                //members: [data.get("Username")],
                //memberCount: 1,
            }
            try {
                const res = await axios.post(`http://localhost:8000/new-community/`, newComm, {
                    withCredentials: true
                });
                const community = res.data;
                console.log(community);
                await navigate(`/${encodeURIComponent(community._id)}`);
            } catch (err) {
                console.log(err)
                console.error("Community creation failed:", err);
                if (err.status === 500 || err.response.data.welcomePage){
                    setErrorPage(err.response.data.error)
                }else
                    setError(err.response.data.error);
            }
        }
    }
    if (errorPage)
        return(<ErrorPage error={errorPage}/>)
    return(
        <form className="create-page" id="create-community-form" onSubmit={handleForm}>
            <TextBox name="Community Name" maxchars="100" placeholder="Name...(Max 100 Characters)"/>
            <TextBox multiline={true} maxchars="500" name="Community Description" placeholder="Description...(Max 500 Characters)"/>
            <span style={{color: "red", display: "block"}}>{error ? (`${error}`) : ('')}</ span>
            <input className="submit-button" type="submit" value="Engender Community" />
        </ form>
    );
}