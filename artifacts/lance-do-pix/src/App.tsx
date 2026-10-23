export default function App() {
  return (
    <main className="prototype-host">
      <iframe
        className="prototype-frame"
        src={`${import.meta.env.BASE_URL}prototype.html`}
        title="Lance do Pix — protótipo interativo"
      />
    </main>
  );
}
