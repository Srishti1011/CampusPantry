import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, ChefHat,
  ChevronDown, Clock3, Copy, Heart, Leaf, MapPin, Menu, Minus, Plus,
  Printer, Search, ShieldCheck, ShoppingBag, Sparkles, Sprout, TicketCheck,
  Trash2, TrendingUp, Utensils, X, Zap,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { categories, createSampleListings, initialNotifications, weekActivity } from "./data";

const STORAGE = {
  listings: "campuspantry:listings",
  reservations: "campuspantry:reservations",
  notifications: "campuspantry:notifications",
};

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function initialData() {
  const savedListings = readStorage(STORAGE.listings, null);
  const listings = savedListings || createSampleListings();
  if (!savedListings) {
    const firstListing = listings.find((listing) => listing.id === "demo-1");
    if (firstListing) firstListing.portions -= 1;
  }
  const seededReservations = [
    {
      id: "demo-res-1", listingId: "demo-1", itemName: "Grilled Veggie Sandwich",
      outlet: "Campus Café", image: listings.find((item) => item.id === "demo-1")?.image,
      quantity: 1, total: 50, reference: "CP-7K2M9A", pickupLocation: "Campus Café, Main Campus",
      deadline: listings.find((item) => item.id === "demo-1")?.deadline,
      createdAt: new Date(Date.now() - 15 * 60_000).toISOString(), status: "Active", student: "Aarav Sharma",
    },
    {
      id: "demo-res-2", listingId: "demo-2", itemName: "Creamy Tomato Penne",
      outlet: "The Food Court", image: listings.find((item) => item.id === "demo-2")?.image,
      quantity: 1, total: 90, reference: "CP-4T8B1Q", pickupLocation: "The Food Court, Main Campus",
      deadline: listings.find((item) => item.id === "demo-2")?.deadline,
      createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(), status: "Collected", student: "Meera Kapoor",
    },
  ];
  const reservations = readStorage(STORAGE.reservations, null) || seededReservations;
  const notifications = readStorage(STORAGE.notifications, null) || initialNotifications;
  return { listings, reservations, notifications };
}

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const getDeadlineStatus = (deadline) => {
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0) return { expired: true, label: "Pickup ended", remaining };
  if (remaining < 30 * 60_000) return { expired: false, label: `Closing in ${Math.max(1, Math.ceil(remaining / 60_000))} min`, remaining };
  if (remaining < 60 * 60_000) return { expired: false, label: "Closing soon", remaining };
  return { expired: false, label: `Pickup by ${new Date(deadline).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`, remaining };
};
const listingStatus = (item) => {
  if (getDeadlineStatus(item.deadline).expired) return "Expired";
  if (item.portions <= 0) return "Sold Out";
  if (item.portions <= 2) return "Almost gone";
  return "Available";
};
const shortDate = (date) => new Date(date).toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" });
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const makeReference = () => `CP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const toLocalDateTimeInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function App() {
  const boot = useMemo(initialData, []);
  const [listings, setListings] = useState(boot.listings);
  const [reservations, setReservations] = useState(boot.reservations);
  const [notifications, setNotifications] = useState(boot.notifications);
  const [now, setNow] = useState(Date.now());
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPass, setSelectedPass] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => localStorage.setItem(STORAGE.listings, JSON.stringify(listings)), [listings]);
  useEffect(() => localStorage.setItem(STORAGE.reservations, JSON.stringify(reservations)), [reservations]);
  useEffect(() => localStorage.setItem(STORAGE.notifications, JSON.stringify(notifications)), [notifications]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const pushNotification = (title, body, kind = "info") => {
    setNotifications((current) => [{ id: makeId(), title, body, time: new Date().toISOString(), read: false, kind }, ...current]);
  };
  const reserve = (item, quantity) => {
    const current = listings.find((listing) => listing.id === item.id);
    if (!current || listingStatus(current) === "Expired" || current.portions < quantity || current.portions < 1) {
      setToast("Sorry, this listing is no longer available.");
      return;
    }
    const reservation = {
      id: makeId(), listingId: item.id, itemName: item.name, outlet: item.outlet, image: item.image,
      quantity, total: quantity * item.rescuePrice, reference: makeReference(),
      pickupLocation: item.pickupLocation, deadline: item.deadline,
      createdAt: new Date().toISOString(), status: "Active", student: "Aarav Sharma",
    };
    setListings((currentListings) => currentListings.map((listing) =>
      listing.id === item.id ? { ...listing, portions: listing.portions - quantity } : listing,
    ));
    setReservations((current) => [reservation, ...current]);
    pushNotification("Reservation confirmed!", `${quantity} × ${item.name} is ready for pickup.`, "reservation");
    setSelectedItem(null);
    setSelectedPass(reservation);
    setToast("Your food is reserved. See you at pickup!");
  };
  const updateReservation = (reservationId, status) => {
    const reservation = reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.status !== "Active") return;
    if (status === "Collected" && getDeadlineStatus(reservation.deadline).expired) {
      setToast("This pickup window has ended; the reservation cannot be collected.");
      return;
    }
    setReservations((current) => current.map((item) => item.id === reservationId ? { ...item, status } : item));
    if (status === "Cancelled") {
      setListings((current) => current.map((listing) => {
        if (listing.id !== reservation.listingId || getDeadlineStatus(listing.deadline).expired) return listing;
        return { ...listing, portions: listing.portions + reservation.quantity };
      }));
      pushNotification("Reservation cancelled", `${reservation.itemName} was cancelled.`, "cancelled");
      setToast("Reservation cancelled and portions restored.");
    } else {
      pushNotification("Food collected!", `Enjoy your ${reservation.itemName}.`, "collected");
      setToast("Marked as collected. Enjoy!");
    }
  };
  const saveListing = (draft) => {
    if (draft.id) {
      setListings((current) => current.map((item) => item.id === draft.id ? { ...item, ...draft } : item));
      setToast("Listing updated.");
    } else {
      const listing = { ...draft, id: makeId(), createdAt: new Date().toISOString() };
      setListings((current) => [listing, ...current]);
      setToast("Your listing is live for students.");
    }
  };
  const removeListing = (id) => {
    setListings((current) => current.filter((item) => item.id !== id));
    setToast("Listing removed.");
  };

  return (
    <>
      <Header unread={notifications.filter((item) => !item.read).length} notifications={notifications}
        onRead={(id) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item))}
        onReadAll={() => setNotifications((current) => current.map((item) => ({ ...item, read: true })))}
        onToast={setToast} />
      <Routes>
        <Route path="/" element={<Home listings={listings} now={now} onSelect={setSelectedItem} reservations={reservations} />} />
        <Route path="/reservations" element={<Reservations reservations={reservations} onUpdate={updateReservation} onPass={setSelectedPass} />} />
        <Route path="/impact" element={<Impact listings={listings} reservations={reservations} />} />
        <Route path="/manager" element={<Manager listings={listings} reservations={reservations} onUpdate={updateReservation} onSave={saveListing} onRemove={removeListing} />} />
        <Route path="/manager/listings" element={<Manager listings={listings} reservations={reservations} onUpdate={updateReservation} onSave={saveListing} onRemove={removeListing} />} />
        <Route path="/manager/reservations" element={<Manager listings={listings} reservations={reservations} onUpdate={updateReservation} onSave={saveListing} onRemove={removeListing} />} />
        <Route path="*" element={<Home listings={listings} now={now} onSelect={setSelectedItem} reservations={reservations} />} />
      </Routes>
      {selectedItem && <ListingModal item={selectedItem} current={listings.find((item) => item.id === selectedItem.id)} onClose={() => setSelectedItem(null)} onReserve={reserve} />}
      {selectedPass && <PickupPass reservation={selectedPass} onClose={() => setSelectedPass(null)} onToast={setToast} />}
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}<button aria-label="Dismiss" onClick={() => setToast("")}><X size={15} /></button></div>}
    </>
  );
}

function Header({ unread, notifications, onRead, onReadAll, onToast }) {
  const location = useLocation();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const manager = location.pathname.startsWith("/manager");
  const nav = manager
    ? [{ to: "/manager", label: "Overview", end: true }, { to: "/manager/listings", label: "My listings" }, { to: "/manager/reservations", label: "Reservations" }]
    : [{ to: "/", label: "Discover", end: true }, { to: "/#closing", label: "Closing soon" }, { to: "/reservations", label: "My reservations" }, { to: "/impact", label: "Our impact" }];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark"><Leaf size={19} fill="currentColor" /></span>
          <span>Campus<span className="brand-light">Pantry</span><small>GOOD FOOD, ANOTHER CHANCE</small></span>
        </Link>
        <nav className={`main-nav ${mobileOpen ? "mobile-open" : ""}`}>
          {nav.map((item) => <NavLink key={item.label} to={item.to} end={item.end} onClick={() => setMobileOpen(false)}>{item.label}</NavLink>)}
          <Link className="mobile-role-link" to={manager ? "/" : "/manager"}>{manager ? "Student view" : "Outlet portal"} <ArrowRight size={14} /></Link>
        </nav>
        <div className="header-actions">
          {!manager && <div className="popover-anchor">
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => { setNoticeOpen(!noticeOpen); setProfileOpen(false); }}>
              <Bell size={19} />{unread > 0 && <span className="notification-dot">{unread}</span>}
            </button>
            {noticeOpen && <div className="popover notifications-popover">
              <div className="popover-heading"><div><strong>Notifications</strong><span>{unread ? `${unread} unread` : "You're all caught up"}</span></div><button className="text-button" onClick={onReadAll}>Mark all read</button></div>
              <div className="notification-list">
                {notifications.slice(0, 5).map((notification) => <button className={`notification-item ${notification.read ? "" : "unread"}`} key={notification.id} onClick={() => onRead(notification.id)}>
                  <span className="notice-icon"><Sparkles size={15} /></span><span><b>{notification.title}</b><small>{notification.body}</small><small className="notice-time">{shortDate(notification.time)}</small></span>
                </button>)}
              </div>
            </div>}
          </div>}
          <div className="role-switch"><span className="role-avatar">{manager ? <ChefHat size={17} /> : "A"}</span><span>{manager ? "Outlet team" : "Aarav"}</span><ChevronDown size={14} /></div>
          <div className="popover-anchor profile-anchor">
            <button className="profile-caret" aria-label="Open profile menu" onClick={() => { setProfileOpen(!profileOpen); setNoticeOpen(false); }}><ChevronDown size={16} /></button>
            {profileOpen && <div className="popover profile-popover"><div className="profile-summary"><span className="profile-large">{manager ? <ChefHat size={20} /> : "A"}</span><span><b>{manager ? "Campus Café" : "Aarav Sharma"}</b><small>{manager ? "Outlet manager · Demo" : "Student · TIET"}</small></span></div><Link to={manager ? "/" : "/manager"} onClick={() => setProfileOpen(false)}>{manager ? <Utensils size={16} /> : <ChefHat size={16} />}{manager ? "Switch to student view" : "Switch to outlet portal"}<ArrowRight size={14} /></Link><button onClick={() => { onToast("Demo profile · Changes are stored on this device."); setProfileOpen(false); }}>Demo profile details</button></div>}
          </div>
          <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
    </header>
  );
}

function Home({ listings, onSelect, reservations }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Food");
  const openListings = listings.filter((item) => listingStatus(item) !== "Expired");
  const filtered = openListings.filter((item) => {
    const matchesCategory = category === "All Food" || item.category === category;
    const query = search.trim().toLowerCase();
    return matchesCategory && (!query || `${item.name} ${item.outlet} ${item.category} ${item.dietary?.join(" ")}`.toLowerCase().includes(query));
  });
  const urgent = listings.filter((item) => {
    const remaining = new Date(item.deadline).getTime() - Date.now();
    return item.portions > 0 && remaining > 0 && remaining < 75 * 60_000;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const rescuePick = listings.find((item) => item.portions > 0 && !getDeadlineStatus(item.deadline).expired) || listings[0];
  return (
    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />LESS WASTE. MORE TASTE.</div>
          <h1>Good food.<br /><em>Better choices.</em><br />Zero waste.</h1>
          <p>Discover delicious surplus food from your campus favourites. Grab it at a special price before it goes to waste.</p>
          <div className="hero-buttons"><a className="button button-primary" href="#discover">Explore food deals <ArrowRight size={17} /></a><a href="#how-it-works" className="button button-link">How it works <ArrowDownRight size={16} /></a></div>
          <div className="hero-highlights"><span><span className="mini-icon orange"><Sparkles size={15} /></span>Fresh food deals</span><span><span className="mini-icon green"><Heart size={15} /></span>Affordable portions</span><span><span className="mini-icon yellow"><Sprout size={15} /></span>Fight food waste</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-blob" /><div className="hero-blob-inner" />
          <div className="hero-image-frame"><img src={rescuePick?.image} alt={rescuePick?.name || "Fresh campus food"} /><span className="image-sticker"><Leaf size={16} /> SAVED, NOT WASTED</span></div>
          <div className="float-card rescue-pick"><span className="float-label"><span className="live-dot" /> RESCUE OF THE DAY</span><strong>{rescuePick?.name || "Fresh campus favourites"}</strong><span>{rescuePick?.portions || 0} portions waiting · {money(rescuePick?.rescuePrice)}</span></div>
          <div className="float-card impact-bubble"><span className="impact-bubble-icon"><Sprout size={17} /></span><b>{reservations.filter((item) => item.status === "Collected").reduce((n, item) => n + item.quantity, 0) + 128}+</b><small>portions saved<br />on campus</small></div>
          <span className="hero-sparkle sparkle-one">✳</span><span className="hero-sparkle sparkle-two">✳</span>
        </div>
        <div className="hero-campus-note"><MapPin size={14} /> MADE FOR TIET · PATIALA</div>
      </section>

      <section className="discovery-section section-shell" id="discover">
        <div className="section-topline"><span className="section-kicker">A LITTLE GOOD GOES A LONG WAY</span><span className="demo-label"><span /> DEMO MENU · TIET</span></div>
        <div className="section-heading-row"><div><h2>What's waiting<br className="desktop-break" /> to be rescued<span className="heading-period">?</span></h2><p>Your favourite campus food, at better prices and with a better purpose.</p></div><div className="search-field"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search meals, snacks, outlets..." aria-label="Search meals, snacks, outlets" />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={16} /></button>}</div></div>
        <div className="category-row" aria-label="Food categories">{categories.map((item, index) => <button key={item} className={`category-chip ${category === item ? "selected" : ""}`} onClick={() => setCategory(item)}><span className={`category-icon category-${index}`}>{[<Utensils size={16} />, <Zap size={16} />, <ChefHat size={16} />, <Sparkles size={16} />, <Utensils size={16} />, <span>☕</span>, <Heart size={16} />, <Leaf size={16} />][index]}</span>{item}</button>)}</div>
        <div className="listing-toolbar"><span><b>{filtered.length} delicious finds</b><span> · all made on campus</span></span><span className="sort-note"><span className="live-dot" /> Updated just now</span></div>
        {filtered.length ? <div className="food-grid">{filtered.map((item) => <FoodCard key={item.id} item={item} onSelect={onSelect} />)}</div> : <EmptyState title="No bites found (yet)" text="Try another search or category. There's always something good around the corner." action={() => { setCategory("All Food"); setSearch(""); }} actionLabel="Show all food" />}
      </section>

      <section className="closing-section" id="closing">
        <div className="closing-top"><div><span className="section-kicker light-kicker">TICK TOCK, TASTY</span><h2>Rescue before<br /><em>closing.</em></h2><p>These delicious deals won't be around for long.</p></div><div className="closing-side-note"><span className="clock-stamp"><Clock3 size={22} /></span><span>Made fresh today.<br /><b>Ready when you are.</b></span></div></div>
        {urgent.length ? <div className="urgent-grid">{urgent.slice(0, 3).map((item) => <FoodCard key={item.id} item={item} onSelect={onSelect} urgent />)}</div> : <div className="closing-empty"><span className="clock-stamp"><Check size={20} /></span><span><b>You're right on time.</b> More closing-time rescues are being prepared.</span></div>}
        <div className="closing-footnote"><span>⏱</span> Pickup deadlines are live and update automatically. No expired deals, ever.</div>
      </section>

      <section className="how-section section-shell" id="how-it-works">
        <div className="how-heading"><span className="section-kicker">THE GOOD STUFF, MADE SIMPLE</span><h2>Three steps to<br /><em>a better bite.</em></h2><p>Good food is too good to go to waste. Here's how you can help.</p></div>
        <div className="steps-grid">{[
          { n: "01", title: "Discover", text: "Find surplus food from your favourite campus outlets.", icon: <Search size={22} />, tone: "step-peach" },
          { n: "02", title: "Reserve", text: "Claim your portions before the pickup window closes.", icon: <TicketCheck size={22} />, tone: "step-yellow" },
          { n: "03", title: "Collect", text: "Visit the outlet, collect your food and enjoy.", icon: <ShoppingBag size={22} />, tone: "step-green" },
        ].map((step) => <div className="step-card" key={step.n}><span className={`step-icon ${step.tone}`}>{step.icon}</span><span className="step-number">{step.n} / 03</span><h3>{step.title}</h3><p>{step.text}</p></div>)}</div>
        <div className="sustainability-banner"><span className="banner-leaf"><Sprout size={22} /></span><span><b>Small rescues. Big impact.</b><small>Every rescued meal is a little win for our campus and our planet.</small></span><Link to="/impact">See your impact <ArrowRight size={16} /></Link></div>
      </section>

      <section className="home-impact section-shell"><div className="home-impact-copy"><span className="section-kicker">A GOOD THING IN MOTION</span><h2>Every bite<br /><em>makes a difference.</em></h2><p>Students and campus kitchens are turning surplus into something meaningful, one rescued meal at a time.</p><Link className="button button-primary" to="/impact">Explore our impact <ArrowRight size={16} /></Link></div><div className="impact-number-card"><span className="impact-number-icon"><Leaf size={19} /></span><strong>128<span>+</span></strong><b>portions rescued</b><small>on campus this week <span>↗</span></small><div className="tiny-bars">{[22, 38, 29, 52, 43, 73, 60, 85, 67, 100, 79, 91].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><span className="illustrative-note">Illustrative demo count</span></div><span className="impact-decoration">✳</span></section>
      <Footer />
    </main>
  );
}

function FoodCard({ item, onSelect, urgent = false }) {
  const status = listingStatus(item);
  const urgency = getDeadlineStatus(item.deadline);
  const off = Math.round((1 - item.rescuePrice / item.originalPrice) * 100);
  const unavailable = status === "Expired" || status === "Sold Out";
  return (
    <article className={`food-card ${urgent ? "food-card-urgent" : ""} ${unavailable ? "food-unavailable" : ""}`} onClick={() => !unavailable && onSelect(item)} tabIndex={unavailable ? -1 : 0} onKeyDown={(event) => event.key === "Enter" && !unavailable && onSelect(item)}>
      <div className="food-image-wrap"><img src={item.image} alt={item.name} loading="lazy" /><span className={`discount-badge ${urgent ? "discount-hot" : ""}`}>{off}% OFF</span>{(status === "Almost gone" || urgent) && !unavailable && <span className="food-status-pill"><span className="live-dot" />{status === "Almost gone" ? "ONLY " : ""}{item.portions} LEFT</span>}{unavailable && <span className="soldout-overlay">{status === "Expired" ? "Pickup ended" : "All rescued!"}</span>}</div>
      <div className="food-card-body"><div className="food-card-heading"><div><h3>{item.name}</h3><span className="food-outlet">{item.outlet}</span></div><button className="save-food" title="Save for later" onClick={(event) => { event.stopPropagation(); event.currentTarget.classList.toggle("saved"); }}><Heart size={17} /></button></div>
        <div className="food-price-line"><span className="rescue-price">{money(item.rescuePrice)}</span><del>{money(item.originalPrice)}</del><span className="portion-count">{item.portions} {item.portions === 1 ? "left" : "portions"}</span></div>
        <div className="food-card-footer"><span className={`deadline-label ${urgency.remaining < 60 * 60_000 ? "deadline-hot" : ""}`}><Clock3 size={13} />{urgency.label}</span><button className="card-arrow" disabled={unavailable} aria-label={`View ${item.name}`} onClick={(event) => { event.stopPropagation(); onSelect(item); }}><ArrowRight size={16} /></button></div>
      </div>
    </article>
  );
}

function ListingModal({ item, current, onClose, onReserve }) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => {
    const handler = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  const available = current?.portions ?? 0;
  const status = current ? listingStatus(current) : "Expired";
  const expired = status === "Expired";
  const soldOut = status === "Sold Out";
  const deadline = getDeadlineStatus(current?.deadline || item.deadline);
  const handleReserve = () => {
    if (!current || quantity > current.portions || quantity < 1 || expired || soldOut) {
      setError("This listing is no longer available in that quantity.");
      return;
    }
    onReserve(current, quantity);
  };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="detail-modal" role="dialog" aria-modal="true" aria-label={item.name}>
    <button className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
    <div className="detail-photo"><img src={item.image} alt={item.name} /><span className="detail-photo-label"><Leaf size={14} /> RESCUED FOOD, FULL OF GOODNESS</span></div>
    <div className="detail-content"><span className="detail-category">{item.category} <span>·</span> {item.outlet}</span><h2>{item.name}</h2><p className="detail-description">{item.description}</p>
      <div className="detail-price-row"><strong>{money(item.rescuePrice)}</strong><del>{money(item.originalPrice)}</del><span>{Math.round((1 - item.rescuePrice / item.originalPrice) * 100)}% off</span></div>
      <div className="detail-facts"><span><MapPin size={16} /><b>Pickup spot</b><small>{item.pickupLocation}</small></span><span><Clock3 size={16} /><b>Ready by</b><small>{shortDate(current?.deadline || item.deadline)}</small></span><span><ShoppingBag size={16} /><b>Available</b><small>{available} portions</small></span></div>
      <div className="dietary-tags">{(item.dietary || []).map((tag) => <span key={tag}><Leaf size={12} />{tag}</span>)}</div>
      <div className="detail-info-row"><span><b>Ingredients</b><small>{item.ingredients || "Ask the outlet for today's ingredients."}</small></span><span><b>Allergens</b><small>{item.allergens || "Please check with the outlet before pickup."}</small></span></div>
      <div className="handling-note"><ShieldCheck size={17} /><span>Prepared fresh today. Please collect by the listed pickup time and check with the outlet team about allergens.</span></div>
      <div className="reserve-controls"><div className="quantity-control"><button aria-label="Remove one portion" disabled={quantity <= 1} onClick={() => setQuantity((n) => Math.max(1, n - 1))}><Minus size={15} /></button><strong>{quantity}</strong><button aria-label="Add one portion" disabled={quantity >= available} onClick={() => setQuantity((n) => Math.min(available, n + 1))}><Plus size={15} /></button></div><span className="total-price"><small>Total at pickup</small><b>{money(item.rescuePrice * quantity)}</b></span><button className="button button-primary reserve-button" disabled={expired || soldOut || !current} onClick={handleReserve}>{expired ? "Pickup ended" : soldOut ? "All rescued" : "Reserve my food"}<ArrowRight size={17} /></button></div>
      {(expired || deadline.expired) && <p className="form-error">The pickup deadline has passed. This deal can no longer be reserved.</p>}
      {error && <p className="form-error">{error}</p>}
      {!expired && !soldOut && deadline.remaining < 60 * 60_000 && <p className="urgency-note"><Clock3 size={14} /> {deadline.label} — don't miss this rescue.</p>}
    </div>
  </div></div>;
}

function Reservations({ reservations, onUpdate, onPass }) {
  const [tab, setTab] = useState("All");
  const [details, setDetails] = useState(null);
  const tabs = ["All", "Active", "Collected", "Cancelled", "Expired"];
  const visible = reservations.filter((item) => {
    const status = item.status === "Active" && getDeadlineStatus(item.deadline).expired ? "Expired" : item.status;
    return tab === "All" || status === tab;
  });
  return <main className="page-shell reservations-page"><div className="page-intro"><span className="section-kicker">YOUR LITTLE WINS</span><h1>My <em>reservations.</em></h1><p>Your rescued food, all in one place. Don't forget to collect it fresh.</p></div>
    <div className="reservation-summary"><div><span className="summary-icon summary-orange"><TicketCheck size={19} /></span><span><b>{reservations.filter((item) => item.status === "Active" && !getDeadlineStatus(item.deadline).expired).length}</b><small>Ready to collect</small></span></div><div><span className="summary-icon summary-green"><Sprout size={19} /></span><span><b>{reservations.filter((item) => item.status === "Collected").reduce((n, item) => n + item.quantity, 0)}</b><small>Portions rescued</small></span></div><div><span className="summary-icon summary-yellow"><Heart size={19} /></span><span><b>{money(reservations.filter((item) => item.status === "Collected").reduce((n, item) => n + item.total, 0))}</b><small>Good food enjoyed</small></span></div></div>
    <div className="tabs-row">{tabs.map((item) => <button key={item} className={tab === item ? "tab-active" : ""} onClick={() => setTab(item)}>{item}<span>{item === "All" ? reservations.length : reservations.filter((reservation) => (reservation.status === "Active" && getDeadlineStatus(reservation.deadline).expired ? "Expired" : reservation.status) === item).length}</span></button>)}</div>
    {visible.length ? <div className="reservation-list">{visible.map((reservation) => {
      const status = reservation.status === "Active" && getDeadlineStatus(reservation.deadline).expired ? "Expired" : reservation.status;
      return <article className="reservation-card" key={reservation.id}><img src={reservation.image} alt="" /><div className="reservation-main"><div className="reservation-title"><h3>{reservation.itemName}</h3><span className={`status-pill status-${status.toLowerCase()}`}>{status}</span></div><span>{reservation.outlet} <i>·</i> {reservation.quantity} {reservation.quantity === 1 ? "portion" : "portions"}</span><div className="reservation-meta"><span><TicketCheck size={14} />{reservation.reference}</span><span><Clock3 size={14} />{shortDate(reservation.deadline)}</span></div></div><div className="reservation-amount"><small>Pay at pickup</small><b>{money(reservation.total)}</b><button onClick={() => setDetails(reservation)}>Details <ArrowRight size={14} /></button></div>{status === "Active" && <div className="reservation-actions"><button className="pass-button" onClick={() => onPass(reservation)}><TicketCheck size={15} /> Pickup pass</button><button className="cancel-button" onClick={() => onUpdate(reservation.id, "Cancelled")}>Cancel</button><button className="collect-button" onClick={() => onUpdate(reservation.id, "Collected")}>Mark collected</button></div>}</article>;
    })}</div> : <EmptyState title={tab === "All" ? "Your next good bite is out there" : `No ${tab.toLowerCase()} reservations`} text={tab === "All" ? "Find a fresh deal and reserve your first meal. The good stuff is waiting." : "Check back when you have more campus food to rescue."} action={() => window.location.assign("/")} actionLabel="Discover food" />}
    <div className="demo-disclaimer"><span className="demo-label"><span /> DEMO DATA</span> Reservation and payment details are simulated for this prototype. Pay at the outlet when you collect.</div>
    <Footer />
    {details && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDetails(null)}><div className="reservation-detail-modal"><button className="modal-close" onClick={() => setDetails(null)} aria-label="Close"><X size={19} /></button><img src={details.image} alt="" /><span className={`status-pill status-${details.status.toLowerCase()}`}>{details.status}</span><h2>{details.itemName}</h2><p>{details.outlet} · {details.quantity} portion{details.quantity > 1 ? "s" : ""}</p><div className="pass-details"><span>Reference <b>{details.reference}</b></span><span>Amount due <b>{money(details.total)}</b></span><span>Pickup at <b>{details.pickupLocation}</b></span><span>Pickup by <b>{shortDate(details.deadline)}</b></span></div>{details.status === "Active" && <button className="button button-primary" onClick={() => { setDetails(null); onPass(details); }}>Open pickup pass <ArrowRight size={16} /></button>}</div></div>}
  </main>;
}

function PickupPass({ reservation, onClose, onToast }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reservation.reference);
      onToast("Reservation reference copied.");
    } catch {
      onToast(`Your reservation reference is ${reservation.reference}`);
    }
  };
  return <div className="modal-backdrop pass-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="pickup-pass" role="dialog" aria-modal="true" aria-label="Digital pickup pass">
    <button className="modal-close" onClick={onClose} aria-label="Close pickup pass"><X size={19} /></button>
    <div className="pass-top"><Link to="/" className="brand pass-brand"><span className="brand-mark"><Leaf size={16} fill="currentColor" /></span><span>Campus<span className="brand-light">Pantry</span><small>GOOD FOOD, ANOTHER CHANCE</small></span></Link><span className="pass-demo">DEMO PASS</span></div>
    <img className="pass-food-image" src={reservation.image} alt={reservation.itemName} />
    <div className="pass-item"><span>YOUR RESCUED GOODNESS</span><h2>{reservation.itemName}</h2><p>{reservation.outlet}</p></div>
    <div className="pass-perforation"><i /><span>✦</span><i /></div>
    <div className="pass-grid"><span>COLLECT FOR<b>{reservation.student || "Aarav Sharma"}</b></span><span>PORTIONS<b>{reservation.quantity} × meal</b></span><span>AMOUNT DUE<b>{money(reservation.total)} at pickup</b></span><span>PICKUP BY<b>{shortDate(reservation.deadline)}</b></span></div>
    <div className="pass-location"><MapPin size={16} /><span><small>PICKUP LOCATION</small><b>{reservation.pickupLocation}</b></span></div>
    <div className="pass-code-row"><div className="qr-visual" aria-label="Decorative QR-style image">{Array.from({ length: 64 }, (_, i) => <i key={i} style={{ opacity: ((i * 13 + i * i) % 7) > 2 ? 1 : 0 }} />)}</div><div><small>RESERVATION REFERENCE</small><b>{reservation.reference}</b><span>Show this pass to the outlet team.</span></div><button className="icon-button" onClick={copy} aria-label="Copy reservation reference"><Copy size={17} /></button></div>
    <p className="pass-disclaimer">Demo only · This is not a payment or scannable collection credential. Pay at the outlet.</p>
    <div className="pass-actions"><button className="button button-primary" onClick={() => window.print()}><Printer size={16} /> Print pass</button><button className="button button-outline" onClick={copy}><Copy size={16} /> Copy reference</button></div>
  </div></div>;
}

function Impact({ listings, reservations }) {
  const portions = reservations.filter((item) => item.status === "Collected").reduce((total, item) => total + item.quantity, 0) + 128;
  const items = new Set(reservations.filter((item) => item.status === "Collected").map((item) => item.listingId)).size + 26;
  const students = new Set(reservations.map((item) => item.student)).size + 47;
  const activity = weekActivity.map((item, index) => ({ ...item, portions: item.portions + (index === 6 ? portions % 9 : 0) }));
  const rescuedValue = reservations.filter((item) => item.status === "Collected").reduce((sum, item) => sum + item.total, 0);
  return <main className="page-shell impact-page"><div className="impact-hero"><div><span className="section-kicker">GOOD FOOD, GOOD RIPPLE EFFECTS</span><h1>Every bite makes<br /><em>a difference.</em></h1><p>Small rescues add up. Here's a little snapshot of what our TIET community can do together.</p></div><span className="impact-hero-art"><Sprout size={69} /><i>✳</i></span></div>
    <div className="impact-stats-grid"><ImpactStat icon={<ShoppingBag size={19} />} value={`${portions}`} label="Portions rescued" tone="orange" /><ImpactStat icon={<Utensils size={19} />} value={`${items}`} label="Food items saved" tone="yellow" /><ImpactStat icon={<Heart size={19} />} value={`${students}`} label="Students taking part" tone="green" /><ImpactStat icon={<Leaf size={19} />} value={`~${(portions * 0.4).toFixed(1)} kg`} label="Estimated food saved" tone="peach" /></div>
    <div className="impact-content-grid"><section className="chart-card"><div className="chart-heading"><div><span className="section-kicker">THE WEEK IN RESCUES</span><h2>A little more good,<br />every day.</h2></div><span className="chart-period"><span className="live-dot" /> THIS WEEK</span></div><div className="impact-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activity} margin={{ top: 20, right: 12, left: -20, bottom: 0 }}><defs><linearGradient id="impactFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eee9e1" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#92887d", fontSize: 12 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#92887d", fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee9e1", fontFamily: "DM Sans" }} /><Area type="monotone" dataKey="portions" stroke="#ed9413" strokeWidth={3} fill="url(#impactFill)" activeDot={{ r: 6, fill: "#ed9413" }} /></AreaChart></ResponsiveContainer></div><div className="chart-caption"><span><span className="chart-legend-dot" />Portions rescued</span><span>Activity shown is illustrative demo data</span></div></section>
      <section className="impact-aside"><div className="impact-callout"><span className="impact-callout-icon"><Sprout size={21} /></span><span className="section-kicker">YOUR GOOD RIPPLE</span><h3>One small rescue.<br /><em>A lot less waste.</em></h3><p>Each portion rescued helps keep fresh, delicious food on a plate instead of in the bin.</p><span className="illustrative-note">Impact estimates are illustrative, not verified environmental measurements.</span></div><div className="saved-together"><span className="saved-emoji">✳</span><span><b>{money(rescuedValue + 6380)}</b><small>saved by students this week <i>· demo estimate</i></small></span><TrendingUp size={19} /></div></section></div>
    <section className="impact-cta"><div><span className="section-kicker">YOUR TURN, CAMPUS</span><h2>Make your next meal<br /><em>mean a little more.</em></h2></div><Link to="/" className="button button-primary">Find a rescue <ArrowRight size={16} /></Link></section><Footer />
  </main>;
}
function ImpactStat({ icon, value, label, tone }) { return <div className="impact-stat"><span className={`summary-icon summary-${tone}`}>{icon}</span><strong>{value}</strong><small>{label}</small><span className="stat-demo-dot">ILLUSTRATIVE</span></div>; }

function Manager({ listings, reservations, onUpdate, onSave, onRemove }) {
  const location = useLocation();
  const navigate = useNavigate();
  const page = location.pathname === "/manager/listings" ? "listings" : location.pathname === "/manager/reservations" ? "reservations" : "overview";
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const managerListings = listings.filter((item) => item.outlet === "Campus Café" || item.owner === "Campus Café");
  const outletListings = managerListings.length ? managerListings : listings.slice(0, 4);
  const outletReservations = reservations.filter((reservation) => outletListings.some((item) => item.id === reservation.listingId) || reservation.outlet === "Campus Café");
  const active = outletListings.filter((item) => listingStatus(item) === "Available" || listingStatus(item) === "Almost gone");
  const collected = outletReservations.filter((item) => item.status === "Collected");
  const shownListings = outletListings.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  const openForm = (listing = null) => { setEditing(listing); setFormOpen(true); };
  const submitForm = (draft) => { onSave({ ...draft, outlet: "Campus Café", owner: "Campus Café" }); setFormOpen(false); setEditing(null); };
  const toggleSold = (item) => onSave({ ...item, portions: item.portions > 0 ? 0 : 4 });

  return <main className="manager-shell">
    <div className="manager-welcome"><div><span className="section-kicker">OUTLET PARTNER PORTAL <span className="manager-live"><span className="live-dot" /> DEMO MODE</span></span><h1>A little surplus.<br /><em>A lot of good.</em></h1><p>Good afternoon, Campus Café team. Your rescued food is making a difference.</p></div><div className="manager-welcome-art"><span>✳</span><ChefHat size={47} /></div></div>
    <div className="manager-workspace"><aside className="manager-sidebar"><span className="sidebar-label">YOUR OUTLET</span><div className="outlet-identity"><span className="outlet-avatar"><ChefHat size={19} /></span><span><b>Campus Café</b><small>TIET · Main Campus</small></span><ChevronDown size={15} /></div><span className="sidebar-label sidebar-section-label">WORKSPACE</span><NavLink to="/manager" end className={({ isActive }) => `sidebar-link ${isActive && page === "overview" ? "sidebar-active" : ""}`}><TrendingUp size={17} />Overview</NavLink><NavLink to="/manager/listings" className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-active" : ""}`}><Utensils size={17} />My listings<span className="sidebar-count">{outletListings.length}</span></NavLink><NavLink to="/manager/reservations" className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-active" : ""}`}><TicketCheck size={17} />Reservations{outletReservations.some((item) => item.status === "Active") && <span className="sidebar-notice" />}</NavLink><div className="sidebar-note"><span><Sprout size={18} /></span><b>You're doing good.</b><small>Every listing is a meal someone can love.</small></div><Link className="sidebar-student-link" to="/"><ArrowLeft size={15} />Switch to student view</Link></aside>
    <section className="manager-content">
      {page === "overview" && <><div className="manager-page-heading"><div><span className="section-kicker">MONDAY, CAMPUS CAFÉ</span><h2>Your rescue overview</h2></div><button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> Add a listing</button></div>
        <div className="manager-stat-grid"><ManagerStat label="Active listings" value={active.length} note="Live on student menu" icon={<Utensils size={18} />} tone="orange" /><ManagerStat label="Portions available" value={active.reduce((sum, item) => sum + item.portions, 0)} note="Ready for a new home" icon={<ShoppingBag size={18} />} tone="yellow" /><ManagerStat label="Portions collected" value={collected.reduce((sum, item) => sum + item.quantity, 0) + 12} note="This week's good work" icon={<CheckCircle2 size={18} />} tone="green" /><ManagerStat label="Rescue revenue" value={money(collected.reduce((sum, item) => sum + item.total, 0) + 1840)} note="Simulated · paid at pickup" icon={<TrendingUp size={18} />} tone="peach" /></div>
        <div className="manager-overview-grid"><section className="manager-panel activity-panel"><div className="manager-panel-heading"><span><b>Rescue activity</b><small>Portions claimed this week</small></span><span className="chart-period"><span className="live-dot" /> THIS WEEK</span></div><div className="manager-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekActivity} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="#f0ece5" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#92887d", fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#92887d", fontSize: 10 }} /><Tooltip cursor={{ fill: "#fff8ed" }} contentStyle={{ borderRadius: 12, border: "1px solid #eee9e1" }} /><Bar dataKey="portions" fill="#f3a229" radius={[6, 6, 0, 0]} maxBarSize={32} /></BarChart></ResponsiveContainer></div></section>
        <section className="manager-panel popular-panel"><div className="manager-panel-heading"><span><b>On the menu</b><small>Your current food rescues</small></span><button className="text-button" onClick={() => navigate("/manager/listings")}>See all <ArrowRight size={14} /></button></div><div className="popular-list">{outletListings.slice(0, 4).map((item) => <div className="popular-row" key={item.id}><img src={item.image} alt="" /><span><b>{item.name}</b><small>{item.portions} portions left · {money(item.rescuePrice)}</small></span><span className={`tiny-status ${listingStatus(item) === "Expired" ? "tiny-expired" : ""}`}>{listingStatus(item)}</span></div>)}</div></section></div>
        <section className="manager-panel recent-panel"><div className="manager-panel-heading"><span><b>Recent reservations</b><small>Pickup is payment — thanks for keeping it simple.</small></span><button className="text-button" onClick={() => navigate("/manager/reservations")}>All reservations <ArrowRight size={14} /></button></div><ManagerReservationRows reservations={outletReservations.slice(0, 4)} onUpdate={onUpdate} /></section>
      </>}
      {page === "listings" && <><div className="manager-page-heading"><div><span className="section-kicker">MAKE SURPLUS SOMEBODY'S LUNCH</span><h2>Manage your listings</h2><p>Keep today's menu fresh. Students see changes right away.</p></div><button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> Add a listing</button></div><div className="listing-manager-toolbar"><span>{outletListings.length} listings <i>·</i> shared with student view</span><label className="manager-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a listing..." /></label></div><div className="manage-listing-table"><div className="table-head"><span>FOOD ITEM</span><span>PRICE</span><span>PORTIONS</span><span>PICKUP BY</span><span>STATUS</span><span>ACTIONS</span></div>{shownListings.map((item) => <div className="table-row" key={item.id}><span className="table-food"><img src={item.image} alt="" /><span><b>{item.name}</b><small>{item.category}</small></span></span><span><b>{money(item.rescuePrice)}</b><del>{money(item.originalPrice)}</del></span><span>{item.portions}</span><span>{shortDate(item.deadline)}</span><span><span className={`status-pill status-${listingStatus(item).toLowerCase().replace(" ", "-")}`}>{listingStatus(item)}</span></span><span className="table-actions"><button onClick={() => openForm(item)} aria-label={`Edit ${item.name}`}>Edit</button><button title={item.portions ? "Mark sold out" : "Restock portions"} onClick={() => toggleSold(item)}>{item.portions ? "Sold out" : "Restock"}</button><button className="remove-button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button></span></div>)}{!shownListings.length && <EmptyState title="Nothing on the menu" text="Add a listing to share good food with campus." action={() => openForm()} actionLabel="Create a listing" />}</div></>}
      {page === "reservations" && <><div className="manager-page-heading"><div><span className="section-kicker">THE GOOD FOOD IS WAITING</span><h2>Pickup reservations</h2><p>Confirm collections and help rescued food find its next home.</p></div></div><div className="manager-reservation-summary"><span><b>{outletReservations.filter((item) => item.status === "Active" && !getDeadlineStatus(item.deadline).expired).length}</b> ready for pickup</span><span><b>{outletReservations.filter((item) => item.status === "Collected").length}</b> collected</span><span><b>{outletReservations.filter((item) => item.status === "Cancelled").length}</b> cancelled</span></div><section className="manager-panel reservations-panel"><div className="manager-panel-heading"><span><b>All reservations</b><small>Demo student orders for Campus Café and your outlet listings.</small></span><span className="demo-label"><span /> SIMULATED</span></div><ManagerReservationRows reservations={outletReservations} onUpdate={onUpdate} showAll /></section></>}
      <div className="manager-disclaimer"><ShieldCheck size={15} /> Demo outlet portal · listings, pickup and revenue are simulated and stored on this device.</div>
    </section></div>
    <Footer />
    {formOpen && <ListingForm initial={editing} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={submitForm} />}
  </main>;
}

function ManagerStat({ label, value, note, icon, tone }) { return <div className="manager-stat"><span className={`summary-icon summary-${tone}`}>{icon}</span><small>{label}</small><strong>{value}</strong><span>{note}</span></div>; }

function ManagerReservationRows({ reservations, onUpdate, showAll = false }) {
  return reservations.length ? <div className="manager-reservation-list">{reservations.slice(0, showAll ? undefined : 5).map((reservation) => {
    const status = reservation.status === "Active" && getDeadlineStatus(reservation.deadline).expired ? "Expired" : reservation.status;
    return <div className="manager-reservation-row" key={reservation.id}><img src={reservation.image} alt="" /><span className="manager-reservation-food"><b>{reservation.itemName}</b><small>{reservation.student} · {reservation.quantity} portion{reservation.quantity > 1 ? "s" : ""}</small></span><span className="manager-reservation-ref">{reservation.reference}</span><span className={`status-pill status-${status.toLowerCase()}`}>{status}</span><span className="manager-reservation-total">{money(reservation.total)}</span>{status === "Active" && <button className="collect-button manager-collect" onClick={() => onUpdate(reservation.id, "Collected")}><Check size={14} /> Collected</button>}</div>;
  })}</div> : <EmptyState title="No pickups just yet" text="New student reservations will show up here." />;
}

function ListingForm({ initial, onClose, onSave }) {
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => initial ? { ...initial } : {
    name: "", category: "Quick Meals", description: "", originalPrice: "", rescuePrice: "", portions: "",
    pickupLocation: "Campus Café, Main Campus", deadline: "", image: "", ingredients: "", allergens: "", dietary: [],
  });
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = (event) => {
    event.preventDefault();
    const originalPrice = Number(form.originalPrice);
    const rescuePrice = Number(form.rescuePrice);
    const portions = Number(form.portions);
    if (!form.name.trim() || !form.deadline || new Date(form.deadline).getTime() <= Date.now()) {
      setError("Add a food name and a pickup deadline in the future.");
      return;
    }
    if (!Number.isFinite(originalPrice) || originalPrice <= 0 || !Number.isFinite(rescuePrice) || rescuePrice <= 0 || rescuePrice > originalPrice) {
      setError("Prices must be positive, and the rescue price cannot exceed the original price.");
      return;
    }
    if (!Number.isInteger(portions) || portions < 0) {
      setError("Enter a whole number of portions (zero marks the listing sold out).");
      return;
    }
    onSave({ ...form, originalPrice, rescuePrice, portions, image: form.image || "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=960&q=85", deadline: new Date(form.deadline).toISOString(), dietary: Array.isArray(form.dietary) ? form.dietary : [] });
  };
  const dateValue = form.deadline ? toLocalDateTimeInput(form.deadline) : "";
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="listing-form-modal" onSubmit={save}><div className="form-modal-heading"><div><span className="section-kicker">GOOD FOOD, COMING RIGHT UP</span><h2>{initial ? "Edit your listing" : "Add a food listing"}</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button></div><p>Share surplus while it's still fresh. Students will see this listing right away.</p><div className="form-grid"><label className="full-field">Food name<input required value={form.name} onChange={(event) => change("name", event.target.value)} placeholder="e.g. Grilled vegetable sandwich" /></label><label>Category<select value={form.category} onChange={(event) => change("category", event.target.value)}>{categories.filter((item) => item !== "All Food").map((item) => <option key={item}>{item}</option>)}</select></label><label>Available portions<input type="number" min="0" step="1" required value={form.portions} onChange={(event) => change("portions", event.target.value)} placeholder="e.g. 4" /></label><label>Original price (₹)<input type="number" min="1" step="1" required value={form.originalPrice} onChange={(event) => change("originalPrice", event.target.value)} placeholder="100" /></label><label>Rescue price (₹)<input type="number" min="1" step="1" required value={form.rescuePrice} onChange={(event) => change("rescuePrice", event.target.value)} placeholder="50" /></label><label className="full-field">Pickup deadline<input type="datetime-local" required value={dateValue} onChange={(event) => change("deadline", event.target.value)} /></label><label className="full-field">Pickup location<input required value={form.pickupLocation} onChange={(event) => change("pickupLocation", event.target.value)} /></label><label className="full-field">Food image URL <span className="optional">(optional)</span><input value={form.image} onChange={(event) => change("image", event.target.value)} placeholder="Paste an image URL or leave blank for a demo photo" /></label><label className="full-field">Description<textarea rows="2" value={form.description} onChange={(event) => change("description", event.target.value)} placeholder="A few appetising details..." /></label><label>Ingredients<input value={form.ingredients} onChange={(event) => change("ingredients", event.target.value)} placeholder="e.g. seasonal vegetables" /></label><label>Allergen information<input value={form.allergens} onChange={(event) => change("allergens", event.target.value)} placeholder="e.g. gluten, dairy" /></label><label className="full-field">Dietary tags <span className="optional">(comma separated)</span><input value={(form.dietary || []).join(", ")} onChange={(event) => change("dietary", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="Vegetarian, Vegan..." /></label></div>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button className="button button-primary"><Check size={16} />{initial ? "Save changes" : "Publish listing"}</button></div></form></div>;
}

function EmptyState({ title, text, action, actionLabel }) {
  return <div className="empty-state"><span className="empty-state-icon"><Sprout size={24} /></span><h3>{title}</h3><p>{text}</p>{action && <button className="button button-outline" onClick={action}>{actionLabel || "Try again"} <ArrowRight size={15} /></button>}</div>;
}

function Footer() {
  return <footer className="site-footer"><Link to="/" className="brand footer-brand"><span className="brand-mark"><Leaf size={16} fill="currentColor" /></span><span>Campus<span className="brand-light">Pantry</span><small>GOOD FOOD, ANOTHER CHANCE</small></span></Link><span>Made with a little love (and less waste) at TIET.</span><span className="footer-demo"><span className="live-dot" /> Prototype · Demo data</span></footer>;
}

export default App;
