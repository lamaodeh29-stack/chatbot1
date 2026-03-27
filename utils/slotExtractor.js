// ══════════════════════════════════════════
//   Slot Extractor
//   Reads a message and tries to find
//   a day and time the user mentioned
// ══════════════════════════════════════════

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// Abbreviation → full day name
const dayAliases = {
    'mon': 'monday',
    'tue': 'tuesday', 'tues': 'tuesday',
    'wed': 'wednesday', 'weds': 'wednesday',
    'thu': 'thursday', 'thur': 'thursday', 'thurs': 'thursday',
    'fri': 'friday',
};

const timeMap = {
    // 7am – 12pm
    '7am':    '7:00am',  '7:00am': '7:00am',
    '8am':    '8:00am',  '8:00am': '8:00am',
    '9am':    '9:00am',  '9:00am': '9:00am',
    '10am':   '10:00am', '10:00am':'10:00am',
    '11am':   '11:00am', '11:00am':'11:00am',
    '12pm':   '12:00pm', '12:00pm':'12:00pm',
    // 1pm – 7pm
    '1pm':    '1:00pm',  '1:00pm': '1:00pm',
    '2pm':    '2:00pm',  '2:00pm': '2:00pm',
    '3pm':    '3:00pm',  '3:00pm': '3:00pm',
    '4pm':    '4:00pm',  '4:00pm': '4:00pm',
    '5pm':    '5:00pm',  '5:00pm': '5:00pm',
    '6pm':    '6:00pm',  '6:00pm': '6:00pm',
    '7pm':    '7:00pm',  '7:00pm': '7:00pm',
    // 24-hour equivalents
    '07:00': '7:00am',
    '08:00': '8:00am',
    '09:00': '9:00am',
    '10:00': '10:00am',
    '11:00': '11:00am',
    '12:00': '12:00pm',
    '13:00': '1:00pm',
    '14:00': '2:00pm',
    '15:00': '3:00pm',
    '16:00': '4:00pm',
    '17:00': '5:00pm',
    '18:00': '6:00pm',
    '19:00': '7:00pm',
};


function extractSlot(message) {
    // Normalise: lowercase, collapse spaces, strip "this/next" modifiers
    let msg = message.toLowerCase().replace(/\s+/g, ' ').trim();
    msg = msg.replace(/\b(this|next)\s+/g, '');

    // Find day — full names first, then abbreviations (whole-word match)
    let day = days.find(d => msg.includes(d));
    if (!day) {
        for (const [abbr, full] of Object.entries(dayAliases)) {
            if (new RegExp(`\\b${abbr}\\b`).test(msg)) {
                day = full;
                break;
            }
        }
    }

    // Normalise "noon" before time lookup
    let cleaned = msg.replace(/\bnoon\b/g, '12pm');
    // Remove spaces before am/pm (e.g. "10 am" → "10am")
    cleaned = cleaned.replace(/(\d)\s*(am|pm)/g, '$1$2');

    const timeKey = Object.keys(timeMap).find(t => cleaned.includes(t));
    const time    = timeKey ? timeMap[timeKey] : null;

    return { day, time };
}


module.exports = { extractSlot };
