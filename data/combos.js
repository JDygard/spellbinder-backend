const combos = [
    {
        id: '1',
        name: 'Dim Mak',
        source: 'class', // 'talent', 'item', or 'class'
        class: 'warrior', // Include this field only for class-specific combos
        sequence: [3, 3, 3], // Array of word lengths required to execute the combo
        timeLimit: 6, // Time limit in seconds to complete the combo
        effect: {
            type: 'damageMultiplier', // 'damageMultiplier', 'heal', 'applyStatusEffect', etc.
            value: 2, // Numeric value for the effect, e.g., damage multiplier or healing amount
            statusEffect: 'OptionalStatusEffect', // Include this field only for status effects
            duration: 10, // Duration of the effect in seconds, if applicable
        },
    }
]

module.exports = combos;