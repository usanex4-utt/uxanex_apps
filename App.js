import "./global.css";
import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store } from "./src/store";           // ← NEW
import { AuthProvider } from "./src/context/AuthContext";
import Navigation from "./src/navigation";

export default function App() {
  return (
    <Provider store={store}>               
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Navigation />
        </AuthProvider>
      </SafeAreaProvider>
    </Provider>
  );
}