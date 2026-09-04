// Server Component — no "use client". Delega todo el render al HomeClient.
import HomeClient from "~/components/HomeClient";

export default function Home() {
  return <HomeClient />;
}
