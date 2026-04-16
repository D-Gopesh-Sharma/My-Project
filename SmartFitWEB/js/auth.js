import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "./firebase.js";


// EMAIL LOGIN
document.getElementById("loginBtn")?.addEventListener("click", async () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    await signInWithEmailAndPassword(auth, email, password);

    window.location.href = "profile.html";

  } catch (error) {

    alert(error.message);

  }

});

document.getElementById("signupBtn")?.addEventListener("click", async () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    await createUserWithEmailAndPassword(auth, email, password);

    window.location.href = "profile.html";

  } catch (error) {

    alert(error.message);

  }

});

const provider = new GoogleAuthProvider();

document.getElementById("googleLogin")?.addEventListener("click", async () => {

  try {

    await signInWithPopup(auth, provider);

    window.location.href = "profile.html";

  } catch (error) {

    alert(error.message);

  }

});