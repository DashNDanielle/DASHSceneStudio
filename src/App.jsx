import React, { useState } from "react";
import { Loader2, Upload, ImagePlus, PlusCircle } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// 🌸 DASH Scene Studio card styling
const cardClass = "card p-6 space-y-3";

// --- Firebase Setup (replace values) ---
const firebaseConfig = {
  apiKey: "AIzaSyAiv_DQMuczXR3cFp3-4tu5qYzGCcga8kI",
  authDomain: "dash-scene-studio.firebaseapp.com",
  projectId: "dash-scene-studio",
  storageBucket: "dash-scene-studio.firebasestorage.app",
  messagingSenderId: "730304435",
  appId: "1:730304435:web:eb79b75293b8f12b8145c6",
  measurementId: "G-SS5X5RVQLJ"
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// --- Gemini Setup ---
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image-preview", // ✅ correct image generator model
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

  // Custom inputs
  const [customStyle, setCustomStyle] = useState("");
  const [showStyleInput, setShowStyleInput] = useState(false);
  const [customPalette, setCustomPalette] = useState("");
  const [showPaletteInput, setShowPaletteInput] = useState(false);
  const [customClothing, setCustomClothing] = useState("");
  const [showClothingInput, setShowClothingInput] = useState(false);

  // ---- Step 1: Upload Avatar ----
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
    } finally {
      setUploading(false);
    }
  };

  // ---- Step 5: Generate Scene (Gemini Image Generation) ----
 // ---- Image Generation using Gemini 2.5 ----
