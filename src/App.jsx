import React, { useState, useCallback } from 'react';
import { Aperture, Upload, Loader2, Sparkles, Droplet, Type, Shirt, Heart, Zap } from 'lucide-react';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// =================================================================
// 🛑 UPDATED: YOUR NEW, SECURE CLOUD RUN URL
// =================================================================
const CLOUD_RUN_BASE_URL = 'https://dash-backend-456267857471.us-west1.run.app';

// --- Style Options (Themes and Attire) ---
const STYLE_OPTIONS = [
    'Dark Academia Aesthetic',
    'Kawaii',
    'Athletic Performance Gear',
    'Casual Streetwear',
    'Formal Evening Attire',
    'Gothic Fantasy',
    'Cyberpunk Neon',
    'Steampunk Brass & Leather',
    'Sci-Fi Space Opera',
    'High Fashion Photography',
    'Urban Street Style',
    'Bohemian Chic',
    'Vaporwave Aesthetic',
    'Rustic Woodland Explorer',
    'Grunge Aesthetic'
];
const CUSTOM_STYLE_KEY = 'CUSTOM_STYLE_INPUT';
// --- End Style Options ---

// --- Color Palettes ---
const COLOR_PALETTES = [
    { name: 'Ocean Mist', colors: ['#5F9EA0', '#B0C4DE', '#E6E6FA'], description: 'Soft blues, seafoam green, and lavender.' },
    { name: 'Desert Sunset', colors: ['#CD5C5C', '#F4A460', '#F0E68C'], description: 'Deep reds, vibrant oranges, and warm sand tones.' },
    { name: 'Vibrant Pop', colors: ['#FF69B4', '#00FFFF', '#FFD700'], description: 'Hot pink, electric cyan, and bright gold accents.' },
    { name: 'Monochrome Cool', colors: ['#2F4F4F', '#A9A9A9', '#DCDCDC'], description: 'Dark slate gray, neutral gray, and silvery white.' },
    { name: 'Earthy Jewel Tones', colors: ['#8B4513', '#228B22', '#800080'], description: 'Rich brown, deep forest green, and royal purple.' },
    { name: 'Pastel Dreams', colors: ['#FADADD', '#B0E0E6', '#FAFAD2'], description: 'Soft rose, baby blue, and pale yellow.' },
];
const CUSTOM_PALETTE_KEY = 'CUSTOM_PALETTE_INPUT';
// --- End Color Palettes ---

// --- Clothing Focus Options ---
const CLOTHING_OPTIONS = [
    'Full Dress or Gown',
    'Pants and Top (Trousers, Jeans, etc.)',
    'Shorts and Top',
    'Skirt and Top',
    'Jumpsuit or Romper',
    'Specific Outerwear (Coat, Jacket, Cape)',
    'Swimwear or Beach Attire'
];
const CUSTOM_CLOTHING_KEY = 'CUSTOM_CLOTHING_INPUT';
// --- End Clothing Focus Options ---


