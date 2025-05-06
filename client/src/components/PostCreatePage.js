import "../stylesheets/forms.css"; 
import { useNavigate } from "react-router-dom";
import { TextBox, validateLinks, DropDown } from "./FormComponents";
import { useEffect, useState } from "react";
import axios from "axios";

export default function PostCreatePage() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [communities, setCommunities] = useState([]);
    const [linkFlairs, setLinkFlairs] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [comRes, flairRes] = await Promise.all([
                    axios.get("http://localhost:8000/communities"),
                    axios.get("http://localhost:8000/linkflairs")
                ]);
                setCommunities(comRes.data);
                setLinkFlairs(flairRes.data);
            } catch (err) {
                console.error("Failed to fetch form data:", err);
                setError("Failed to load form options");
            }
        }
        fetchData();
    }, []);

    async function handleForm(e){
        e.preventDefault();
        const data = new FormData(e.target);
        const content = data.get("Content");
        const links = validateLinks(content);
        if (!links.success){
            setError(links.error);
            return;
        }
        
        const postUser = data.get("Username")
        const communityID = data.get("Community");

        let flair = data.get("Link Flair")
        if (flair === "" || flair === "none"){
            const custom = data.get("Custom Flair");
            if (custom){
                try {
                    const newFlairRes = await axios.post("http://localhost:8000/new-linkflair", { content: custom });
                    flair = newFlairRes.data._id;
                } catch (err) {
                    console.error("Failed to create custom flair:", err);
                    return setError("Failed to create custom flair");
                }
            } else {
                flair = null
            }
        }

            const newPost = {
                title: data.get("Title"),
                content: data.get("Content"),
                linkFlairID: flair,
                postedBy: postUser,
                postedDate: new Date(),
                commentIDs: [],
                views: 0,
            };
            try {
                await axios.post(`http://localhost:8000/communities/${communityID}/new-post`, newPost);
                navigate(`/`);
            } catch (err) {
                console.error("Post creation failed:", err);
                setError("Failed to submit post");
            }
        }


    const values = {};
    communities.forEach(c => values[c.name] = c._id);
    
    const flairs = {};
    linkFlairs.forEach(f => flairs[f.content] = f._id);

    const customFlair = {
        maxchars: "30",
        required: false,
        name: "Custom Flair",
        placeholder: "Flair...(Max 30 Characters)"
    };


    return(
        <form className="create-page" id="create-community-form" onSubmit={handleForm}>
            <DropDown name="Community" values={values}/>
            <TextBox name="Title" maxchars="100" placeholder="Title...(Max 100 Characters)"/>
            <DropDown name="Link Flair" placeholder="Custom/None" values={flairs} required={false} customInput={true} customAttributes={customFlair}/>
            <TextBox name="Content" multiline={true}/>
            <span style={{color: "red", display: "block"}}>{error ? (`${error}`) : ('')}</ span>
            <TextBox name="Username" placeholder="Username..."/>
            <input className="submit-button" type="submit" value="Submit Post" />
        </ form>
    );
}