import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Bell, ChevronRight, Copy, CreditCard, Gift, Heart, Home, MapPin, Menu, Minus, PackageCheck, Plus, Search, ShoppingBag, ShoppingCart, Sparkles, Star, Trash2, User, Wallet, X, Check, Clock3, Info, LogOut, ShieldCheck, Settings, Globe, Instagram, Mail, Phone, CircleDashed, MapPinned
} from 'lucide-react';
import { CONTACT_INFO, LANGUAGES, PRODUCTS, VOUCHERS, defaultAddresses, defaultProfile, notificationList } from './data/config';
import { readStorage, writeStorage } from './utils/storage';

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

const APP_NAV_ITEMS = [
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Menu', to: '/menu/makanan', icon: Menu },
  { label: 'Cart', to: '/cart', icon: ShoppingBag },
  { label: 'Profile', to: '/profil', icon: User },
];

const defaultPreferences = {
  language: 'id',
  orderNotifications: true,
  promoNotifications: true,
  selectedAppearance: 'light',
};

const getSelectedAddress = (addresses, selectedId) => addresses.find((item) => item.id === selectedId) || addresses[0];

const getProductById = (id) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => readStorage('elena_auth', false));
  const [profile, setProfile] = useState(() => readStorage('elena_profile', defaultProfile));
  const [addresses, setAddresses] = useState(() => readStorage('elena_addresses', defaultAddresses));
  const [selectedAddressId, setSelectedAddressId] = useState(() => readStorage('elena_selectedAddressId', defaultAddresses[0].id));
  const [cart, setCart] = useState(() => readStorage('elena_cart', []));
  const [favorites, setFavorites] = useState(() => readStorage('elena_favorites', []));
  const [selectedVoucher, setSelectedVoucher] = useState(() => readStorage('elena_selectedVoucher', null));
  const [paymentMethod, setPaymentMethod] = useState(() => readStorage('elena_paymentMethod', 'QRIS'));
  const [orders, setOrders] = useState(() => readStorage('elena_orders', []));
  const [preferences, setPreferences] = useState(() => readStorage('elena_preferences', defaultPreferences));
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState(notificationList);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => writeStorage('elena_auth', isLoggedIn), [isLoggedIn]);
  useEffect(() => writeStorage('elena_profile', profile), [profile]);
  useEffect(() => writeStorage('elena_addresses', addresses), [addresses]);
  useEffect(() => writeStorage('elena_selectedAddressId', selectedAddressId), [selectedAddressId]);
  useEffect(() => writeStorage('elena_cart', cart), [cart]);
  useEffect(() => writeStorage('elena_favorites', favorites), [favorites]);
  useEffect(() => writeStorage('elena_selectedVoucher', selectedVoucher), [selectedVoucher]);
  useEffect(() => writeStorage('elena_paymentMethod', paymentMethod), [paymentMethod]);
  useEffect(() => writeStorage('elena_orders', orders), [orders]);
  useEffect(() => writeStorage('elena_preferences', preferences), [preferences]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const addToCart = (product, size = 'Reguler', quantity = 1, note = '') => {
    const itemPrice = product.basePrice + (size === 'Large' ? product.largeExtraPrice : 0);
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id && item.size === size && item.note === note);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id && item.size === size && item.note === note
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...current, { productId: product.id, size, quantity, note, effectiveUnitPrice: itemPrice }];
    });
    setToast({ type: 'success', message: `${product.name} ditambahkan ke keranjang` });
  };

  const updateCartQuantity = (productId, size, delta) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.productId !== productId || item.size !== size) return item;
          const nextQty = item.quantity + delta;
          return nextQty <= 0 ? null : { ...item, quantity: nextQty };
        })
        .filter(Boolean)
    );
  };

  const removeCartItem = (productId, size) => {
    setCart((current) => current.filter((item) => !(item.productId === productId && item.size === size)));
    setToast({ type: 'success', message: 'Item dihapus dari keranjang' });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.effectiveUnitPrice * item.quantity, 0);
  const shippingFee = cart.length ? 10000 : 0;
  const voucherDiscount = selectedVoucher ? computeVoucherDiscount(selectedVoucher, subtotal, shippingFee) : 0;
  const total = Math.max(subtotal + shippingFee - voucherDiscount, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (!isLoggedIn) {
      setToast({ type: 'error', message: 'Silakan masuk terlebih dahulu' });
      return;
    }
    if (!cart.length) {
      setToast({ type: 'error', message: 'Keranjang masih kosong' });
      return;
    }
    if (!selectedAddressId || !addresses.length) {
      setToast({ type: 'error', message: 'Alamat pengiriman belum tersedia' });
      return;
    }
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setToast({ type: 'success', message: 'Berhasil keluar' });
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="app-preview">
          <AppRoutes
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            profile={profile}
            setProfile={setProfile}
            cart={cart}
            setCart={setCart}
            addToCart={addToCart}
            updateCartQuantity={updateCartQuantity}
            removeCartItem={removeCartItem}
            addresses={addresses}
            setAddresses={setAddresses}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            favorites={favorites}
            setFavorites={setFavorites}
            selectedVoucher={selectedVoucher}
            setSelectedVoucher={setSelectedVoucher}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            orders={orders}
            setOrders={setOrders}
            preferences={preferences}
            setPreferences={setPreferences}
            subtotal={subtotal}
            shippingFee={shippingFee}
            voucherDiscount={voucherDiscount}
            total={total}
            cartCount={cartCount}
            handleCheckout={handleCheckout}
            logout={logout}
            toast={toast}
            setToast={setToast}
            notifications={notifications}
            setNotifications={setNotifications}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            noticeOpen={noticeOpen}
            setNoticeOpen={setNoticeOpen}
          />
          {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
      </div>
    </BrowserRouter>
  );
}

