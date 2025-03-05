import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipboardDocumentIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import ModelViewer from "./Components/ModelViewer";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in ModelViewer:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <p>Failed to load the model. Please try again.</p>;
    }
    return this.props.children;
  }
}

const App = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [assets, setAssets] = useState([]);
  const [file, setFile] = useState(null);
  const [activeModelId, setActiveModelId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("models");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(true);
  const [sharedLink, setSharedLink] = useState("");
  const [previewAsset, setPreviewAsset] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const Baseurl = "http://localhost:5000";

  // Fetch assets from the backend
  useEffect(() => {
    if (token) {
      fetchAssets();
    }
  }, [token]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${Baseurl}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssets(response.data);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Error fetching assets");
    } finally {
      setLoading(false);
    }
  };

  // Handle user signup
  const handleSignup = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${Baseurl}/signup`, { username, password, email });
      toast.success(response.data.message);
      setShowSignup(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error signing up");
    } finally {
      setLoading(false);
    }
  };

  // Handle user login
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${Baseurl}/login`, { username, password });
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error logging in");
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPublic", isPublic);

    setLoading(true);
    try {
      const response = await axios.post(`${Baseurl}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data.message === "File already exists with the same version") {
        alert(response.data.message);
      } else {
        setAssets((prev) => [...prev, response.data.asset]);
      }
    } catch (error) {
      alert("Error uploading file: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle asset deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await axios.delete(`${Baseurl}/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssets((prev) => prev.filter((asset) => asset._id !== id));
      if (activeModelId === id) setActiveModelId(null);
      toast.success("Asset deleted successfully");
    } catch (error) {
      toast.error("Error deleting asset: " + error.message);
    }
  };

  // Handle shared link preview
  const handleSharedLinkPreview = async () => {
    if (!sharedLink) {
      toast.error("Please enter a shared link");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${Baseurl}/assets/public/${sharedLink}`);
      setPreviewAsset(response.data);
      setIsModelLoaded(false); // Reset model loaded state
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching asset");
    } finally {
      setLoading(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard");
  };

  // Logout user
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setAssets([]);
    toast.success("Logged out successfully");
  };

  // Get category from file path
  const getCategoryFromFilePath = (filePath) => {
    const segments = filePath.split(/[\\/]/);
    return segments[segments.length - 1];
  };

  // Convert base64 data to a URL
  const getBase64URL = (base64, mimeType) =>
    `data:${mimeType};base64,${base64}`;

  // Category descriptions
  const categoryDescriptions = {
    models:
      "3D models are the foundation of AR/VR experiences. Upload and manage GLB, GLTF, OBJ, and other 3D model formats that bring your virtual worlds to life.",
    textures:
      "Textures add realism and detail to 3D models. Manage image files like PNG, JPG, and PSD that define how surfaces look with properties like color, reflectivity, and roughness.",
    animations:
      "Animations bring movement and life to static 3D models. Store animation files that control how characters and objects move within your AR/VR environment.",
    sounds:
      "Sound effects and audio tracks create immersive AR/VR experiences. Manage audio files like MP3, WAV, and OGG that provide spatial audio for your virtual environments.",
  };

  // Filter assets by active category
  const filteredAssets = assets.filter(
    (a) => getCategoryFromFilePath(a.category) === activeCategory
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-bold mb-8 text-center">AR/VR Asset Manager</h1>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 text-white p-4">
          <nav>
            <div>
              {Object.keys(categoryDescriptions).map((category) => (
                <div key={category} className="mb-2">
                  <button
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeCategory === category
                        ? "bg-blue-600"
                        : "bg-transparent hover:bg-gray-700"
                    } transition-colors`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Login and Signup Section */}
          {!token ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {showSignup ? "Signup" : "Login"}
              </h2>
              {showSignup && (
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 mb-4 border rounded"
                />
              )}
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 mb-4 border rounded"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 mb-4 border rounded"
              />
              <div className="flex gap-4">
                <button
                  onClick={showSignup ? handleSignup : handleLogin}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {loading ? (showSignup ? "Signing Up..." : "Logging In...") : showSignup ? "Signup" : "Login"}
                </button>
                <button
                  onClick={() => setShowSignup(!showSignup)}
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                >
                  {showSignup ? "Switch to Login" : "Switch to Signup"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Welcome, {username}
              </h2>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          )}

          {/* Upload Form */}
          {token && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Upload New Asset</h2>
              <form onSubmit={handleFileUpload} className="flex gap-4">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  className="flex-1 p-2 border rounded"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  Make Public
                </label>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {loading ? "Uploading..." : "Upload"}
                </button>
              </form>
            </div>
          )}

          {/* Shared Link Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Preview Shared Asset</h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Paste shared link here"
                value={sharedLink}
                onChange={(e) => setSharedLink(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleSharedLinkPreview}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Preview
              </button>
            </div>
            {previewAsset && (
  <div className="mt-4">
    <h3 className="font-semibold mb-2">{previewAsset.name}</h3>
    {getCategoryFromFilePath(previewAsset.category) === "models" && (
      <div className="mb-4">
        <button
          onClick={() => setIsModelLoaded(!isModelLoaded)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          {isModelLoaded ? "Close Model" : "Load Model"}
        </button>
        {isModelLoaded && (
          <div className="mt-4 border p-4 rounded-lg bg-gray-50">
            {previewAsset.base64Data ? (
              <ErrorBoundary>
                <div className="h-60 w-full flex items-center justify-center">
                  <ModelViewer
                    modelUrl={getBase64URL(previewAsset.base64Data, previewAsset.type)}
                    type={previewAsset.name.split(".").pop()}
                  />
                </div>
              </ErrorBoundary>
            ) : (
              <p className="text-red-500">Model data is missing.</p>
            )}
          </div>
        )}
      </div>
    )}
    <div className="flex gap-4">
      <button
        onClick={() => copyToClipboard(`${Baseurl}/assets/public/${previewAsset.privateLink}`)}
        className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors flex items-center gap-2"
      >
        <ClipboardDocumentIcon className="w-5 h-5" />
        Copy Link
      </button>
      <a
        href={`${Baseurl}/uploads/${previewAsset.category}/${previewAsset.name}`}
        download={previewAsset.name}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        <ArrowDownTrayIcon className="w-5 h-5" />
        Download
      </a>
    </div>
  </div>
)}
          </div>

          {/* Asset Grid */}
          {token && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <div key={asset._id} className="bg-white p-4 rounded shadow">
                  <p className="font-medium mb-2">
                    {asset.name}{" "}
                    <span className="text-gray-500">(v{asset.version})</span>
                  </p>

                  {/* Display based on type */}
                  {activeCategory === "models" && (
                    <div className="mb-2">
                      <button
                        onClick={() =>
                          setActiveModelId(
                            activeModelId === asset._id ? null : asset._id
                          )
                        }
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 mr-2"
                      >
                        {activeModelId === asset._id
                          ? "Close Model"
                          : "Load Model"}
                      </button>
                      {activeModelId === asset._id && (
                        <div className="mt-2 border p-4 rounded-lg bg-gray-50">
                          {asset.base64Data ? (
                            <ErrorBoundary>
                              <div className="h-60 w-full flex items-center justify-center">
                                <ModelViewer
                                  modelUrl={getBase64URL(asset.base64Data, asset.type)}
                                  type={asset.name.split(".").pop()}
                                />
                              </div>
                            </ErrorBoundary>
                          ) : (
                            <p className="text-red-500">Model data is missing.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other asset details */}
                  <p>Category: {asset.category}</p>
                  <p>Upload Date: {new Date(asset.uploadDate).toLocaleString()}</p>
                  {!asset.isPublic && (
                    <p>
                      Private Link:{" "}
                      <a
                        href={`${Baseurl}/assets/public/${asset.privateLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Share Link
                      </a>
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => handleDelete(asset._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                    <a
                      href={`${Baseurl}/uploads/${asset.category}/${asset.name}`}
                      download={asset.name}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;