const handleGenerateScene = async () => {
  if (!avatar) {
    alert("Please upload your avatar first.");
    return;
  }

  setLoading(true);
  setImageURL(null);

  try {
    // Convert uploaded avatar to base64 (so Gemini can edit it)
    const response = await fetch(avatar);
    const blob = await response.blob();
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];

      const prompt = `
        Create a new image using the uploaded character as reference.
        Maintain facial identity and proportions.
        Style: ${style || "Default"}
        Color Palette: ${colorPalette || "Default"}
        Clothing: ${clothingFocus || "Default"}
        Scene: ${prompt || "Creative portrait scene in 9:16 aspect ratio"}
        Keep vertical composition and cinematic lighting.
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
                  { text: prompt },
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
        console.error("Gemini API returned unexpected response:", data);
        alert("Error: Gemini did not return an image.");
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

  // ---- UI Options ----
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

  return (
   <div className="min-h-screen flex flex-col items-center py-10 px-4 bg-gradient-to-br from-white via-[#e0f2f1] to-[#ede9fe]">
      <h1 className="text-2xl font-semibold text-center text-emerald-700 mb-6">
        ✿ DASH Scene Studio
      </h1>
      <p className="text-center text-gray-500 mb-8">
        Define your avatar, pick a style, and describe the scene.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Step 1: Upload Avatar */}
          <div className={cardClass}>
            <h2 className="font-semibold text-emerald-700 mb-2">① Upload Your Avatar</h2>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="mb-3" />
            {uploading ? (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} /> Uploading...
              </p>
            ) : avatar ? (
              <img src={avatar} alt="avatar" className="rounded-xl w-full mt-2 border border-gray-200" />
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-400">
                <Upload size={20} className="mb-2" />
                Upload or drag an image here
              </div>
            )}
          </div>

          {/* Step 2: Choose Style */}
          <div className={cardClass}>
            <h2 className="font-semibold text-emerald-700 mb-2">② Choose Your Style</h2>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`p-2 text-sm rounded-md border ${
                    style === s ? "bg-emerald-100 border-emerald-400" : "hover:bg-gray-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {showStyleInput ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="Enter custom style..."
                  className="border rounded-md p-2 flex-1 text-sm"
                />
                <button
                  onClick={() => {
                    if (customStyle.trim()) {
                      setStyle(customStyle);
                      setShowStyleInput(false);
                      setCustomStyle("");
                    }
                  }}
                  className="bg-emerald-500 text-white px-3 py-2 rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowStyleInput(true)}
                className="mt-3 flex items-center gap-2 text-emerald-600 text-sm"
              >
                <PlusCircle size={16} /> Create My Own
              </button>
            )}
          </div>

          {/* Step 3: Choose Color Palette */}
          <div className={cardClass}>
            <h2 className="font-semibold text-emerald-700 mb-2">③ Choose Color Palette</h2>
            <div className="space-y-3">
              {colorPalettes.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setColorPalette(p.name)}
                  className={`w-full flex items-center justify-between rounded-md border p-2 text-sm ${
                    colorPalette === p.name ? "bg-emerald-100 border-emerald-400" : "hover:bg-gray-100"
                  }`}
                >
                  <span className="text-left">
                    <strong>{p.name}</strong>
                    <div className="text-xs text-gray-500">{p.description}</div>
                  </span>
                  <div className="flex gap-1">
                    {p.colors.map((c, i) => (
                      <span key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c }}></span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {showPaletteInput ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={customPalette}
                  onChange={(e) => setCustomPalette(e.target.value)}
                  placeholder="Enter custom palette..."
                  className="border rounded-md p-2 flex-1 text-sm"
                />
                <button
                  onClick={() => {
                    if (customPalette.trim()) {
                      setColorPalette(customPalette);
                      setShowPaletteInput(false);
                      setCustomPalette("");
                    }
                  }}
                  className="bg-emerald-500 text-white px-3 py-2 rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPaletteInput(true)}
                className="mt-3 flex items-center gap-2 text-emerald-600 text-sm"
              >
                <PlusCircle size={16} /> Create My Own
              </button>
            )}
          </div>

          {/* Step 4: Choose Clothing Focus */}
          <div className={cardClass}>
            <h2 className="font-semibold text-emerald-700 mb-2">④ Choose Clothing Focus</h2>
            <div className="grid grid-cols-2 gap-2">
              {clothingFocuses.map((c) => (
                <button
                  key={c}
                  onClick={() => setClothingFocus(c)}
                  className={`p-2 text-sm rounded-md border ${
                    clothingFocus === c ? "bg-emerald-100 border-emerald-400" : "hover:bg-gray-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {showClothingInput ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={customClothing}
                  onChange={(e) => setCustomClothing(e.target.value)}
                  placeholder="Enter custom clothing..."
                  className="border rounded-md p-2 flex-1 text-sm"
                />
                <button
                  onClick={() => {
                    if (customClothing.trim()) {
                      setClothingFocus(customClothing);
                      setShowClothingInput(false);
                      setCustomClothing("");
                    }
                  }}
                  className="bg-emerald-500 text-white px-3 py-2 rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClothingInput(true)}
                className="mt-3 flex items-center gap-2 text-emerald-600 text-sm"
              >
                <PlusCircle size={16} /> Create My Own
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 5: Scene Description */}
          <div className={cardClass}>
            <h2 className="font-semibold text-emerald-700 mb-2">⑤ Describe The Scene Details (Optional)</h2>
            <textarea
              className="w-full border rounded-md p-3 text-sm mb-4"
              placeholder="E.g., Standing on a futuristic bridge overlooking city lights at dusk..."
              rows="3"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleGenerateScene}
              disabled={loading}
              className="w-full bg-emerald-500 text-white font-medium py-2 rounded-lg hover:bg-emerald-600 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
              {loading ? "Generating..." : "Generate New Scene (9:16)"}
            </button>
          </div>

          {/* Step 6: Generated Scene */}
          <div className="bg-white p-5 rounded-2xl shadow-md text-center">
            <h2 className="font-semibold text-emerald-700 mb-2">⑥ Generated Scene (9:16 Portrait)</h2>
            {loading ? (
              <div className="flex justify-center items-center h-96 text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Generating...
              </div>
            ) : imageURL ? (
              <img src={imageURL} alt="Generated scene" className="rounded-xl mx-auto border w-auto h-[600px] object-cover" />
            ) : (
              <div className="flex flex-col justify-center items-center border-2 border-dashed border-gray-300 rounded-xl h-96 text-gray-400">
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