function AppRoutes(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, setIsLoggedIn, profile, setProfile, cart, setCart, addToCart, updateCartQuantity, removeCartItem, addresses, setAddresses, selectedAddressId, setSelectedAddressId, favorites, setFavorites, selectedVoucher, setSelectedVoucher, paymentMethod, setPaymentMethod, orders, setOrders, preferences, setPreferences, subtotal, shippingFee, voucherDiscount, total, cartCount, handleCheckout, logout, toast, setToast, notifications, setNotifications, menuOpen, setMenuOpen, noticeOpen, setNoticeOpen } = props;

  useEffect(() => {
    if (!isLoggedIn && ['/home', '/menu/makanan', '/menu/minuman', '/produk', '/cart', '/review-pesanan', '/metode-pembayaran', '/pembayaran', '/status-pembayaran', '/status-pesanan', '/alamat', '/alamat-tersimpan', '/voucher', '/pilih-voucher', '/profil', '/edit-profil', '/pengaturan', '/bahasa', '/about', '/media', '/contact', '/syarat-ketentuan', '/kebijakan-privasi'].includes(location.pathname)) {
      navigate('/login');
    }
  }, [isLoggedIn, location.pathname, navigate]);

  const selectedAddress = getSelectedAddress(addresses, selectedAddressId) || addresses[0];

  return (
    <>
      {menuOpen && <MobileMenuOverlay onClose={() => setMenuOpen(false)} />}
      {noticeOpen && <NotificationPanel notifications={notifications} onClose={() => setNoticeOpen(false)} />}
      <Routes>
        <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setToast={setToast} />} />
        <Route path="/register" element={<RegisterPage setIsLoggedIn={setIsLoggedIn} setToast={setToast} />} />
        <Route path="/home" element={<HomePage setMenuOpen={setMenuOpen} setNoticeOpen={setNoticeOpen} setToast={setToast} />} />
        <Route path="/menu/makanan" element={<MenuPage type="food" setMenuOpen={setMenuOpen} setNoticeOpen={setNoticeOpen} addToCart={addToCart} setToast={setToast} />} />
        <Route path="/menu/minuman" element={<MenuPage type="drink" setMenuOpen={setMenuOpen} setNoticeOpen={setNoticeOpen} addToCart={addToCart} setToast={setToast} />} />
        <Route path="/produk/:id" element={<ProductDetailPage addToCart={addToCart} favorites={favorites} setFavorites={setFavorites} setToast={setToast} />} />
        <Route path="/cart" element={<CartPage cart={cart} updateCartQuantity={updateCartQuantity} removeCartItem={removeCartItem} subtotal={subtotal} shippingFee={shippingFee} voucherDiscount={voucherDiscount} total={total} selectedVoucher={selectedVoucher} setSelectedVoucher={setSelectedVoucher} setToast={setToast} />} />
        <Route path="/review-pesanan" element={<ReviewOrderPage cart={cart} subtotal={subtotal} shippingFee={shippingFee} voucherDiscount={voucherDiscount} total={total} addresses={addresses} selectedAddressId={selectedAddressId} setSelectedAddressId={setSelectedAddressId} selectedVoucher={selectedVoucher} setSelectedVoucher={setSelectedVoucher} setToast={setToast} />} />
        <Route path="/metode-pembayaran" element={<PaymentMethodPage paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} total={total} setToast={setToast} />} />
        <Route path="/pembayaran" element={<PaymentQRPage total={total} paymentMethod={paymentMethod} setToast={setToast} />} />
        <Route path="/status-pembayaran" element={<PaymentStatusPage total={total} paymentMethod={paymentMethod} setToast={setToast} />} />
        <Route path="/pesanan-berhasil" element={<OrderSuccessPage total={total} paymentMethod={paymentMethod} />} />
        <Route path="/status-pesanan" element={<OrderStatusPage orders={orders} />} />
        <Route path="/alamat" element={<AddressPage addresses={addresses} setAddresses={setAddresses} selectedAddressId={selectedAddressId} setSelectedAddressId={setSelectedAddressId} setToast={setToast} />} />
        <Route path="/alamat-tersimpan" element={<SavedAddressesPage addresses={addresses} setAddresses={setAddresses} selectedAddressId={selectedAddressId} setSelectedAddressId={setSelectedAddressId} setToast={setToast} />} />
        <Route path="/voucher" element={<PromoVoucherPage setToast={setToast} />} />
        <Route path="/pilih-voucher" element={<SelectVoucherPage selectedVoucher={selectedVoucher} setSelectedVoucher={setSelectedVoucher} setToast={setToast} />} />
        <Route path="/profil" element={<ProfilePage profile={profile} logout={logout} setToast={setToast} />} />
        <Route path="/edit-profil" element={<EditProfilePage profile={profile} setProfile={setProfile} setToast={setToast} />} />
        <Route path="/pengaturan" element={<SettingsPage preferences={preferences} setPreferences={setPreferences} />} />
        <Route path="/bahasa" element={<LanguagePage preferences={preferences} setPreferences={setPreferences} setToast={setToast} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/syarat-ketentuan" element={<TermsPage />} />
        <Route path="/kebijakan-privasi" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to={isLoggedIn ? '/home' : '/login'} replace />} />
      </Routes>
    </>
  );
}

function LoginPage({ setIsLoggedIn, setToast }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setToast({ type: 'error', message: 'Isi email dan kata sandi terlebih dahulu' });
      return;
    }
    setIsLoggedIn(true);
    setToast({ type: 'success', message: 'Berhasil masuk' });
    navigate('/home');
  };

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="brand-block">
          <div className="brand-logo">ELENA LUNCHBOX</div>
          <div className="brand-tagline">Pesan Makanan Dengan Mudah Dan Nyaman</div>
        </div>

        <div className="segmented-tabs">
          <button className={`tab-pill ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); navigate('/login'); }}>Masuk</button>
          <button className={`tab-pill ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); navigate('/register'); }}>Daftar</button>
        </div>

        <form className="auth-card" onSubmit={onSubmit}>
          <label className="field-label">Email atau Nomor Handphone</label>
          <input className="text-input" type="text" placeholder="Contoh: user@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="field-label">Kata Sandi</label>
          <div className="password-input-wrap">
            <input className="text-input" type={showPassword ? 'text' : 'password'} placeholder="Masukkan kata sandi" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="icon-button small" aria-label="Toggle password" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          <button type="button" className="text-link" onClick={() => navigate('/register')}>Lupa Password?</button>
          <button className="primary-button full" type="submit">Masuk</button>
        </form>

        <div className="divider-line"><span>Atau masuk dengan</span></div>
        <div className="social-row">
          <button className="secondary-button social-button" onClick={() => setToast({ type: 'info', message: 'Autentikasi eksternal belum diintegrasikan' })}>Google</button>
          <button className="secondary-button social-button" onClick={() => setToast({ type: 'info', message: 'Autentikasi eksternal belum diintegrasikan' })}>Apple</button>
        </div>
      </div>
    </div>
  );
}

