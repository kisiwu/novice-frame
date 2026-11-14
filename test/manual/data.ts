export interface Message {
  id: string;
  message: string;
  _sensitiveData: string;
}

const messages: Message[] = [];

export async function getMessages(search?: string): Promise<unknown[]> {
  return search
    ? messages.filter((m) => m.message.includes(search)).map(({ message, id }) => ({ message, id }))
    : messages.map(({ message, id }) => ({ message, id }));
}

export async function getMessagesWithSensitiveData(search?: string): Promise<Message[]> {
  return search
    ? messages.filter((m) => m.message.includes(search)).map((msg) => ({ ...msg }))
    : messages.map((msg) => ({ ...msg }));
}

export async function addMessage(message: string): Promise<Omit<Message, '_sensitiveData'>> {
  const id = crypto.randomUUID();
  messages.push({ id, message, _sensitiveData: crypto.randomUUID() });
  return { id, message };
}

export async function getMessageById(id: string): Promise<Omit<Message, '_sensitiveData'> | undefined> {
  const message = messages.find((msg) => msg.id === id);
  return message ? { id: message.id, message: message.message } : undefined;
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
