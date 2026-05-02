export interface TempEmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  intro: string;
}

export interface TempEmailContent extends TempEmailMessage {
  body: string;
  textBody: string;
  htmlBody: string;
}

const PROXY_URL = '/api/mail';

export async function fetchFromProxy(path: string, options: RequestInit = {}) {
  // Use relative path in browser, absolute in SSR
  let fetchUrl: string;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams();
    params.set('path', path);
    fetchUrl = `${PROXY_URL}?${params.toString()}`;
  } else {
    const url = new URL(PROXY_URL, 'http://localhost:3000');
    url.searchParams.set('path', path);
    fetchUrl = url.toString();
  }
  
  const response = await fetch(fetchUrl, {
    ...options,
    headers: {
      ...options.headers,
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getTopDomain(): Promise<string> {
  const data = await fetchFromProxy('/domains');
  const domains = data['hydra:member'] || data;
  return domains[0]?.domain || 'mail.tm';
}

export async function createAccount(address: string, password: string): Promise<any> {
  return fetchFromProxy('/accounts', {
    method: 'POST',
    body: JSON.stringify({ address, password }),
  });
}

export async function getToken(address: string, password: string): Promise<string> {
  const data = await fetchFromProxy('/token', {
    method: 'POST',
    body: JSON.stringify({ address, password }),
  });
  return data.token;
}

export async function getMessages(token: string): Promise<TempEmailMessage[]> {
  const data = await fetchFromProxy('/messages', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const members = data['hydra:member'] || data || [];
  if (!Array.isArray(members)) return [];

  return members.map((m: any) => ({
    id: m.id || String(Math.random()),
    from: m.from?.address || m.from || 'Unknown Sender',
    subject: m.subject || '(No Subject)',
    date: m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : 'Recent',
    intro: m.intro || ''
  }));
}

export async function getMessageContent(id: string, token: string): Promise<TempEmailContent | null> {
  const m = await fetchFromProxy(`/messages/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!m) return null;

  return {
    id: m.id,
    from: m.from?.address || m.from || 'Unknown Sender',
    subject: m.subject || '(No Subject)',
    date: m.createdAt ? new Date(m.createdAt).toLocaleString() : 'Recent',
    intro: m.intro || '',
    body: m.text || m.intro || 'No content',
    textBody: m.text || m.intro || 'No content',
    htmlBody: m.html?.[0] || m.html || ''
  };
}