function RegisterPage({ setIsLoggedIn, setToast }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setToast({ type: 'error', message: 'Lengkapi semua data pendaftaran' });
      return;
    }
    setIsLoggedIn(true);
    setToast({ type: 'success', message: 'Akun berhasil dibuat' });
    navigate('/home');
  };

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="brand-block">
          <div className="brand-logo">ELENA LUNCHBOX</div>
          <div className="brand-tagline">Pesan Makanan Dengan Mudah Dan Nyaman</div>
        </div>

        <div className="segmented-tabs">
          <button className="tab-pill" onClick={() => navigate('/login')}>Masuk</button>
          <button className="tab-pill active" onClick={() => navigate('/register')}>Daftar</button>
        </div>

        <form className="auth-card" onSubmit={onSubmit}>
          <label className="field-label">Nama</label>
          <input className="text-input" type="text" placeholder="Masukkan nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label className="field-label">Email atau Nomor Handphone</label>
          <input className="text-input" type="text" placeholder="Contoh: user@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <label className="field-label">Kata Sandi</label>
          <div className="password-input-wrap">
            <input className="text-input" type={showPassword ? 'text' : 'password'} placeholder="Buat kata sandi" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="icon-button small" aria-label="Toggle password" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          <button className="primary-button full" type="submit">Daftar</button>
        </form>

        <div className="divider-line"><span>Atau daftar dengan</span></div>
        <div className="social-row">
          <button className="secondary-button social-button" onClick={() => setToast({ type: 'info', message: 'Autentikasi eksternal belum diintegrasikan' })}>Google</button>
          <button className="secondary-button social-button" onClick={() => setToast({ type: 'info', message: 'Autentikasi eksternal belum diintegrasikan' })}>Apple</button>
        </div>
      </div>
    </div>
  );
}

function HomePage({ setMenuOpen, setNoticeOpen, setToast }) {
  const navigate = useNavigate();
  const bestSeller = PRODUCTS.slice(0, 4);

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Home" leftIcon={<button className="icon-button" aria-label="Menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>} rightIcon={<button className="icon-button" aria-label="Notifications" onClick={() => setNoticeOpen(true)}><Bell size={20} /></button>} />
      <div className="content-area surface-light">
        <div className="welcome-block">
          <h1 className="welcome-title">Selamat Datang</h1>
          <p className="muted-copy">Selamat datang di Elena Lunchbox, pesan makanan dan minuman di sini</p>
        </div>

        <button className="primary-button large" onClick={() => navigate('/menu/makanan')}>Pesan Sekarang</button>

        <h2 className="section-heading centered">Best Seller</h2>
        <div className="best-seller-grid">
          {bestSeller.map((product) => (
            <div key={product.id} className="best-seller-item" onClick={() => navigate(`/produk/${product.id}`)}>
              <img src={product.image} alt={product.name} className="best-seller-image" />
              <div className="best-seller-name">{product.name}</div>
            </div>
          ))}
        </div>
      </div>

      <FooterHome />
      <BottomNav active="Home" />
    </div>
  );
}

function MenuPage({ type, setMenuOpen, setNoticeOpen, addToCart, setToast }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const navigate = useNavigate();

  const categoryList = ['Semua', 'Appetizer', 'Main Course', 'Dessert'];
  const filtered = PRODUCTS.filter((p) => p.type === type).filter((product) => {
    const matchesText = `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory;
    return matchesText && matchesCategory;
  });

  return (
    <div className="page-shell with-bottom-nav">
      <Header title={type === 'food' ? 'Menu Makanan' : 'Menu Minuman'} leftIcon={<button className="icon-button" aria-label="Menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>} rightIcon={<button className="icon-button" aria-label="Notifications" onClick={() => setNoticeOpen(true)}><Bell size={20} /></button>} />
      <div className="content-area no-padding-top">
        <div className="sticky-bar search-bar-wrap">
          <Search className="search-icon" size={16} />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari menu favoritmu..." />
        </div>
        <div className="category-scroll sticky-bar">
          {categoryList.map((cat) => (
            <button key={cat} className={`category-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
          ))}
        </div>

        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onClick={() => navigate(`/produk/${product.id}`)} onAdd={(p) => { addToCart(p); setToast({ type: 'success', message: `${p.name} ditambahkan` }); }} />
          ))}
        </div>
      </div>
      <BottomNav active="Menu" />
    </div>
  );
}

function ProductDetailPage({ addToCart, favorites, setFavorites, setToast }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const product = getProductById(id);
  const [size, setSize] = useState('Reguler');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [liked, setLiked] = useState(favorites.includes(product.id));

  useEffect(() => {
    setLiked(favorites.includes(product.id));
  }, [favorites, product.id]);

  const unitPrice = product.basePrice + (size === 'Large' ? product.largeExtraPrice : 0);
  const totalPrice = unitPrice * quantity;

  const toggleFavorite = () => {
    setFavorites((current) => {
      const next = current.includes(product.id) ? current.filter((item) => item !== product.id) : [...current, product.id];
      return next;
    });
    setLiked((value) => !value);
    setToast({ type: 'success', message: liked ? 'Favorit dihapus' : 'Favorit ditambahkan' });
  };

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Detail Menu" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/menu/makanan')}><ArrowLeft size={20} /></button>} rightIcon={<button className="icon-button" aria-label="Favorite" onClick={toggleFavorite}><Heart size={20} fill={liked ? '#050505' : 'none'} /></button>} />
      <div className="content-area detail-content">
        <img src={product.image} alt={product.name} className="detail-image" />
        <div className="product-header-row">
          <h2>{product.name}</h2>
          <div className="price-tag">{formatCurrency(unitPrice)}</div>
        </div>
        <div className="rating-row">
          <Star size={14} fill="#050505" />
          <span>{product.rating}</span>
          <span className="muted-copy">({product.ratingCount} ulasan)</span>
        </div>
        <p className="muted-copy detail-description">{product.description}</p>

        <div className="divider-line inline" />

        <div className="option-block">
          <h4>Ukuran Porsi</h4>
          <div className="option-group">
            <button className={`option-button ${size === 'Reguler' ? 'selected' : ''}`} onClick={() => setSize('Reguler')}>Reguler</button>
            <button className={`option-button ${size === 'Large' ? 'selected' : ''}`} onClick={() => setSize('Large')}>Large (+{formatCurrency(product.largeExtraPrice)})</button>
          </div>
        </div>

        <div className="detail-qty-row">
          <span>Jumlah Pesanan</span>
          <div className="qty-stepper compact">
            <button className="stepper-button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={14} /></button>
            <span>{quantity}</span>
            <button className="stepper-button black" onClick={() => setQuantity((q) => q + 1)}><Plus size={14} /></button>
          </div>
        </div>

        <div className="option-block notes-block">
          <label className="field-label">Catatan Tambahan</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional: tanpa pedas, extra bawang..." />
        </div>
      </div>

      <div className="sticky-bottom-bar">
        <div className="checkout-meta">
          <small>Total</small>
          <strong>{formatCurrency(totalPrice)}</strong>
        </div>
        <button className="primary-button" onClick={() => { addToCart(product, size, quantity, note); navigate('/cart'); }}>+ Keranjang</button>
      </div>
      <BottomNav active="Menu" />
    </div>
  );
}

