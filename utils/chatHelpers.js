// utils/chatHelpers.js

/**
 * Generate deterministic chat IDs for both users
 */
export const generateChatIds = (userEmail, recipientEmail) => {
  const user = userEmail.toLowerCase().trim();
  const recipient = recipientEmail.toLowerCase().trim();
  
  return {
    myChatId: `chat_${user}_${recipient}`,
    theirChatId: `chat_${recipient}_${user}`,
  };
};

/**
 * Check if this is a self-chat
 */
export const isSelfChat = (userEmail, recipientEmail) => {
  return userEmail.toLowerCase().trim() === recipientEmail.toLowerCase().trim();
};

/**
 * Generate self-chat ID
 */
export const generateSelfChatId = (userEmail) => {
  return `chat_self_${userEmail.toLowerCase().trim()}`;
};