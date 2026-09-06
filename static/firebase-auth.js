import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  projectId: "quaint-archive-v98sv",
  appId: "1:470599887239:web:d8784cf7be92b7b4d98b22",
  apiKey: "AIzaSyAah2d-ytxUJfntJJe94fI2S3jTFgX82h8",
  authDomain: "quaint-archive-v98sv.firebaseapp.com",
  // The firestoreDatabaseId is not part of standard config but we can pass it if we want.
  // The standard web SDK doesn't natively support connecting to a non-default database ID directly through config easily without extra params in getFirestore.
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Use the specific databaseId created by the setup tool
const db = getFirestore(app, "ai-studio-heatwaveapp-af7b1419-31a2-42fa-941d-242cc43fabb2");
const provider = new GoogleAuthProvider();

// Hook into existing UI
document.addEventListener("DOMContentLoaded", () => {
    const btnGoogleLogin = document.getElementById("btn-google-login");
    const btnGoogleRegister = document.getElementById("btn-google-register");
    const btnLogout = document.getElementById("btn-auth-logout");

    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await signInWithPopup(auth, provider);
            } catch (err) {
                console.error("Login failed", err);
            }
        });
    }

    if (btnGoogleRegister) {
        btnGoogleRegister.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await signInWithPopup(auth, provider);
            } catch (err) {
                console.error("Register failed", err);
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", async (e) => {
            e.preventDefault();
            await signOut(auth);
            // hide auth modal if open
            const modal = document.getElementById('auth-modal');
            if (modal) modal.style.display = 'none';
        });
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        let role = "user";
        try {
            // Fetch role from Firestore
            const userRef = doc(db, "users", user.uid);
            let userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                // First time login - Create user document
                await setDoc(userRef, {
                    email: user.email,
                    name: user.displayName,
                    role: "user", // Default role
                    createdAt: new Date().toISOString()
                });
            } else {
                role = userDoc.data().role || "user";
            }
        } catch (err) {
            console.warn("Firestore profile fetch/create skipped:", err);
        }

        if (role === "admin") {
            document.body.classList.add("is-admin");
            setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
        } else {
            document.body.classList.remove("is-admin");
        }

        // Update UI Pill via global function if it exists
        if (window.updateUserHeaderPill) {
            window.updateUserHeaderPill({
                name: user.displayName,
                email: user.email,
                role: role === 'admin' ? 'MUNICIPAL_OFFICER' : 'CITIZEN',
                badge_color: role === 'admin' ? '#ef4444' : '#00d2ff',
                avatar: user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'
            });
        }
        
        // Hide modal
        const modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'none';

        // Swap to logged in panel for auth modal
        const formLogin = document.getElementById('form-auth-login');
        const formRegister = document.getElementById('form-auth-register');
        const panelLoggedIn = document.getElementById('panel-logged-in');
        const tabSwitch = document.querySelector('.auth-tab-switch');
        const fastDemo = document.getElementById('panel-fastdemo');

        if (formLogin) formLogin.style.display = 'none';
        if (formRegister) formRegister.style.display = 'none';
        if (fastDemo) fastDemo.style.display = 'none';
        if (tabSwitch) tabSwitch.style.display = 'none';
        if (panelLoggedIn) panelLoggedIn.style.display = 'block';

        const activeName = document.getElementById('active-user-name');
        const activeEmail = document.getElementById('active-user-email');
        const activeAvatar = document.getElementById('active-user-avatar');
        if(activeName) activeName.textContent = user.displayName;
        if(activeEmail) activeEmail.textContent = user.email;
        if(activeAvatar) activeAvatar.textContent = user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U';

    } else {
        document.body.classList.remove("is-admin");
        
        if (window.updateUserHeaderPill) {
            window.updateUserHeaderPill({
                name: 'Public Observer',
                role: 'GUEST',
                badge_color: '#64748b',
                avatar: 'PO'
            });
        }

        const formLogin = document.getElementById('form-auth-login');
        const panelLoggedIn = document.getElementById('panel-logged-in');
        const tabSwitch = document.querySelector('.auth-tab-switch');
        
        if (formLogin) formLogin.style.display = 'block';
        if (panelLoggedIn) panelLoggedIn.style.display = 'none';
        if (tabSwitch) tabSwitch.style.display = 'flex';
    }
});