function CartPage({ cart, updateCartQuantity, removeCartItem, subtotal, shippingFee, voucherDiscount, total, selectedVoucher, setSelectedVoucher, setToast }) {
  const navigate = useNavigate();

  if (!cart.length) {
    return (
      <div className="page-shell with-bottom-nav">
        <Header title="Keranjang" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/menu/makanan')}><ArrowLeft size={20} /></button>} rightIcon={<button className="icon-button" aria-label="Notifications" onClick={() => navigate('/home')}><Bell size={20} /></button>} />
        <div className="content-area empty-state-panel">
          <div className="empty-bag">🛍️</div>
          <div className="empty-title">Keranjang kamu masih kosong</div>
          <button className="primary-button" onClick={() => navigate('/menu/makanan')}>Lihat Menu</button>
        </div>
        <BottomNav active="Cart" />
      </div>
    );
  }

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Keranjang" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/menu/makanan')}><ArrowLeft size={20} /></button>} rightIcon={<button className="icon-button" aria-label="Notifications" onClick={() => navigate('/home')}><Bell size={20} /></button>} />
      <div className="content-area cart-body">
        <div className="cart-items-list">
          {cart.map((item) => {
            const product = getProductById(item.productId);
            return (
              <div className="cart-item-row" key={`${item.productId}-${item.size}`}>
                <img src={product.image} alt={product.name} className="cart-thumb" />
                <div className="cart-item-content">
                  <div className="cart-item-head">
                    <div>
                      <div className="product-name">{product.name}</div>
                      <div className="muted-copy small">{item.size} · {item.note || 'Tanpa catatan'}</div>
                    </div>
                    <button className="icon-button" onClick={() => removeCartItem(item.productId, item.size)}><Trash2 size={16} /></button>
                  </div>
                  <div className="cart-item-foot">
                    <div className="price-tag">{formatCurrency(item.effectiveUnitPrice * item.quantity)}</div>
                    <div className="qty-stepper mini">
                      <button className="stepper-button" onClick={() => updateCartQuantity(item.productId, item.size, -1)}><Minus size={12} /></button>
                      <span>{item.quantity}</span>
                      <button className="stepper-button black" onClick={() => updateCartQuantity(item.productId, item.size, 1)}><Plus size={12} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="voucher-row">
          <input className="text-input small-input" placeholder="Ketik kode promo..." />
          <button className="primary-button small-button">Terapkan</button>
        </div>

        <div className="summary-box">
          <div className="summary-line"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
          <div className="summary-line"><span>Diskon Voucher</span><strong>-{formatCurrency(voucherDiscount)}</strong></div>
          <div className="summary-line"><span>Ongkos Kirim</span><strong>{formatCurrency(shippingFee)}</strong></div>
          <div className="summary-line total"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
        </div>
      </div>

      <div className="sticky-bottom-bar compact">
        <div className="checkout-meta">
          <small>TOTAL ORDER</small>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <button className="primary-button" onClick={() => { if (selectedVoucher) setSelectedVoucher(selectedVoucher); navigate('/review-pesanan'); }}>Lanjut Pembayaran</button>
      </div>
      <BottomNav active="Cart" />
    </div>
  );
}

function ReviewOrderPage({ cart, subtotal, shippingFee, voucherDiscount, total, addresses, selectedAddressId, setSelectedAddressId, selectedVoucher, setSelectedVoucher, setToast }) {
  const navigate = useNavigate();
  const selectedAddress = getSelectedAddress(addresses, selectedAddressId) || addresses[0];

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Review Pesanan" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/cart')}><ArrowLeft size={20} /></button>} />
      <div className="content-area review-body">
        <div className="section-block">
          <h3>Menu Yang Dipesan</h3>
          {cart.map((item) => {
            const product = getProductById(item.productId);
            return (
              <div key={`${item.productId}-${item.size}`} className="review-item-row">
                <img src={product.image} alt={product.name} className="review-thumb" />
                <div className="review-item-info">
                  <div className="product-name">{product.name}</div>
                  <div className="muted-copy small">{item.size} · Qty {item.quantity}</div>
                </div>
                <div className="price-tag">{formatCurrency(item.effectiveUnitPrice * item.quantity)}</div>
              </div>
            );
          })}
        </div>

        <div className="section-block">
          <h3>Alamat Pengantaran</h3>
          <div className="address-card" onClick={() => navigate('/alamat-tersimpan')}>
            <MapPin size={16} />
            <div>
              <strong>{selectedAddress?.type === 'office' ? 'Kantor' : 'Rumah Utama'}</strong>
              <div className="muted-copy small">{selectedAddress?.fullAddress || 'Alamat belum diisi'}</div>
            </div>
            <div className="map-preview-mini" />
          </div>
        </div>

        <div className="section-block">
          <h3>Promo Terpasang</h3>
          <div className="voucher-box dashed">
            <Gift size={14} />
            <span>{selectedVoucher ? selectedVoucher.title : 'Belum ada voucher dipakai'}</span>
            <strong>{selectedVoucher ? `-${formatCurrency(selectedVoucher.value)}` : 'Rp 0'}</strong>
          </div>
        </div>

        <div className="summary-box">
          <div className="summary-line"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
          <div className="summary-line"><span>Diskon Voucher</span><strong>-{formatCurrency(voucherDiscount)}</strong></div>
          <div className="summary-line"><span>Ongkos Kirim</span><strong>{formatCurrency(shippingFee)}</strong></div>
          <div className="summary-line total"><span>Total Pembayaran</span><strong>{formatCurrency(total)}</strong></div>
        </div>
      </div>

      <div className="sticky-bottom-bar compact">
        <div className="checkout-meta">
          <small>Total Bayar</small>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <button className="primary-button" onClick={() => navigate('/metode-pembayaran')}>Pilih Pembayaran</button>
      </div>
      <BottomNav active="Cart" />
    </div>
  );
}

function PaymentMethodPage({ paymentMethod, setPaymentMethod, total }) {
  const navigate = useNavigate();

  const methods = [
    { group: 'E-Wallet', items: ['GoPay', 'ShopeePay', 'OVO'] },
    { group: 'Transfer Bank (Virtual Account)', items: ['BCA Virtual Account', 'Mandiri Virtual Account', 'BNI Virtual Account'] },
    { group: 'Instant QRIS', items: ['QRIS (E-Wallet / M-Banking)'] },
  ];

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Metode Pembayaran" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/review-pesanan')}><ArrowLeft size={20} /></button>} />
      <div className="content-area payment-methods">
        {methods.map((group) => (
          <div key={group.group} className="method-group">
            <h4>{group.group}</h4>
            {group.items.map((item) => (
              <button key={item} className={`method-item ${paymentMethod === item ? 'selected' : ''}`} onClick={() => setPaymentMethod(item)}>
                <div className="method-left">
                  <span className="method-icon"><Wallet size={16} /></span>
                  <span>{item}</span>
                </div>
                <span className={`radio-dot ${paymentMethod === item ? 'checked' : ''}`}></span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="sticky-bottom-bar compact">
        <div className="checkout-meta">
          <small>Total Bayar</small>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <button className="primary-button" onClick={() => navigate('/pembayaran')}>Bayar Sekarang</button>
      </div>
      <BottomNav active="Cart" />
    </div>
  );
}

function PaymentQRPage({ total, paymentMethod, setToast }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(39);
  const paymentCode = 'ELENA-QR-732541';

  useEffect(() => {
    const timer = setInterval(() => setCountdown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(paymentCode);
      setToast({ type: 'success', message: 'Kode pembayaran berhasil disalin' });
    } catch {
      setToast({ type: 'info', message: 'Salin manual: ELENA-QR-732541' });
    }
  };

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Pembayaran QRIS" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/metode-pembayaran')}><ArrowLeft size={20} /></button>} />
      <div className="content-area payment-qr-body">
        <div className="text-center">
          <div className="muted-copy">Jumlah Tagihan</div>
          <h2 className="amount-large">{formatCurrency(total)}</h2>
          <div className="tiny-alert"><Clock3 size={14} /> {countdown}s</div>
        </div>

        <div className="qr-demo-wrap">
          <div className="qr-box">QR DEMO - TIDAK DAPAT DIGUNAKAN MEMBAYAR</div>
        </div>

        <div className="copy-code-row">
          <button className="secondary-button full" onClick={copyCode}>Salin Kode Pembayaran</button>
        </div>
        <div className="demo-code">{paymentCode}</div>

        <div className="instruction-card">
          <h4>Petunjuk Pembayaran:</h4>
          <ol>
            <li>Buka aplikasi mobile banking atau e-wallet.</li>
            <li>Pilih menu scan QRIS dan pindai QR di atas.</li>
            <li>Konfirmasi jumlah dan lanjutkan pembayaran.</li>
          </ol>
        </div>

        <button className="primary-button full" onClick={() => navigate('/status-pembayaran')}>Sudah Bayar? Cek Status</button>
      </div>
      <BottomNav active="Cart" />
    </div>
  );
}

function PaymentStatusPage({ total, paymentMethod, setToast }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Status Pembayaran" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/pembayaran')}><ArrowLeft size={20} /></button>} />
      <div className="content-area status-page">
        <div className={`status-icon ${status}`}>{status === 'success' ? '✓' : status === 'failed' ? '!' : '•'}</div>
        <div className="status-title">{status === 'success' ? 'Pembayaran Berhasil' : status === 'failed' ? 'Pembayaran Gagal' : 'Menunggu Pembayaran'}</div>
        <div className="status-meta">Metode: {paymentMethod}</div>
        <div className="status-meta">Referensi: ELENA-INV-2026-001</div>
        <div className="status-meta">Jumlah: {formatCurrency(total)}</div>
        <div className="status-meta">Waktu: 11 Oktober 2026, 18:42</div>

        <div className="action-stack">
          <button className="secondary-button full" onClick={() => { setStatus('success'); setToast({ type: 'success', message: 'Simulasi pembayaran berhasil' }); }}>Simulasikan Pembayaran Berhasil</button>
          <button className="secondary-button full" onClick={() => { setStatus('failed'); setToast({ type: 'error', message: 'Simulasi pembayaran gagal' }); }}>Simulasikan Pembayaran Gagal</button>
          <button className="primary-button full" onClick={() => { if (status === 'success') navigate('/pesanan-berhasil'); else navigate('/pembayaran'); }}>Lanjutkan</button>
        </div>
      </div>
      <BottomNav active="Cart" />
    </div>
  );
}

function OrderSuccessPage({ total, paymentMethod }) {
  const navigate = useNavigate();

  return (
    <div className="success-page">
      <div className="success-circle">✓</div>
      <h1>Pesanan Berhasil</h1>
      <p>Makanan Anda sedang kami siapkan dan segera diantar.</p>

      <div className="summary-box success-summary">
        <div className="summary-line"><span>ID Pesanan</span><strong>#EL-1048</strong></div>
        <div className="summary-line"><span>Metode Pembayaran</span><strong>{paymentMethod}</strong></div>
        <div className="summary-line"><span>Estimasi Tiba</span><strong>15-20 menit</strong></div>
        <div className="summary-line"><span>Total Dibayarkan</span><strong>{formatCurrency(total)}</strong></div>
      </div>

      <div className="stack-buttons">
        <button className="primary-button full" onClick={() => navigate('/status-pesanan')}>Lacak Pesanan</button>
        <button className="secondary-button full" onClick={() => navigate('/menu/makanan')}>Kembali ke Menu</button>
      </div>
    </div>
  );
}

function OrderStatusPage({ orders }) {
  const navigate = useNavigate();
  const lastOrder = orders[0] || { id: '#EL-1048', total: 131000 };

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Status Pemesanan" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/pesanan-berhasil')}><ArrowLeft size={20} /></button>} />
      <div className="content-area order-status-area">
        <div className="order-summary-card">
          <div className="muted-copy">Nomor Pesanan</div>
          <strong>{lastOrder.id || '#EL-1048'}</strong>
          <div className="muted-copy">Total: {formatCurrency(lastOrder.total || 131000)}</div>
        </div>

        <div className="timeline-card">
          <div className="timeline-item done">
            <span className="timeline-dot"></span>
            <div>
              <strong>Pesanan Sedang Dibuat</strong>
              <p>Pesananmu sedang dipersiapkan.</p>
            </div>
          </div>
          <div className="timeline-item active">
            <span className="timeline-dot"></span>
            <div>
              <strong>Menuju Perjalanan</strong>
              <p>Kurir sedang menuju lokasimu.</p>
            </div>
          </div>
          <div className="timeline-item upcoming">
            <span className="timeline-dot"></span>
            <div>
              <strong>Pesanan Sudah Sampai</strong>
              <p>Pesanan telah sampai di lokasi.</p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="Cart" />
    </div>
  );
}

function AddressPage({ addresses, setAddresses, selectedAddressId, setSelectedAddressId, setToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: 'home', name: '', phone: '', address: '', detail: '', deliveryMode: 'now' });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const saveAddress = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setToast({ type: 'error', message: 'Lengkapi semua data alamat' });
      return;
    }
    const newAddress = {
      id: `adr-${Date.now()}`,
      type: form.type,
      label: form.type === 'office' ? 'Kantor' : 'Rumah Utama',
      recipient: form.name,
      phone: form.phone,
      fullAddress: form.address,
      details: form.detail,
      isPrimary: addresses.length === 0,
      deliveryMode: form.deliveryMode,
      scheduledDate: date,
      scheduledTime: time,
    };
    const next = [...addresses, newAddress];
    setAddresses(next);
    setSelectedAddressId(newAddress.id);
    setToast({ type: 'success', message: 'Alamat tersimpan' });
    navigate('/review-pesanan');
  };

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Alamat Pengantaran" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/review-pesanan')}><ArrowLeft size={20} /></button>} rightIcon={<button className="icon-button" aria-label="Notifications" onClick={() => navigate('/home')}><Bell size={20} /></button>} />
      <div className="content-area address-form-body">
        <div className="map-preview-card">
          <div className="map-placeholder">📍</div>
        </div>

        <div className="address-toggle-row">
          <button className={`option-button ${form.type === 'home' ? 'selected' : ''}`} onClick={() => setForm({ ...form, type: 'home' })}>Rumah Utama</button>
          <button className={`option-button ${form.type === 'office' ? 'selected' : ''}`} onClick={() => setForm({ ...form, type: 'office' })}>Kantor</button>
        </div>

        <div className="field-stack">
          <label className="field-label">Nama Penerima</label>
          <input className="text-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="field-label">Nomor HP Penerima</label>
          <input className="text-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="field-label">Alamat Lengkap</label>
          <input className="text-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <label className="field-label">Detail Tambahan (Lantai/Unit)</label>
          <input className="text-input" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
        </div>

        <div className="delivery-mode-row">
          <button className={`option-button ${form.deliveryMode === 'now' ? 'selected' : ''}`} onClick={() => setForm({ ...form, deliveryMode: 'now' })}>Sekarang (Sesaat Lagi)</button>
          <button className={`option-button ${form.deliveryMode === 'schedule' ? 'selected' : ''}`} onClick={() => setForm({ ...form, deliveryMode: 'schedule' })}>Jadwalkan Pengiriman</button>
        </div>

        {form.deliveryMode === 'schedule' && (
          <div className="field-stack schedule-stack">
            <label className="field-label">Tanggal</label>
            <input type="date" className="text-input" value={date} onChange={(e) => setDate(e.target.value)} />
            <label className="field-label">Waktu</label>
            <input type="time" className="text-input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        )}

        <button className="primary-button full" onClick={saveAddress}>Konfirmasi Alamat</button>
      </div>
      <BottomNav active="Cart" />
    </div>
  );
}

function SavedAddressesPage({ addresses, setAddresses, selectedAddressId, setSelectedAddressId, setToast }) {
  const navigate = useNavigate();
  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Alamat Tersimpan" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/review-pesanan')}><ArrowLeft size={20} /></button>} rightIcon={<button className="icon-button" aria-label="Notifications" onClick={() => navigate('/home')}><Bell size={20} /></button>} />
      <div className="content-area list-area">
        {addresses.map((addr) => (
          <div key={addr.id} className={`address-list-card ${selectedAddressId === addr.id ? 'selected' : ''}`} onClick={() => setSelectedAddressId(addr.id)}>
            <div className="address-row-top">
              <strong>{addr.label}</strong>
              {addr.isPrimary && <span className="mini-tag">Alamat Utama</span>}
            </div>
            <div className="muted-copy small">{addr.recipient} · {addr.phone}</div>
            <div className="muted-copy small">{addr.fullAddress}</div>
            <div className="address-actions">
              <button className="text-link small" onClick={() => navigate('/alamat')}>Edit</button>
              <button className="text-link small danger" onClick={() => { setAddresses((current) => current.filter((item) => item.id !== addr.id)); setToast({ type: 'success', message: 'Alamat dihapus' }); }}>Hapus</button>
            </div>
          </div>
        ))}
        <button className="primary-button full" onClick={() => navigate('/alamat')}>Tambah Alamat</button>
      </div>
      <BottomNav active="Cart" />
    </div>
  );
}

function PromoVoucherPage({ setToast }) {
  const navigate = useNavigate();
  const vouchers = VOUCHERS;

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Promo & Voucher" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/profil')}><ArrowLeft size={20} /></button>} rightIcon={<button className="icon-button" aria-label="Notifications" onClick={() => navigate('/home')}><Bell size={20} /></button>} />
      <div className="content-area">
        <h3 className="section-heading">Voucher Tersedia</h3>
        {vouchers.map((voucher) => (
          <div key={voucher.id} className="voucher-box coupon-box">
            <div>
              <div className="mini-tag">{voucher.code}</div>
              <strong>{voucher.title}</strong>
              <div className="muted-copy small">Min. {formatCurrency(voucher.minSpend)} · Berlaku hingga {voucher.expiry}</div>
            </div>
            <button className="primary-button small-button" onClick={() => { navigate('/pilih-voucher'); setToast({ type: 'success', message: 'Voucher dipilih' }); }}>Pakai</button>
          </div>
        ))}
      </div>
      <BottomNav active="Profile" />
    </div>
  );
}

function SelectVoucherPage({ selectedVoucher, setSelectedVoucher, setToast }) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');

  const apply = () => {
    const found = VOUCHERS.find((v) => v.code.toLowerCase() === input.trim().toLowerCase());
    if (!found) {
      setFeedback('Kode voucher tidak valid');
      setToast({ type: 'error', message: 'Voucher tidak valid' });
      return;
    }
    setSelectedVoucher(found);
    setFeedback(`Voucher ${found.code} berhasil diterapkan`);
    setToast({ type: 'success', message: `Voucher ${found.code} diterapkan` });
  };

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Pilih Voucher" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/cart')}><ArrowLeft size={20} /></button>} rightIcon={<button className="icon-button" aria-label="Notifications" onClick={() => navigate('/home')}><Bell size={20} /></button>} />
      <div className="content-area list-area">
        <div className="inline-code-field">
          <input className="text-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Masukkan kode voucher" />
          <button className="primary-button small-button" onClick={apply}>Cek</button>
        </div>
        {feedback && <div className="info-banner">{feedback}</div>}

        <h3 className="section-heading">Voucher Saya</h3>
        {VOUCHERS.map((voucher) => (
          <button key={voucher.id} className={`voucher-card ${selectedVoucher?.id === voucher.id ? 'selected' : ''}`} onClick={() => setSelectedVoucher(voucher)}>
            <div>
              <strong>{voucher.title}</strong>
              <div className="muted-copy small">{voucher.code} · Min. {formatCurrency(voucher.minSpend)}</div>
            </div>
            <span className="radio-dot selected"></span>
          </button>
        ))}

        <button className="primary-button full" onClick={() => navigate('/cart')}>Terapkan Voucher</button>
      </div>
      <BottomNav active="Cart" />
    </div>
  );
}

