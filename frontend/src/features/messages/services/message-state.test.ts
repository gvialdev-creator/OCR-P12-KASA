import { expect, it } from "vitest";
import { mergeMessages, messageDate } from "./message-state";
import type { Message } from "@/features/messages/types";

const message = (id: number): Message => ({ id, conversation_id: 1, sender_id: 1, body: "Hello", client_message_id: String(id), created_at: "2026-10-08T10:00:00Z" });

it("merges REST, socket and reconnect pages without duplicates or ordering gaps", () => {
  expect(mergeMessages([message(2), message(3)], [message(1), message(3), message(4)]).map((entry) => entry.id)).toEqual([1, 2, 3, 4]);
});

it("uses an explicit shared timezone", () => {
  expect(messageDate("2026-10-08T23:00:00Z")).toBe("9 octobre 2026");
});