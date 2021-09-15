import { createContext, useContext } from "react";

// Client env : null
// Server env : { done: false, promises: [] }
const PreloadContext = createContext(null);
export default PreloadContext;

// resolve is function type
export const Preloader = ({ resolve }) => {
  const preloadContext = useContext(PreloadContext);
  if (!preloadContext) return null; // if context value is invalid, do nothing
  if (preloadContext.done) return null; // if working has already done, do nothing

  // add promise to promises array
  // although resolve function do not return promise, to do like promise
  // use Promise.resolve function
  preloadContext.promises.push(Promise.resolve(resolve()));
  return null;
}