function ProfilePage({ profile, logout, setToast }) {
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Pesanan Saya', action: () => navigate('/status-pesanan') },
    { label: 'Alamat Tersimpan', action: () => navigate('/alamat-tersimpan') },
    { label: 'Voucher Saya', action: () => navigate('/voucher') },
    { label: 'Pengaturan', action: () => navigate('/pengaturan') },
    { label: 'Pilihan Bahasa', action: () => navigate('/bahasa') },
    { label: 'Pusat Bantuan & CS', action: () => navigate('/contact') },
    { label: 'Syarat & Ketentuan', action: () => navigate('/syarat-ketentuan') },
    { label: 'Kebijakan Privasi', action: () => navigate('/kebijakan-privasi') },
  ];

  return (
    <div className="page-shell with-bottom-nav">
      <div className="content-area profile-page">
        <div className="profile-card">
          <div className="avatar-circle">{profile.name?.charAt(0) || 'E'}</div>
          <div className="profile-meta">
            <div className="profile-name">{profile.name}</div>
            <div className="muted-copy small">{profile.email}</div>
            <button className="text-link small" onClick={() => navigate('/edit-profil')}>Edit Profil</button>
          </div>
        </div>

        <div className="profile-list">
          {menuItems.map((item) => (
            <div className="profile-row" key={item.label} onClick={item.action}>
              <div className="profile-row-main">
                <span className="row-icon"><User size={16} /></span>
                <span>{item.label}</span>
              </div>
              <ChevronRight size={16} />
            </div>
          ))}
        </div>

        <button className="logout-button" onClick={() => { logout(); navigate('/login'); }}><LogOut size={16} /> Keluar Akun</button>
      </div>
      <BottomNav active="Profile" />
    </div>
  );
}

