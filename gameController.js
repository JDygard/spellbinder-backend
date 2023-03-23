function callCreatures(challenge) {
    let current = challenge.tree;
    while (current) {
        switch (current.type) {
            case "healing":
                console.log("Call healing creature here");
                break;
            case "normal":
                console.log("Call normal creature here");
                break;
            case "strong":
                console.log("Call strong creature here");
                break;
            case "boss":
                console.log("Call boss creature here");
                break;
            default:
                console.log("Unknown creature type");
                break;
        }
        current = current.next;
    }
}

function getChallengeSummary(challenges) {
    return challenges[0].map((challenge) => {
      const { id, name, reward } = challenge;
      return { id, name, reward };
    });
  }

module.exports = { callCreatures, getChallengeSummary };
