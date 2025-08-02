import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setQuery, setResults, openSearch, closeSearch, addRecentSearch } from "@/store/searchSlice";
import { productService } from "@/services/api/productService";
import Input from "@/components/atoms/Input";
import ApperIcon from "@/components/ApperIcon";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
setSpeechSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    
    // Safe camera support detection to prevent "Illegal invocation" error
    try {
      setCameraSupported(
        navigator.mediaDevices && 
        typeof navigator.mediaDevices.getUserMedia === 'function'
      );
    } catch (error) {
      console.warn('Camera support detection failed:', error);
      setCameraSupported(false);
    }
  }, []);
  const startVoiceSearch = () => {
    if (!speechSupported) {
      alert('Voice search is not supported in your browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      dispatch(setQuery(transcript));
      handleSearch(transcript);
      setIsListening(false);
    };

recognition.onerror = (event) => {
      setIsListening(false);
      
      // Enhanced error handling for speech recognition with immediate feedback
      const error = {
        name: event.error || 'SpeechRecognitionError',
        message: `Voice recognition error: ${event.error}`,
        originalError: event
      };

      // Provide immediate user feedback for permission denied
      if (event.error === 'not-allowed') {
        console.warn('Microphone permission denied for voice search');
        // Show immediate feedback while ErrorHandler provides detailed guidance
        import('@/utils/errorHandler').then(({ ErrorHandler }) => {
          ErrorHandler.handleSpeechRecognitionError(error, 'Voice Search');
        }).catch(console.error);
      } else {
        // Use the enhanced error handler for other error types
        import('@/utils/errorHandler').then(({ ErrorHandler }) => {
          ErrorHandler.handleSpeechRecognitionError(error, 'Voice Search');
        }).catch(console.error);
      }

      // Enhanced logging for debugging
      console.warn('Speech recognition failed:', {
        error: event.error,
        message: event.message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

const startBarcodeScanning = async () => {
    if (!cameraSupported) {
      alert('Camera access is not supported in your browser');
      return;
    }

    try {
      setIsScanning(true);
      
      // Enhanced browser compatibility checks
      if (!navigator?.mediaDevices) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
      // Store reference to prevent context issues
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
        throw new Error('getUserMedia not supported in this browser');
      }
      
      // Use .call() to ensure proper context binding and prevent "Illegal invocation"
      const stream = await mediaDevices.getUserMedia.call(mediaDevices, { 
        video: { facingMode: 'environment' } // Use back camera
      });
      
      // Create video element for barcode scanning
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      
      // Simple barcode detection using camera (in real app, use a barcode library)
      // For demo, we'll simulate scanning after 3 seconds
      setTimeout(async () => {
        const mockBarcode = '1234567890123'; // Simulated barcode
        
        // Clean up stream
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
        
        // Search for product by barcode
        try {
          const products = await productService.searchByBarcode(mockBarcode);
          if (products.length > 0) {
            dispatch(setQuery(products[0].name));
            handleSearch(products[0].name);
          } else {
            alert('No product found for this barcode');
          }
        } catch (searchError) {
          console.error('Barcode search error:', searchError);
          alert('Error searching for product. Please try again.');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Camera access error:', error);
      setIsScanning(false);
      
      let errorMessage = 'Camera access failed. Please try again.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access to scan barcodes.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser. Please try a different browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      } else if (error.message?.includes('MediaDevices') || error.message?.includes('getUserMedia')) {
        errorMessage = 'Camera API not available. Please use a modern browser with HTTPS.';
      }
      
      alert(errorMessage);
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
      {cameraSupported && (
        <button
          onClick={startBarcodeScanning}
          disabled={isScanning}
          className={`absolute right-24 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors duration-200 ${
            isScanning 
              ? 'text-blue-500 bg-blue-50 animate-pulse' 
              : 'text-gray-500 hover:text-primary hover:bg-primary/10'
          }`}
          title="Scan Barcode/QR"
        >
          <ApperIcon name={isScanning ? "Camera" : "QrCode"} className="w-4 h-4" />
        </button>
      )}
      
      {/* Voice Search Button */}
      {speechSupported && (
        <button
          onClick={startVoiceSearch}
          disabled={isListening}
          className={`absolute right-12 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors duration-200 ${
            isListening 
              ? 'text-red-500 bg-red-50 animate-pulse' 
              : 'text-gray-500 hover:text-primary hover:bg-primary/10'
          }`}
          title="Voice Search"
        >
          <ApperIcon name={isListening ? "MicOff" : "Mic"} className="w-4 h-4" />
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
                      src={product.images[0]}
                      alt={product.title}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </p>
                      <p className="text-sm text-primary font-semibold">
                        ${product.price.toFixed(2)}
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