function EditProfilePage({ profile, setProfile, setToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(profile);

  const save = () => {
    setProfile(form);
    setToast({ type: 'success', message: 'Profil berhasil diperbarui' });
    navigate('/profil');
  };

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Edit Profil" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/profil')}><ArrowLeft size={20} /></button>} />
      <div className="content-area">
        <div className="field-stack">
          <label className="field-label">Nama</label>
          <input className="text-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="field-label">Gmail/Email</label>
          <input className="text-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="field-label">Nomor Telepon</label>
          <input className="text-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="field-label">Gender</label>
          <select className="text-input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
        <button className="primary-button full" onClick={save}>Simpan Perubahan</button>
      </div>
      <BottomNav active="Profile" />
    </div>
  );
}

function SettingsPage({ preferences, setPreferences }) {
  const toggle = (key) => setPreferences((p) => ({ ...p, [key]: !p[key] }));
  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Pengaturan" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => window.history.back()}><ArrowLeft size={20} /></button>} />
      <div className="content-area settings-list">
        <div className="settings-group">
          <div className="settings-row">
            <span>Notifikasi pesanan</span>
            <button className={`switch ${preferences.orderNotifications ? 'on' : ''}`} onClick={() => toggle('orderNotifications')}><span /></button>
          </div>
          <div className="settings-row">
            <span>Notifikasi promo</span>
            <button className={`switch ${preferences.promoNotifications ? 'on' : ''}`} onClick={() => toggle('promoNotifications')}><span /></button>
          </div>
          <div className="settings-row">
            <span>Bahasa</span>
            <span className="muted-copy">Indonesia</span>
          </div>
        </div>
      </div>
      <BottomNav active="Profile" />
    </div>
  );
}

