/// <reference types="vite/client" />

interface Window {
  /**
   * SB-155: the GraphQL results a prerendered page was rendered from, written
   * into the file by the prerender so the first render needs no request.
   */
  __SKIPBUREAU_DATA__?: import('urql').SSRData
}
