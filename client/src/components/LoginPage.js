import {useEffect, useState} from "react"
import { useNavigate } from "react-router-dom";
import "../stylesheets/forms.css";
import {loginUser} from "./Api";
import axios from 'axios';

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    try{
      async function fetchUser () {
        var res = await axios.get("http://localhost:8000/check-login", { withCredentials:true })
        console.log(!res.data)
        if (!res.data){
          localStorage.removeItem('user')
        } else{
          localStorage.setItem('user', JSON.stringify(res.data))
          navigate("/home");
        }      
      }
      
      fetchUser()

    }catch (err){
      console.log(err)
      setError(err.response.data.error);
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    try {
        const res = await axios.post("http://localhost:8000/login", { email, password }, {withCredentials: true})

        if (res.status === 200) {
            console.log(res.data)
            localStorage.setItem("user", JSON.stringify(res.data)); //store user info
            navigate("/home");
        } else {
            setError(res.data.error || "Login failed.");
        }
    } catch (err) {
      console.log(err)
      setError(err.response?.data.error  || "Login failed.");
    }
  };

  return (
    <form className="create-page" onSubmit={handleSubmit}>
      <h2>Log In</h2>
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <input
        className="entryfield"
        type="email"
        name="email"
        placeholder="Email"
        onChange={handleChange}
      />
      <input
        className="entryfield"
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        style={{ marginTop: "10px" }}
      />
      <input type="submit" className="submit-button" value="Log In" />
    </form>
  );
}
