/**
 * Media Service - Handles MediaDevices API with proper context binding
 * Prevents "Illegal invocation" errors by maintaining proper 'this' context
 */

class MediaService {
  constructor() {
    // Bind methods to maintain proper context
    this.getUserMedia = this.getUserMedia.bind(this);
    this.getDisplayMedia = this.getDisplayMedia.bind(this);
    this.enumerateDevices = this.enumerateDevices.bind(this);
  }

  /**
   * Get user media with proper error handling and context binding
   */
  async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported');
      }

      // Properly bind the method to maintain context
      const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      const stream = await getUserMedia(constraints);
      
      return {
        success: true,
        stream,
        error: null
      };
    } catch (error) {
      console.error('MediaService - getUserMedia error:', error);
      
      return {
        success: false,
        stream: null,
        error: {
          name: error.name,
          message: error.message,
          type: this.getErrorType(error)
        }
      };
    }
  }

  /**
   * Get display media (screen sharing) with proper context binding
   */
  async getDisplayMedia(constraints = { video: true }) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing not supported');
      }

      const getDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      const stream = await getDisplayMedia(constraints);
      
      return {
        success: true,
        stream,
        error: null
      };
    } catch (error) {
      console.error('MediaService - getDisplayMedia error:', error);
      
      return {
        success: false,
        stream: null,
        error: {
          name: error.name,
          message: error.message,
          type: this.getErrorType(error)
        }
      };
    }
  }

  /**
   * Enumerate available media devices
   */
  async enumerateDevices() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Device enumeration not supported');
      }

      const enumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
      const devices = await enumerateDevices();
      
      return {
        success: true,
        devices,
        error: null
      };
    } catch (error) {
      console.error('MediaService - enumerateDevices error:', error);
      
      return {
        success: false,
        devices: [],
        error: {
          name: error.name,
          message: error.message,
          type: this.getErrorType(error)
        }
      };
    }
  }

  /**
   * Stop media stream tracks
   */
  stopStream(stream) {
    if (stream && stream.getTracks) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.warn('Error stopping media track:', error);
        }
      });
    }
  }

  /**
   * Get error type for better error handling
   */
  getErrorType(error) {
    if (error.name === 'NotAllowedError') return 'permission_denied';
    if (error.name === 'NotFoundError') return 'device_not_found';
    if (error.name === 'NotSupportedError') return 'not_supported';
    if (error.name === 'NotReadableError') return 'device_busy';
    if (error.message.includes('Illegal invocation')) return 'context_error';
    return 'unknown';
  }

  /**
   * Check if media APIs are supported
   */
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

// Export singleton instance
export const mediaService = new MediaService();
export default mediaService;