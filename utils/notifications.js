// utils/notifications.js
import moment from "moment";

class NotificationManager {
  constructor() {
    this.permission = typeof window !== 'undefined' && "Notification" in window 
      ? Notification.permission 
      : "denied";
  }

  // Request notification permission
  async requestPermission() {
    if (typeof window === 'undefined' || !("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      this.permission = "granted";
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    }

    return false;
  }

  // Format message preview based on type
  formatMessagePreview(message) {
    if (message.poll) {
      return `📊 Poll: ${message.poll.question}`;
    }
    
    if (message.location) {
      return "📍 Shared location";
    }
    
    if (message.voiceURL) {
      return "🎤 Voice message";
    }
    
    if (message.fileURL) {
      if (message.fileType?.startsWith('image/')) {
        return "📷 Photo";
      }
      if (message.fileType?.startsWith('video/')) {
        return "🎥 Video";
      }
      if (message.fileType?.startsWith('audio/')) {
        return "🎵 Audio";
      }
      return `📎 ${message.fileName || 'File'}`;
    }
    
    if (message.message) {
      // Truncate long messages
      return message.message.length > 50 
        ? message.message.substring(0, 50) + "..."
        : message.message;
    }
    
    return "New message";
  }

  // Get sender display name
  getSenderName(senderEmail, customDisplayName, isSelfChat) {
    if (isSelfChat) {
      return "You (Saved Messages)";
    }
    return customDisplayName || senderEmail?.split('@')[0] || "Unknown";
  }

  // Show notification
  showNotification({ 
    senderEmail, 
    customDisplayName, 
    message, 
    chatId, 
    isSelfChat = false,
    senderPhotoURL 
  }) {
    if (typeof window === 'undefined' || this.permission !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }

    const title = this.getSenderName(senderEmail, customDisplayName, isSelfChat);
    const body = this.formatMessagePreview(message);

    const options = {
      body: body,
      icon: senderPhotoURL || '/default-avatar.png',
      badge: '/notification-badge.png',
      tag: chatId, // This prevents duplicate notifications for the same chat
      requireInteraction: false,
      timestamp: message.timestamp || Date.now(),
      data: {
        chatId,
        messageId: message.id,
        senderEmail,
      },
    };

    try {
      const notification = new Notification(title, options);

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        // Navigate to the chat
        window.location.href = `/chat/${chatId}`;
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error("Error showing notification:", error);
      return null;
    }
  }

  // Check if should show notification
  shouldShowNotification(userEmail, messageUserEmail, isTabFocused, currentChatId, messageChatId) {
    // Don't show notification for own messages
    if (userEmail === messageUserEmail) {
      return false;
    }

    // Don't show if tab is focused and viewing the chat
    if (isTabFocused && currentChatId === messageChatId) {
      return false;
    }

    return true;
  }
}

export const notificationManager = new NotificationManager();
export default NotificationManager;