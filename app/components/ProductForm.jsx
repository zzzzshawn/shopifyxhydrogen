import {Link, useNavigate} from '@remix-run/react';
import {useAside} from './Aside';
import {CartForm} from '@shopify/hydrogen';
import {ChevronLeft} from 'lucide-react';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 * }}
 */
export function ProductForm({productOptions, selectedVariant, setShowForm}) {
  const navigate = useNavigate();
  const {open} = useAside();

  // Function to handle adding the selected variant to the cart
  const handleAddToCart = (variant) => {
    if (variant && variant.availableForSale) {
      // Open the cart aside
      open('cart');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <div className=" w-[80%] mx-auto" key={option.name}>
            <h5 className="text-center w-full relative">
              {option.name}
              <ChevronLeft
                onClick={() => setShowForm(false)}
                className="w-5 h-5 cursor-pointer absolute right-0 top-1/2 -translate-y-1/2"
              />
            </h5>
            <div className=" flex items-center justify-between">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                // Ensure no size is selected by default
                const isSelected = false; // Force no default selection

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className="product-options-item"
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{
                        border: isSelected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <CartForm
                      route="/cart"
                      inputs={{
                        lines: [
                          {
                            merchandiseId: selectedVariant?.id,
                            quantity: 1,
                          },
                        ],
                      }}
                      action={CartForm.ACTIONS.LinesAdd}
                      key={option.name + name}
                    >
                      {(fetcher) => (
                        <button
                          type="submit"
                          className={`product-options-item${
                            exists && !isSelected ? ' link' : ''
                          }`}
                          style={{
                            border: isSelected
                              ? '1px solid black'
                              : '1px solid transparent',
                            opacity: available ? 1 : 0.3,
                          }}
                          disabled={!exists || fetcher.state !== 'idle'}
                          onClick={() => {
                            if (!isSelected) {
                              navigate(`?${variantUriQuery}`, {
                                replace: true,
                                preventScrollReset: true,
                              });
                              // Call the handleAddToCart function to open the cart aside
                              handleAddToCart(selectedVariant);
                            }
                          }}
                        >
                          <ProductOptionSwatch swatch={swatch} name={name} />
                        </button>
                      )}
                    </CartForm>
                  );
                }
              })}
            </div>
            <br />
          </div>
        );
      })}
    </div>
  );
}

/**
 * @param {{
 *   swatch?: Maybe<ProductOptionValueSwatch> | undefined;
 *   name: string;
 * }}
 */
function ProductOptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="product-option-label-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