function LanguagePage({ preferences, setPreferences, setToast }) {
  const [query, setQuery] = useState('');
  const filtered = LANGUAGES.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 60);

  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Pilihan Bahasa" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => window.history.back()}><ArrowLeft size={20} /></button>} />
      <div className="content-area list-area">
        <input className="text-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari bahasa" />
        <div className="language-list">
          {filtered.map((language) => (
            <button key={language.code} className={`language-item ${preferences.language === language.code ? 'selected' : ''}`} onClick={() => { setPreferences((p) => ({ ...p, language: language.code })); setToast({ type: 'success', message: `${language.name} dipilih` }); }}>
              <span>{language.name}</span>
              {language.code === 'id' && <span className="mini-tag">Bahasa utama</span>}
              <span className="radio-dot selected"></span>
            </button>
          ))}
        </div>
      </div>
      <BottomNav active="Profile" />
    </div>
  );
}

function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="page-shell with-bottom-nav">
      <Header title="About Us" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/home')}><ArrowLeft size={20} /></button>} />
      <div className="content-area text-page">
        <p>Elena Lunchbox adalah brand kuliner praktis yang menghadirkan menu sehat, cepat, dan cocok untuk gaya hidup modern. Kami fokus pada cita rasa yang konsisten, kemasan yang rapi, dan pengalaman pemesanan yang simpel untuk pelanggan di semua usia.</p>
        <img className="full-image-card" src="https://images.unsplash.com/..." alt="Café" />
        <ul className="bullet-list">
          <li>Menu yang dibuat dengan bahan pilihan.</li>
          <li>Rasa tetap konsisten setiap hari.</li>
          <li>Delivery cepat dan layanan ramah.</li>
        </ul>
      </div>
      <BottomNav active="Home" />
    </div>
  );
}

function MediaPage() {
  const navigate = useNavigate();
  const media = [
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/...',
    'https://images.unsplash.com/...',
  ];
  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Media" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/home')}><ArrowLeft size={20} /></button>} />
      <div className="content-area gallery-grid">
        {media.map((url, index) => (
          <img key={index} src={url} alt={`Media ${index + 1}`} className="gallery-image" />
        ))}
      </div>
      <BottomNav active="Home" />
    </div>
  );
}

