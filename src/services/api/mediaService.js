// MediaService for handling camera, microphone, and media operations

class MediaService {
  constructor() {
    this.stream = null;
    this.isSupported = this.checkSupport();
  }

  checkSupport() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Get user media with proper error handling and context binding
async getUserMedia(constraints = { video: true, audio: false }) {
    if (!this.isSupported) {
      throw new Error('getUserMedia is not supported in this browser');
    }

    try {
      // Enhanced context preservation to prevent "Illegal invocation"
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
        throw new Error('getUserMedia method not available');
      }
      
// Use .call() to ensure proper context binding and prevent "Illegal invocation"
      this.stream = await mediaDevices.getUserMedia.call(mediaDevices, constraints);
      return this.stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw this.handleMediaError(error);
    }
  }
  // Get camera stream with enhanced error handling
  async getCameraStream(facingMode = 'environment') {
    try {
      return await this.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
    } catch (error) {
      // Fallback to basic video constraints if advanced constraints fail
      if (error.name === 'OverconstrainedError') {
        return await this.getUserMedia({
          video: true,
          audio: false
        });
      }
      throw error;
    }
  }

  // Get microphone stream with enhanced error handling
  async getMicrophoneStream() {
    try {
      return await this.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (error) {
      // Fallback to basic audio constraints
      if (error.name === 'OverconstrainedError') {
        return await this.getUserMedia({
          video: false,
          audio: true
        });
      }
      throw error;
    }
  }

  // Stop current stream with proper cleanup
  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.stream = null;
}
  }

  // Handle media errors with comprehensive error mapping
  handleMediaError(error) {
    const errorMessages = {
      'NotAllowedError': 'Permission denied. Please allow camera/microphone access in your browser settings.',
      'NotFoundError': 'No camera/microphone found. Please connect a device and try again.',
      'NotReadableError': 'Camera/microphone is already in use by another application.',
      'OverconstrainedError': 'Camera/microphone constraints cannot be satisfied. Trying with basic settings.',
      'SecurityError': 'Media access blocked due to security restrictions. Please use HTTPS.',
      'AbortError': 'Media access was aborted. Please try again.',
      'NotSupportedError': 'Media access is not supported in this browser.',
      'TypeError': 'Invalid media constraints provided.'
    };

    const userFriendlyMessage = errorMessages[error.name] || `Media error: ${error.message}`;
    const enhancedError = new Error(userFriendlyMessage);
    enhancedError.originalError = error;
    enhancedError.name = error.name;
    
    return enhancedError;
  }

  // Take photo from video stream with error handling
  takePhoto(videoElement) {
    if (!videoElement) {
      throw new Error('Video element is required');
    }

    if (videoElement.readyState !== 4) {
      throw new Error('Video is not ready. Please wait for the camera to initialize.');
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Unable to get canvas context');
      }

      context.drawImage(videoElement, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error taking photo:', error);
      throw new Error('Failed to capture photo. Please try again.');
    }
  }

// Get available media devices with proper error handling
  async getDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return { cameras: [], microphones: [], speakers: [] };
    }

    try {
      // Enhanced context preservation for enumerateDevices
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices || typeof mediaDevices.enumerateDevices !== 'function') {
        return { cameras: [], microphones: [], speakers: [] };
      }
      
// Use .call() to ensure proper context binding and prevent "Illegal invocation"
      const devices = await mediaDevices.enumerateDevices.call(mediaDevices);
      return {
        cameras: devices.filter(device => device.kind === 'videoinput'),
        microphones: devices.filter(device => device.kind === 'audioinput'),
        speakers: devices.filter(device => device.kind === 'audiooutput')
      };
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return { cameras: [], microphones: [], speakers: [] };
    }
  }

  // Check if device has camera with proper error handling
  async hasCamera() {
    try {
      const devices = await this.getDevices();
      return devices.cameras.length > 0;
    } catch (error) {
      console.warn('Could not check camera availability:', error);
      return false;
    }
  }

  // Check if device has microphone with proper error handling
  async hasMicrophone() {
    try {
      const devices = await this.getDevices();
      return devices.microphones.length > 0;
    } catch (error) {
      console.warn('Could not check microphone availability:', error);
      return false;
    }
  }

  // Switch camera (front/back) with enhanced error handling
  async switchCamera() {
    if (!this.stream) {
      throw new Error('No active stream to switch');
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('No video track found');
    }

    try {
      const settings = videoTrack.getSettings();
      const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user';
      
      this.stopStream();
      return await this.getCameraStream(newFacingMode);
    } catch (error) {
      console.error('Error switching camera:', error);
      // Try to restart with original constraints if switch fails
      try {
        return await this.getCameraStream();
      } catch (fallbackError) {
        throw new Error('Unable to switch camera. Please restart the camera.');
      }
    }
  }

  // Record video/audio with comprehensive error handling
  startRecording(stream, options = {}) {
    if (!MediaRecorder) {
      throw new Error('MediaRecorder is not supported in this browser');
    }

    if (!stream || !stream.active) {
      throw new Error('Invalid or inactive media stream provided');
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: options.mimeType || 'video/webm',
        videoBitsPerSecond: options.videoBitsPerSecond || 1000000
      });

      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
}
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
      };

      return {
        mediaRecorder,
        chunks,
        start: () => {
          if (mediaRecorder.state === 'inactive') {
            mediaRecorder.start();
          }
        },
        stop: () => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        },
        getBlob: () => new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' }),
        getState: () => mediaRecorder.state
      };
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Unable to start recording. Please check your browser compatibility.');
    }
  }

  // Request permissions with comprehensive error handling
  async requestPermissions() {
    if (!this.isSupported) {
      return { camera: false, microphone: false, error: 'Media devices not supported' };
    }

    try {
      // Try to get both permissions at once
      const stream = await this.getUserMedia({ video: true, audio: true });
      this.stopStream();
      return { camera: true, microphone: true };
    } catch (error) {
      console.warn('Combined permissions failed, trying individually:', error);
      
      // Try individual permissions
      const permissions = { camera: false, microphone: false };
      
      try {
        const videoStream = await this.getUserMedia({ video: true, audio: false });
        if (videoStream) {
          videoStream.getTracks().forEach(track => track.stop());
          permissions.camera = true;
        }
      } catch (e) {
        console.warn('Camera permission denied:', e);
        permissions.cameraError = e.message;
      }

      try {
        const audioStream = await this.getUserMedia({ video: false, audio: true });
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
          permissions.microphone = true;
        }
      } catch (e) {
        console.warn('Microphone permission denied:', e);
        permissions.microphoneError = e.message;
      }

      return permissions;
    }
  }

  // Enhanced cleanup with event listener removal
  cleanup() {
    try {
      this.stopStream();
      
      // Remove any device change listeners if they were added
      if (navigator.mediaDevices && this.deviceChangeHandler) {
        navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeHandler);
        this.deviceChangeHandler = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Add device change monitoring
  onDeviceChange(callback) {
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      this.deviceChangeHandler = callback;
      navigator.mediaDevices.addEventListener('devicechange', callback);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', callback);
        this.deviceChangeHandler = null;
      };
    }
    return () => {}; // Return empty cleanup function if not supported
  }
}

// Create singleton instance with proper error handling
let mediaServiceInstance;
try {
  mediaServiceInstance = new MediaService();
} catch (error) {
  console.error('Failed to initialize MediaService:', error);
  mediaServiceInstance = null;
}

export const mediaService = mediaServiceInstance;
export default mediaServiceInstance;