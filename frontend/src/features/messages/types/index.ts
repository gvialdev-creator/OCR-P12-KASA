export interface MessageUser {
  id: number;
  name: string;
  picture: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  client_message_id: string;
  body: string;
  created_at: string;
}

export interface ReadState {
  user_id: number;
  last_read_message_id: number;
  last_read_at: string;
}

export interface Conversation {
  id: number;
  peer: MessageUser;
  last_message: Message | null;
  last_message_at: string;
  unread_count: number;
  read_states: ReadState[];
}

export interface ConversationPage {
  conversations: Conversation[];
  next_cursor: string | null;
}

export interface MessagePage {
  messages: Message[];
  has_more: boolean;
}

export interface SocketTicket {
  token: string;
  expires_at: string;
}

export type MessagingResult<T> = { data: T; error: null } | { data: null; error: string };

export type MessagingEvent =
  | { type: "message"; message: Message }
  | { type: "read"; conversation_id: number; read_state: ReadState }
  | { type: "connected" };