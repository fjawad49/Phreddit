import "../stylesheets/forms.css";
import React, { useState, useEffect } from "react";
import {TextBox, validateLinks} from "./FormComponents";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ErrorPage } from "./WelcomePage";

export default function CommunityCreatePage() {
    const params = useParams(); //community ID from /edit-community/:id
    const navigate = useNavigate();

    const [editComm, setEditComm] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState('');
    const [errorPage, setErrorPage] = useState(null)

    useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))

    async function fetchCommunity() {
      try {
        const res = await axios.get(`http://localhost:8000/communities/${params.id}`);
        const comm = res.data;
        setName(comm.name);
        setDescription(comm.description);
      } catch (err) {
        console.error("Failed to load community:", err);
        setError("Failed to load community details");
      }
    }

    if (params.id){
        console.log(user)
        if (user && user.communities.includes(params.id)){
            fetchCommunity();
            setEditComm(true)
        }else{
            setErrorPage("You do not have permission to view this page.")
        }
    } else{
        setDescription("")
        setEditComm(false)
        setName("")
    }
  }, [params.id]);

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
                if (err.status === 500 || err.response?.data.welcomePage){
                    setErrorPage(err.response?.data.error || "Please try again later.")
                }else
                    setError(err.response?.data.error || "Please try again later.");
            }
        }
    }

    async function handleDelete() {
        const confirm = window.confirm("Are you sure you want to delete this community? This cannot be undone.");
        if (!confirm) return;

        try {
        await axios.delete(`http://localhost:8000/delete-community/${params.id}`, {
            withCredentials: true
        });
        navigate("/profile");
        } catch (err) {
        console.error("Delete failed:", err);
        setError("Failed to delete community");
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        const links = validateLinks(description);
        if (!links.success) {
        setError(links.error);
        return;
        }

        try {
        await axios.put(`http://localhost:8000/update-community/${params.id}`, {
            name,
            description,
        }, {
            withCredentials: true
        });
        navigate(`/profile`); //or redirect to `/profile` or `/communities/${id}`
        } catch (err) {
            console.log(err)
            console.error("Community update failed:", err);
            if (err.status === 500 || err.response?.data.welcomePage){
                setErrorPage(err.response?.data.error || "Update failed.")
            }else
                setError(err.response?.data.error || "Update failed.");
        }
  }

    if (errorPage)
        return(<ErrorPage error={errorPage}/>)
    return(
        <form className="create-page" id="create-community-form" onSubmit={editComm ? handleSave : handleForm}>
            <h2>{editComm ? "Edit Community" : "New Community"}</h2>
            <TextBox onChange={e => setName(e.target.value)} value={name} name="Community Name" maxchars="100" placeholder="Name...(Max 100 Characters)"/>
            <TextBox onChange={e => setDescription(e.target.value)} value={description} multiline={true} maxchars="500" name="Community Description" placeholder="Description...(Max 500 Characters)"/>
            <span style={{color: "red", display: "block"}}>{error ? (`${error}`) : ('')}</ span>
            <input className="submit-button" type="submit" value={editComm ? "Save Changes" : "Engender Community"} />
            {editComm && (      
                <button type="button" className="submit-button" onClick={handleDelete} style={{ marginTop: "1rem", backgroundColor: '#cc0000' }}>
                    Delete Community
                </button>)}
        </ form>
    );
}