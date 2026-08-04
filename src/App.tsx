import AppRoot from "./components/AppRoot";

/**
 * Vite entry — mirrors app/page.tsx in the Next.js App Router.
 * Both render the same <AppRoot /> (landing + auth screens).
 */
export default function App() {
  return <AppRoot />;
}
