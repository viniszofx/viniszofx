import Link from "next/link";

export default function Home() {
  return (
    <div className="container min-h-screen mx-auto flex justify-center items-center flex-col gap-4">
      <p className="font-mono text-xs">Working in updates...</p>
      <p className="font-semibold text-lg">Thanks for your visit 💙</p>
      <Link
        href="https://linkedin.com/in/viniszofx"
        className="text-sm underline"
      >
        Linkedin
      </Link>
    </div>
  );
}
