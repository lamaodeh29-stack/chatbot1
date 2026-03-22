// ══════════════════════════════════════════
//   Slot Extractor
//   Reads a message and tries to find
//   a day and time the user mentioned
// ══════════════════════════════════════════

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const timeMap = {
    '9am':    '9:00am',
    '9:00am': '9:00am',
    '10am':   '10:00am',
    '10:00am':'10:00am',
    '11am':   '11:00am',
    '11:00am':'11:00am',
    '12pm':   '12:00pm',
    '12:00pm':'12:00pm',
    '1pm':    '1:00pm',
    '1:00pm': '1:00pm',
    '2pm':    '2:00pm',
    '2:00pm': '2:00pm',
    '3pm':    '3:00pm',
    '3:00pm': '3:00pm',
    '4pm':    '4:00pm',
    '4:00pm': '4:00pm',
};


function extractSlot(message) {
    const msg = message.toLowerCase().replace(/\s+/g, ' ').trim();

    // Find day
    const day = days.find(d => msg.includes(d));

    // Find time — remove spaces before am/pm (e.g. "10 am" → "10am")
    const cleaned = msg.replace(/(\d)\s*(am|pm)/g, '$1$2');
    const timeKey  = Object.keys(timeMap).find(t => cleaned.includes(t));
    const time     = timeKey ? timeMap[timeKey] : null;

    return { day, time };
}


module.exports = { extractSlot };
