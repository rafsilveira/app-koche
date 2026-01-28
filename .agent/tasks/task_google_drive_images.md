Step Id: 34
# Task: Fix Google Drive Image Rendering

## Context
The user is experiencing issues with "Connection Location" (local da conexão) images not appearing. These images are hosted on Google Drive. The current implementation attempts to convert the Google Drive Viewer link to a direct download link (`https://drive.google.com/uc?export=view&id=...`). This method is often unreliable due to permission issues or Google's anti-hotlinking measures (blobs, 403s).

## Objective
Ensure Google Drive images display correctly in the application.

## Plan
1.  **Reproduction**: Use the browser subagent to navigate to a specific car model (Audi A3 2007-2018) that has a Google Drive image and verify the failure (broken image, 403 error, etc.).
2.  **Investigation**: Check the `src` attribute of the broken image and any console errors.
3.  **Implementation**:
    *   Modify `ResultCard.jsx` to use a more reliable Google Drive embedding method.
    *   Alternative 1: Use `https://drive.google.com/thumbnail?id=<ID>&sz=w1000` (often more reliable for previews).
    *   Alternative 2: Check for 403 errors and potentially provide a "View Image" fallback button if embedding is strictly blocked.
    *   Add a test case or manual verification step.
4.  **Verification**: Verify the fix with the browser subagent.

## Specific Example from Database
*   **Brand**: AUDI
*   **Model**: A3
*   **Year**: 2007-2018
*   **Link**: `https://drive.google.com/file/d/1lIRkzKkJWAze9uCJAjQqTNhFDM4pNXAC/view?usp=drive_link`
