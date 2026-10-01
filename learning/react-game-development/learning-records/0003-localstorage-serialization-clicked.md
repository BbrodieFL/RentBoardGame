# localStorage Serialization Clicked

The learner correctly identified that `localStorage` stores strings, so the game uses `JSON.stringify` before saving and retrieves the saved value from browser storage when the app starts again. Future lessons can assume the save loop is understood at a high level, while tightening the vocabulary: the app loads saved data when React creates initial state, then React renders from that state.

**Evidence**

- Quiz `why-json-stringify-storage`: correct.
- Free response: "The data is saved to a bucket in web storage. When the page is rendered data is retrieved from that bucket"

**Implications**

The next near-edge concept is immutable array updates: logging creates a new list with the new entry, and undo creates a new list without the removed entry.
