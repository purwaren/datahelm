import { useQuery } from "@tanstack/react-query";
import {
  getBootstrapState,
  getHealthCheck,
  isTauriRuntimeAvailable,
} from "../api/tauri-client";

function App() {
  const healthQuery = useQuery({
    queryKey: ["health-check"],
    queryFn: getHealthCheck,
  });

  const bootstrapQuery = useQuery({
    queryKey: ["bootstrap-state"],
    queryFn: getBootstrapState,
  });

  const health = healthQuery.data;
  const bootstrap = bootstrapQuery.data;

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">DataHelm / M0 Bootstrap</span>
        <h1>Connection-first desktop shell for the DataHelm spike cycle.</h1>
        <p>
          This workspace implements the first two `M0` tickets: repository
          bootstrap and shared spike contracts. The shell is intentionally small,
          but the module boundaries already match the approved technical design.
        </p>
        <div className="hero-actions">
          <button type="button" disabled>
            New Connection
          </button>
          <button type="button" className="secondary" disabled>
            Open SQL Workspace
          </button>
        </div>
      </section>

      {!isTauriRuntimeAvailable && (
        <section className="card error-banner">
          <h2>Browser Preview Mode</h2>
          <p>
            The typed bridge is ready, but Tauri commands are unavailable in a
            plain browser preview. Run `npm run tauri dev` after dependency
            installation to exercise the Rust backend commands.
          </p>
        </section>
      )}

      <section className="grid two-up">
        <article className="card">
          <p className="kicker">Workspace State</p>
          <h2>Bootstrap health</h2>
          {healthQuery.isLoading ? (
            <p>Checking bridge health…</p>
          ) : healthQuery.isError ? (
            <p className="muted">Unable to load health status from the backend.</p>
          ) : health ? (
            <>
              <div className="status">
                <span className="status-dot" />
                {health.status}
              </div>
              <p className="muted">
                Runtime: <span className="mono">{health.runtime}</span>
              </p>
              <p className="muted">
                App version:{" "}
                <span className="mono">{health.appVersion}</span>
              </p>
            </>
          ) : (
            <p className="muted">No health status available yet.</p>
          )}
        </article>

        <article className="card">
          <p className="kicker">M0 Tickets</p>
          <h2>Next recommended execution flow</h2>
          <ol className="list">
            <li>`M0-01` repository bootstrap</li>
            <li>`M0-02` shared contracts</li>
            <li>`SP1-01`, `SP1-02`, `SP3-01`</li>
            <li>`SP1-03`, `SP3-02`</li>
            <li>`SP2-01`, `SP2-02`</li>
          </ol>
        </article>
      </section>

      <section className="grid two-up" style={{ marginTop: "1rem" }}>
        <article className="card">
          <p className="kicker">Frontend / Backend Boundary</p>
          <h2>Shared contracts ready for spikes</h2>
          {bootstrapQuery.isLoading ? (
            <p>Loading bootstrap contracts…</p>
          ) : bootstrapQuery.isError || !bootstrap ? (
            <p className="muted">
              Bootstrap contracts could not be loaded from the backend.
            </p>
          ) : (
            <>
              <div className="pill-row" style={{ marginBottom: "1rem" }}>
                {bootstrap.modules.map((module) => (
                  <span className="pill" key={module}>
                    {module}
                  </span>
                ))}
              </div>
              <p className="muted">
                Sample connection:{" "}
                <span className="mono">{bootstrap.sampleProfile.name}</span> /{" "}
                {bootstrap.sampleProfile.engine}
              </p>
              <p className="muted">
                Sample session:{" "}
                <span className="mono">{bootstrap.sampleSession.sessionId}</span>
              </p>
            </>
          )}
        </article>

        <article className="card">
          <p className="kicker">Spike Evidence</p>
          <h2>Reserved workspace</h2>
          <ul className="list">
            <li>connectivity reports for PostgreSQL and MySQL</li>
            <li>normalized metadata payload examples</li>
            <li>query and cancellation findings</li>
            <li>read-only, keychain, and draft restore findings</li>
          </ul>
        </article>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <p className="kicker">Bootstrap Snapshot</p>
        <h2>App-facing DTO baseline</h2>
        {bootstrap ? (
          <table className="table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Current baseline</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ConnectionProfile</td>
                <td>
                  {bootstrap.sampleProfile.engine} / {bootstrap.sampleProfile.host}:
                  {bootstrap.sampleProfile.port}
                </td>
              </tr>
              <tr>
                <td>SessionContext</td>
                <td>{bootstrap.sampleSession.database ?? "No database selected"}</td>
              </tr>
              <tr>
                <td>CapabilityMap</td>
                <td>{bootstrap.sampleSession.capabilityMap.notes.join(", ")}</td>
              </tr>
              <tr>
                <td>QueryJob</td>
                <td>{bootstrap.sampleQueryJob.state}</td>
              </tr>
              <tr>
                <td>MetadataSnapshot</td>
                <td>
                  {bootstrap.sampleMetadata.explorer.length} explorer object(s)
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="muted">No bootstrap snapshot loaded yet.</p>
        )}
      </section>
    </main>
  );
}

export { App };
