import { db } from './firebase';
import { collection, getDocs, addDoc, writeBatch, doc, deleteDoc, query, where, limit, updateDoc } from 'firebase/firestore';
// import localData from '../../Data_Carros_Koche_App.json'; // REMOVED: Firestore is now the single source of truth

const CACHE_KEY = 'koche_vehicle_data_v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch vehicle data from Firestore (Single Source of Truth)
 * Includes local caching to reduce reads.
 */
export async function fetchVehicleData(forceRefresh = false) {
    console.log("Fetching data from Firestore...");

    try {
        // 1. Check Cache
        if (!forceRefresh) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                const age = Date.now() - parsed.timestamp;
                if (age < CACHE_DURATION) {
                    console.log(`Serving ${parsed.data.length} vehicles from cache.`);
                    return parsed.data;
                }
            }
        }

        // 2. Fetch from Firestore
        const querySnapshot = await getDocs(collection(db, "vehicles"));
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            source: 'db'
        }));

        console.log(`Fetched ${data.length} vehicles from Firestore.`);

        // 3. Update Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));

        return data;

    } catch (e) {
        console.error("Error fetching vehicle data: ", e);
        // If critical failure, try to serve stale cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            console.warn("Serving stale cache due to error.");
            return JSON.parse(cached).data;
        }
        return [];
    }
}
/**
 * Adds a new vehicle to Firestore and clears cache
 */
export async function addVehicle(vehicleData) {
    try {
        const docRef = await addDoc(collection(db, "vehicles"), vehicleData);
        console.log("Document written with ID: ", docRef.id);

        // Clear cache so next fetch gets new data
        localStorage.removeItem(CACHE_KEY);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

/**
 * Migrates data from JSON to Firestore (Batch)
 * @param {Array} jsonData
 */
export async function migrateData(jsonData) {
    const batchSize = 450; // Safety margin below 500
    const chunks = [];

    for (let i = 0; i < jsonData.length; i += batchSize) {
        chunks.push(jsonData.slice(i, i + batchSize));
    }

    console.log(`Starting migration. Total items: ${jsonData.length}. Batches: ${chunks.length}`);

    let count = 0;
    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(item => {
            const docRef = doc(collection(db, "vehicles")); // Auto-ID
            batch.set(docRef, item);
        });
        await batch.commit();
        count += chunk.length;
        console.log(`Migrated ${count} items...`);
    }

    console.log("Migration complete!");
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
// ==========================================
// ADMIN MANAGEMENT
// ==========================================

/**
 * Fetches list of admin emails from Firestore
 */
export async function getAdmins() {
    try {
        const querySnapshot = await getDocs(collection(db, "admins"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email
        }));
    } catch (e) {
        console.error("Error fetching admins:", e);
        return [];
    }
}

/**
 * Adds a new admin email
 */
export async function addAdmin(email) {
    try {
        await addDoc(collection(db, "admins"), { email });
        return true;
    } catch (e) {
        console.error("Error adding admin:", e);
        throw e;
    }
}

/**
 * Removes an admin by ID
 */
export async function removeAdmin(adminId) {
    try {
        await deleteDoc(doc(db, "admins", adminId));
        return true;
    } catch (e) {
        console.error("Error removing admin:", e);
        throw e;
    }
}

/**
 * Search users by email prefix
 */
export async function searchUsers(emailPrefix) {
    if (!emailPrefix || emailPrefix.length < 3) return [];

    try {
        // Firestore doesn't support native partial string match easily without third party (Algolia/Typesense)
        // usage of >= and <= is a common hack for prefix search
        const q = query(
            collection(db, "users"),
            where('email', '>=', emailPrefix),
            where('email', '<=', emailPrefix + '\uf8ff'),
            limit(5)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email,
            name: doc.data().name
        }));
    } catch (e) {
        console.error("Error searching users:", e);
        return [];
    }
}

/**
 * Fetch ALL users for export (Leads)
 */
/**
 * Fetch users with optional date filtering
 * @param {Date} startDate - (Optional)
 * @param {Date} endDate - (Optional)
 */
export async function getAllUsers(startDate = null, endDate = null) {
    try {
        let q = collection(db, "users");

        // Build constraints
        const constraints = [];
        if (startDate) constraints.push(where("createdAt", ">=", startDate));
        if (endDate) constraints.push(where("createdAt", "<=", endDate));

        if (constraints.length > 0) {
            q = query(q, ...constraints);
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (e) {
        console.error("Error fetching users:", e);
        return [];
    }
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle(id, vehicleData) {
    try {
        const vehicleRef = doc(db, "vehicles", id);
        await updateDoc(vehicleRef, vehicleData);
        // Clear cache
        localStorage.removeItem(CACHE_KEY);
    } catch (e) {
        console.error("Error updating vehicle:", e);
        throw e;
    }
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id) {
    try {
        await deleteDoc(doc(db, "vehicles", id));
        // Clear cache
        localStorage.removeItem(CACHE_KEY);
    } catch (e) {
        console.error("Error deleting vehicle:", e);
        throw e;
    }
}
