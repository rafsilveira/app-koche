import { db } from './firebase'; // Optional if we use Firebase for caching later, but for now just fetch
// Reuse the standard fetch or axios. We'll use fetch to keep it simple.

// The URL of your Google Apps Script (Same as Webhook)
// If you changed the deployment and got a NEW URL, update it here.
const DATA_API_URL = "https://script.google.com/macros/s/AKfycbxvinNteBES3YIy6p188kJvvL-F7Gv7Aq60rIbWiKg740YnLxmg-Ck-MwALcRVfCv9thA/exec";

const CACHE_KEY = 'koche_vehicle_data_v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches vehicle data from Google Sheets with Caching
 * @param {boolean} forceRefresh - If true, bypasses cache
 */
export async function fetchVehicleData(forceRefresh = false) {
    try {
        // 1. Check Cache
        if (!forceRefresh) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                const age = Date.now() - parsed.timestamp;
                if (age < CACHE_DURATION) {
                    console.log("Using cached data (Age: " + (age / 1000 / 60).toFixed(0) + " min)");
                    return parsed.data;
                }
            }
        }

        console.log("Fetching data from Sheet...");
        const response = await fetch(DATA_API_URL);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // 2. Save to Cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
        } catch (e) {
            console.warn("Quota exceeded handling localStorage", e);
        }

        // Process data (optional sanitization)
        return data.map(item => ({
            ...item,
            // Ensure array fields split by comma if needed, or keep as string
            // For now, the App expects strings for most, but let's be safe
        }));

    } catch (error) {
        console.error("Failed to fetch vehicle data:", error);

        // Fallback: Try to return stale cache if network fails
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached).data;

        return [];
    }
}

/**
 * Converts Google Drive 'view' links to 'thumbnail' links for <img> tags
 */
export function processImageLink(link) {
    if (!link) return '';

    // Check if it's a Google Drive link
    if (link.includes('drive.google.com')) {
        // Extract ID
        let id = '';
        const parts = link.split('/');

        // Pattern: .../d/FILE_ID/view...
        const dIndex = parts.indexOf('d');
        if (dIndex !== -1 && parts[dIndex + 1]) {
            id = parts[dIndex + 1];
        }
        // Pattern: id=FILE_ID
        else if (link.includes('id=')) {
            id = link.split('id=')[1].split('&')[0];
        }

        if (id) {
            // Using a high-res thumbnail endpoint which is often more reliable than 'uc?export=view' for images
            return `https://lh3.googleusercontent.com/d/${id}=w1000`;
            // Alternative: `https://drive.google.com/uc?export=view&id=${id}`
        }
    }

    return link;
}

/**
 * Converts YouTube 'watch' links to 'embed' links
 */
export function processVideoLink(link) {
    if (!link) return '';

    // Standard: https://www.youtube.com/watch?v=VIDEO_ID
    // Short: https://youtu.be/VIDEO_ID

    let videoId = '';

    if (link.includes('youtu.be/')) {
        videoId = link.split('youtu.be/')[1].split('?')[0];
    } else if (link.includes('v=')) {
        videoId = link.split('v=')[1].split('&')[0];
    }

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }

    return link;
}
