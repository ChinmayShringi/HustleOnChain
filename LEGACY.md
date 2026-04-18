# UI Legacy Versions

This file tracks the legacy versions of the UI as requested by the user.

## legacy 1
- **Description**: Initial "Protocol Garden" UI state.
- **Git Tag**: `legacy-1`
- **Creation Date**: 2026-04-18
- **Contents**: Full Next.js 14 frontend with Landing, Create, Preview, Funding, and Project Detail pages.

### How to Restore legacy 1
To revert all UI changes and go back to this state:
1. Run `git checkout legacy-1 -- frontend/`
2. This will replace the contents of the `frontend/` directory with the state saved at this tag.
3. Any new UI files created after this point should be manually deleted if they are not tracked by the legacy-1 tag.
