import {Suspense, useEffect, useState} from 'react';
import {Await, NavLink, useAsyncValue} from '@remix-run/react';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {ChevronRight, Menu, ShoppingBag} from 'lucide-react';

/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  const {menu} = header;
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  useEffect(() => {
    if (menuOpen) {
      const header = document.getElementById('main-header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    }

    return () => {
      setHeaderHeight(0);
    };
  }, [menuOpen]);

  return (
    <>
      {/* Spacer div that pushes content down */}
      <div className="sm:hidden" style={{height: headerHeight}} />

      {/* Main header */}
      <header
        id="main-header"
        className={`z-40 bg-white w-full flex flex-col items-center justify-between px-5 font-mono fixed top-0`}
      >
        <div className="flex items-center justify-between w-full h-12">
          <div className="flex items-center justify-center gap-5">
            <div
              className="cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setMenuOpen(!menuOpen);
                }
              }}
              tabIndex={0}
              role="button"
            >
              {!menuOpen ? (
                <Menu className="size-6" />
              ) : (
                <ChevronRight className="size-6" />
              )}
            </div>
            {menuOpen && (
              <div className="max-sm:hidden">
                <HeaderMenu
                  menu={menu}
                  viewport="desktop"
                  primaryDomainUrl={header.shop.primaryDomain.url}
                  publicStoreDomain={publicStoreDomain}
                />
              </div>
            )}
          </div>
          <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
        </div>
        {menuOpen && (
          <div className="sm:hidden w-full max-sm:pb-5 px-2">
            <div>
              <HeaderMenu
                menu={menu}
                viewport="desktop"
                primaryDomainUrl={header.shop.primaryDomain.url}
                publicStoreDomain={publicStoreDomain}
              />
            </div>
          </div>
        )}
      </header>
      {menuOpen && (
        <div
          className="fixed inset-0 bg-transparent z-30 sm:hidden"
          style={{top: headerHeight}}
          onClick={() => setMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setMenuOpen(false);
            }
          }}
          tabIndex={0}
          role="button"
        />
      )}
    </>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const {close} = useAside();

  return (
    <nav className={`flex sm:gap-7 max-sm:flex-col gap-3`} role="navigation">
      {viewport === 'mobile' && (
        <NavLink end onClick={close} prefetch="intent" to="/">
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="uppercase hover:no-underline"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({isLoggedIn, cart}) {
  return (
    <nav className="" role="navigation">
      {/* <HeaderMenuMobileToggle />
      <NavLink prefetch="intent" to="/account">
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
          </Await>
        </Suspense>
      </NavLink> */}
      {/* <SearchToggle /> */}
      <CartToggle cart={cart} />
    </nav>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button className="reset" onClick={() => open('search')}>
      Search
    </button>
  );
}

/**
 * @param {{count: number | null}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      Cart {count === null ? <span>&nbsp;</span> : count}
    </a>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  const {open} = useAside();
  return (
    <div
      className="flex items-center gap-1 cursor-pointer"
      onClick={() => open('cart')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          open('cart');
        }
      }}
      tabIndex={0}
      role="button"
    >
      <ShoppingBag className="size-5" />
      <p>{cart?.totalQuantity ?? 0}</p>
    </div>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
