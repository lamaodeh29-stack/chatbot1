
# Nano AI Support Chatbot — Project Source of Truth
## AI Instructions
This file is the single source of truth for the project.
Always follow these rules before making any changes.
Do not assume anything outside this file unless necessary.
## Project Goal
This is a customer support chatbot web app called Nano.

It supports:
- FAQ answers
- support ticket creation
- booking flow
- modern chat UI

## UI Rules
- keep the current UI design
- keep the assistant name "Nano"
- keep the dark premium blue/purple style
- do not rebuild the frontend from scratch
- do not change layout unless explicitly requested

## Local Development Rules
- local app must work on localhost:3000
- local backend uses Express
- frontend and backend must stay compatible
- do not break the local working flow

## Booking Rules
Booking flow must work like this:
1. user says they want to book
2. bot shows available slots
3. user replies with selected day/time
4. system confirms the booking

Do not replace booking logic with placeholder replies.

## Ticket Rules
- ticket creation must remain functional
- do not replace real ticket logic with fake or test replies

## FAQ Rules
- FAQ handling must remain functional
- do not reduce everything to generic fallback

## Important Files
- server.js
- script.js
- routes/chat.js
- services/bookingService.js
- services/ticketService.js
- services/faqService.js
- utils/intentDetector.js
- utils/slotExtractor.js
- db.js

## Change Rules
- always inspect existing code before editing
- prefer fixing existing logic over rebuilding
- keep changes minimal and targeted
- do not add temporary stub logic unless explicitly requested
- do not break working features while fixing one feature

## Debug Priorities
If booking breaks, check:
- slot extraction
- pending booking lookup
- confirmation flow
- route flow order before fallback

If local breaks, check:
- frontend fetch path
- Express route path
- server.js route registration
- import/export mismatches

## Communication Style
- minimal explanation
- apply changes directly
- do not ask unnecessary follow-up questions
- list changed files after edits