export const referralSteps = [
  { title: "Introduce", text: "Tell us who needs a team." },
  { title: "Chat", text: "We add you to a WhatsApp group with your contact." },
  { title: "Deal", text: "You watch the conversation until the deal is agreed." },
  { title: "Earn", text: "You earn your share when the deal is finalized." },
];

export type PhoneMessage = {
  from: "me" | "client" | "team";
  name: string;
  time: string;
  text: string;
  /** How long the three typing dots show before this message arrives. Leave it out for no dots. */
  typingMs?: number;
  /** An emoji reaction that pops onto the message. Use it on one message only. */
  react?: string;
};
export type PhoneItem = { day: string } | PhoneMessage;

/**
 * The sample WhatsApp group in variant three's phone, seen from the referrer's side ("You" is on the right).
 * The story follows the four steps: introduce, chat, deal, earn. About six messages is the right length.
 */
export const phoneChat = {
  label: "Sample WhatsApp group chat",
  group: "Ada & Albert Nelly",
  members: "Ada, Albert Nelly, You",
  initials: "AN",
  clock: "9:41",
  network: "5G",
  placeholder: "Message",
  typing: "is typing…",
  scrollHint: "Scroll up for the start",
  pause: "Pause animation",
  play: "Play animation",
  items: [
    { day: "Today" },
    { from: "me", name: "You", time: "10:02", text: "Hi Ada, meet the Albert Nelly team. They build apps for businesses like yours." },
    { from: "team", name: "Albert Nelly", time: "10:03", typingMs: 1500, text: "Welcome, Ada. What are you looking to build?" },
    { from: "client", name: "Ada", time: "10:04", typingMs: 2200, text: "An app where my customers can browse and order my fashion pieces." },
    { from: "team", name: "Albert Nelly", time: "10:06", typingMs: 1700, text: "Great idea. We’ll send a quote and a timeline tomorrow." },
    { day: "Tomorrow" },
    { from: "client", name: "Ada", time: "09:12", typingMs: 1400, text: "Looks good. Let’s go ahead!" },
    { from: "team", name: "Albert Nelly", time: "09:15", typingMs: 1800, react: "🎉", text: "Deal finalized. Thank you for the introduction, your commission is confirmed." },
  ] satisfies PhoneItem[],
};

// Placeholder tiles until real partner logos arrive. Keep 5 to 10.
export const partnerTiles = ["Photography", "Flyer design", "Portrait art", "Event planning", "Print", "Video"];
