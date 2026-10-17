import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import MerchantAccess from "./MerchantAccess.jsx";
import DecorArt from "./DecorArt.jsx";
import Payments from "./Payments.jsx";

const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value / 100,
  );
const orderCode = (id) => (id.startsWith("demo-") ? id : id.slice(0, 8));
async function api(path, options) {
  const response = await fetch(
    "/api" + path,
    options
      ? {
          method: options.method || "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options.data),
        }
      : undefined,
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function Icon({ name, size = 20, ...props }) {
  const shapes = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    box: (
      <>
        <path d="m3 7 9-4 9 4v10l-9 4-9-4Z" />
        <path d="m3 7 9 5 9-5M12 12v9M7 5l10 5" />
      </>
    ),
    bag: (
      <>
        <path d="M4 8h16l-1 13H5Z" />
        <path d="M8 9V6a4 4 0 0 1 8 0v3" />
      </>
    ),
    palette: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4c-1-1 0-3 2-3h2a4 4 0 0 0 3-4c0-4-4-7-9-7Z" />
        <path d="M7 10h.01M10 6h.01M15 7h.01M6 15h.01" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
        <path d="m20 2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    external: (
      <>
        <path d="M14 3h7v7m0-7L10 14" />
        <path d="M10 3H4v17h17v-6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    chart: (
      <>
        <path d="M4 3v17h17M8 15l4-5 4 2 5-7" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {shapes[name] || shapes.box}
    </svg>
  );
}
function ProductArt({ product, large = false }) {
  const [failedImage, setFailedImage] = useState("");
  if (product.image_url && failedImage !== product.image_url)
    return (
      <div className="product-art product-photo">
        <img
          src={product.image_url}
          alt={product.title}
          loading="lazy"
          onError={() => setFailedImage(product.image_url)}
        />
      </div>
    );
  if (["chair", "table", "lamp", "vase"].includes(product.art))
    return <DecorArt product={product} large={large} />;
  const { art = "bottle" } = product;
  return (
    <div className={`product-art art-${art} ${large ? "large" : ""}`}>
      <svg viewBox="0 0 240 200" aria-hidden="true">
        <defs>
          <linearGradient id={`shade-${product.id}`} x1="0" x2="1">
            <stop stopColor="#ffffff" stopOpacity=".5" />
            <stop offset="1" stopColor="#454031" stopOpacity=".15" />
          </linearGradient>
        </defs>
        <ellipse
          cx="123"
          cy="174"
          rx="58"
          ry="8"
          fill="#665445"
          opacity=".10"
        />
        {art === "bag" ? (
          <>
            <path
              d="M85 69V51c0-44 70-44 70 0v18"
              fill="none"
              stroke="#b2a383"
              strokeWidth="8"
            />
            <path d="m62 64 116 0 12 105H50Z" fill="#d8c8a4" />
            <path
              d="m62 64 11 105h106l-1-105"
              fill={`url(#shade-${product.id})`}
            />
            <text
              x="120"
              y="122"
              textAnchor="middle"
              fontSize="11"
              fill="#6c644e"
              letterSpacing="3"
            >
              EVERYDAY
            </text>
          </>
        ) : art === "cup" ? (
          <>
            <path
              d="M155 79c58-13 55 66 1 58"
              fill="none"
              stroke="#c0b5a2"
              strokeWidth="13"
            />
            <path d="M65 67h97l-8 88q-36 25-80 0Z" fill="#d6cbbc" />
            <ellipse cx="113" cy="67" rx="49" ry="12" fill="#e6ddd1" />
            <ellipse cx="113" cy="68" rx="41" ry="7" fill="#9a8d78" />
            <path
              d="M72 82v63"
              stroke="#eee8dd"
              strokeWidth="6"
              strokeLinecap="round"
              opacity=".6"
            />
          </>
        ) : art === "book" ? (
          <>
            <path d="m72 42 92-8 13 126-92 12Z" fill="#7a8a6b" />
            <path d="m80 43 84-7 11 122-83 11Z" fill="#9ca88c" />
            <path d="m85 171 92-12-2 5-88 12Z" fill="#eae3d2" />
            <text
              x="124"
              y="94"
              textAnchor="middle"
              fontSize="10"
              fill="#f4efdf"
              letterSpacing="2"
            >
              FIELD NOTES
            </text>
          </>
        ) : (
          <>
            <rect
              x={art === "pump" ? 86 : 91}
              y="65"
              width={art === "pump" ? 72 : 62}
              height="104"
              rx="10"
              fill={art === "pump" ? "#78886a" : "#9e5838"}
            />
            <rect
              x={art === "pump" ? 86 : 91}
              y="65"
              width={art === "pump" ? 72 : 62}
              height="104"
              rx="10"
              fill={`url(#shade-${product.id})`}
            />
            {art === "pump" ? (
              <>
                <path d="M112 65V43h44v10h-31v12" fill="#373e30" />
                <rect
                  x="108"
                  y="59"
                  width="20"
                  height="12"
                  rx="2"
                  fill="#373e30"
                />
              </>
            ) : (
              <>
                <rect
                  x="104"
                  y="36"
                  width="36"
                  height="31"
                  rx="4"
                  fill="#3d3a30"
                />
                <path d="M112 36v-9q10-12 20 0v9" fill="#3d3a30" />
              </>
            )}
            <rect x="94" y="98" width="55" height="47" fill="#ede4cf" />
            <text
              x="121"
              y="113"
              textAnchor="middle"
              fontSize="7"
              fill="#615e4c"
              letterSpacing="1.2"
            >
              CONSIDERED
            </text>
            <path d="M112 123h19M116 129h11" stroke="#8c856e" strokeWidth="1" />
          </>
        )}
      </svg>
    </div>
  );
}
function Modal({ title, onClose, children }) {
  const ref = React.useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    ref.current.showModal();
    return () => before?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function App() {
  const slug = window.location.pathname.match(/^\/store\/([^/]+)\/?$/)?.[1];
  return slug ? (
    <Storefront slug={slug} />
  ) : (
    <MerchantAccess>
      {(user, onLogout) => <Dashboard user={user} onLogout={onLogout} />}
    </MerchantAccess>
  );
}
function Dashboard({ user, onLogout }) {
  const [stores, setStores] = useState([]),
    [selected, setSelected] = useState(
      localStorage.getItem("forma-store") || "",
    ),
    [page, setPage] = useState("Overview"),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(""),
    [query, setQuery] = useState("");
  const store = stores.find((s) => s.id === selected) || stores[0];
  async function load() {
    try {
      setStores(await api("/stores"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }
  useEffect(() => {
    load();
  }, [page]);
  useEffect(() => {
    if (selected) localStorage.setItem("forma-store", selected);
  }, [selected]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  const orders = store?.orders || [],
    products = store?.products || [],
    revenue = orders
      .filter((o) =>
        store?.paymentMode === "demo"
          ? o.payment_status === "demo"
          : o.payment_status === "paid",
      )
      .reduce((n, o) => n + o.total, 0);
  async function saved(message) {
    setModal(null);
    await load();
    setNotice(message);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="wordmark" href="/" aria-label="Myverse home">
          <span className="brand-symbol">m</span> MYVERSE
        </a>
        <div className="workspace-caption">YOUR WORKSPACE</div>
        <label className="store-select">
          <span className="store-avatar" style={{ background: store?.accent }}>
            {store?.name[0] || "F"}
          </span>
          <select
            aria-label="Active store"
            value={store?.id || ""}
            onChange={(e) => {
              setSelected(e.target.value);
              setQuery("");
            }}
          >
            {stores.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Icon name="chevron" size={15} />
        </label>
        <nav aria-label="Management">
          {[
            ["Overview", "grid"],
            ["Products", "box"],
            ["Orders", "bag"],
            ["Brand studio", "palette"],
            ["AI commerce", "spark"],
            ["Payments", "chart"],
          ].map(([label, icon]) => (
            <button
              key={label}
              onClick={() => {
                setPage(label);
                setQuery("");
              }}
              className={page === label ? "nav-item active" : "nav-item"}
            >
              <Icon name={icon} />
              {label}
              {label === "AI commerce" && <span className="new-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-card">
            <span className="eyebrow">BUILT TO BE YOURS</span>
            <h3>
              One platform.
              <br />
              Endless possibilities.
            </h3>
            <p>Create a home for your next great brand.</p>
            <button onClick={() => setModal({ type: "store" })}>
              Create a store <Icon name="plus" size={15} />
            </button>
          </div>
          <div className="profile">
            <span className="profile-avatar">Y</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
              <button className="signout-button" onClick={onLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{page}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-pill">
              <i /> Private workspace
            </span>
            {store && (
              <a
                className="button small"
                href={`/store/${store.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                View store <Icon name="external" size={14} />
              </a>
            )}
          </div>
        </header>
        <main className="dashboard-content">
          {error && (
            <div role="alert" className="error">
              {error} <button onClick={load}>Retry</button>
            </div>
          )}
          {!loaded ? (
            <p>Loading your workspace…</p>
          ) : !store ? (
            <div className="empty">
              <h1>Your next chapter starts here.</h1>
              <button
                className="button primary"
                onClick={() => setModal({ type: "store" })}
              >
                Create your first store
              </button>
            </div>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {page === "Overview"
                      ? "MAKE SOMETHING YOURS"
                      : "YOUR COMMERCE WORKSPACE"}
                  </span>
                  <h1>
                    {page === "Overview"
                      ? "Curate a world of distinction."
                      : page === "Brand studio"
                        ? "Your brand, every detail."
                        : page === "AI commerce"
                          ? "A more thoughtful way to shop."
                          : page}
                  </h1>
                  <p>
                    {page === "Overview"
                      ? `Here’s what’s happening with ${store.name}.`
                      : page === "Products"
                        ? "Thoughtful products deserve a beautiful place to live."
                        : page === "Orders"
                          ? "Every order is the start of a relationship."
                          : page === "Brand studio"
                            ? "Make this space feel unmistakably like you."
                            : "Help customers find their next favorite thing."}
                  </p>
                </div>
                {page === "Products" ? (
                  <button
                    className="button primary"
                    onClick={() => setModal({ type: "product" })}
                  >
                    <Icon name="plus" size={16} /> Add product
                  </button>
                ) : page === "Overview" ? (
                  <button
                    className="button"
                    onClick={() => setPage("Brand studio")}
                  >
                    <Icon name="palette" size={16} /> Customize store
                  </button>
                ) : null}
              </div>
              {page === "Overview" && (
                <>
                  <section className="welcome-banner">
                    <div className="banner-copy">
                      <span className="light-eyebrow">
                        A DIFFERENT PERSPECTIVE ON LIVING.
                      </span>
                      <h2>
                        Your perspective.
                        <br />
                        Your world, beautifully composed.
                      </h2>
                      <p>
                        A home for independent interior brands and extraordinary
                        objects.
                      </p>
                      <button onClick={() => setPage("Brand studio")}>
                        Make it your own <Icon name="arrow" size={17} />
                      </button>
                    </div>
                    <div className="banner-visual">
                      <span className="orbit orbit-one" />
                      <span className="orbit orbit-two" />
                      <div className="floating-label">Made with intention.</div>
                      <ProductArt
                        product={{ art: "chair", id: "banner" }}
                        large
                      />
                      <div className="tiny-brand-card">
                        <span
                          className="mini-swatch"
                          style={{ background: store.accent }}
                        />
                        <div>
                          <strong>{store.name}</strong>
                          <small>Your brand lives here</small>
                        </div>
                        <Icon name="check" size={16} />
                      </div>
                    </div>
                  </section>
                  <div className="section-heading">
                    <h2>Your store at a glance</h2>
                    <span>All time · store activity</span>
                  </div>
                  <section className="metrics">
                    {[
                      [
                        money(revenue),
                        store.paymentMode === "demo"
                          ? "Demo order value"
                          : "Paid order value",
                        "chart",
                      ],
                      [orders.length, "Orders", "bag"],
                      [products.length, "Products in your catalog", "box"],
                      [
                        products.reduce((s, p) => s + p.inventory, 0),
                        "Units available",
                        "globe",
                      ],
                    ].map(([value, label, icon]) => (
                      <div className="metric" key={label}>
                        <div className="metric-label">
                          {label}
                          <Icon name={icon} size={17} />
                        </div>
                        <strong>{value}</strong>
                        <small>
                          {label.endsWith("order value")
                            ? store.paymentMode === "demo"
                              ? "No live payments collected"
                              : "Verified paid orders only"
                            : label === "Orders"
                              ? "Across this store’s order history"
                              : label === "Products in your catalog"
                                ? "Curated for your customers"
                                : "Across this store’s collection"}
                        </small>
                      </div>
                    ))}
                  </section>
                  <div className="overview-lower">
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Recent orders</h2>
                          <p>A few good things on their way.</p>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => setPage("Orders")}
                        >
                          View all <Icon name="arrow" size={15} />
                        </button>
                      </div>
                      <Orders orders={orders.slice(0, 4)} />
                    </section>
                    <section className="ai-promo">
                      <div className="spark-tile">
                        <Icon name="spark" size={24} />
                      </div>
                      <span className="eyebrow">MEET YOUR NEXT ADVANTAGE</span>
                      <h2>
                        Commerce with
                        <br />a little intelligence.
                      </h2>
                      <p>
                        Help shoppers discover products through a conversation
                        that feels natural.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => setPage("AI commerce")}
                      >
                        Explore AI commerce <Icon name="arrow" size={16} />
                      </button>
                      <span className="outline-label">
                        Catalog search included · AI optional
                      </span>
                    </section>
                  </div>
                  <section className="panel collection-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>A collection worth discovering</h2>
                        <p>Your products, in their best light.</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setPage("Products")}
                      >
                        Manage products <Icon name="arrow" size={15} />
                      </button>
                    </div>
                    <div className="collection-grid">
                      {products.slice(0, 4).map((p) => (
                        <button
                          className="product-preview"
                          key={p.id}
                          onClick={() =>
                            setModal({ type: "product", product: p })
                          }
                        >
                          <ProductArt product={p} />
                          <div>
                            <strong>{p.title}</strong>
                            <span>{money(p.price)}</span>
                          </div>
                          <small>{p.category}</small>
                        </button>
                      ))}
                      {!products.length && (
                        <p className="empty">
                          Add your first product to bring this store to life.
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}
              {page === "Products" && (
                <section className="panel">
                  <div className="panel-heading">
                    <h2>
                      All products{" "}
                      <span className="count">{products.length}</span>
                    </h2>
                    <label className="search-input">
                      <Icon name="search" size={17} />
                      <input
                        placeholder="Search products"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Inventory</th>
                          <th>Price</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {products
                          .filter((p) =>
                            `${p.title} ${p.category}`
                              .toLowerCase()
                              .includes(query.toLowerCase()),
                          )
                          .map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div className="product-cell">
                                  <ProductArt product={p} />
                                  <strong>{p.title}</strong>
                                </div>
                              </td>
                              <td>{p.category}</td>
                              <td>
                                <span
                                  className={
                                    p.inventory ? "stock" : "out-stock"
                                  }
                                >
                                  {p.inventory} in stock
                                </span>
                              </td>
                              <td>{money(p.price)}</td>
                              <td>
                                <button
                                  className="text-button"
                                  onClick={() =>
                                    setModal({ type: "product", product: p })
                                  }
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {!products.length && (
                    <p className="empty">
                      This collection is waiting for its first product.
                    </p>
                  )}
                </section>
              )}
              {page === "Orders" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>All orders</h2>
                      <p>
                        {store.paymentMode === "demo"
                          ? "Demo checkouts · no money collected."
                          : "Paid orders are confirmed by Stripe. Pending checkouts are not payment confirmations."}
                      </p>
                    </div>
                  </div>
                  <Orders
                    orders={orders}
                    onSelect={(order) => setModal({ type: "order", order })}
                  />
                </section>
              )}
              {page === "Brand studio" && (
                <BrandEditor
                  key={store.id}
                  store={store}
                  onSaved={() => saved("Your brand has been updated.")}
                />
              )}
              {page === "AI commerce" && (
                <div className="ai-layout">
                  <section className="panel assistant-info">
                    <span className="spark-tile">
                      <Icon name="spark" size={28} />
                    </span>
                    <h2>A guide to your collection.</h2>
                    <p>
                      Your assistant only receives this store’s product catalog.
                      Try asking about a category, a product, or an everyday
                      need.
                    </p>
                    <div className="info-note">
                      <strong>AI is an optional integration</strong>
                      <p>
                        Catalog search is included. The platform owner manages
                        the live AI connection, so your customers never need
                        their own AI account.
                      </p>
                    </div>
                    <p className="muted">
                      AI allowance: 20 requests per store per day, with a shared
                      $5 monthly platform budget estimate. Provider access is
                      configured securely by the platform owner.
                    </p>
                  </section>
                  <Assistant key={store.id} store={store} />
                </div>
              )}
              {page === "Payments" && <Payments />}
            </>
          )}
          <footer className="dashboard-footer">
            <span>MYVERSE COMMERCE</span>
            <span>Good things start with an idea.</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {notice}
        </div>
      )}
      {modal?.type === "store" && (
        <StoreForm
          onClose={() => setModal(null)}
          onSaved={async (s) => {
            setSelected(s.id);
            setPage("Overview");
            await saved("Your new store is ready to customize.");
          }}
        />
      )}
      {modal?.type === "product" && (
        <ProductForm
          store={store}
          product={modal.product}
          onClose={() => setModal(null)}
          onSaved={() =>
            saved(
              modal.product
                ? "Product updated."
                : "Product added to your collection.",
            )
          }
        />
      )}
      {modal?.type === "order" && (
        <Modal title="Order details" onClose={() => setModal(null)}>
          <p>{modal.order.customer}</p>
          <p className="muted">
            {new Date(modal.order.created_at).toLocaleString()} ·{" "}
            {modal.order.payment_status === "paid"
              ? "Payment confirmed"
              : modal.order.payment_status === "demo"
                ? "Demo · no payment collected"
                : modal.order.payment_status}
          </p>
          {modal.order.items.map((item, i) => (
            <div className="cart-row" key={i}>
              <span>
                {item.title} × {item.quantity}
              </span>
              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="cart-total">
            Total <strong>{money(modal.order.total)}</strong>
          </div>
          {modal.order.customer_email && <p>{modal.order.customer_email}</p>}
          {modal.order.shipping_json && (
            <p className="muted">
              Ship to:{" "}
              {Object.values(
                JSON.parse(modal.order.shipping_json).address || {},
              )
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          <p className="muted">
            Fulfillment: {modal.order.fulfillment_status || "unfulfilled"}
          </p>
          {["paid", "demo"].includes(modal.order.payment_status) && (
            <button
              className="button primary full"
              disabled={modal.order.fulfillment_status === "fulfilled"}
              onClick={async () => {
                try {
                  await api(`/stores/${store.id}/orders/${modal.order.id}`, {
                    method: "PATCH",
                    data: { fulfillment_status: "fulfilled" },
                  });
                  await saved("Order marked fulfilled.");
                } catch (e) {
                  setError(e.message);
                  setModal(null);
                }
              }}
            >
              Mark fulfilled
            </button>
          )}
        </Modal>
      )}
    </div>
  );
}
function Orders({ orders, onSelect }) {
  return !orders.length ? (
    <p className="empty">
      Your first order is a new beginning. Open the storefront to try a demo
      checkout.
    </p>
  ) : (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                {onSelect ? (
                  <button className="text-button" onClick={() => onSelect(o)}>
                    #{orderCode(o.id)}
                  </button>
                ) : (
                  <strong>#{orderCode(o.id)}</strong>
                )}
              </td>
              <td>{o.customer}</td>
              <td>
                <span className="status-pill">
                  {o.payment_status === "paid"
                    ? "Paid"
                    : o.payment_status === "demo"
                      ? "Demo"
                      : o.payment_status || "Demo"}{" "}
                  · {o.fulfillment_status || "unfulfilled"}
                </span>
              </td>
              <td>{money(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function StoreForm({ onClose, onSaved }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="A new home for your brand" onClose={onClose}>
      <p className="muted">
        Each store gets its own branding, catalog, and demo orders.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const data = Object.fromEntries(new FormData(e.currentTarget));
            data.starterCatalog = data.starterCatalog === "on";
            await onSaved(await api("/stores", { data }));
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Brand name
          <input
            name="name"
            placeholder="Your next big idea"
            maxLength="80"
            required
            autoFocus
          />
        </label>
        <label>
          Store address
          <input
            name="slug"
            placeholder="your-brand"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength="80"
            required
          />
          <small>Lowercase letters, numbers, and hyphens.</small>
        </label>
        <label>
          Brand tagline
          <input
            name="tagline"
            placeholder="What do you believe in?"
            maxLength="180"
          />
        </label>
        <label>
          Brand color
          <input name="accent" type="color" defaultValue="#6c5944" />
        </label>
        <label className="checkbox-label">
          <input name="starterCatalog" type="checkbox" defaultChecked />
          Include the sample luxury interior collection
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy ? "Creating…" : "Create store"}
          <Icon name="arrow" size={16} />
        </button>
      </form>
    </Modal>
  );
}
function ProductForm({ store, product: p, onClose, onSaved }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title={p ? "Edit your product" : "Something new for your collection"}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const data = Object.fromEntries(new FormData(e.currentTarget));
            data.price = Math.round(Number(data.price) * 100);
            data.inventory = Number(data.inventory);
            data.active = data.active === "on";
            await api(`/stores/${store.id}/products${p ? "/" + p.id : ""}`, {
              method: p ? "PATCH" : "POST",
              data,
            });
            await onSaved();
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Product name
          <input
            name="title"
            defaultValue={p?.title}
            maxLength="100"
            required
            autoFocus
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            defaultValue={p?.description}
            rows="3"
            maxLength="1000"
          />
        </label>
        <div className="form-row">
          <label>
            Price (USD)
            <input
              name="price"
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              defaultValue={p ? p.price / 100 : ""}
              required
            />
          </label>
          <label>
            Stock quantity
            <input
              name="inventory"
              type="number"
              min="0"
              max="1000000"
              step="1"
              defaultValue={p?.inventory ?? 10}
              required
            />
          </label>
        </div>
        <label>
          Category
          <input
            name="category"
            defaultValue={p?.category || "Collection"}
            maxLength="60"
          />
        </label>
        <label>
          Product photo URL
          <input
            name="image_url"
            type="url"
            pattern="https://.*"
            maxLength="2048"
            defaultValue={p?.image_url || ""}
            placeholder="https://your-image-host.com/product.jpg"
          />
          <small>
            Use your own HTTPS product image, or keep the illustrated preview.
          </small>
        </label>
        <label>
          Product illustration
          <select name="art" defaultValue={p?.art || "chair"}>
            {[
              "chair",
              "table",
              "lamp",
              "vase",
              "bottle",
              "bag",
              "cup",
              "pump",
              "book",
            ].map((a) => (
              <option key={a} value={a}>
                {a[0].toUpperCase() + a.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="active"
            defaultChecked={p?.active !== 0}
          />
          Available for purchase
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy ? "Saving…" : p ? "Save changes" : "Add product"}
        </button>
        {p && (
          <button
            type="button"
            className="button full"
            disabled={busy || p.active === 0}
            onClick={async () => {
              setBusy(true);
              try {
                await api(`/stores/${store.id}/products/${p.id}`, {
                  method: "DELETE",
                  data: {},
                });
                await onSaved();
              } catch (e) {
                setError(e.message);
                setBusy(false);
              }
            }}
          >
            Take off sale
          </button>
        )}
      </form>
    </Modal>
  );
}
function BrandEditor({ store, onSaved }) {
  const [name, setName] = useState(store.name),
    [tagline, setTagline] = useState(store.tagline),
    [accent, setAccent] = useState(store.accent),
    [shippingFee, setShippingFee] = useState((store.shipping_fee || 0) / 100),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="brand-layout">
      <section className="panel brand-form">
        <h2>The details make the difference.</h2>
        <p className="muted">Preview your identity as you go.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("/stores/" + store.id, {
                method: "PATCH",
                data: {
                  name,
                  tagline,
                  accent,
                  shipping_fee: Math.round(Number(shippingFee) * 100),
                },
              });
              await onSaved();
            } catch (err) {
              setError(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Brand name
            <input
              value={name}
              maxLength="80"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Tagline
            <textarea
              value={tagline}
              maxLength="180"
              onChange={(e) => setTagline(e.target.value)}
              rows="3"
            />
          </label>
          <label>
            Signature color
            <div className="color-control">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
              />
              <span>{accent.toUpperCase()}</span>
            </div>
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <label>
            Flat delivery fee (USD)
            <input
              type="number"
              min="0"
              max="10000"
              step="0.01"
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              required
            />
            <small>
              Zero means complimentary delivery. Shipping regions are configured
              by the platform owner.
            </small>
          </label>
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save brand identity"}
          </button>
        </form>
      </section>
      <section className="brand-preview" style={{ "--store-accent": accent }}>
        <span className="eyebrow">YOUR STOREFRONT · PREVIEW</span>
        <div className="preview-browser">
          <div className="browser-dots">
            ● ● ● <span>/store/{store.slug}</span>
          </div>
          <div className="preview-brand">{name}</div>
          <div className="preview-hero">
            <span className="light-eyebrow">A WORLD OF YOUR OWN</span>
            <h2>{tagline || "Something wonderful starts here."}</h2>
            <span className="preview-button">
              Explore the collection <Icon name="arrow" size={16} />
            </span>
          </div>
          <div className="preview-products">
            {store.products.slice(0, 2).map((p) => (
              <ProductArt key={p.id} product={p} />
            ))}
          </div>
        </div>
        <p>Your changes appear in this store’s storefront after saving.</p>
      </section>
    </div>
  );
}
function Assistant({ store, onAdd }) {
  const [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [configured, setConfigured] = useState(false);
  useEffect(() => {
    api("/health")
      .then((h) => setConfigured(h.aiConfigured))
      .catch(() => {});
  }, []);
  async function ask(message) {
    if (!message.trim() || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", message }]);
    try {
      const answer = await api(`/stores/${store.id}/assistant`, {
        data: { message },
      });
      setMessages((m) => [...m, { role: "assistant", ...answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "error", message: e.message }]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="assistant">
      <div className="assistant-header">
        <span className="spark-tile">
          <Icon name="spark" />
        </span>
        <div>
          <strong>Your collection, discovered.</strong>
          <small>
            {configured
              ? "AI shopping assistant"
              : "Catalog search · AI provider not connected"}
          </small>
        </div>
      </div>
      <div className="messages" aria-live="polite">
        {!messages.length && (
          <div className="assistant-welcome">
            <Icon name="spark" size={32} />
            <h3>A little help finding your favorite.</h3>
            <p>Tell me what you’re looking for in {store.name}.</p>
            <div className="prompt-buttons">
              {["Something for everyday use", "Show me the collection"].map(
                (p) => (
                  <button key={p} onClick={() => ask(p)}>
                    {p} <Icon name="arrow" size={14} />
                  </button>
                ),
              )}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div className={"message " + m.role} key={i}>
            <p>{m.message}</p>
            {m.products?.map((id) => {
              const p = store.products.find((p) => p.id === id);
              return p ? (
                <div className="recommendation" key={id}>
                  <ProductArt product={p} />
                  <div>
                    <strong>{p.title}</strong>
                    <span>{money(p.price)}</span>
                  </div>
                  {onAdd && (
                    <button
                      className="icon-button"
                      aria-label={`Add ${p.title} to bag`}
                      onClick={() => onAdd(p)}
                    >
                      <Icon name="plus" size={17} />
                    </button>
                  )}
                </div>
              ) : null;
            })}
          </div>
        ))}
        {busy && <p className="muted">Finding something for you…</p>}
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          aria-label="Ask about the collection"
          placeholder="What are you looking for?"
          value={input}
          maxLength="1500"
          onChange={(e) => setInput(e.target.value)}
        />
        <button aria-label="Send message" disabled={busy || !input.trim()}>
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </section>
  );
}
function Storefront({ slug }) {
  const [store, setStore] = useState(null),
    [error, setError] = useState(""),
    [cart, setCart] = useState(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(`myverse-cart-${slug}`) || "[]",
        );
        return Array.isArray(saved)
          ? saved.filter(
              (i) =>
                typeof i.productId === "string" &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                i.quantity <= 100,
            )
          : [];
      } catch {
        return [];
      }
    }),
    [showCart, setShowCart] = useState(false),
    [showAssistant, setShowAssistant] = useState(false),
    [receipt, setReceipt] = useState(null),
    [busy, setBusy] = useState(false),
    [cartError, setCartError] = useState(""),
    [category, setCategory] = useState("All");
  useEffect(() => {
    localStorage.setItem(`myverse-cart-${slug}`, JSON.stringify(cart));
  }, [cart, slug]);
  async function load() {
    try {
      setStore(await api("/storefront?slug=" + encodeURIComponent(slug)));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [slug]);
  function add(p) {
    setCartError("");
    setReceipt(null);
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id);
      return existing
        ? c.map((i) =>
            i.productId === p.id
              ? { ...i, quantity: Math.min(i.quantity + 1, p.inventory, 100) }
              : i,
          )
        : [...c, { productId: p.id, quantity: 1 }];
    });
  }
  const total =
    (store?.shipping_fee || 0) +
    cart.reduce(
      (sum, i) =>
        sum +
        (store?.products.find((p) => p.id === i.productId)?.price || 0) *
          i.quantity,
      0,
    );
  if (error)
    return (
      <div className="empty">
        <h1>{error}</h1>
        <a href="/">Return to workspace</a>
      </div>
    );
  if (!store) return <div className="empty">Opening the store…</div>;
  return (
    <div className="storefront" style={{ "--store-accent": store.accent }}>
      <div className="store-announcement">
        INTERIORS WITH INTENTION. OBJECTS WITH SOUL.{" "}
        <span>
          {store.paymentMode === "stripe"
            ? "Secure checkout · USD"
            : store.paymentMode === "setup-required"
              ? "Payments being configured · USD"
              : "Demo checkout · USD"}
        </span>
      </div>
      <header className="store-header">
        <a href={`/store/${store.slug}`} className="store-logo">
          {store.name}
        </a>
        <nav>
          <a href="#collection">The collection</a>
          <button onClick={() => setShowAssistant(true)}>
            Find your favorite <Icon name="spark" size={15} />
          </button>
        </nav>
        <button
          className="cart-button"
          onClick={() => {
            setCartError("");
            setShowCart(true);
          }}
        >
          <Icon name="bag" /> Bag{" "}
          <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
        </button>
      </header>
      <main>
        {new URLSearchParams(window.location.search).get("checkout") ===
          "success" && (
          <p className="checkout-notice">
            Thank you. Your payment confirmation is being processed securely.
            The merchant’s order status is updated after Stripe verifies
            payment.
          </p>
        )}
        {new URLSearchParams(window.location.search).get("checkout") ===
          "cancelled" && (
          <p className="checkout-notice">
            Checkout was cancelled. Reserved stock is released when the checkout
            session expires.
          </p>
        )}
        <section className="store-hero">
          <div>
            <span className="light-eyebrow">THE MYVERSE EDIT</span>
            <h1>{store.tagline || "Good things, made yours."}</h1>
            <p>
              Sculptural forms, honest materials, and pieces chosen to make a
              space unmistakably yours.
            </p>
            <a className="store-cta" href="#collection">
              Discover the collection <Icon name="arrow" size={18} />
            </a>
          </div>
          <div className="store-hero-art">
            <ProductArt
              product={store.products[0] || { id: "hero", art: "chair" }}
              large
            />
            <span>Objects with intention.</span>
          </div>
        </section>
        <section className="store-collection" id="collection">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                EXCEPTIONAL OBJECTS. ENDURING DESIGN.
              </span>
              <h2>The art of a considered home.</h2>
            </div>
            <span>{store.products.length} considered essentials</span>
          </div>
          <div className="filters">
            {["All", ...new Set(store.products.map((p) => p.category))].map(
              (c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={category === c ? "selected" : ""}
                >
                  {c}
                </button>
              ),
            )}
          </div>
          <div className="store-products">
            {store.products
              .filter((p) => category === "All" || p.category === category)
              .map((p) => (
                <article className="store-product" key={p.id}>
                  <ProductArt product={p} />
                  <span className="eyebrow">{p.category}</span>
                  <div className="store-product-title">
                    <h3>{p.title}</h3>
                    <span>{money(p.price)}</span>
                  </div>
                  <p>{p.description}</p>
                  <button
                    disabled={!p.inventory}
                    onClick={() => {
                      add(p);
                      setShowCart(true);
                    }}
                  >
                    {p.inventory ? "Add to bag" : "Out of stock"}
                    <Icon name="plus" size={16} />
                  </button>
                </article>
              ))}
          </div>
          {!store.products.length && (
            <p className="empty">
              A new collection is taking shape. Come back soon.
            </p>
          )}
        </section>
        <section className="store-assistant-banner">
          <Icon name="spark" size={28} />
          <div>
            <h2>Not sure where to begin?</h2>
            <p>A little guidance can lead to something lovely.</p>
          </div>
          <button onClick={() => setShowAssistant(true)}>
            Let’s find your favorite <Icon name="arrow" size={17} />
          </button>
        </section>
      </main>
      <footer className="store-footer">
        <strong>{store.name}</strong>
        <span>Considered commerce, powered by Myverse.</span>
        <a href="/">
          Merchant workspace <Icon name="arrow" size={14} />
        </a>
      </footer>
      {showCart && (
        <Modal
          title={receipt ? "A good thing, on its way." : "Your bag"}
          onClose={() => setShowCart(false)}
        >
          {receipt ? (
            <>
              <div className="receipt-icon">
                <Icon name="check" size={32} />
              </div>
              <h3>Demo order saved</h3>
              <p>
                No payment was collected. You can see this order in the
                management dashboard.
              </p>
              <p className="muted">
                Order #{receipt.id.slice(0, 8)} · {money(receipt.total)}
              </p>
              <button
                className="button primary full"
                onClick={() => setShowCart(false)}
              >
                Keep exploring
              </button>
            </>
          ) : cart.length ? (
            <>
              <p className="info-note">
                {store.paymentMode === "stripe"
                  ? "Continue to Stripe for secure payment and shipping details. Any configured taxes are calculated there."
                  : store.paymentMode === "setup-required"
                    ? "This merchant has not enabled payments yet."
                    : "Demo checkout only. No payment information or money is collected."}
              </p>
              {cart.map((i) => {
                const p = store.products.find((p) => p.id === i.productId);
                return p ? (
                  <div className="cart-row" key={p.id}>
                    <div>
                      <strong>{p.title}</strong>
                      <small>{money(p.price)} each</small>
                    </div>
                    <input
                      aria-label={`Quantity for ${p.title}`}
                      type="number"
                      min="1"
                      max={Math.min(p.inventory, 100)}
                      value={i.quantity}
                      onChange={(e) =>
                        setCart((c) =>
                          c.map((item) =>
                            item.productId === p.id
                              ? {
                                  ...item,
                                  quantity: Math.min(
                                    Math.max(Number(e.target.value) || 1, 1),
                                    p.inventory,
                                    100,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                    />
                    <button
                      className="icon-button"
                      aria-label={`Remove ${p.title}`}
                      onClick={() =>
                        setCart((c) =>
                          c.filter((item) => item.productId !== p.id),
                        )
                      }
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ) : null;
              })}
              <p className="muted">
                Delivery:{" "}
                {store.shipping_fee
                  ? money(store.shipping_fee)
                  : "Complimentary"}
                . Any configured taxes are calculated at checkout.
              </p>
              <div className="cart-total">
                Total <strong>{money(total)}</strong>
              </div>
              {cartError && (
                <p role="alert" className="error">
                  {cartError}
                </p>
              )}
              <button
                className="button primary full"
                disabled={busy || store.paymentMode === "setup-required"}
                onClick={async () => {
                  setBusy(true);
                  setCartError("");
                  try {
                    const result = await api(`/stores/${store.id}/orders`, {
                      data: { items: cart },
                    });
                    if (result.checkoutUrl) {
                      window.location.assign(result.checkoutUrl);
                      return;
                    }
                    setReceipt(result);
                    setCart([]);
                    await load();
                  } catch (e) {
                    setCartError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy
                  ? "Opening checkout…"
                  : store.paymentMode === "stripe"
                    ? "Continue to secure checkout"
                    : store.paymentMode === "setup-required"
                      ? "Payments not enabled"
                      : "Place demo order"}{" "}
                <Icon name="arrow" size={17} />
              </button>
            </>
          ) : (
            <p className="empty">
              A little room for something wonderful. Your bag is empty.
            </p>
          )}
        </Modal>
      )}
      {showAssistant && (
        <Modal
          title="Find your favorite"
          onClose={() => setShowAssistant(false)}
        >
          <Assistant store={store} onAdd={add} />
          <button
            className="button full"
            onClick={() => {
              setShowAssistant(false);
              setShowCart(true);
            }}
          >
            View bag ({cart.reduce((s, i) => s + i.quantity, 0)}){" "}
            <Icon name="bag" size={16} />
          </button>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
