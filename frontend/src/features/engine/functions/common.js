
export const keyClass = "m-auto border cursor-pointer bg-gray-500 hover:bg-gray-400 text-center bottom inline-block";
export const keyStyle = {width: "3vh", height: "3vh", borderRadius: "0.5vh"}
export const ATTACHMENT_OFFSET = 3.5;
export const DEFAULT_CARD_Z_INDEX = 1000;

export const defaultdict = (defaultObj, defaultVal) => {
  return new Proxy(defaultObj, {
    get: (target, name) => name in target ? target[name] : defaultVal
  });
}

export const getVisibleSide = (card, playerN) => {
  if (!card) return null;
  const currentSide = card.currentSide;
  if (currentSide === "A" || card.peeking[playerN]) return "A";
  else return "B";
}
  
export const getVisibleFace = (card, playerN) => {
  const visibleSide = getVisibleSide(card, playerN);
  if (visibleSide) return card.sides[visibleSide];
  else return null;
}
  
export const getVisibleFaceSrc = (visibleFace, user, gameDef) => {
  if (!visibleFace) return {src: null, default: "image not found"};
  var src = visibleFace.imageUrl;
  // If there's no src listed, it's probably a card back
  if (!src || src ==="") {    
    src = gameDef?.cardBacks?.[visibleFace.name]?.imageUrl;
  }
  // If there's still no src listed, there's a problem with the card or game definition #FIXME: visual idicator of missing image
  if (!src || src ==="") src = ""
  const language = user?.language || "English";
  const srcLanguage = src.replace('/English/','/'+language+'/');
  
  return {
    src: srcLanguage,
    default: src
  }
}

// Returns the left offset of the first card in a group
export const getFirstCardOffset = (width, cardSize) => {
  return 0.2 + (1.39-width)*cardSize/2;
}
