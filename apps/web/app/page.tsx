import { Button } from "@ambagan/ui";
import { formatCurrency } from "@ambagan/utils";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Ambagan</h1>
      <p>Sample amount: {formatCurrency(1500)}</p>
      <Button variant="primary">Get Started</Button>
    </main>
  );
}
