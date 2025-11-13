// utils/createDualChat.js

import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateChatIds, isSelfChat as checkSelfChat, generateSelfChatId } from './chatHelpers';

/**
 * Create two mirrored chat documents - one for each user
 */
export const createDualChat = async (currentUserEmail, recipientEmail) => {
  try {
    console.log(`📝 Creating dual chat: ${currentUserEmail} ↔ ${recipientEmail}`);
    
    // Handle self-chat
    if (checkSelfChat(currentUserEmail, recipientEmail)) {
      console.log(`💬 Self-chat detected - creating single chat`);
      
      const selfChatId = generateSelfChatId(currentUserEmail);
      
      // Check if exists
      const selfDoc = await getDoc(doc(db, 'chats', selfChatId));
      if (selfDoc.exists()) {
        console.log(`ℹ️ Self-chat already exists: ${selfChatId}`);
        return { myChatId: selfChatId, theirChatId: selfChatId };
      }
      
      // Create self-chat document
      await setDoc(doc(db, 'chats', selfChatId), {
        owner: currentUserEmail,
        recipient: currentUserEmail,
        users: [currentUserEmail, currentUserEmail],
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        deletedBy: [],
        archivedBy: [],
        isSelfChat: true,
      });
      
      console.log(`✅ Self-chat created: ${selfChatId}`);
      return { myChatId: selfChatId, theirChatId: selfChatId };
    }
    
    // Generate chat IDs
    const { myChatId, theirChatId } = generateChatIds(currentUserEmail, recipientEmail);
    
    // Check if chats already exist
    const [myDoc, theirDoc] = await Promise.all([
      getDoc(doc(db, 'chats', myChatId)),
      getDoc(doc(db, 'chats', theirChatId))
    ]);
    
    if (myDoc.exists() && theirDoc.exists()) {
      console.log(`ℹ️ Chats already exist`);
      return { myChatId, theirChatId };
    }
    
    // Create both chat documents
    const chatData1 = {
      owner: currentUserEmail,
      recipient: recipientEmail,
      users: [currentUserEmail, recipientEmail],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      deletedBy: [],
      archivedBy: [],
    };
    
    const chatData2 = {
      owner: recipientEmail,
      recipient: currentUserEmail,
      users: [recipientEmail, currentUserEmail],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      deletedBy: [],
      archivedBy: [],
    };
    
    await Promise.all([
      setDoc(doc(db, 'chats', myChatId), chatData1),
      setDoc(doc(db, 'chats', theirChatId), chatData2)
    ]);
    
    console.log(`✅ Dual chats created:`, { myChatId, theirChatId });
    
    return { myChatId, theirChatId };
  } catch (error) {
    console.error('❌ Error creating dual chat:', error);
    throw error;
  }
};

/**
 * Check if dual chat exists
 */
export const dualChatExists = async (currentUserEmail, recipientEmail) => {
  try {
    if (checkSelfChat(currentUserEmail, recipientEmail)) {
      const selfChatId = generateSelfChatId(currentUserEmail);
      const selfDoc = await getDoc(doc(db, 'chats', selfChatId));
      return selfDoc.exists();
    }
    
    const { myChatId } = generateChatIds(currentUserEmail, recipientEmail);
    const myDoc = await getDoc(doc(db, 'chats', myChatId));
    return myDoc.exists();
  } catch (error) {
    console.error('❌ Error checking dual chat:', error);
    return false;
  }
};