import React, { useState, useEffect } from "react";
import axios from "axios";
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

const AssetManager = () => {
  const [assets, setAssets] = useState([]);
  const [file, setFile] = useState(null);
  const [activeModelId, setActiveModelId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("models");
  const Baseurl = "http://localhost:5000";

  // Fetch assets from the backend
  useEffect(() => {
    axios
      .get(`${Baseurl}/assets`)
      .then((response) => {
        console.log("Fetched assets:", response.data); // Log fetched assets for debugging
        setAssets(response.data);
      })
      .catch((error) => console.error("Error fetching assets:", error));
  }, []);

  // Handle asset deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await axios.delete(`${Baseurl}/assets/${id}`);
      setAssets((prev) => prev.filter((asset) => asset._id !== id));
      if (activeModelId === id) setActiveModelId(null);
    } catch (error) {
      alert("Error deleting asset: " + error.message);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${Baseurl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.message === "File already exists with the same version") {
        alert(response.data.message);
      } else {
        setAssets((prev) => [...prev, response.data.asset]);
      }
    } catch (error) {
      alert("Error uploading file: " + error.message);
    }
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

  // const handleDownload = (id) => {
  //   const token = localStorage.getItem("token"); // or however you're storing JWT
  //   console.log(id);
  //   {}
   
  //   fetch(`${Baseurl}/download/${id}`, {
  //     method: "GET",
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   })
  //     .then((response) => {
  //       if (!response.ok) throw new Error("Failed to download file");
  
  //       return response.blob(); // convert response to Blob
  //     })
  //     .then((blob) => {
  //       const url = window.URL.createObjectURL(new Blob([blob]));
  //       const link = document.createElement("a");
  
  //       // Optional: dynamically name the file if needed
  //       link.href = url;
  //       link.setAttribute("download", "asset_file"); // You can extract actual name if needed
  //       document.body.appendChild(link);
  //       link.click();
  //       link.remove();
  //     })
  //     .catch((error) => {
  //       console.error("Download error:", error);
  //       alert("Failed to download file");
  //     });
  // };
  const handleDownload = (id) => {
    const token = localStorage.getItem("token");
  
    fetch(`${Baseurl}/download/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to download file");
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob); // No double blob
        const link = document.createElement("a");
        link.href = url;
  
        // Optional: Get filename from content-disposition
        const filename = "asset_file"; // change this if needed
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url); // clean up
      })
      .catch((error) => {
        console.error("Download error:", error);
        alert("Failed to download file");
      });
  };
  

  return (
    <>
      <h1
        style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "2rem" }}
      >
        AR/VR Asset Manager
      </h1>
      <div
        style={{ height: "100vh", backgroundColor: "#f7fafc", display: "flex" }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: "16rem",
            backgroundColor: "#2d3748",
            color: "white",
            padding: "1rem",
          }}
        >
          <nav>
            <div>
              {Object.keys(categoryDescriptions).map((category) => (
                <div key={category} style={{ marginBottom: "0.5rem" }}>
                  <button
                    onClick={() => setActiveCategory(category)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      backgroundColor:
                        activeCategory === category ? "#3182ce" : "transparent",
                      color: "white",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#4a5568")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor =
                        activeCategory === category ? "#3182ce" : "transparent")
                    }
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
          </h2>

          <div
            style={{
              backgroundColor: "white",
              padding: "1rem",
              borderRadius: "0.375rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ color: "#4a5568" }}>
              {categoryDescriptions[activeCategory]}
            </p>
          </div>

          {/* Upload Form */}
          <div
            style={{
              backgroundColor: "white",
              padding: "1rem",
              borderRadius: "0.375rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
              }}
            >
              Upload New Asset
            </h3>
            <form
              onSubmit={handleFileUpload}
              style={{ display: "flex", gap: "0.5rem" }}
            >
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                required
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #e2e8f0",
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "#3182ce",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#2b6cb0")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#3182ce")
                }
              >
                Upload
              </button>
            </form>
          </div>

          {/* Asset Grid */}
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
                      <div className="mt-2 h-40 border">
                        {asset.base64Data ? (
                          <ErrorBoundary>
                            <ModelViewer
                              modelUrl={getBase64URL(asset.base64Data, asset.type)}
                              type={asset.name.split(".").pop()}
                            />
                          </ErrorBoundary>
                        ) : (
                          <p className="text-red-500">Model data is missing.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeCategory === "textures" && (
                  <div className="mb-2">
                    <img
                      src={getBase64URL(asset.base64Data, asset.type)}
                      alt={asset.name}
                      className="max-w-full h-32 object-contain mb-2"
                    />
                  </div>
                )}

                {activeCategory === "sounds" && (
                  <div className="mb-2">
                    <audio controls className="w-full">
                      <source
                        src={getBase64URL(asset.base64Data, asset.type)}
                        type={asset.type}
                      />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <a
                    href={getBase64URL(asset.base64Data, asset.type)}
                    //
                    download={asset.name}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => handleDelete(asset._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AssetManager;