const App = () => {
    const [inputImage, setInputImage] = useState(null);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [customStyleInput, setCustomStyleInput] = useState('');
    const [selectedPalette, setSelectedPalette] = useState('');
    const [customPaletteInput, setCustomPaletteInput] = useState('');
    const [selectedClothing, setSelectedClothing] = useState('');
    const [customClothingInput, setCustomClothingInput] = useState('');
    const [userPrompt, setUserPrompt] = useState('');
    const [generatedImageURL, setGeneratedImageURL] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTextGenerating, setIsTextGenerating] = useState(false); // NEW State for LLM loading
    const [error, setError] = useState(null);

    // Firebase states (for future persistence, currently unused in core logic)
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);

    const MAX_RETRIES = 5;

    // Hardcoded 9:16 aspect ratio classes for UI display
    const resultContainerClasses = 'w-full max-w-sm lg:w-[450px] aspect-[9/16]';

    // 1. Firebase Initialization and Authentication
    React.useEffect(() => {
        // Canvas Global variables MUST be used
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase config is missing.");
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const firebaseAuth = getAuth(app);
            setDb(firestore);
            setAuth(firebaseAuth);

            const authenticate = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(firebaseAuth, initialAuthToken);
                    } else {
                        await signInAnonymously(firebaseAuth);
                    }
                    setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
                } catch (authError) {
                    console.error("Firebase authentication error:", authError);
                    setUserId(crypto.randomUUID());
                }
            };

            authenticate();
        } catch (e) {
            console.error("Error initializing Firebase:", e);
        }
    }, []);

    // Utility function to convert Base64 URL to parts object required by the API
    const urlToGenerativePart = (base64Url) => {
        if (!base64Url) return null;
        const [mimeTypePart, dataPart] = base64Url.split(',');
        const mimeType = mimeTypePart.match(/:(.*?);/)[1];
        const data = dataPart;
        return {
            inlineData: { mimeType, data }
        };
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                // The result will be a data URL (e.g., 'data:image/png;base64,...')
                setInputImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStyleSelect = (style) => {
        setSelectedStyle(style);
        setError(null);
        if (style !== CUSTOM_STYLE_KEY) {
            setCustomStyleInput('');
        }
    }

    const handlePaletteSelect = (paletteName) => {
        setSelectedPalette(paletteName);
        setError(null);
        if (paletteName !== CUSTOM_PALETTE_KEY) {
            setCustomPaletteInput('');
        }
    }

    const handleClothingSelect = (clothing) => {
        setSelectedClothing(clothing);
        setError(null);
        if (clothing !== CUSTOM_CLOTHING_KEY) {
            setCustomClothingInput('');
        }
    }

    // UPDATED: LLM Function to enhance the user's prompt now calls your Cloud Run endpoint
    const generateEnhancedPrompt = useCallback(async () => {

        // --- Determine effective style, color, and clothing for context ---
        let effectiveStyle = selectedStyle === CUSTOM_STYLE_KEY ? customStyleInput.trim() : selectedStyle;
        if (effectiveStyle === 'Kawaii') {
            effectiveStyle = 'Photorealistic rendering of the Kawaii fashion and aesthetic, maintaining the character\'s original age and proportions';
        }

        let colorDescription;
        if (selectedPalette === CUSTOM_PALETTE_KEY) {
            const custom = customPaletteInput.trim();
            colorDescription = custom ? custom : 'a balanced, high-contrast color palette';
        } else {
            const palette = COLOR_PALETTES.find(p => p.name === selectedPalette);
            colorDescription = palette ? palette.description : 'a random color palette';
        }

        const effectiveClothing = selectedClothing === CUSTOM_CLOTHING_KEY ? customClothingInput.trim() : selectedClothing;

        // --- Validation Checks ---
        if (!inputImage) {
            setError("Please complete Step 1: Upload your avatar before enhancing the prompt.");
            return;
        }
        if (!effectiveStyle || !colorDescription || !effectiveClothing) {
            setError("Please ensure steps 2, 3, and 4 are complete so the AI has context for the enhancement.");
            return;
        }

        const basePrompt = userPrompt.trim() || 'A simple setting for the character';

        setIsTextGenerating(true);
        setError(null);

        const systemPrompt = `You are a world-class prompt engineer for a generative AI image studio. Your task is to take a short, creative description (SCENE DETAILS) and expand it into a highly detailed, descriptive, and vivid paragraph suitable for a photorealistic image generator.

Instructions:
1. Incorporate the provided STYLE, COLOR, and CLOTHING context into the expanded description.
2. Maintain the core idea of the SCENE DETAILS.
3. Add elements like specific lighting, complex textures, composition terms (e.g., volumetric light, shallow depth of field, wide-angle shot, cinematic), and background richness.
4. Output ONLY the single, enhanced paragraph, without any conversational or leading text.`;

        const userQuery = `SCENE DETAILS: ${basePrompt}.
    STYLE: ${effectiveStyle}.
    COLOR: ${colorDescription}.
    CLOTHING: ${effectiveClothing}.
    
    Expand and refine the SCENE DETAILS into a rich, full prompt.`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        let attempts = 0;
        // The fetch URL now points to your Cloud Run endpoint
        const FETCH_URL = `${CLOUD_RUN_BASE_URL}/enhance-prompt`; 
        
        while (attempts < MAX_RETRIES) {
            try {
                const response = await fetch(FETCH_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payload }) // Wrap the payload to match backend expectation
                });

                if (!response.ok) {
                    throw new Error(`Prompt enhancement failed. Status: ${response.status}`);
                }

                const result = await response.json();
                const enhancedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

                if (enhancedText) {
                    setUserPrompt(enhancedText.trim());
                    setIsTextGenerating(false);
                    return; // Exit loop on success
                } else {
                    throw new Error('LLM response format was unexpected or empty.');
                }
            } catch (err) {
                attempts++;
                if (attempts >= MAX_RETRIES) {
                    console.error("Final LLM API error:", err);
                    setError(`Failed to enhance prompt after ${MAX_RETRIES} attempts.`);
                    setIsTextGenerating(false);
                    return;
                }
                const delay = Math.pow(2, attempts) * 1000;
                console.warn(`LLM attempt ${attempts} failed, retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

    }, [inputImage, selectedStyle, customStyleInput, selectedPalette, customPaletteInput, selectedClothing, customClothingInput, userPrompt]);


    // UPDATED: Image Generation function now calls your Cloud Run endpoint
    const generateScene = useCallback(async () => {

        // --- Determine effective style, color, and clothing ---
        let effectiveStyle = selectedStyle === CUSTOM_STYLE_KEY ? customStyleInput.trim() : selectedStyle;

        // Explicitly refine 'Kawaii' style to include photorealism
        if (effectiveStyle === 'Kawaii') {
            effectiveStyle = 'Photorealistic rendering of the Kawaii fashion and aesthetic, maintaining the character\'s original age and proportions';
        }

        let colorDescription;
        if (selectedPalette === CUSTOM_PALETTE_KEY) {
            const custom = customPaletteInput.trim();
            colorDescription = custom ? custom : 'a balanced, high-contrast color palette';
        } else {
            const palette = COLOR_PALETTES.find(p => p.name === selectedPalette);
            colorDescription = palette ? palette.description : selectedPalette;
        }

        const effectiveClothing = selectedClothing === CUSTOM_CLOTHING_KEY ? customClothingInput.trim() : selectedClothing;
        // --- End determination ---

        // --- Validation Checks ---
        if (!inputImage) {
            setError("Please complete Step 1: Upload your avatar.");
            return;
        }
        if (!effectiveStyle) {
            setError("Please complete Step 2: Choose a style or enter a custom one.");
            return;
        }
        if (!colorDescription) {
            setError("Please complete Step 3: Choose a color palette or enter a custom one.");
            return;
        }
        if (!effectiveClothing) {
            setError("Please complete Step 4: Choose a clothing focus or enter a custom one.");
            return;
        }
        // Step 5 (userPrompt) is optional.
        // --- End Validation Checks ---


        setIsLoading(true);
        setGeneratedImageURL(null);
        setError(null);

        const imagePart = urlToGenerativePart(inputImage);

        // --- Determine the final prompt ---
        let finalSceneDescription = userPrompt.trim();

        if (!finalSceneDescription) {
            // Construct a highly detailed prompt instructing the AI to invent the scene.
            finalSceneDescription =
                `Generate a completely unique and highly detailed background, action, and environment. 
             The scene must have dynamic lighting, compelling composition, and an interesting pose or action.`;
        }

        // --- HARDCODED 9:16 INSTRUCTION ---
        const aspectInstruction = `9:16 portrait (1080x1920) aspect ratio. Full-body shot or head-to-toe view. The background must expand vertically to fill the entire tall canvas, ensuring a strong, dynamic vertical composition.`;

        const combinedPrompt =
            `The desired output image format must be the ${aspectInstruction}.
             Modify the uploaded character image. 
             The visual style and theme must be '${effectiveStyle}'. 
             The character's outfit must have a strong focus on the silhouette/type: '${effectiveClothing}'.
             The dominant color palette for the scene and attire must be: ${colorDescription}.
             It is CRITICAL that you maintain the character's core identity, face, and distinctive features exactly as they are. 
             Apply the following specific scene description: ${finalSceneDescription}`;

        const textPart = { text: combinedPrompt };
        // --- End prompt determination ---

        const payload = {
            contents: [{
                role: "user",
                parts: [textPart, imagePart]
            }],
            generationConfig: {
                responseModalities: ['TEXT', 'IMAGE']
            },
        };

        let attempts = 0;
        // The fetch URL now points to your Cloud Run endpoint
        const FETCH_URL = `${CLOUD_RUN_BASE_URL}/generate-scene`;

        while (attempts < MAX_RETRIES) {
            try {
                const response = await fetch(FETCH_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payload }) // Wrap the payload to match backend expectation
                });

                if (!response.ok) {
                    throw new Error(`Image generation failed. Status: ${response.status}`);
                }

                const result = await response.json();

                const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

                if (base64Data) {
                    // Image data is returned as PNG base64 data
                    const imageUrl = `data:image/png;base64,${base64Data}`;
                    setGeneratedImageURL(imageUrl);
                    setIsLoading(false);
                    return; // Exit loop on success
                } else {
                    throw new Error('Image generation failed or response format was unexpected.');
                }

            } catch (err) {
                attempts++;
                if (attempts >= MAX_RETRIES) {
                    console.error("Final API error:", err);
                    setError(`Failed to generate scene after ${MAX_RETRIES} attempts. Error: ${err.message}`);
                    setIsLoading(false);
                    return;
                }
                const delay = Math.pow(2, attempts) * 1000;
                console.warn(`Attempt ${attempts} failed, retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }, [inputImage, selectedStyle, customStyleInput, selectedPalette, customPaletteInput, selectedClothing, customClothingInput, userPrompt]);


    return (
        // 1. New Font: Quicksand. New Background: Soft Cream (bg-amber-50).
        <div className="min-h-screen bg-amber-50 p-4 sm:p-8 font-['Quicksand',_Inter]">
            <script src="https://cdn.tailwindcss.com"></script>
            <header className="text-center mb-10">
                {/* MODIFICATION: The whole header section is now contained to center the items */}
                <h1 className="text-4xl font-extrabold text-indigo-600 flex items-center justify-center space-x-3">
                    {/* First element: The Heart Icon */}
                    <Heart className="w-8 h-8 fill-pink-500 text-pink-500" />

                    {/* Second element: The Text Title */}
                    <span>DASH Scene Studio</span>

                    {/* THIRD ELEMENT: The Image of "Dash" */}
                    <img 
                        // IMPORTANT: Replace this placeholder with the actual URL of your Dash image
                        src="https://via.placeholder.com/32x32/ff88aa/ffffff?text=D" 
                        alt="Dash Mascot"
                        className="w-8 h-8 rounded-full object-cover border-2 border-pink-500 shadow-md"
                    />
                </h1>
                <p className="text-gray-500 mt-2 text-lg">Define your avatar, pick a style, and describe the scene.</p>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- Left Panel: Steps 1, 2, 3, 4 --- */}
                <div className="lg:col-span-1 space-y-8">

                    {/* Step 1: Upload Avatar */}
                    {/* 3. Rounded Corners (rounded-3xl) and Soft Shadow (shadow-2xl) */}
                    <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-pink-100/70">
                        <h2 className="text-2xl font-semibold mb-6 text-indigo-600 flex items-center space-x-2">
                            <Upload className="w-6 h-6 text-pink-500" />
                            <span>1. Sparkle Upload</span>
                        </h2>

                        <div className="mb-6">
                            <label htmlFor="avatar-upload" className="block text-sm font-medium text-gray-700 mb-2">
                                Character Image File (JPG or PNG)
                            </label>
                            {/* Softer hover effect and rounded-2xl border */}
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-pink-300 rounded-2xl hover:border-pink-500 transition duration-150 cursor-pointer">
                                <div className="space-y-1 text-center">
                                    <Sparkles className="mx-auto h-8 w-8 text-pink-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="avatar-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-pink-500">
                                            <span>Upload a file</span>
                                            <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/png, image/jpeg" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 4MB</p>
                                </div>
                            </div>
                        </div>

                        {inputImage && (
                            // Softer accent color and rounded-2xl
                            <div className="p-4 bg-pink-100 rounded-2xl border border-pink-300">
                                <h3 className="text-lg font-medium text-pink-700 mb-3">Current Avatar:</h3>
                                <img
                                    src={inputImage}
                                    alt="Uploaded Character Avatar"
                                    className="w-full max-w-xs h-auto object-cover rounded-2xl shadow-lg mx-auto"
                                />
                            </div>
                        )}
                    </div>

                    {/* Step 2: Choose Style */}
                    <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-pink-100/70">
                        <h2 className="text-2xl font-semibold mb-4 text-indigo-600 flex items-center space-x-2">
                            <Aperture className="w-6 h-6 text-teal-500" />
                            <span>2. Dream Style</span>
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">Select the aesthetic or theme for your character's clothing and scene.</p>

                        {/* Predefined Styles */}
                        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 mb-4">
                            {STYLE_OPTIONS.map(style => (
                                <button
                                    key={style}
                                    onClick={() => handleStyleSelect(style)}
                                    className={`p-3 text-sm font-medium rounded-full text-center transition duration-200 border
                                        ${selectedStyle === style
                                            ? 'bg-pink-500 text-white border-pink-600 shadow-md transform scale-[1.03] shadow-inner' // Cuter selected state
                                            : 'bg-pink-50 text-gray-800 border-pink-200 hover:bg-pink-100'
                                        }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>

                        {/* Custom Style Input Button */}
                        <button
                            onClick={() => handleStyleSelect(CUSTOM_STYLE_KEY)}
                            className={`p-3 w-full text-sm font-medium rounded-full text-center transition duration-200 border flex items-center justify-center space-x-2
                                ${selectedStyle === CUSTOM_STYLE_KEY
                                    ? 'bg-violet-500 text-white border-violet-600 shadow-md transform scale-[1.03] shadow-inner' // Cuter selected state
                                    : 'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-200'
                                }`}
                        >
                            <Type className="w-4 h-4" />
                            <span>Custom Style Prompt...</span>
                        </button>

                        {/* Custom Style Input Field */}
                        {selectedStyle === CUSTOM_STYLE_KEY && (
                            <input
                                type="text"
                                value={customStyleInput}
                                onChange={(e) => setCustomStyleInput(e.target.value)}
                                placeholder="e.g., Solarpunk, Victorian Era, or 90s Grunge"
                                className="mt-3 w-full p-3 border border-violet-400 rounded-full focus:ring-violet-500 focus:border-violet-500 shadow-sm"
                            />
                        )}

                        {(selectedStyle && selectedStyle !== CUSTOM_STYLE_KEY) && (
                            <p className="mt-4 text-sm font-medium text-pink-600">
                                Selected: <span className="font-bold">{selectedStyle}</span>
                            </p>
                        )}
                        {(selectedStyle === CUSTOM_STYLE_KEY && customStyleInput.trim()) && (
                            <p className="mt-4 text-sm font-medium text-violet-600">
                                Custom Style: <span className="font-bold">{customStyleInput}</span>
                            </p>
                        )}
                    </div>

                    {/* Step 3: Choose Color Palette */}
                    <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-pink-100/70">
                        <h2 className="text-2xl font-semibold mb-4 text-indigo-600 flex items-center space-x-2">
                            <Droplet className="w-6 h-6 text-pink-500" />
                            <span>3. Color Palette Pop</span>
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">Select the dominant colors for the outfit and environment.</p>

                        {/* Predefined Palettes */}
                        <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2 mb-4">
                            {COLOR_PALETTES.map(palette => (
                                <div
                                    key={palette.name}
                                    onClick={() => handlePaletteSelect(palette.name)}
                                    className={`p-3 rounded-2xl border-2 cursor-pointer transition duration-200
                                        ${selectedPalette === palette.name
                                            ? 'bg-teal-200 border-teal-500 shadow-md transform scale-[1.02] shadow-inner' // Cuter selected state
                                            : 'bg-gray-50 border-gray-200 hover:bg-teal-50 hover:border-teal-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-800">{palette.name}</span>
                                        <div className="flex space-x-1">
                                            {palette.colors.map((color, index) => (
                                                <div
                                                    key={index}
                                                    className="w-5 h-5 rounded-full shadow-inner border border-gray-300"
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{palette.description}</p>
                                </div>
                            ))}
                        </div>

                        {/* Custom Palette Input Button */}
                        <button
                            onClick={() => handlePaletteSelect(CUSTOM_PALETTE_KEY)}
                            className={`p-3 w-full text-sm font-medium rounded-full text-center transition duration-200 border flex items-center justify-center space-x-2
                                ${selectedPalette === CUSTOM_PALETTE_KEY
                                    ? 'bg-violet-500 text-white border-violet-600 shadow-md transform scale-[1.03] shadow-inner' // Cuter selected state
                                    : 'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-200'
                                }`}
                        >
                            <Type className="w-4 h-4" />
                            <span>Custom Color Prompt...</span>
                        </button>

                        {/* Custom Palette Input Field */}
                        {selectedPalette === CUSTOM_PALETTE_KEY && (
                            <input
                                type="text"
                                value={customPaletteInput}
                                onChange={(e) => setCustomPaletteInput(e.target.value)}
                                placeholder="e.g., forest green, charcoal gray, and copper highlights"
                                className="mt-3 w-full p-3 border border-violet-400 rounded-full focus:ring-violet-500 focus:border-violet-500 shadow-sm"
                            />
                        )}

                        {(selectedPalette && selectedPalette !== CUSTOM_PALETTE_KEY) && (
                            <p className="mt-4 text-sm font-medium text-teal-600">
                                Selected Palette: <span className="font-bold">{selectedPalette}</span>
                            </p>
                        )}
                        {(selectedPalette === CUSTOM_PALETTE_KEY && customPaletteInput.trim()) && (
                            <p className="mt-4 text-sm font-medium text-violet-600">
                                Custom Palette: <span className="font-bold">{customPaletteInput}</span>
                            </p>
                        )}
                    </div>

                    {/* Step 4: Choose Clothing Focus */}
                    <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-pink-100/70">
                        <h2 className="text-2xl font-semibold mb-4 text-indigo-600 flex items-center space-x-2">
                            <Shirt className="w-6 h-6 text-pink-500" />
                            <span>4. Outfit Focus</span>
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">Select the primary type of outfit for the scene, or enter a custom one.</p>

                        {/* Predefined Clothing Options */}
                        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 mb-4">
                            {CLOTHING_OPTIONS.map(clothing => (
                                <button
                                    key={clothing}
                                    onClick={() => handleClothingSelect(clothing)}
                                    className={`p-3 text-sm font-medium rounded-full text-center transition duration-200 border
                                        ${selectedClothing === clothing
                                            ? 'bg-pink-500 text-white border-pink-600 shadow-md transform scale-[1.03] shadow-inner' // Cuter selected state
                                            : 'bg-gray-100 text-gray-800 border-pink-200 hover:bg-pink-100'
                                        }`}
                                >
                                    {clothing}
                                </button>
                            ))}
                        </div>

                        {/* Custom Clothing Input Button */}
                        <button
                            onClick={() => handleClothingSelect(CUSTOM_CLOTHING_KEY)}
                            className={`p-3 w-full text-sm font-medium rounded-full text-center transition duration-200 border flex items-center justify-center space-x-2
                                ${selectedClothing === CUSTOM_CLOTHING_KEY
                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md transform scale-[1.03] shadow-inner' // Cuter selected state
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                }`}
                        >
                            <Type className="w-4 h-4" />
                            <span>Custom Outfit Prompt...</span>
                        </button>

                        {/* Custom Clothing Input Field */}
                        {selectedClothing === CUSTOM_CLOTHING_KEY && (
                            <input
                                type="text"
                                value={customClothingInput}
                                onChange={(e) => setCustomClothingInput(e.target.value)}
                                placeholder="e.g., A quilted bomber jacket and cargo pants, or a silk robe."
                                className="mt-3 w-full p-3 border border-emerald-400 rounded-full focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                            />
                        )}

                        {(selectedClothing && selectedClothing !== CUSTOM_CLOTHING_KEY) && (
                            <p className="mt-4 text-sm font-medium text-pink-600">
                                Selected: <span className="font-bold">{selectedClothing}</span>
                            </p>
                        )}
                        {(selectedClothing === CUSTOM_CLOTHING_KEY && customClothingInput.trim()) && (
                            <p className="mt-4 text-sm font-medium text-emerald-600">
                                Custom Clothing: <span className="font-bold">{customClothingInput}</span>
                            </p>
                        )}
                    </div>
                </div>


                {/* --- Right Panel: Step 5 & Results --- */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Step 5: Refine Prompt (Optional) */}
                    <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-pink-100/70">
                        <h2 className="text-2xl font-semibold mb-6 text-indigo-600 flex items-center space-x-2">
                            <Sparkles className="w-6 h-6 text-teal-500" />
                            <span>5. Scene Details (Optional)</span>
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">Enter specific details for the background or action. **Leave blank to let the AI create a unique scene for you!**</p>

                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 shadow-inner"
                            rows="4"
                            placeholder="E.g., Standing on a futuristic bridge overlooking a city skyline at dusk, holding a neon umbrella."
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            disabled={isTextGenerating}
                        ></textarea>

                        {/* NEW: Enhance Prompt Button */}
                        <button
                            onClick={generateEnhancedPrompt}
                            disabled={isTextGenerating || isLoading || !inputImage ||
                                (selectedStyle === '' || (selectedStyle === CUSTOM_STYLE_KEY && customStyleInput.trim() === '')) ||
                                (selectedPalette === '' || (selectedPalette === CUSTOM_PALETTE_KEY && customPaletteInput.trim() === '')) ||
                                (selectedClothing === '' || (selectedClothing === CUSTOM_CLOTHING_KEY && customClothingInput.trim() === ''))
                            }
                            // Button style changed to rounded-full and soft pink
                            className="mt-4 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-pink-500 hover:bg-pink-600 transition duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTextGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Prompting the LLM...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    ✨ Let the AI Write the Details
                                </>
                            )}
                        </button>
                        {/* END NEW BUTTON */}

                        {error && (
                            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl" role="alert">
                                <p className="font-bold">Uh Oh! Error Detected:</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={generateScene}
                            disabled={isLoading || isTextGenerating || !inputImage ||
                                (selectedStyle === '' || (selectedStyle === CUSTOM_STYLE_KEY && customStyleInput.trim() === '')) ||
                                (selectedPalette === '' || (selectedPalette === CUSTOM_PALETTE_KEY && customPaletteInput.trim() === '')) ||
                                (selectedClothing === '' || (selectedClothing === CUSTOM_CLOTHING_KEY && customClothingInput.trim() === ''))
                            }
                            // Main Generate Button: Rounded-full, vibrant teal, shadow-xl
                            className="mt-4 w-full flex items-center justify-center px-6 py-4 border border-transparent text-lg font-bold rounded-full shadow-xl text-white bg-teal-500 hover:bg-teal-600 transition duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    {/* Cuter Loading Icon and Text */}
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    <div className="flex flex-col items-start text-sm">
                                        <p>Generating Scene...</p>
                                        <p className='font-normal opacity-80'>Painting your masterpiece (approx. 30s)</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Zap className="mr-3 h-6 w-6" />
                                    Generate New Scene!
                                </>
                            )}
                        </button>
                    </div>

                    {/* Results Area */}
                    <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-pink-100/70 flex flex-col items-center">
                        <h2 className="text-2xl font-semibold mb-6 text-indigo-600">6. Your Masterpiece (9:16 Portrait)</h2>

                        {/* Dynamic Container for Aspect Ratio Display (Hardcoded 9:16) */}
                        <div
                            className={`relative ${resultContainerClasses} mx-auto flex items-center justify-center bg-gray-100 rounded-3xl border-4 border-dashed border-teal-300 overflow-hidden`}
                        >
                            {generatedImageURL && !isLoading ? (
                                <img
                                    src={generatedImageURL}
                                    alt="Generated Scene"
                                    // object-cover forces the image content to fill the 9:16 container
                                    className="h-full w-full object-cover rounded-2xl shadow-2xl"
                                />
                            ) : isLoading ? (
                                <div className="flex flex-col items-center justify-center p-10 text-teal-600">
                                    <Heart className="h-16 w-16 animate-pulse mb-4 text-pink-500 fill-pink-500" />
                                    <p className="text-xl font-bold">Applying magic...</p>
                                    <p className="text-sm text-gray-500 mt-2 text-center">The AI is working hard to preserve your character's likeness and create your dream scene!</p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 p-10">
                                    <Aperture className="mx-auto h-16 w-16 mb-4" />
                                    <p className="text-lg">Your generated scene will appear here.</p>
                                    <p className="text-sm mt-1">Complete all steps on the left to begin generation.</p>
                                </div>
                            )}
                        </div>

                        {generatedImageURL && (
                            <p className="mt-4 text-sm text-gray-500 text-center">
                                Masterpiece created! You can modify the details or change the style and regenerate for a new scene.
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default App;