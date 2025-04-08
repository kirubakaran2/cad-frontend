import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";

const ModelViewer = ({ modelUrl, type }) => {
  let Model;

  if (type === "gltf" || type === "glb") {
    Model = () => {
      const gltf = useLoader(GLTFLoader, modelUrl);
      return <primitive object={gltf.scene} scale={1.5} />;
    };
  } else if (type === "obj") {
    Model = () => {
      const obj = useLoader(OBJLoader, modelUrl);
      return <primitive object={obj} scale={1.5} />;
    };
  } else if (type === "stl") {
    Model = () => {
      const geometry = useLoader(STLLoader, modelUrl);
      return (
        <mesh>
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial color="gray" />
        </mesh>
      );
    };
  } else if (type === "fbx") {
    Model = () => {
      const fbx = useLoader(FBXLoader, modelUrl);
      return <primitive object={fbx} scale={1.5} />;
    };
  } else if (type === "dae" ) {
    Model = () => {
      const collada = useLoader(ColladaLoader, modelUrl);
      return <primitive object={collada.scene} scale={1.5} />;
    };
  } else {
    return <p>Unsupported file format</p>;
  }

  return (
    <Canvas style={{ width: "100%", height: "500px" }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} />
      <Model />
      <OrbitControls />
    </Canvas>
  );
};

export default ModelViewer;
