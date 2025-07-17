---
"io-services-cms-backoffice": patch
---

show the name of the suspended group in the tooltipAdded tooltip logic with group name interpolation in ServiceGroupTag and ApiKeysGroupTag.Cleaned up the code by handling safe fallback when the group name is missing.Kept the current structure with separate components without introducing a generic component, to avoid extensive refactoring.
