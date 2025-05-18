import "../stylesheets/forms.css"; 
import { useNavigate, useParams } from "react-router-dom";
import { TextBox, validateLinks, DropDown } from "./FormComponents";
import { useEffect, useState } from "react";
import axios from "axios";
import { ErrorPage } from "./WelcomePage";

export default function PostCreatePage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [error, setError] = useState('');
    const [communities, setCommunities] = useState([]);
    const [linkFlairs, setLinkFlairs] = useState([]);
    const [errorPage, setErrorPage] = useState(null);
    const [edit, setEdit] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedCommunity, setSelectedCommunity] = useState("");
    const [selectedFlair, setSelectedFlair] = useState("");
    const [customFlairText, setCustomFlairText] = useState("");

    useEffect(() => {

        
        if (id && JSON.parse(localStorage.getItem("user"))){
        axios.get(`http://localhost:8000/posts/${id}`, { withCredentials: true })
            .then(res => {
                const post = res.data;
                setTitle(post.title);
                setContent(post.content);
                setSelectedCommunity(post.communityId); //should be a valid _id
                setSelectedFlair(post.linkFlairID || "");
            })
            .catch(err => {
                console.error("Error loading post:", err);
                setError("Could not load post for editing.");
            });
            setEdit(true);
        }else{
            setEdit(false);
            setTitle("");
            setContent("");
            setSelectedCommunity(""); //should be a valid _id
            setSelectedFlair("");
            setCustomFlairText("")
        }
    }, [id]);
    
    useEffect(() => {
        async function fetchData() {
            try {
                const [comRes, flairRes, joinedRes] = await Promise.all([
                    axios.get("http://localhost:8000/communities"),
                    axios.get("http://localhost:8000/linkflairs"),
                    axios.get("http://localhost:8000/user-communities", { withCredentials: true })
                ]);
                //sort joined communities first
                const joinedIds = new Set(joinedRes.data.map(c => c._id));
                const sortedCommunities = [
                    ...comRes.data.filter(c => joinedIds.has(c._id)),
                    ...comRes.data.filter(c => !joinedIds.has(c._id))
                ];

                setCommunities(sortedCommunities);
                setLinkFlairs(flairRes.data);
            } catch (err) {
                console.error("Failed to fetch form data:", err);
                setErrorPage(err.response?.data || "Failed to load form options");
            }
        }
        fetchData();
    }, []);

    if (errorPage)
        return(<ErrorPage error={errorPage}/>)

    async function handleForm(e){
        e.preventDefault();
        const data = new FormData(e.target);
        const content = data.get("Content");
        const links = validateLinks(content);
        if (!links.success){
            setError(links.error);
            return;
        }
        
        //const postUser = data.get("Username")
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
                //postedBy: postUser,
                //postedDate: new Date(),
                //commentIDs: [],
                //views: 0,
            };
            try {
                await axios.post(`http://localhost:8000/communities/${communityID}/new-post`, newPost, {
                    withCredentials: true
                });
                navigate("/home");
            } catch (err) {
                console.error("Post creation failed:", err);
                const msg = err.response?.data?.error || "Failed to submit post";
                if (err.status === 500 || err.response.data.welcomePage === true)
                    setErrorPage(msg)
                else
                    setError(msg);
            }
        }

    async function handleUpdate(e){
        e.preventDefault();
        const links = validateLinks(content);
        if (!links.success){
            setError(links.error);
            return;
        }

        let flair = selectedFlair;
        if (!flair || flair === "none") {
            if (customFlairText.trim()) {
                try {
                    const newFlairRes = await axios.post("http://localhost:8000/new-linkflair", { content: customFlairText });
                    flair = newFlairRes.data._id;
                } catch (err) {
                    console.error("Failed to create custom flair:", err);
                    return setError("Failed to create custom flair");
                }
            } else {
                flair = null;
            }
        }

        const postData = {
            title,
            content,
            linkFlairID: flair,
        };

        try {
            await axios.put(`http://localhost:8000/update-post/${id}`, postData, { withCredentials: true });
            navigate("/profile");
        } catch (err) {
            console.error("Submit failed:", err);
            const msg = err.response?.data?.error || "Failed to submit post";
            setError(msg);
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

    async function handleDelete() {
      const confirmDelete = window.confirm("Are you sure you want to delete this post? This cannot be undone.");
      if (!confirmDelete) return;
    
      try {
        await axios.delete(`http://localhost:8000/delete-post/${id}`, {
          withCredentials: true
        });
        navigate("/profile");
      } catch (err) {
        console.error("Delete failed:", err);
        setError("Failed to delete post");
      }
    }

    return (
        <form className="create-page" id="create-community-form" onSubmit={edit ? handleUpdate : handleForm}>
             <h2>{edit ? "Edit Post" : "New Post"}</h2>
            <div className="form-group">
                <DropDown name="Community" values={values} selected={selectedCommunity} onChange={(val) => {setSelectedCommunity(val)}} disabled={edit} />
            </div>
            <div className="form-group">
                <TextBox name="Title" maxchars="100" placeholder="Title...(Max 100 Characters)" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
                <DropDown
                    name="Link Flair"
                    placeholder="Custom/None"
                    values={flairs}
                    required={false}
                    customInput={true}
                    customAttributes={customFlair}
                    selected={selectedFlair}
                    customValue={customFlairText}
                    onChange={val => setSelectedFlair(val)}
                    onCustomChange={e => setCustomFlairText(e.target.value)}
                />
            </div>
            <div className="form-group">
                <TextBox name="Content" multiline={true} value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <span style={{ color: "red", display: "block" }}>{error && error}</span>
            <input className="submit-button" type="submit" value={edit ? "Save Changes" : "Submit Post"} />
            {edit && (<button
                type="button"
                className="submit-button"
                style={{ marginTop: "1rem", backgroundColor: "#cc0000" }}
                onClick={ handleDelete}
            >
                Delete Post
            </button>)}
        </form>
    );
}    