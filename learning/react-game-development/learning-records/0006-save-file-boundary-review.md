# Save File Boundary Review

Milestone 5 originally included a cosmetic shop, but the mechanic was removed because it cluttered the game before there were enough meaningful items. The teachable concept that remains is import/export/reset as a save-file boundary: `gameSave` becomes JSON text on export, imported JSON is parsed and normalized, and reset restores the default save shape.

**Implications**

Future lessons should treat cosmetic shops as deferred product scope, not current app behavior. The next useful review target is how `normalizeGameSave` protects the app from broken or old save files.
