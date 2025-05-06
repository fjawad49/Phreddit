import {useState} from "react"
import { useNavigate } from "react-router-dom";
import "../stylesheets/forms.css";
import {loginUser} from "./Api";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    try {
        const res = await loginUser({ email, password });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("user", JSON.stringify(data)); //store user info
            navigate("/home");
        } else {
            setError(data.error || "Login failed.");
        }
        } catch (err) {
        setError("Server error during login.");
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
