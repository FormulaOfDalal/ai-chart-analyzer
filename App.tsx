
import React, { useState, useCallback, useEffect } from 'react';
import { ImageUpload } from './ImageUpload'; // Updated path
import { AnalysisDisplay } from './AnalysisDisplay'; // Updated path
import { LoadingSpinner } from './LoadingSpinner'; // Updated path
import { ErrorMessage } from './ErrorMessage'; // Updated path
import { 
  analyzeChartWithGemini, 
  setGeminiApiKey, 
  loadApiKeyFromStorage, 
  isGeminiClientInitialized,
  getStoredApiKey,
  clearGeminiApiKey
} from './geminiService'; // Updated path
import type { AnalysisData } from './types';
import { fileToBase64 } from './fileUtils'; // Updated path

const App: React.FC = () => {
  const [chartImageFile, setChartImageFile] = useState<File | null>(null);
  const [chartImagePreview, setChartImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isKeyInputVisible, setIsKeyInputVisible] = useState<boolean>(true);
  const [apiKeyMessage, setApiKeyMessage] = useState<string | null>(null);
  const [clientInitialized, setClientInitialized] = useState<boolean>(false);


  useEffect(() => {
    const storedKey = loadApiKeyFromStorage(); // This also attempts to initialize the client
    if (storedKey) {
      setApiKeyInput(storedKey); // Pre-fill input if needed, or just use for display
      if (isGeminiClientInitialized()) {
        setClientInitialized(true);
        setIsKeyInputVisible(false);
        setApiKeyMessage("API Key loaded from storage and client initialized.");
      } else {
        setClientInitialized(false);
        setIsKeyInputVisible(true);
        setApiKeyMessage("Stored API Key found, but client initialization failed. Please verify and re-submit.");
        setError("Failed to initialize with stored API Key. It might be invalid or expired.");
      }
    } else {
      setClientInitialized(false);
      setIsKeyInputVisible(true);
      setApiKeyMessage("Please enter your Gemini API Key to enable analysis.");
    }
  }, []);

  const handleSetApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) {
      setApiKeyMessage("API Key cannot be empty.");
      setError("Please enter a valid API Key.");
      setClientInitialized(false);
      return;
    }
    setError(null);
    setApiKeyMessage("Setting API Key...");
    try {
      setGeminiApiKey(apiKeyInput.trim()); // This will throw on failure
      setClientInitialized(true);
      setIsKeyInputVisible(false);
      setApiKeyMessage("API Key set successfully and client initialized.");
    } catch (err: any) {
      console.error("Failed to set API key:", err);
      setError(`Failed to set API Key: ${err.message}`);
      setApiKeyMessage(`Error: ${err.message}`);
      setClientInitialized(false);
      setIsKeyInputVisible(true); // Keep input visible if key set fails
    }
  }, [apiKeyInput]);

  const handleChangeApiKey = useCallback(() => {
    clearGeminiApiKey();
    setClientInitialized(false);
    setIsKeyInputVisible(true);
    setApiKeyInput(getStoredApiKey() || ''); // Show stored key or empty
    setApiKeyMessage("Enter your Gemini API Key.");
    setError(null);
    setAnalysis(null); // Clear analysis when changing key
  }, []);


  const handleImageUpload = useCallback((file: File) => {
    setChartImageFile(file);
    setAnalysis(null); 
    setError(null); 
    const reader = new FileReader();
    reader.onloadend = () => {
      setChartImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyzeChart = useCallback(async () => {
    if (!chartImageFile) {
      setError("Please upload a chart image first.");
      return;
    }
    if (!clientInitialized) {
      setError("Gemini API Key is not set or client is not initialized. Please set your API key.");
      setIsKeyInputVisible(true); // Show API key input if not set
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const base64ImageString = await fileToBase64(chartImageFile);
      const base64Data = base64ImageString.split(',')[1];
      
      const result = await analyzeChartWithGemini(base64Data, chartImageFile.type);
      setAnalysis(result);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze chart. Check the console for more details.");
      if (err.message && (err.message.toLowerCase().includes("api key not valid") || err.message.toLowerCase().includes("invalid api key"))) {
        setClientInitialized(false); // De-initialize client on specific key errors
        setIsKeyInputVisible(true);
        setApiKeyMessage("The API Key appears to be invalid. Please check and set it again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [chartImageFile, clientInitialized]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-8 transition-all duration-500">
      <header className="w-full max-w-4xl text-center mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          AI Chart Analyzer
        </h1>
        <p className="mt-3 text-lg text-gray-300">
          Upload a financial chart image and let AI provide insights on patterns, trends, and more.
        </p>
      </header>

      <main className="w-full max-w-4xl bg-gray-800 bg-opacity-80 shadow-2xl rounded-xl p-6 sm:p-10 backdrop-filter backdrop-blur-lg">
        
        {isKeyInputVisible && (
          <div className="mb-6 p-4 border border-purple-500 rounded-lg bg-gray-700 bg-opacity-50">
            <h2 className="text-xl font-semibold text-purple-300 mb-2">Set Gemini API Key</h2>
            <p className="text-sm text-gray-400 mb-3">
              Your API key is stored in your browser's local storage and is not sent to our servers.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your Gemini API Key"
                className="flex-grow p-2.5 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-500"
                aria-label="Gemini API Key"
              />
              <button
                onClick={handleSetApiKey}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-70"
              >
                Set Key
              </button>
            </div>
            {apiKeyMessage && <p className={`mt-2 text-sm ${error && apiKeyMessage.startsWith("Error:") ? 'text-red-400' : 'text-purple-300'}`}>{apiKeyMessage}</p>}
          </div>
        )}

        {!isKeyInputVisible && clientInitialized && (
           <div className="mb-6 p-3 border border-green-500 rounded-lg bg-gray-700 bg-opacity-50 text-center">
            <p className="text-green-300 text-sm">
              Gemini API Key is set. 
              <button onClick={handleChangeApiKey} className="ml-2 text-purple-300 hover:text-purple-200 underline font-semibold">
                Change Key
              </button>
            </p>
          </div>
        )}

        <ImageUpload onImageUpload={handleImageUpload} currentImagePreview={chartImagePreview} />

        {chartImagePreview && (
          <div className="mt-6 text-center">
            <button
              onClick={handleAnalyzeChart}
              disabled={isLoading || !chartImageFile || !clientInitialized}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
              aria-label="Analyze Chart"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Chart'}
            </button>
            {!clientInitialized && !isLoading && (
                <p className="mt-2 text-sm text-yellow-400">Please set your API Key to enable analysis.</p>
            )}
          </div>
        )}

        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}
        
        {analysis && !isLoading && (
          <div className="mt-8">
            <AnalysisDisplay analysis={analysis} />
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Chart Analyzer. Powered by Gemini.</p>
         <p className="mt-1 text-xs">
           Note: Gemini API Key is required. Your key is stored locally in your browser.
         </p>
      </footer>
    </div>
  );
};

export default App;
