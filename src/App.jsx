import React, { useState } from "react";
import { Loader2, Upload, ImagePlus, PlusCircle } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Firebase Setup ---
const firebaseConfig = {
  apiKey: "AIzaSyAiv_DQMuczXR3cFp3-4tu5qYzGCcga8kI",
  authDomain: "dash-scene-studio.firebaseapp.com",
  projectId: "dash-scene-studio",
  storageBucket: "dash-scene-studio.firebasestorage.app",
  messagingSenderId: "730304435",
  appId: "1:730304435:web:eb79b75293b8f12b8145c6",
  measurementId: "G-SS5X5RVQLJ",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// --- Gemini Setup ---
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image-preview",
});

export default function App() {
  const [avatar, setAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [style, setStyle] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [clothingFocus, setClothingFocus] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageURL, setImageURL] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showStyleInput, setShowStyleInput] = useState(false);
  const [customStyle, setCustomStyle] = useState("");
  const [showPaletteInput, setShowPaletteInput] = useState(false);
  const [customPalette, setCustomPalette] = useState("");
  const [showClothingInput, setShowClothingInput] = useState(false);
  const [customClothing, setCustomClothing] = useState("");

  // ---- Upload Avatar ----
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setAvatar(downloadURL);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  // ---- Generate Scene ----
  const handleGenerateScene = async () => {
    if (!avatar) {
      alert("Please upload your avatar first.");
      return;
    }

    setLoading(true);
    setImageURL(null);

    try {
      const response = await fetch(avatar);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];

        const userPrompt = `
        Create a new 9:16 image using the uploaded avatar as a visual reference.
        Maintain the avatar’s face and likeness.
        Style theme: ${style || "Default"}.
        Color palette: ${colorPalette || "Default"}.
        Clothing focus: ${clothingFocus || "Default"}.
        Scene description: ${prompt || "Cinematic background, soft lighting."}
        Return a clear portrait composition.
        `;

        const result = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${
            import.meta.env.VITE_GEMINI_API_KEY
          }`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: userPrompt },
                    {
                      inlineData: {
                        mimeType: blob.type,
                        data: base64,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        const data = await result.json();

        if (data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
          const imageBase64 =
            data.candidates[0].content.parts[0].inlineData.data;
          setImageURL(`data:image/png;base64,${imageBase64}`);
        } else {
          console.error("Gemini returned unexpected response:", data);
          alert("Gemini did not return an image. Try changing your style or scene description.");
        }

        setLoading(false);
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error generating scene:", error);
      alert("Error generating scene. Check console for details.");
      setLoading(false);
    }
  };

  // ---- Lists ----
  const styles = [
    "Dark Academia Aesthetic",
    "Kawaii",
    "Athletic Performance Gear",
    "Casual Streetwear",
    "Formal Evening Attire",
    "Gothic Fantasy",
    "Cyberpunk Neon",
    "Steampunk Brass & Leather",
    "Sci-Fi Space Opera",
    "High Fashion Photography",
    "Urban Street Style",
    "Bohemian Chic",
    "Vaporwave Aesthetic",
    "Rustic Woodland Explorer",
    "Grunge Aesthetic",
  ];

  const colorPalettes = [
    { name: "Ocean Mist", colors: ["#5F9EA0", "#B0C4DE", "#E6E6FA"], description: "Soft blues, seafoam green, and lavender." },
    { name: "Desert Sunset", colors: ["#CD5C5C", "#F4A460", "#F0E68C"], description: "Deep reds, vibrant oranges, and warm sand tones." },
    { name: "Vibrant Pop", colors: ["#FF69B4", "#00FFFF", "#FFD700"], description: "Hot pink, electric cyan, and bright gold accents." },
    { name: "Monochrome Cool", colors: ["#2F4F4F", "#A9A9A9", "#DCDCDC"], description: "Dark slate gray, neutral gray, and silvery white." },
    { name: "Earthy Jewel Tones", colors: ["#8B4513", "#228B22", "#800080"], description: "Rich brown, deep forest green, and royal purple." },
    { name: "Pastel Dreams", colors: ["#FADADD", "#B0E0E6", "#FAFAD2"], description: "Soft rose, baby blue, and pale yellow." },
  ];

  const clothingFocuses = [
    "Full Dress or Gown",
    "Pants and Top (Trousers, Jeans, etc.)",
    "Shorts and Top",
    "Skirt and Top",
    "Jumpsuit or Romper",
    "Specific Outerwear (Coat, Jacket, Cape)",
    "Swimwear or Beach Attire",
  ];

  // ---- UI ----
  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 bg-gradient-to-br from-white via-pink-50 to-pink-100">
      <h1 className="text-3xl font-bold text-center text-pink-600 mb-6">
        ✿ DASH Scene Studio
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Upload your avatar, pick your vibe, and let Gemini bring it to life.
      </p>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="space-y-6">
          {/* Upload Avatar */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-pink-200">
            <h2 className="font-semibold text-pink-600 mb-2">① Upload Your Avatar</h2>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            {uploading ? (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} /> Uploading...
              </p>
            ) : avatar ? (
              <img src={avatar} alt="avatar" className="rounded-xl w-full border mt-2" />
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-pink-300 rounded-xl p-6 text-gray-400">
                <Upload size={20} className="mb-2" />
                Upload or drag an image here
              </div>
            )}
          </div>

          {/* Style Picker */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-pink-200">
            <h2 className="font-semibold text-pink-600 mb-2">② Choose Style</h2>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`p-2 text-sm rounded-md border transition-all ${
                    style === s
                      ? "bg-pink-500 text-white border-pink-600"
                      : "hover:bg-pink-100 hover:text-pink-600 border-pink-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-pink-200">
            <h2 className="font-semibold text-pink-600 mb-2">③ Choose Color Palette</h2>
            {colorPalettes.map((p) => (
              <button
                key={p.name}
                onClick={() => setColorPalette(p.name)}
                className={`w-full flex items-center justify-between rounded-md border p-2 text-sm transition-all ${
                  colorPalette === p.name
                    ? "bg-pink-500 text-white border-pink-600"
                    : "hover:bg-pink-100 hover:text-pink-600 border-pink-200"
                }`}
              >
                <span>
                  <strong>{p.name}</strong>
                  <div className="text-xs opacity-80">{p.description}</div>
                </span>
                <div className="flex gap-1">
                  {p.colors.map((c, i) => (
                    <span key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c }}></span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Clothing */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-pink-200">
            <h2 className="font-semibold text-pink-600 mb-2">④ Clothing Focus</h2>
            <div className="grid grid-cols-2 gap-2">
              {clothingFocuses.map((c) => (
                <button
                  key={c}
                  onClick={() => setClothingFocus(c)}
                  className={`p-2 text-sm rounded-md border transition-all ${
                    clothingFocus === c
                      ? "bg-pink-500 text-white border-pink-600"
                      : "hover:bg-pink-100 hover:text-pink-600 border-pink-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-pink-200">
            <h2 className="font-semibold text-pink-600 mb-2">⑤ Describe the Scene</h2>
            <textarea
              className="w-full border rounded-md p-3 text-sm mb-4"
              placeholder="E.g., Standing on a futuristic bridge overlooking city lights..."
              rows="3"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleGenerateScene}
              disabled={loading}
              className="w-full bg-pink-500 text-white font-medium py-2 rounded-lg hover:bg-pink-600 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
              {loading ? "Generating..." : "Generate Scene (9:16)"}
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-md text-center border border-pink-200">
            <h2 className="font-semibold text-pink-600 mb-2">⑥ Generated Scene</h2>
            {loading ? (
              <div className="flex justify-center items-center h-96 text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Generating...
              </div>
            ) : imageURL ? (
              <img
                src={imageURL}
                alt="Generated scene"
                className="rounded-xl mx-auto border w-auto h-[600px] object-cover"
              />
            ) : (
              <div className="flex flex-col justify-center items-center border-2 border-dashed border-pink-300 rounded-xl h-96 text-gray-400">
                <ImagePlus size={22} className="mb-2" />
                Your generated scene will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
