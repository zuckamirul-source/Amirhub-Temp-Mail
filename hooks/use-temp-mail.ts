'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getMessages, 
  getMessageContent, 
  TempEmailMessage, 
  TempEmailContent,
  getTopDomain,
  createAccount,
  getToken
} from '@/lib/mail-service';

export function useTempMail() {
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<TempEmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [activeMessageContent, setActiveMessageContent] = useState<TempEmailContent | null>(null);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const refreshInbox = useCallback(async (authToken: string) => {
    setIsRefreshing(true);
    setError(null);
    setIsOnline(true);
    try {
      const msgs = await getMessages(authToken);
      setMessages(msgs);
      setLastChecked(new Date());
      setIsOnline(true);
    } catch (err: any) {
      console.error('Failed to refresh inbox:', err);
      // If unauthorized, token might be expired. Try to re-login once.
      if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
        const address = localStorage.getItem('mail_tm_address');
        const password = localStorage.getItem('mail_tm_password');
        if (address && password) {
          try {
            const newToken = await getToken(address, password);
            localStorage.setItem('mail_tm_token', newToken);
            setToken(newToken);
            const retryMsgs = await getMessages(newToken);
            setMessages(retryMsgs);
            setIsOnline(true);
            return;
          } catch (reAuthErr) {
            console.error('Re-auth failed:', reAuthErr);
            setIsOnline(false);
          }
        }
      }
      setIsOnline(false);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  const generateNewAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsOnline(true);
    try {
      const domain = await getTopDomain();
      const randomId = Math.random().toString(36).substring(2, 10);
      const address = `${randomId}@${domain}`;
      const password = Math.random().toString(36).substring(2, 15);
      
      await createAccount(address, password);
      const authToken = await getToken(address, password);
      
      localStorage.setItem('mail_tm_address', address);
      localStorage.setItem('mail_tm_password', password);
      localStorage.setItem('mail_tm_token', authToken);
      
      setEmail(address);
      setToken(authToken);
      setMessages([]);
      setActiveMessageId(null);
      setActiveMessageContent(null);
      await refreshInbox(authToken);
    } catch (err: any) {
      console.error('Failed to create account:', err);
      setError(err.message || 'Failed to create a new secure address.');
      setIsOnline(false);
      setIsLoading(false);
    }
  }, [refreshInbox]);

  const initEmail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsOnline(true);
    try {
      const savedAddress = localStorage.getItem('mail_tm_address');
      const savedPassword = localStorage.getItem('mail_tm_password');
      let savedToken = localStorage.getItem('mail_tm_token');
      
      if (!savedAddress || !savedPassword) {
        await generateNewAccount();
        return;
      }

      // If we have an address but no token, or token might be expired, try to get a new one
      if (!savedToken) {
        try {
          savedToken = await getToken(savedAddress, savedPassword);
          localStorage.setItem('mail_tm_token', savedToken);
        } catch (e) {
          // If login fails, generate a new account
          await generateNewAccount();
          return;
        }
      }
      
      setEmail(savedAddress);
      setToken(savedToken);
      await refreshInbox(savedToken);
    } catch (err: any) {
      console.error('Failed to init email:', err);
      setError('Connection to mail server failed. Please try again.');
      setIsOnline(false);
      setIsLoading(false);
    }
  }, [refreshInbox, generateNewAccount]);

  const selectMessage = async (id: string) => {
    if (!token) return;
    setActiveMessageId(id);
    setIsMessageLoading(true);
    try {
      const content = await getMessageContent(id, token);
      setActiveMessageContent(content);
    } catch (error) {
      console.error('Failed to load message content:', error);
      setIsOnline(false);
    } finally {
      setIsMessageLoading(false);
    }
  };

  useEffect(() => {
    const runInit = async () => {
      await initEmail();
    };
    runInit();
    
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [initEmail]);

  // Set up polling
  useEffect(() => {
    if (token) {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(() => {
        refreshInbox(token);
      }, 15000); // Poll every 15 seconds
    }
  }, [token, refreshInbox]);

  return {
    email,
    messages,
    isLoading,
    isRefreshing,
    isOnline,
    generateNewEmail: generateNewAccount,
    selectMessage,
    activeMessageId,
    activeMessageContent,
    isMessageLoading,
    refreshInbox: () => token && refreshInbox(token),
    clearActiveMessage: () => {
      setActiveMessageId(null);
      setActiveMessageContent(null);
    },
    error,
    lastChecked
  };
}
