# Game Rules Separated From UI Clicked

The learner correctly explained that keeping rent and streak logic in `gameMath.ts` makes the rules testable without rendering the whole game and separates UI rendering from game rules. Future lessons can assume the learner understands why pure rule functions exist, and can move toward reading state transitions in `App.tsx`.

**Evidence**

- Quiz `rent-paid-file`: correct.
- Free response: "It is useful to keep rent and streak rules in gameMath so that the logic can be tested without having to render the whole game. Additionally it seperates ui rendering from the game rules."

**Implications**

The next near-edge concept is the shape of a full state transition: event handler receives intent, creates the next saved data, applies rule functions, and React renders from the result.
