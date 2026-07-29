## 1. Specification

- [x] 1.1 Create proposal, design, and delta specs for async upload, collision-free report keys, and basis/material evidence boundaries
- [x] 1.2 Validate the OpenSpec change before implementation

## 2. Async Upload Entry

- [x] 2.1 Lift the three-file upload draft state to the agent console so modal close preserves selected files
- [x] 2.2 Add explicit per-file remove controls and clear the draft only on remove, page refresh, or parse start
- [x] 2.3 Add pending task insertion on parse start and close the modal immediately
- [x] 2.4 Replace or remove the pending task when backend bootstrap succeeds or fails

## 3. Stable Rendering

- [x] 3.1 Use collision-free UI keys for report rectification delivery rows
- [x] 3.2 Use collision-free UI keys for report finding groups and history/detail finding lists that can receive duplicate checklist ids

## 4. Evidence Boundary

- [x] 4.1 Harden backend packet match candidates so basis/checklist objects cannot satisfy material evidence
- [x] 4.2 Add focused smoke coverage for basis/checklist exclusion and async upload UI contracts

## 5. Verification And Archive

- [x] 5.1 Run focused UI/backend smoke, typecheck, and OpenSpec validation
- [x] 5.2 Sync completed delta specs into main specs
- [x] 5.3 Archive the completed change
