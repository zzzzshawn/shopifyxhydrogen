import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context}) {
  const {products} = await context.storefront.query(ALL_PRODUCTS_QUERY);

  return {
    allProducts: products.edges.map((edge) => edge.node),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  const allProducts = context.storefront
    .query(ALL_PRODUCTS_QUERY)
    .then((response) => response.products.edges.map((edge) => edge.node))
    .catch((error) => {
      console.error(error);
      return null;
    });

  return {
    allProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData();
  console.log(data); // Check the structure of the data here

  return (
    <div className="home">
      <AllProducts products={data.allProducts} />
    </div>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
function AllProducts({products}) {
  return (
    <div className="p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5 sm:gap-4">
              {response
                ? response.map((product) => (
                    <Link
                      key={product.id}
                      className="group flex flex-col items-center overflow-hidden "
                      to={`/products/${product.handle}`}
                    >
                      <div className="w-full aspect-square overflow-hidden">
                        {product.images.edges.length > 0 && (
                          <Image
                            data={product.images.edges[0].node}
                            className="w-full h-full object-cover border border-black/20"
                            sizes='(min-width: 45em) 400px, 100vw'
                            aspectRatio="1/1"
                          />
                        )}
                      </div>
                      <h4 className="mt-2 text-xs lg:text-sm font-light text-center line-clamp-1">
                        {product.title}
                      </h4>
                      
                    </Link>
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts {
    products(first: 100) {
      edges {
        node {
          id
          title
          description
          handle
          variants(first: 1) {
            edges {
              node {
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
