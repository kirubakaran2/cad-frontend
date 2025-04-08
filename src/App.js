import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  CloudArrowUpIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import ModelViewer from "./Components/ModelViewer";

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
  const [showSignup, setShowSignup] = useState(false);
  const [sharedLink, setSharedLink] = useState("");
  const [previewAsset, setPreviewAsset] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const Baseurl = process.env.REACT_APP_API_URL || "https://cad-backend-ecy3.onrender.com";

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

  const handleSignup = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${Baseurl}/signup`, {
        username,
        password,
        email,
      });
      toast.success(response.data.message);
      setShowSignup(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error signing up");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${Baseurl}/login`, {
        username,
        password,
      });
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userid", response.data.userid);
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error logging in");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPublic", isPublic);
    formData.append("category", activeCategory);

    setLoading(true);
    try {
      const response = await axios.post(`${Baseurl}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (
        response.data.message === "File already exists with the same version"
      ) {
        toast.info(response.data.message);
      } else {
        setAssets((prev) => [...prev, response.data.asset]);
        toast.success("File uploaded successfully");
      }
    } catch (error) {
      toast.error("Error uploading file: " + error.message);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

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

  const handleSharedLinkPreview = async () => {
    if (!sharedLink) {
      toast.error("Please enter a shared link");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${Baseurl}/assets/public/${sharedLink}`
      );
      setPreviewAsset(response.data);
      setIsModelLoaded(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching asset");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userid");
    setToken("");
    setAssets([]);
    toast.success("Logged out successfully");
  };

  const getCategoryFromFilePath = (filePath) => {
    const segments = filePath.split(/[\\/]/);
    return segments[segments.length - 1];
  };

  const getBase64URL = (base64, mimeType) =>
    `data:${mimeType};base64,${base64}`;

  const categoryDescriptions = {
    models: "3D models for AR/VR experiences",
    textures: "Texture images for surface details",
    animations: "Animation files for 3D models",
    sounds: "Sound effects and audio tracks",
  };

  const filteredAssets = assets.filter(
    (a) => getCategoryFromFilePath(a.category) === activeCategory
  );

  const handleDownload = (id) => {
    const token = localStorage.getItem("token");

    fetch(`${Baseurl}/download/${id}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to download file");
        }

        const disposition = response.headers.get("Content-Disposition");
        let filename = "downloaded_file";

        if (disposition && disposition.includes("filename=")) {
          const match = disposition.match(/filename="?([^"]+)"?/);
          if (match?.[1]) {
            filename = match[1];
          }
        }

        const contentType = response.headers.get("Content-Type");

        const mimeToExtension = {
          "model/vnd.collada+xml": ".dae",
          "model/gltf+json": ".gltf",
          "model/gltf-binary": ".glb",
          "application/octet-stream": ".bin",
        };

        const extension = mimeToExtension[contentType] || "";

        if (!filename.includes(".")) {
          filename += extension;
        }

        return response.blob().then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        });
      })
      .catch((error) => {
        console.error("Download error:", error);
        toast.error("Failed to download file");
      });
  };

  const handleDeleteshow = (asset) => {
    const user = localStorage.getItem("userid");
    return user === asset;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 flex gap-3 items-center">
          <img src="/vector.jpg" alt="" className="w-10 h-10"/>
          <div>AR/VR Asset Manager</div>
        </h1>
        {token && (
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-blue-500" />
              {username}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all flex items-center"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg p-6 border-r">
          <nav>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Categories
            </h2>
            <div className="space-y-2">
              {Object.keys(categoryDescriptions).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    activeCategory === category
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          {/* Authentication Section */}
          {!token ? (
            <div className="max-w-md mx-auto bg-white shadow-xl rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                {showSignup ? "Create Your Account" : "Welcome Back"}
              </h2>

              <div className="space-y-4">
                {showSignup && (
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                )}
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                />

                <div className="flex space-x-4">
                  <button
                    onClick={showSignup ? handleSignup : handleLogin}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition-all"
                  >
                    {loading
                      ? showSignup
                        ? "Signing Up..."
                        : "Logging In..."
                      : showSignup
                      ? "Sign Up"
                      : "Log In"}
                  </button>
                  <button
                    onClick={() => setShowSignup(!showSignup)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    {showSignup ? "Switch to Login" : "Switch to Signup"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Upload Form */}
              <div className="mb-8 bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <CloudArrowUpIcon className="w-6 h-6 mr-2 text-blue-500" />
                  Upload New Asset
                </h2>
                <form onSubmit={handleFileUpload} className="flex space-x-4">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                    className="flex-1 p-3 border border-gray-300 rounded-lg"
                  />
                  <label className="flex items-center space-x-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="form-checkbox rounded text-blue-500"
                    />
                    <span>Make Public</span>
                  </label>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all"
                  >
                    {loading ? "Uploading..." : "Upload"}
                  </button>
                </form>
              </div>

              {/* Shared Link Preview */}
              <div className="mb-8 bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Preview Shared Asset
                </h2>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Enter shared link"
                    value={sharedLink}
                    onChange={(e) => setSharedLink(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={handleSharedLinkPreview}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all"
                  >
                    Preview
                  </button>
                </div>
                {/* {previewAsset && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold">{previewAsset.name}</h3>
                    {getCategoryFromFilePath(previewAsset.category) ===
                      "models" && (
                      <div className="mt-2">
                        <button
                          onClick={() => setIsModelLoaded(!isModelLoaded)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                        >
                          {isModelLoaded ? "Close Model" : "Load Model"}
                        </button>
                        {isModelLoaded && previewAsset.base64Data && (
                          <ErrorBoundary>
                            <ModelViewer
                              modelUrl={getBase64URL(
                                previewAsset.base64Data,
                                previewAsset.type
                              )}
                              type={previewAsset.name.split(".").pop()}
                            />
                          </ErrorBoundary>
                        )}
                      </div>
                    )}
                  </div>
                )} */}
                {previewAsset && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">{previewAsset.name}</h3>

                    {getCategoryFromFilePath(previewAsset.category) ===
                      "models" && (
                      <div className="mb-4">
                        <button
                          onClick={() => setIsModelLoaded(!isModelLoaded)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        >
                          {isModelLoaded ? "Close Model" : "Load Model"}
                        </button>

                        {isModelLoaded && (
                          <div className="mt-4 border p-4 rounded-lg bg-white">
                            {previewAsset.base64Data ? (
                              <ErrorBoundary>
                                <div className="h-60 w-full flex items-center justify-center">
                                  <ModelViewer
                                    modelUrl={getBase64URL(
                                      previewAsset.base64Data,
                                      previewAsset.type
                                    )}
                                    type={previewAsset.name.split(".").pop()}
                                  />
                                </div>
                              </ErrorBoundary>
                            ) : (
                              <p className="text-red-500">
                                Model data is missing.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Copy Link & Download Buttons */}
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${Baseurl}/assets/public/${previewAsset.privateLink}`
                          )
                        }
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset._id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-[1.02] hover:shadow-xl"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-800">
                          {asset.name}
                          <span className="text-sm text-gray-500 ml-2">
                            (v{asset.version})
                          </span>
                        </h3>
                        {handleDeleteshow(asset.owner) && (
                          <button
                            onClick={() => handleDelete(asset._id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {/* Model Preview Logic */}
                      {activeCategory === "models" && asset.base64Data && (
                        <div className="mb-4">
                          <button
                            onClick={() =>
                              setActiveModelId(
                                activeModelId === asset._id ? null : asset._id
                              )
                            }
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center"
                          >
                            <EyeIcon className="w-5 h-5 mr-2" />
                            {activeModelId === asset._id
                              ? "Close Model"
                              : "View Model"}
                          </button>

                          {activeModelId === asset._id && (
                            <div className="mt-4 border rounded-lg overflow-hidden">
                              <ModelViewer
                                modelUrl={getBase64URL(
                                  asset.base64Data,
                                  asset.type
                                )}
                                type={asset.name.split(".").pop()}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Category:</strong>{" "}
                          {getCategoryFromFilePath(
                            asset.category
                          ).toUpperCase()}
                        </p>
                        <p>
                          <strong>Uploaded:</strong>{" "}
                          {new Date(asset.uploadDate).toLocaleString()}
                        </p>
                        {!asset.isPublic && (
                          <p>
                            <strong>Private Link: </strong>
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
                      </div>

                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() => handleDownload(asset._id)}
                          className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all flex items-center justify-center"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
