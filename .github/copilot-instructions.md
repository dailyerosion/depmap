# Daily Erosion Project Map App Repo

Every time you choose to apply a rule(s), explicitly state the rule(s) in the output. 
You can abbreviate the rule description to a single word or phrase.

## Rules

- **DO NOT MOCK** For testing, only mock things when absolutely necessary.
  This means that you should not mock any modules or functions that are part of the
  codebase. Instead, use the actual implementations of those modules or functions.
- Do not add code comments detailing what you modified. Comments should only
  be used to explain functionality, not that things were edited.
- Do not attempt to run node for testing purposes.
- Do not use Jquery and replace any jQuery code with vanilla JavaScript.
- Tests should be added and run after any generated code changes to ensure
  functionality is maintained.
- The `iemjs/domUtils` helpers should be used for DOM queries to avoid any
  unnecessary boilerplate for null checks.  The general policy is that all
  dom elements are expected to exist.
- Javascript usage of `this` should be avoided at all costs.
