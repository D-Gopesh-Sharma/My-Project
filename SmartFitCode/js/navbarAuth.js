import { auth, onAuthStateChanged } from "./firebase.js";

const authButton = document.getElementById("authButton");

onAuthStateChanged(auth, (user) => {

  if (!authButton) return;

  if (user) {
    
    // User logged in
    authButton.textContent = "Account";
    authButton.href = "profile.html";

  } else {

    // User not logged in
    authButton.textContent = "Sign In";
    authButton.href = "signin.html";

  }

});