// utils/sendDualMessage.js

import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { generateChatIds, isSelfChat as checkSelfChat, generateSelfChatId } from './chatHelpers';
import { MESSAGE_STATUS } from '../components/ChatScreen/constants';

/**
 * Send message to BOTH chat documents
 */
export const sendDualMessage = async (currentUserEmail, recipientEmail, messageData) => {
  try {
    console.log(`📤 Sending dual message from ${currentUserEmail} to ${recipientEmail}`);
    
    // Handle self-chat
    if (checkSelfChat(currentUserEmail, recipientEmail)) {
      const selfChatId = generateSelfChatId(currentUserEmail);
      
      const selfMessage = {
        ...messageData,
        user: currentUserEmail,
        timestamp: serverTimestamp(),
        status: MESSAGE_STATUS.READ, // Self-chat messages are always read
        readAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'chats', selfChatId, 'messages'), selfMessage);
      
      await updateDoc(doc(db, 'chats', selfChatId), {
        lastMessage: messageData.message || 'File',
        lastMessageTime: serverTimestamp(),
      });
      
      console.log(`✅ Self-chat message sent`);
      return;
    }
    
    const { myChatId, theirChatId } = generateChatIds(currentUserEmail, recipientEmail);
    
    // Message in MY chat (sent by me - shows status updates)
    const myMessage = {
      ...messageData,
      user: currentUserEmail,
      timestamp: serverTimestamp(),
      status: MESSAGE_STATUS.SENT, // Will update to delivered/read
    };
    
    // Message in THEIR chat (from me, but in their inbox)
    const theirMessage = {
      ...messageData,
      user: currentUserEmail,
      timestamp: serverTimestamp(),
      status: MESSAGE_STATUS.SENT, // They will mark as delivered/read when they see it
    };
    
    // Add messages to both chats
    await Promise.all([
      addDoc(collection(db, 'chats', myChatId, 'messages'), myMessage),
      addDoc(collection(db, 'chats', theirChatId, 'messages'), theirMessage),
    ]);
    
    const lastMessage = messageData.message || messageData.fileURL ? 'File' : 'Message';
    
    // Update last message in both chats
    await Promise.all([
      updateDoc(doc(db, 'chats', myChatId), {
        lastMessage,
        lastMessageTime: serverTimestamp(),
      }),
      updateDoc(doc(db, 'chats', theirChatId), {
        lastMessage,
        lastMessageTime: serverTimestamp(),
      }),
    ]);
    
    console.log(`✅ Dual message sent to both chats`);
  } catch (error) {
    console.error('❌ Error sending dual message:', error);
    throw error;
  }
};