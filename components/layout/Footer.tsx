export function Footer() {
  return (
    <footer className="border-t border-neutral-200 mt-12 py-10 text-sm bg-neutral-50">
      <div className="container mx-auto px-4 grid gap-8 md:grid-cols-4">
        <div>
          <h3 className="font-semibold mb-3">Help & Information</h3>
          <ul className="space-y-1 text-neutral-600">
            <li>Help</li>
            <li>Track order</li>
            <li>Delivery & returns</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">About Us</h3>
          <ul className="space-y-1 text-neutral-600">
            <li>About</li>
            <li>Careers</li>
            <li>Investors</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">More From Us</h3>
          <ul className="space-y-1 text-neutral-600">
            <li>Mobile apps</li>
            <li>Marketplace</li>
            <li>Gift vouchers</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Shopping</h3>
          <ul className="space-y-1 text-neutral-600">
            <li>Women</li>
            <li>Men</li>
            <li>Outlet</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-neutral-500">
          &copy; {new Date().getFullYear()} DYOFFICIALLETTE. Independent demo project
          not affiliated with ASOS.
        </p>
        <div className="flex gap-4 text-xs text-neutral-500">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Cookies</span>
        </div>
      </div>
    </footer>
  );
}
