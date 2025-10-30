import React, { useState } from "react";
import "./index.css";

const App = () => {
  const [avatar, setAvatar] = useState(null);
  const [description, setDescription] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleGenerate = () => {
    // Placeholder for generation logic
    setGeneratedImage("https://placehold.co/400x500?text=Generated+Scene");
  };

  const handleEnhance = () => {
    alert("Prompt enhanced! (demo placeholder)");
  };

  const colorPalettes = [
    { name: "Ocean Mist", colors: ["#A1C4FD", "#C2E9FB", "#7FDBDA"] },
    { name: "Warm Sands", colors: ["#E8C07D", "#F5D6BA", "#A47148"] },
    { name: "Vibrant Pop", colors: ["#E63946", "#F1FAEE", "#A8DADC", "#457B9D"] },
    { name: "Midnight Glow", colors: ["#1B263B", "#415A77", "#778DA9", "#E0E1DD"] },
  ];

  const styles = [
    "Modern Studio",
    "Casual Aesthetic",
    "Editorial Framing",
    "Cinematic Glow",
    "Clayboard Tone",
    "Animated Dream",
    "Soft Light Studio",
    "Golden Harmony",
  ];

  const clothingFocus = [
    "Full Scene Outfit",
    "Portrait Crop",
    "Seasonal Looks",
    "Evening Glam",
    "Business or Elegant",
    "Streetwear / Cozy",
  ];

  return (
    <div className="min-h-screen bg-[#f8fafb] text-gray-800 font-sans p-6">
      <h1 className="text-center text-2xl font-semibold mb-6 text-emerald-700">
        ✿ DASH Scene Studio
      </h1>
      <p className="text-center text-gray-500 mb-10">
        Define your avatar, pick a style, and describe the scene.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* LEFT SIDEBAR */}
        <div className="md:col-span-1 flex flex-col gap-5">
          {/* 1. Upload Avatar */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <h2 className="font-semibold mb-3 text-emerald-700">
              ① Upload Your Avatar
            </h2>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 rounded-xl p-4 cursor-pointer hover:bg-emerald-50 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar Preview"
                  className="w-24 h-24 object-cover rounded-full mb-2"
                />
              ) : (
                <>
                  <span className="text-gray-400 text-sm">
                    Upload PNG/JPG (2MB max)
                  </span>
                </>
              )}
            </label>
          </div>

          {/* 2. Choose Style */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <h2 className="font-semibold mb-3 text-emerald-700">
              ② Choose Your Style
            </h2>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {styles.map((style) => (
                <button
                  key={style}
                  className="text-sm px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-gray-700 transition"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Choose Color Palette */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <h2 className="font-semibold mb-3 text-emerald-700">
              ③ Choose Color Palette
            </h2>
            <div className="flex flex-col gap-3">
              {colorPalettes.map((palette) => (
                <div
                  key={palette.name}
                  className="flex items-center justify-between border border-gray-200 rounded-xl p-2 hover:bg-emerald-50 transition"
                >
                  <span className="text-sm text-gray-700">{palette.name}</span>
                  <div className="flex gap-1">
                    {palette.colors.map((color) => (
                      <div
                        key={color}
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: color }}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Choose Clothing Focus */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <h2 className="font-semibold mb-3 text-emerald-700">
              ④ Choose Clothing Focus
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {clothingFocus.map((focus) => (
                <button
                  key={focus}
                  className="text-sm px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-gray-700 transition"
                >
                  {focus}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="md:col-span-3 grid gap-5">
          {/* 5. Describe Scene */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <h2 className="font-semibold mb-3 text-emerald-700">
              ⑤ Describe The Scene Details (Optional)
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Standing on a futuristic bridge overlooking a city skyline at dusk..."
              className="w-full h-20 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-200 outline-none text-sm resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleEnhance}
                className="flex-1 py-2 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-700 font-medium transition"
              >
                ✨ Enhance Prompt
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium transition"
              >
                ⚡ Generate New Scene
              </button>
            </div>
          </div>

          {/* 6. Generated Scene */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 flex flex-col items-center justify-center">
            <h2 className="font-semibold mb-3 text-emerald-700">
              ⑥ Generated Scene (2:16 Portrait)
            </h2>
            <div className="w-full flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="rounded-xl shadow-md max-h-[480px]"
                />
              ) : (
                <p className="text-gray-400 text-sm text-center">
                  Your generated result will appear here.
                  <br /> Complete steps on the left to begin!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
