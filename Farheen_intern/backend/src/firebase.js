import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAviq3SAQvdfWBvkIWMYa0NUXEPBj9eDe0",
  authDomain: "kanban-d9473.firebaseapp.com",
  projectId: "kanban-d9473",
  storageBucket: "kanban-d9473.firebasestorage.app",
  messagingSenderId: "689475210628",
  appId: "1:689475210628:web:96fcccb8c407e61c9e21d1",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export const githubProvider = new GithubAuthProvider();