function ContactPage() {
  const navigate = useNavigate();
  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Contact" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/home')}><ArrowLeft size={20} /></button>} />
      <div className="content-area text-page">
        <div className="contact-card"><Phone size={16} /> {CONTACT_INFO.phone || 'Kontak belum dikonfigurasi'}</div>
        <div className="contact-card"><Mail size={16} /> {CONTACT_INFO.email || 'Kontak belum dikonfigurasi'}</div>
        <div className="contact-card"><Instagram size={16} /> {CONTACT_INFO.instagram || '@elenalunchbox'}</div>
        <div className="contact-card"><MapPin size={16} /> Jatisari, Tanjungsari, Sumedang Regency, West Java 45362</div>
      </div>
      <BottomNav active="Home" />
    </div>
  );
}

function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Syarat & Ketentuan" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/profil')}><ArrowLeft size={20} /></button>} />
      <div className="content-area text-page long-text">
        <h4>1. Akun</h4><p>Pengguna wajib menjaga keamanan akun dan data pribadi.</p>
        <h4>2. Pemesanan</h4><p>Pesanan dibuat dalam prototipe demo dan dapat berubah sesuai stock dan ketersediaan.</p>
        <h4>3. Harga</h4><p>Harga berlaku sesuai menu yang dipilih dan dapat diubah tanpa pemberitahuan sebelumnya.</p>
        <h4>4. Pembayaran</h4><p>Pembayaran bersifat simulasi, bukan integrasi gateway real-time.</p>
        <h4>5. Pengantaran</h4><p>Estimasi tiba berdasarkan simulasi dan dapat berubah tergantung kondisi pengiriman.</p>
      </div>
      <BottomNav active="Profile" />
    </div>
  );
}

function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="page-shell with-bottom-nav">
      <Header title="Kebijakan Privasi" leftIcon={<button className="icon-button" aria-label="Back" onClick={() => navigate('/profil')}><ArrowLeft size={20} /></button>} />
      <div className="content-area text-page long-text">
        <h4>Data yang dikumpulkan</h4><p>Nama, email, nomor telepon, alamat, preferensi pesanan, data keranjang dan voucher.</p>
        <h4>Penggunaan data</h4><p>Data dipakai untuk memproses pesanan, memberi notifikasi, dan memperbarui profil pengguna.</p>
        <h4>Penimpanan</h4><p>Versi demo menyimpan data di browser/localStorage dan belum memiliki database server.</p>
        <h4>Keamanan</h4><p>Belum ada jaminan keamanan atau kepatuhan hukum yang belum dibuktikan untuk implementasi demo ini.</p>
      </div>
      <BottomNav active="Profile" />
    </div>
  );
}

function FooterHome() {
  return (
    <div className="footer-home">
      <div className="footer-brand">Elena Lunchbox</div>
      <div className="footer-follow-row">
        <h4>Follow Us @Elenalunchbox</h4>
        <Instagram size={18} />
      </div>
      <div className="gallery-grid compact">
        {Array.from({ length: 9 }).map((_, idx) => (
          <img key={idx} src={`https://images.unsplash.com/...`} alt="Elena Lunchbox gallery" className="gallery-image" />
        ))}
      </div>
      <div className="location-block">
        <h4>Lokasi Kami</h4>
        <img src="https://images.unsplash.com/..." alt="Lokasi Elena Lunchbox" className="location-image" />
        <div className="location-name">Elena Lunchbox Cafe</div>
        <div className="muted-copy small">Jatisari, Tanjungsari, Sumedang Regency, West Java 45362</div>
      </div>
      <div className="contact-item"><Phone size={14} /> {CONTACT_INFO.phone || 'Kontak belum dikonfigurasi'}</div>
      <div className="contact-item"><Mail size={14} /> {CONTACT_INFO.email || 'Kontak belum dikonfigurasi'}</div>
      <div className="contact-item"><Instagram size={14} /> {CONTACT_INFO.instagram || '@elenalunchbox'}</div>
      <div className="copyright">© 2026 Elena Lunchbox</div>
    </div>
  );
}

function BottomNav({ active }) {
  return (
    <nav className="bottom-nav">
      {APP_NAV_ITEMS.map(({ label, to, icon: Icon }) => (
        <Link to={to} key={label} className={`nav-item ${active === label ? 'active' : ''}`}>
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Header({ leftIcon, title, rightIcon }) {
  return (
    <header className="app-header">
      <div className="header-left">{leftIcon}</div>
      <div className="header-title">{title}</div>
      <div className="header-right">{rightIcon}</div>
    </header>
  );
}

function ProductCard({ product, onClick, onAdd }) {
  return (
    <div className="product-card" onClick={onClick} role="button" tabIndex={0}>
      <img src={product.image} alt={product.name} className="product-image" loading="lazy" />
      <div className="product-info-row">
        <div>
          <div className="product-name">{product.name}</div>
          <div className="price-tag">{formatCurrency(product.basePrice)}</div>
        </div>
        <button className="add-button" onClick={(e) => { e.stopPropagation(); onAdd(product); }} aria-label={`Tambah ${product.name}`}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function MobileMenuOverlay({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="menu-panel-header">
          <strong>Menu</strong>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="menu-list">
          <button onClick={() => { navigate('/profil'); onClose(); }}>Profil</button>
          <button onClick={() => { navigate('/about'); onClose(); }}>About Us</button>
          <button onClick={() => { navigate('/media'); onClose(); }}>Media/Instagram</button>
          <button onClick={() => { navigate('/contact'); onClose(); }}>Contact</button>
          <button onClick={() => { navigate('/voucher'); onClose(); }}>Promo & Voucher</button>
          <button onClick={() => { navigate('/bahasa'); onClose(); }}>Bahasa Indonesia</button>
          <button onClick={() => { navigate('/bahasa'); onClose(); }}>English</button>
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({ notifications, onClose }) {
  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="menu-panel-header">
          <strong>Notifikasi</strong>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="notification-list">
          {notifications.map((item) => (
            <div key={item.id} className={`notification-item ${item.unread ? 'unread' : ''}`}>
              <div className="notification-icon">{item.icon}</div>
              <div>
                <strong>{item.title}</strong>
                <div className="muted-copy small">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return <div className={`toast ${type || 'success'}`}>{message}</div>;
}

function computeVoucherDiscount(voucher, subtotal, shippingFee) {
  if (!voucher) return 0;
  if (subtotal < voucher.minSpend) return 0;
  if (voucher.type === 'fixed') return Math.min(voucher.value, subtotal);
  if (voucher.type === 'percentage') return Math.min(voucher.value * subtotal / 100, voucher.maxDiscount || subtotal);
  if (voucher.type === 'freeShipping') return shippingFee;
  return 0;
}

export default App;
