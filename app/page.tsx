import Generator from "@/components/Generator";

export default function Home() {
  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <h1>WARP Config Generator</h1>
          <p>
            Сгенерируйте конфигурацию Cloudflare WARP в формате AmneziaWG или
            Clash. Ключ создаётся и регистрируется автоматически.
          </p>
        </header>

        <Generator />
      </div>

      <footer className="footer">
        Конфиг регистрируется через Cloudflare
      </footer>
    </main>
  );
}
