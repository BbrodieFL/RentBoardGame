# Props and Derived State Clicked

The learner correctly identified `label` and `value` as props passed into `StatusChip`, and explained that `StatusChip` can use passed data like local variables. They also correctly explained that `todayRentPoints` is derived from stored `activityEntries`, which means future lessons can build on the distinction between stored state and calculated values.

**Evidence**

- Quiz `what-are-label-value`: correct.
- Quiz `milestone-2-activity-state`: correct.
- Free response: rent points come from deriving today totals from completed activity entries rather than storing a separate `todayRentPoints` value.

**Implications**

The next near-edge concept is immutable array updates, especially why undo uses `filter` to create a new array instead of changing the old activity list directly.
