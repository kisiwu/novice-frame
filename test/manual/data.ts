export interface Message {
  id: string;
  message: string;
  _extKey: string;
}

const messages: Message[] = [];

export async function getMessages(): Promise<unknown[]> {
  return messages.map((msg) => ({ ...msg }));
}

export async function addMessage(message: string): Promise<{ id: string; message: string }> {
  const id = crypto.randomUUID();
  messages.push({ id, message, _extKey: crypto.randomUUID() });
  return { id, message };
}

export async function getMessageById(id: string): Promise<Message | undefined> {
  const message = messages.find((msg) => msg.id === id);
  return message ? { ...message } : undefined;
}

export async function deleteMessageById(id: string): Promise<boolean> {
  const index = messages.findIndex((msg) => msg.id === id);
  if (index !== -1) {
    messages.splice(index, 1);
    return true;
  }
  return false;
}

export async function updateMessageById(id: string, newMessage: string): Promise<boolean> {
  const message = messages.find((msg) => msg.id === id);
  if (message) {
    message.message = newMessage;
    return true;
  }
  return false;
}
