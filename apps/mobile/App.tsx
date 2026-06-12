import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { formatCurrency } from "@ambagan/utils";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ambagan</Text>
      <Text>Sample amount: {formatCurrency(1500)}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
});
