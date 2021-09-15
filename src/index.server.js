import React from 'react';
import ReactDOMServer from 'react-dom/server';
import express from 'express';
import { StaticRouter } from 'react-router';
import App from './App';
import path from 'path';
import fs from 'fs';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import rootReducer from './modules';
import PreloadContext from './lib/PreloadContext';
// looking for file path from asset-manifest.json
const manifest = JSON.parse(
  fs.readFileSync(path.resolve('./build/asset-manifest.json'), 'utf8')
);

const chunks = Object.keys(manifest.files)
  .filter(key => /chunk\.js$/.exec(key)) // find key with chunk.js
  .map(key => `<script src="${manifest.files[key]}"></script>`) // convert to script tag
  .join(''); // merge

function createPage(root, stateScript) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charaset="utf-8" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,shrink-to-fit=no" />
      <meta name="theme-color" content="#000000" />
      <title>React App</title>
      <link href="${manifest.files['main.css']}" rel="stylesheet" />
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root">
      ${root}
    </div>
    ${stateScript}
    <script src="${manifest.files['runtime-main.js']}"></script>
    ${chunks}
    <script src="${manifest.files['main.js']}"></script>
  </body>
  </html>
  `;
}

const app = express();

// handler function for server side rendering
const serverRender = async (req, res, next) => {
  // this function do server side rendering when situation is 404
  const context = {};
  const store = createStore(rootReducer, applyMiddleware(thunk));

  const preloadContext = {
    done: false,
    promises: []
  };

  const jsx = (
    <PreloadContext.Provider value={preloadContext}>
      <Provider store={store} >
        <StaticRouter location={req.url} context={context}>
          <App />
        </StaticRouter>
      </Provider>
    </PreloadContext.Provider>
  );
  ReactDOMServer.renderToStaticMarkup(jsx);
  try {
    await Promise.all(preloadContext.promises);
  }
  catch (e) {
    return res.status(500)
  }
  preloadContext.done = true;

  const root = ReactDOMServer.renderToString(jsx); // do the rendering
  // convert json to string and replace < to prevent to execute other script.
  // https://redux.js.org/recipes/server-rendering#security-considerations
  const stateString = JSON.stringify(store.getState()).replace(/</g, '\\u003c');
  const stateScript = `<script>__PRELOADED_STATE__ = ${stateString}</script>`;// inject initial redux state as script.
  res.send(createPage(root, stateScript)); // response result to client
}

const serve = express.static(path.resolve('./build'), {
  index: false // "/" config to do not show index.html at path
})

app.use(serve); // order is important. It need to be placed in front of serverRender
app.use(serverRender);

app.listen(5000, () => {
  console.log('Running on http://localhost:5000');
});
