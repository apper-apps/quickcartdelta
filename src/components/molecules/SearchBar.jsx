import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { productService } from "@/services/api/productService";
import ApperIcon from "@/components/ApperIcon";
import Error from "@/components/ui/Error";
import Input from "@/components/atoms/Input";
import { addRecentSearch, closeSearch, openSearch, setQuery, setResults } from "@/store/searchSlice";

const SearchBar = ({ className = "" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { query, results, isOpen, recentSearches } = useSelector((state) => state.search);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        dispatch(closeSearch());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dispatch]);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length > 2) {
        setLoading(true);
        try {
          const products = await productService.search(query);
          setSuggestions(products.slice(0, 5));
          dispatch(setResults(products));
        } catch (error) {
          console.error("Search error:", error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, dispatch]);

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      dispatch(addRecentSearch(searchQuery.trim()));
      dispatch(closeSearch());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    dispatch(setQuery(value));
    if (value && !isOpen) {
      dispatch(openSearch());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestionClick = (product) => {
    dispatch(closeSearch());
    navigate(`/product/${product.Id}`);
  };

const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [voiceSearchLang, setVoiceSearchLang] = useState('en-US');

  useEffect(() => {
    // Enhanced speech recognition support detection
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSpeechSupported(hasSpeechRecognition);
    
    // Enhanced camera support detection with better error handling
    const checkCameraSupport = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setCameraSupported(false);
          return;
        }
        
        // Test camera availability without actually requesting permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setCameraSupported(hasCamera);
        
      } catch (error) {
        console.warn('Camera support detection failed:', error);
        setCameraSupported(false);
      }
    };
    
    checkCameraSupport();
  }, []);

  const startVoiceSearch = () => {
    if (!speechSupported) {
      toast.error('🎤 Voice search not supported in your browser. Please try Chrome, Firefox, or Safari.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Enhanced speech recognition configuration
    recognition.continuous = false;
    recognition.interimResults = true; // Show real-time results
    recognition.lang = voiceSearchLang;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info('🎤 Listening... Speak your search query');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        dispatch(setQuery(finalTranscript));
        handleSearch(finalTranscript);
        setIsListening(false);
        toast.success(`🔍 Searching for: "${finalTranscript}"`);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      
      let errorMessage = 'Voice search failed. Please try again.';
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = '🚫 Microphone access denied. Please allow microphone access and try again.';
          toast.error(errorMessage);
          break;
        case 'no-speech':
          errorMessage = '🔇 No speech detected. Please try speaking closer to your microphone.';
          toast.warning(errorMessage);
          break;
        case 'audio-capture':
          errorMessage = '🎤 Microphone not found. Please check your audio devices.';
          toast.error(errorMessage);
          break;
        case 'network':
          errorMessage = '🌐 Network error during voice recognition. Please check your connection.';
          toast.error(errorMessage);
          break;
        case 'service-not-allowed':
          errorMessage = '⚙️ Voice recognition service not available. Please try again later.';
          toast.error(errorMessage);
          break;
        default:
          toast.error(`🎤 Voice search error: ${event.error}`);
      }
      
      console.warn('Enhanced speech recognition error:', {
        error: event.error,
        message: event.message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: voiceSearchLang
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
      toast.error('🎤 Failed to start voice recognition. Please try again.');
      console.error('Voice recognition start error:', error);
    }
  };

  const startBarcodeScanning = async () => {
    if (!cameraSupported) {
      toast.error('📷 Camera not available. Please use a device with camera access.');
      return;
    }

    try {
      setIsScanning(true);
      toast.info('📷 Starting barcode scanner... Please allow camera access.');
      
      // Enhanced browser compatibility checks
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      // Request camera permission with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      // Create video element for barcode scanning
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      
      // Enhanced barcode scanning simulation with visual feedback
      toast.info('🔍 Point camera at barcode... Scanning in progress...');
      
      // Simulate barcode detection (in production, use a barcode scanning library like QuaggaJS)
      const scanTimeout = setTimeout(async () => {
        try {
          const mockBarcodes = [
            { code: '1234567890123', product: 'Apple iPhone 15' },
            { code: '9876543210987', product: 'Samsung Galaxy Watch' },
            { code: '4567890123456', product: 'Sony WH-1000XM4 Headphones' }
          ];
          
          const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
          
          // Search for product by barcode
          const products = await productService.searchByBarcode(randomBarcode.code);
          
          if (products.length > 0) {
            const productName = products[0].title || randomBarcode.product;
            dispatch(setQuery(productName));
            handleSearch(productName);
            toast.success(`✅ Found product: ${productName}`);
          } else {
            toast.warning('❌ No product found for this barcode. Try a different product.');
          }
          
        } catch (searchError) {
          console.error('Barcode search error:', searchError);
          toast.error('🔍 Error searching for product. Please try manual search.');
        }
      }, 3000);
      
      // Clean up after scanning
      setTimeout(() => {
        clearTimeout(scanTimeout);
        if (stream) {
          stream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (stopError) {
              console.warn('Error stopping camera track:', stopError);
            }
          });
        }
        setIsScanning(false);
      }, 5000);
      
    } catch (error) {
      console.error('Enhanced camera access error:', error);
      setIsScanning(false);
      
      let errorMessage = '📷 Camera access failed. Please try again.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '🚫 Camera permission denied. Please allow camera access to scan barcodes.';
        toast.error(errorMessage);
      } else if (error.name === 'NotFoundError') {
        errorMessage = '📷 No camera found. Please use a device with a camera.';
        toast.error(errorMessage);
      } else if (error.name === 'NotSupportedError') {
        errorMessage = '🌐 Camera not supported in this browser. Please try Chrome, Firefox, or Safari.';
        toast.error(errorMessage);
      } else if (error.name === 'NotReadableError') {
        errorMessage = '📱 Camera is busy. Please close other apps using the camera and try again.';
        toast.error(errorMessage);
      } else if (error.message?.includes('MediaDevices') || error.message?.includes('getUserMedia')) {
        errorMessage = '🔒 Camera requires HTTPS. Please use a secure connection.';
        toast.error(errorMessage);
      } else {
        toast.error('📷 Camera initialization failed. Please try again.');
      }
    }
  };

  return (
<div ref={searchRef} className={`relative ${className}`}>
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search products, use voice, or scan barcode..."
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={() => dispatch(openSearch())}
        icon="Search"
        iconPosition="left"
        className="pr-32"
      />
      
      {/* Barcode Scanner Button */}
{/* Enhanced Barcode Scanner Button */}
      {cameraSupported && (
        <button
          onClick={startBarcodeScanning}
          disabled={isScanning}
          className={`absolute right-24 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
            isScanning 
              ? 'text-blue-500 bg-blue-50 animate-pulse scale-110' 
              : 'text-gray-500 hover:text-primary hover:bg-primary/10 hover:scale-105'
          }`}
          title={isScanning ? "Scanning barcode..." : "Scan Barcode/QR Code"}
        >
          <ApperIcon 
            name={isScanning ? "Camera" : "QrCode"} 
            className={`w-4 h-4 ${isScanning ? 'animate-pulse' : ''}`} 
          />
        </button>
      )}
      
      {/* Enhanced Voice Search Button */}
      {speechSupported && (
        <button
          onClick={startVoiceSearch}
          disabled={isListening}
          className={`absolute right-12 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
            isListening 
              ? 'text-red-500 bg-red-50 animate-pulse scale-110' 
              : 'text-gray-500 hover:text-primary hover:bg-primary/10 hover:scale-105'
          }`}
          title={isListening ? "Listening... Speak now" : "Voice Search"}
        >
          <ApperIcon 
            name={isListening ? "MicOff" : "Mic"} 
            className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} 
          />
          {isListening && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          )}
        </button>
      )}
      
      <button
        onClick={() => handleSearch()}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
      >
        <ApperIcon name="Search" className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-auto"
          >
            {loading && (
              <div className="p-4 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <ApperIcon name="Loader2" className="w-4 h-4 animate-spin" />
                  Searching...
                </div>
              </div>
            )}

            {!loading && suggestions.length > 0 && (
              <div className="p-2">
                <h4 className="text-sm font-medium text-gray-700 px-3 py-2">Products</h4>
                {suggestions.map((product) => (
                  <button
                    key={product.Id}
                    onClick={() => handleSuggestionClick(product)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors duration-200"
                  >
<img
                      src={product.images?.[0] || '/placeholder-product.jpg'}
                      alt={product.title}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </p>
<p className="text-sm text-primary font-semibold">
                        ${product.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && query.length === 0 && recentSearches.length > 0 && (
              <div className="p-2">
                <h4 className="text-sm font-medium text-gray-700 px-3 py-2">Recent Searches</h4>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors duration-200"
                  >
                    <ApperIcon name="Clock" className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {!loading && query.length > 2 && suggestions.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <ApperIcon name="Search" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No products found for "{query}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;