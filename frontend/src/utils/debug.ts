// Debug logging utility
class DebugLogger {
  private isEnabled: boolean = false;
  private readonly key = 'garage-sale-debug';

  constructor() {
    // Check localStorage on initialization
    this.isEnabled = localStorage.getItem(this.key) === 'true';
    
    // Expose global functions for easy console access
    (window as any).enableDebug = () => this.enable();
    (window as any).disableDebug = () => this.disable();
    (window as any).debugStatus = () => this.status();
    
    if (this.isEnabled) {
      console.log('🔍 Debug logging is ENABLED');
      console.log('💡 Use disableDebug() to turn off');
    } else {
      console.log('🔍 Debug logging is DISABLED');
      console.log('💡 Use enableDebug() to turn on detailed logging');
    }
  }

  enable() {
    this.isEnabled = true;
    localStorage.setItem(this.key, 'true');
    console.log('🔍 Debug logging ENABLED - detailed logs will appear below');
    console.log('💡 Use disableDebug() to turn off');
  }

  disable() {
    this.isEnabled = false;
    localStorage.removeItem(this.key);
    console.log('🔍 Debug logging DISABLED');
  }

  status() {
    console.log(`🔍 Debug logging is ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);
    return this.isEnabled;
  }

  log(category: string, message: string, data?: any) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const emoji = this.getCategoryEmoji(category);
    
    if (data) {
      console.groupCollapsed(`${emoji} [${timestamp}] ${category}: ${message}`);
      console.log('Data:', data);
      console.groupEnd();
    } else {
      console.log(`${emoji} [${timestamp}] ${category}: ${message}`);
    }
  }

  group(category: string, message: string) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const emoji = this.getCategoryEmoji(category);
    console.group(`${emoji} [${timestamp}] ${category}: ${message}`);
  }

  groupEnd() {
    if (!this.isEnabled) return;
    console.groupEnd();
  }

  error(category: string, message: string, error?: any) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`❌ [${timestamp}] ${category}: ${message}`, error);
  }

  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      API: '🌐',
      Upload: '📤',
      AI: '🤖',
      UI: '🎨',
      Route: '🛤️',
      State: '🗂️',
      Progress: '📊',
      Error: '❌',
      Auth: '🔐',
      Image: '🖼️',
      Form: '📝'
    };
    return emojiMap[category] || '📋';
  }
}

// Create singleton instance
export const debug = new DebugLogger();

// Convenience functions for common categories
export const debugAPI = (message: string, data?: any) => debug.log('API', message, data);
export const debugUpload = (message: string, data?: any) => debug.log('Upload', message, data);
export const debugAI = (message: string, data?: any) => debug.log('AI', message, data);
export const debugUI = (message: string, data?: any) => debug.log('UI', message, data);
export const debugProgress = (message: string, data?: any) => debug.log('Progress', message, data);
export const debugError = (message: string, error?: any) => debug.error('Error', message, error);