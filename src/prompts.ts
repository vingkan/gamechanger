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
A sommelier who's never tasted wine
An old-timey prospector who is getting into crypto
A carnival barker for the free section of Craigslist
A best man speech in which the subtext is that he and the groom were abducted by aliens
Slowly turning into an Animal Crossing character
Your annoyingly complicated Starbucks “secret menu” order
One of those beekeeper TikTok narrations, but they got stung a lot of times
A voice-disguised witness in a true crime doc accidentally reveals exactly who they are
Announcing Thanksgiving Day parade floats but the mushrooms are kicking in
Explaining the rules to the board game Sisyphus’ Boulder
Nike’s newest line: The Gaslighter
One of those bowling animations
Mario walking on hot coals
Your friend’s mom who was nice to you but mean to your friend in front of you
A pilot pointing out landmarks, but it’s a little worrying how he’s going on about our relative insignificance
A grizzled war vet recounts a Black Friday sale event
A palm reader trying to sugarcoat very bad news
Your great aunt has something to say about everything in your junk drawer
Questions your little sibling insists on asking you before you fall asleep
A YouTuber doing a CTA but you can tell she’s barely keeping it together emotionally
A genie’s other stipulations
White water rapid tour guide prepares their group for the Bermuda Triangle
If the Harry Potter Sorting Hat were a mean girl
An ad for Taco Bell’s new Laxative Supreme
A boxing coach gives bad advice between rounds
A surfer, using a bunch of surfing lingo, recollects his gnarliest ride
A gym coach substitute teaches art class
Someone called upon to say grace who doesn’t know how to say grace
A heroic Snickers snags in the vending machine—refusing to let his brothers above him fall
A werewolf who only turns into a wolf when their account is overdrawn
The problem player at every D&D table
A smart toothbrush is too smart
Doomsday device customer service hotline
An animal expert explains a monkey’s unusual behavior
Just the worst explanation of daylight savings
A Peloton instructor keeping their class motivated with blackmail
An evil laugh turned asthma attack
`;

const RAW_PROMPTS_FOR_TWO = `
An obviously stolen item at Antiques Roadshow
An astronaut trying to cover up to NASA that they really messed up
Two sea captains competing for who loves the sea more
One of these two is definitely wearing a wire
Two kraken trainers at SeaWorld show off their work with the krakens
Two of those people who always make conversation on planes
A meet-cute where what they ran into each other and dropped is actually important and should be the focus of their attention
Two of the girls from Euphoria selling you Girl Scout cookies
A child brings a magical snowman to life who is very concerned about dying again
Fred Armisen and Kristen Wiig are the newest additions to the Marvel Cinematic Universe
A video game NPC’s annoying side quest
The long-awaited meeting between Times New Roman and Comic Sans
An echo that mocks you a little bit
Foley artists for the movie “A Bathtub Falls Through Ten Floors of a Rotting House”
Turns out the hostage negotiator knows the hostage taker from way back
A time traveler trying to figure out what year it is without drawing too much attention to themselves
Dueling anime characters over-explaining every move
Two astronauts compete for the quote that will go down in history
Wizards trying to one-up each other with cryptic last words
The more tools a surgeon asks for, the clearer it is they’re winging it
A dialect coach and the star of the movie “Bad British Accent”
The Germaphobe’s Association’s secret handshake
Two reindeer quietly trash-talking Santa
A dramatic video game cut scene transitions awkwardly into the gameplay
A conversation with your Uber driver gets real deep real fast
Tennis match grunts get out of hand
Asteroid-denying dinosaurs’ podcast
`;

const RAW_PROMPTS_FOR_THREE = `
Friends who don’t know how to count on New Year’s Eve
From the CD “Sounds to Help You Sleep”: Jungle noises, plus Steve who got lost
Guys on the Titanic pumped for bro time now that the women and children are gone
A rendition of “Row, Row, Row Your Boat” in which the third singer is clearly trying to amp things up a bit
Throuple’s therapy
An improv group has a bunch of stipulations for the one-word suggestion
Three aging camp counselors trying to squeeze all of the slang they can into their welcome-back spiel
The moment in the show where the lore goes so deep they lose you
Things yelled from a dugout by baseball players who don’t know anything about baseball
A superhero suit-up montage
“America’s Got Talent” judges judging the craziest act they’ve ever seen
A woman in Hell wants to speak to the manager
The activities team for a cruise that’s just sailed into the River Styx
A Shark Tank presentation where the presenters all have food poisoning from their own product
Three active listeners struggle to make conversation
A heist team realizes they all have the same specialty
`;

const PROMPTS_ONE_PLAYER = parsePrompts(RAW_PROMPTS_FOR_ONE, 1, "uno");
const PROMPTS_TWO_PLAYERS = parsePrompts(RAW_PROMPTS_FOR_TWO, 2, "dos");
const PROMPTS_THREE_PLAYERS = parsePrompts(RAW_PROMPTS_FOR_THREE, 3, "tres");
const ALL_PROMPTS = [
  ...PROMPTS_ONE_PLAYER,
  ...PROMPTS_TWO_PLAYERS,
  ...PROMPTS_THREE_PLAYERS,
];

// Export for reset functionality
export const DEFAULT_PROMPTS = ALL_PROMPTS;

// localStorage keys
const PROMPTS_KEY = "gameChangerPrompts";
const NEXT_ID_KEY = "gameChangerNextPromptId";

export function getPromptsFromLocalStorage(): Prompt[] {
  const raw = localStorage.getItem(PROMPTS_KEY);
  if (raw === null || raw === "") {
    // Initialize with default prompts
    savePromptsToLocalStorage(DEFAULT_PROMPTS);
    localStorage.setItem(NEXT_ID_KEY, String(DEFAULT_PROMPTS.length));
    return DEFAULT_PROMPTS;
  }
  try {
    return JSON.parse(raw) as Prompt[];
  } catch (error) {
    console.error(error);
    return DEFAULT_PROMPTS;
  }
}

export function savePromptsToLocalStorage(prompts: Prompt[]) {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
}

export function getNextPromptId(): string {
  const raw = localStorage.getItem(NEXT_ID_KEY);
  if (raw === null) {
    const nextId = DEFAULT_PROMPTS.length;
    localStorage.setItem(NEXT_ID_KEY, String(nextId));
    return String(nextId);
  }
  return raw;
}

export function incrementNextPromptId(): string {
  const currentId = parseInt(getNextPromptId(), 10);
  const nextId = currentId + 1;
  localStorage.setItem(NEXT_ID_KEY, String(nextId));
  return String(currentId);
}

export function resetPromptsToDefaults() {
  savePromptsToLocalStorage(DEFAULT_PROMPTS);
  localStorage.setItem(NEXT_ID_KEY, String(DEFAULT_PROMPTS.length));
}

export function getRandomPrompt(
  playersNeeded: number,
  usedPrompts: Set<string>
): Prompt | null {
  const prompts = getPromptsFromLocalStorage().filter(
    (prompt) =>
      prompt.playersNeeded === playersNeeded && !usedPrompts.has(prompt.id)
  );
  if (prompts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex] ?? null;
}
