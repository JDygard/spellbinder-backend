const challenges = [
    {
        id: 1,
        name: "challenge 1",
        reward: "a neat eraser",
        tree: {
            type: "normal",
            next: {
                type: "strong",
                next: {
                    type: "boss",
                    next: null
                }
            }
        }
    },
    {
        id: 2,
        name: "challenge 2",
        reward: "a stick of gum",
        tree: {
            type: "normal",
            next: {
                type: "strong",
                next: {
                    type: "boss",
                    next: null
                }
            }
        }
    }
];

module.exports = [challenges];