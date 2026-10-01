# React Game Development Glossary

- Component: A reusable function that returns UI.
- JSX: Markup-like syntax inside TypeScript or JavaScript that React turns into UI.
- Prop: Data a parent component hands to a child component, like an argument to a function.
- Parent component: The component that renders another component and can pass it props.
- Child component: The component being rendered by a parent and receiving props.
- Config: Plain project data kept outside components so the UI can be changed without rewriting markup.
- Derived value: A value calculated from existing data instead of stored separately.
- Render: React calling component functions to figure out what should appear on screen.
- State: Component memory managed by React; when state changes, React renders again.
- Event handler: A function that runs because the user did something, such as clicking a button.
- Setter function: The function from `useState` that asks React to store a new state value.
- Functional state update: Passing a function to a setter so the new state is calculated from the previous state.
- localStorage: Browser key/value storage that persists across refreshes and browser restarts for the same origin.
- Origin: The browser bucket made from protocol, host, and port, such as `http://127.0.0.1:5174`.
- Serialization: Turning a JavaScript value into a string so it can be saved.
- Deserialization: Turning a saved string back into a JavaScript value.
