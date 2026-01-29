import Image from "next/image";

export default function Home() {
  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>
        Student Suite
      </h1>

      <p style={{ marginTop: "12px", fontSize: "18px" }}>
        All student tools in one place.
      </p>

      <ul style={{ marginTop: "20px", lineHeight: "1.8" }}>
        <li>📄 Resume Builder</li>
        <li>📝 Notes</li>
        <li>📚 Assignments</li>
        <li>🤖 PDF Tools</li>
      </ul>
    </main>
  );
}
