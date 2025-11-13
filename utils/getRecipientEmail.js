// utils/getRecipientEmail.js

/**
 * Get the recipient email for a chat (WhatsApp-style)
 * @param {string[]} users - Array of user emails in the chat
 * @param {Object} userLoggedIn - Current logged-in user
 * @returns {string|null} Recipient email or null
 */
const getRecipientEmail = (users, userLoggedIn) => {
  // ===================================
  // 1️⃣ VALIDATION
  // ===================================
  if (!users || !Array.isArray(users) || !userLoggedIn?.email) {
    return null;
  }

  const currentUserEmail = userLoggedIn.email.toLowerCase().trim();
  
  // Clean and normalize all emails
  const cleanedUsers = users
    .filter(email => email && typeof email === 'string')
    .map(email => email.toLowerCase().trim());

  // Chat must have at least 1 user
  if (cleanedUsers.length === 0) {
    return null;
  }

  // ===================================
  // 2️⃣ SELF-CHAT DETECTION (Saved Messages)
  // ===================================
  // Get unique participants
  const uniqueParticipants = [...new Set(cleanedUsers)];

  // If there's only ONE unique participant and it's ME → Self-chat
  if (uniqueParticipants.length === 1 && uniqueParticipants[0] === currentUserEmail) {
    return currentUserEmail;
  }

  // ===================================
  // 3️⃣ REGULAR CHAT - Find Other Person
  // ===================================
  // Find the first person who is NOT me
  const recipient = cleanedUsers.find(email => email !== currentUserEmail);

  if (recipient) {
    return recipient;
  }

  // No valid recipient found
  return null;
};

export default getRecipientEmail;