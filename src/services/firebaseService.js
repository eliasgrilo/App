import { db } from "../firebase";
import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    getDoc
} from "firebase/firestore";

/**
 * FirebaseService - Unified data layer for Padoca Pizza
 * Handles syncing between Cloud Firestore and local state
 */

const COLLECTIONS = {
    RECIPES: "recipes",
    INVENTORY: "inventory",
    COSTS: "costs",
    SETTINGS: "settings",
    PIZZAS: "pizzas",
    RECIPES_V2: "recipes_v2",
    RECIPES_V3: "recipes_v3",
    KANBAN: "kanban"
};

// Helper to remove undefined values (Firestore rejects them)
const cleanPayload = (data) => {
    return JSON.parse(JSON.stringify(data));
};

export const FirebaseService = {
    // --- RECIPES ---
    async saveRecipe(id, data) {
        try {
            await setDoc(doc(db, COLLECTIONS.RECIPES, id), cleanPayload({
                ...data,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error saving recipe:", e);
            return false;
        }
    },

    async getAllRecipes() {
        try {
            const q = query(collection(db, COLLECTIONS.RECIPES), orderBy("updatedAt", "desc"));
            const snapshot = await getDocs(q);
            const recipes = {};
            snapshot.forEach(doc => {
                recipes[doc.id] = doc.data();
            });
            return recipes;
        } catch (e) {
            console.error("Error fetching recipes:", e);
            return {};
        }
    },

    async deleteRecipe(id) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.RECIPES, id));
            return true;
        } catch (e) {
            console.error("Error deleting recipe:", e);
            return false;
        }
    },

    // --- INVENTORY ---
    async syncInventory(items, categories) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "inventory_v2"), cleanPayload({
                items,
                categories,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing inventory:", e);
            return false;
        }
    },

    async getInventory() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "inventory_v2"));
            if (docSnap.exists()) return docSnap.data();

            // Fallback to v1 if v2 doesn't exist
            const oldSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "inventory"));
            if (oldSnap.exists()) return { items: oldSnap.data().items, categories: null };

            return null;
        } catch (e) {
            console.error("Error getting inventory:", e);
            return null;
        }
    },

    // --- COSTS ---
    async syncCosts(costs, categories) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "costs_data"), cleanPayload({
                costs,
                categories,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing costs:", e);
            return false;
        }
    },

    async getCosts() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "costs_data"));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting costs:", e);
            return null;
        }
    },

    // --- PIZZAS (Ficha Técnica) ---
    async syncPizzas(pizzas) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "ficha_tecnica"), cleanPayload({
                pizzas,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing pizzas:", e);
            return false;
        }
    },

    async getPizzas() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "ficha_tecnica"));
            return docSnap.exists() ? docSnap.data().pizzas : null;
        } catch (e) {
            console.error("Error getting pizzas:", e);
            return null;
        }
    },

    // --- GLOBAL SETTINGS ---
    async syncGlobalSettings(settings) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "global_config"), cleanPayload({
                ...settings,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing global settings:", e);
            return false;
        }
    },

    async getGlobalSettings() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "global_config"));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting global settings:", e);
            return null;
        }
    },

    // --- RECIPES V2 (New Management Page) ---
    async syncRecipesV2(recipes) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, COLLECTIONS.RECIPES_V2), cleanPayload({
                recipes,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing recipes v2:", e);
            return false;
        }
    },

    async getRecipesV2() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, COLLECTIONS.RECIPES_V2));
            return docSnap.exists() ? docSnap.data().recipes : null;
        } catch (e) {
            console.error("Error getting recipes v2:", e);
            return null;
        }
    },

    // --- RECIPES V3 (Individual Storage) ---
    async syncRecipeV3(id, recipe, merge = false) {
        try {
            await setDoc(doc(db, COLLECTIONS.RECIPES_V3, String(id)), cleanPayload({
                ...recipe,
                updatedAt: new Date().toISOString()
            }), { merge });
            return true;
        } catch (e) {
            console.error("Error syncing recipe v3:", e);
            return false;
        }
    },

    async getRecipesV3() {
        try {
            // Try ordered query first
            let snapshot;
            try {
                const q = query(collection(db, COLLECTIONS.RECIPES_V3), orderBy("updatedAt", "desc"));
                snapshot = await getDocs(q);
            } catch (indexError) {
                // Fallback: query without ordering if index doesn't exist
                console.warn("Index not ready, fetching without order:", indexError.message);
                snapshot = await getDocs(collection(db, COLLECTIONS.RECIPES_V3));
            }

            const recipes = [];
            snapshot.forEach(doc => {
                recipes.push({ ...doc.data(), id: doc.id });
            });
            return recipes;
        } catch (e) {
            console.error("Error getting recipes v3:", e);
            return []; // Return empty array, not null
        }
    },

    async deleteRecipeV3(id) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.RECIPES_V3, String(id)));
            return true;
        } catch (e) {
            console.error("Error deleting recipe v3:", e);
            return false;
        }
    },

    // --- KANBAN ---
    async syncKanban(board) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, COLLECTIONS.KANBAN), cleanPayload({
                ...board,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing kanban:", e);
            return false;
        }
    },

    async getKanban() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, COLLECTIONS.KANBAN));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (e) {
            console.error("Error getting kanban:", e);
            return null;
        }
    },

    // --- RECIPE CATEGORIES ---
    async syncRecipeCategories(categories) {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, "recipe_categories"), cleanPayload({
                categories,
                updatedAt: new Date().toISOString()
            }));
            return true;
        } catch (e) {
            console.error("Error syncing recipe categories:", e);
            return false;
        }
    },

    async getRecipeCategories() {
        try {
            const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "recipe_categories"));
            return docSnap.exists() ? docSnap.data().categories : null;
        } catch (e) {
            console.error("Error getting recipe categories:", e);
            return null;
        }
    }
};
