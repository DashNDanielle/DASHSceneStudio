import React, { useState, useCallback } from 'react';
import { Aperture, Upload, Loader2, Zap, Palette, Droplet, Type, Shirt, Sparkles } from 'lucide-react';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- API KEY INSERTION & GLOBAL SETUP ---

// 1. API Key Extracted from your image
const GEMINI_API_KEY = "AlzaSyC_KUGGYIF8jQrt8yJL0_hxv9zeYA1q110";

// 2. Placeholder for Firebase Config - **CRITICAL: Ensure your build process overwrites this with your real Firebase settings!**
const PLACEHOLDER_FIREBASE_CONFIG = JSON.stringify({
    apiKey: "YOUR_FIREBASE_API_KEY_HERE", // <-- REPLACE THIS with your actual Firebase API Key
    authDomain: "projects/456267857471.firebaseapp.com",
    projectId: `project-id-456267857471`, // Placeholder Project ID
    storageBucket: `project-id-456267857471.appspot.com`,
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
});

// Setting the API Key in the variables your code uses
const apiKey = GEMINI_API_KEY; 
const GENERATION_MODEL = 'gemini-2.5-flash-image-preview';
const TEXT_MODEL = 'gemini-2.5-flash-preview-09-2025';
const IMG_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent?key=${apiKey}`;
const LLM_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`;

// Injecting variables globally as your original code expects them to exist
window.__app_id = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
window.__firebase_config = typeof __firebase_config !== 'undefined' ? __firebase_config : PLACEHOLDER_FIREBASE_CONFIG;
window.__initial_auth_token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- End API Key Insertion & Global Setup ---

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

  // NEW: LLM Function to enhance the user's prompt
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

   const systemPrompt = [
        `You are a world-class prompt engineer for a generative AI image studio. Your task is to take a short, creative description (SCENE DETAILS) and expand it into a highly detailed, descriptive, and vivid paragraph suitable for a photorealistic image generator.`,
        ``,
        `Instructions:`,
        `1. Incorporate the provided STYLE, COLOR, and CLOTHING context into the expanded description.`,
        `2. Maintain the core idea of the SCENE DETAILS.`,
        `3. Add elements like specific lighting, complex textures, composition terms (e.g., volumetric light, shallow depth of field, wide-angle shot, cinematic), and background richness.`,
        `4. Output ONLY the single, enhanced paragraph, without any conversational or leading text.`
    ].join('\n');

    const userQuery = `SCENE DETAILS: ${basePrompt}. 
    STYLE: ${effectiveStyle}.
    COLOR: ${colorDescription}.
    CLOTHING: ${effectiveClothing}.
    
    Expand and refine the SCENE DETAILS into a rich, full prompt.`;

    const payload = {
      contents: [{ parts: [{