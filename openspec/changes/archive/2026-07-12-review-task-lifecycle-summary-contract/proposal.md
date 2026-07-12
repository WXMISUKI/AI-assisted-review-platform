# Change Proposal

This change promotes the document/task lifecycle summary into a shared domain contract.

The library, loading page, and other shell views currently derive human-readable status text independently. A shared lifecycle summary helper will keep the OCR, review-preparation, ready, completed, and failed states consistent across the app and make future backend replacement easier.
