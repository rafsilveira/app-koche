Step Id: 41
# Implementation Plan - Fix Google Drive Images

## Problem
Google Drive links in the format `drive.google.com/file/d/ID/view` are being converted to `drive.google.com/uc?export=view&id=ID`. This endpoint is often rate-limited or blocked for direct `<img>` embedding, causing images to fail to load (403 or broken icon).

## Proposed Solution
Switch to using the Google Drive Thumbnail API, which is generally designed for embedding previews and is more robust for this use case.

**New Format:** `https://drive.google.com/thumbnail?id=[FILE_ID]&sz=w1000`

`sz=w1000` requests a width of 1000px, which matches the quality needed.

## Steps
1.  **Modify `src/components/ResultCard.jsx`**:
    *   Update `processImageLink` function.
    *   Change the replacement string from `https://drive.google.com/uc?export=view&id=$1` to `https://drive.google.com/thumbnail?id=$1&sz=w1000`.
    *   (Optional) Keep the fallback or error handling that is already present.

2.  **Verify**:
    *   Run the app.
    *   Select "AUDI" -> "A3" -> "2007-2018" -> "L4 2.0L TFSI".
    *   Check if "Local da Conexão" image loads.

3.  **Fallback (Contingency)**:
    *   If the thumbnail API also fails (due to strict file permissions), we will change the UI to render a "Visualizar Imagem" button that opens the original Drive link in a new tab.

## Code Changes
**File:** `src/components/ResultCard.jsx`

```javascript
const processImageLink = useCallback((url) => {
    if (!url) return null;

    // Convert Google Drive view links to thumbnail link which is more embed-friendly
    const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)\//;
    const match = url.match(driveRegex);
    if (match && match[1]) {
        // Use thumbnail API instead of export=view
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }

    if (url.startsWith('http') || url.startsWith('data:')) {
        return url;
    }

    return null;
}, []);
```
