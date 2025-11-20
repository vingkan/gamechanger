export type Prompt = {
  id: string;
  text: string;
  playersNeeded: number;
};

function parsePrompts(
  raw: string,
  playersNeeded: number,
  prefix: string
): Prompt[] {
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      return { id: `${prefix}-${index}`, text: line, playersNeeded };
    });
}

const RAW_PROMPTS_FOR_ONE = `
Batman doing a cameo
A sommelier who's never tasted wine
An old-timey prospector who is getting into crypto
An assassin assembling the world’s most intricate sniper rifle
That guy in the movie who’s definitely about to be hit by a bus
A carnival barker for the free section of Craigslist
Jason Bateman giving an inspiring locker room speech
`;

const RAW_PROMPTS_FOR_TWO = `
A drive-thru order from the restaurant “Leftovers”
Slimer tries to convince the Genius Bar his phone wasn’t slimed
An obviously stolen item at Antiques Roadshow
The mushrooms hit Samwise and Frodo at the same time
An astronaut trying to cover up to NASA that they really messed up
Two sea captains competing for who loves the sea more
A scene from a nixed version of Castaway in which Wilson was a talking animated volleyball
`;

const RAW_PROMPTS_FOR_THREE = `
Friends who don’t know how to count on New Year’s Eve
From the CD “Sounds to Help You Sleep”: Jungle noises, plus Steve who got lost
Guys on the Titanic pumped for bro time now that the women and children are gone
`;

const PROMPTS_ONE_PLAYER = parsePrompts(RAW_PROMPTS_FOR_ONE, 1, "uno");
const PROMPTS_TWO_PLAYERS = parsePrompts(RAW_PROMPTS_FOR_TWO, 2, "dos");
const PROMPTS_THREE_PLAYERS = parsePrompts(RAW_PROMPTS_FOR_THREE, 3, "tres");
const ALL_PROMPTS = [
  ...PROMPTS_ONE_PLAYER,
  ...PROMPTS_TWO_PLAYERS,
  ...PROMPTS_THREE_PLAYERS,
];

export function getRandomPrompt(
  playersNeeded: number,
  usedPrompts: Set<string>
): Prompt | null {
  const prompts = ALL_PROMPTS.filter(
    (prompt) =>
      prompt.playersNeeded === playersNeeded && !usedPrompts.has(prompt.id)
  );
  if (prompts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex] ?? null;
}
