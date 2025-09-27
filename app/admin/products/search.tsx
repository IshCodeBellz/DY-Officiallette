import { Suspense } from "react";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ProductsSearchClient = require("./searchClient").default as any;

export default function Search() {
  return (
    <Suspense>
      <ProductsSearchClient />
    </Suspense>
  );
}
