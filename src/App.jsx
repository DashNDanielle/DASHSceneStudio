import React, { useState } from "react";
import { Loader2, Upload, ImagePlus, PlusCircle } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// --- Firebase Setup (corrected) ---
const firebaseConfig = {
  apiKey: "AIzaSyAiv_DQMuczXR3cFp3-4tu5qYzGCcga8kI",
  authDomain: "dash-scene-studio.firebaseapp.com",
  projectId: "dash-scene-studio",
  storageBucket: "dash-scene-studio.firebasestorage.app"
  messagingSenderId: "730304435",
  appId: "1:730304435:web:eb79b75293b8f12b8145c6",
  measurementId: "G-SS5X5RVQLJ"
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export default function App() {
  const [avatar, setAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [style, setStyle] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [clothingFocus, setClothingFocus] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageURL, setImageURL] = useState(null);
  const [loading, setLoading] = useState(false);

  // Custom fields
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

        const chosenStyle = customStyle || style || "digital art";
        const chosenPalette = customPalette || colorPalette || "soft pastel tones";
        const chosenClothing = customClothing || clothingFocus || "modern outfit";

        const scenePrompt = `
          Use the uploaded image as the character reference.
          Maintain the same face and artistic tone.
          Style: ${chosenStyle}.
          Color palette: ${chosenPalette}.
          Outfit focus: ${chosenClothing}.
          Scene: ${prompt || "visually appealing portrait in 9:16 ratio"}.
          Lighting: soft, cinematic, detailed textures.
          Final output should look cohesive, polished, and expressive.
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
                  role: "user",
                  parts: [
                    { text: scenePrompt },
                    {
                      inline_data: {
                        mime_type: blob.type,
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
        if (data?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data) {
          const imageBase64 = data.candidates[0].content.parts[0].inline_data.data;
          setImageURL(`data:image/png;base64,${imageBase64}`);
        } else {
          console.error("Gemini response:", data);
          alert("Gemini did not return an image. Try adjusting your style or prompt.");
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

  // --- Style Options ---
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
    { name: "Ocean Mist", colors: ["#A7C7E7", "#F8BBD0", "#FCE4EC"], description: "Soft blues, pinks, and lavender hues." },
    { name: "Candy Dream", colors: ["#FFC1E3", "#FFB6C1", "#FADADD"], description: "Pastel pinks, candy tones, and cream highlights." },
    { name: "Sunset Sorbet", colors: ["#FDB9C8", "#FDD9A0", "#FFF5C3"], description: "Peachy warmth, coral, and soft yellow tones." },
    { name: "Berry Glow", colors: ["#C71585", "#FF69B4", "#FFC0CB"], description: "Bold magentas and soft pink accents." },
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
    <div className="min-h-screen flex flex-col items-center py-10 px-4 bg-gradient-to-br from-[#ffe6f2] via-[#fff0f5] to-[#ffe4ec]">
      <div className="w-full max-w-6xl bg-white/80 rounded-3xl shadow-lg p-8 border border-pink-200">
        <h1 className="text-3xl font-bold text-center text-pink-600 mb-3">💗 DASH Scene Studio</h1>
        <p className="text-center text-gray-500 mb-8">
          Upload your avatar, pick your aesthetic, and generate your dream scene.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="p-6 bg-pink-50 rounded-2xl border border-pink-200">
              <h2 className="font-semibold text-pink-600 mb-2">① Upload Your Avatar</h2>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="mb-3" />
              {uploading ? (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Uploading...
                </p>
              ) : avatar ? (
                <img src={avatar} alt="avatar" className="rounded-xl w-full mt-2 border border-gray-200" />
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-pink-300 rounded-xl p-6 text-gray-400">
                  <Upload size={20} className="mb-2" />
                  Upload or drag an image here
                </div>
              )}
            </div>

            {/* Style Section */}
            <div className="p-6 bg-pink-50 rounded-2xl border border-pink-200">
              <h2 className="font-semibold text-pink-600 mb-2">② Choose Your Style</h2>
              <div className="grid grid-cols-2 gap-2">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`p-2 text-sm rounded-md border transition ${
                      style === s ? "bg-pink-200 border-pink-400" : "hover:bg-pink-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {!showStyleInput ? (
                <button
                  onClick={() => setShowStyleInput(true)}
                  className="mt-3 flex items-center gap-2 text-pink-600 text-sm"
                >
                  <PlusCircle size={16} /> Create My Own
                </button>
              ) : (
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
                    className="bg-pink-500 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Color Palette */}
            <div className="p-6 bg-pink-50 rounded-2xl border border-pink-200">
              <h2 className="font-semibold text-pink-600 mb-2">③ Choose Color Palette</h2>
              {colorPalettes.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setColorPalette(p.name)}
                  className={`w-full flex items-center justify-between rounded-md border p-2 text-sm transition ${
                    colorPalette === p.name ? "bg-pink-200 border-pink-400" : "hover:bg-pink-100"
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

              {!showPaletteInput ? (
                <button
                  onClick={() => setShowPaletteInput(true)}
                  className="mt-3 flex items-center gap-2 text-pink-600 text-sm"
                >
                  <PlusCircle size={16} /> Create My Own
                </button>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={customPalette}
                    onChange={(e) => setCustomPalette(e.target.value)}
                    placeholder="Enter custom color palette..."
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
                    className="bg-pink-500 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Clothing Focus */}
            <div className="p-6 bg-pink-50 rounded-2xl border border-pink-200">
              <h2 className="font-semibold text-pink-600 mb-2">④ Choose Clothing Focus</h2>
              <div className="grid grid-cols-2 gap-2">
                {clothingFocuses.map((c) => (
                  <button
                    key={c}
                    onClick={() => setClothingFocus(c)}
                    className={`p-2 text-sm rounded-md border transition ${
                      clothingFocus === c ? "bg-pink-200 border-pink-400" : "hover:bg-pink-100"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {!showClothingInput ? (
                <button
                  onClick={() => setShowClothingInput(true)}
                  className="mt-3 flex items-center gap-2 text-pink-600 text-sm"
                >
                  <PlusCircle size={16} /> Create My Own
                </button>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={customClothing}
                    onChange={(e) => setCustomClothing(e.target.value)}
                    placeholder="Enter custom clothing style..."
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
                    className="bg-pink-500 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-pink-50 rounded-2xl border border-pink-200">
              <h2 className="font-semibold text-pink-600 mb-2">⑤ Describe the Scene (Optional)</h2>
              <textarea
                className="w-full border rounded-md p-3 text-sm mb-4"
                placeholder="E.g., Standing under soft pink lights in a digital art studio..."
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

            {/* Generated Image */}
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
    </div>
  );
}
