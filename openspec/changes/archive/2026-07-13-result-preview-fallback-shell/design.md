# Design

The result preview page should have two safe entry states:

1. A normal preview state when a `ReviewResultAsset` exists.
2. A fallback shell when the route is opened for a completed task without a recoverable asset.

The fallback shell should stay in the same shell/layout style, preserve the back navigation and theme toggle, and avoid a blank render. It should explain that the result is not available yet and point the user back to the document library.
