import React from 'react';
import ReactDOMServer from 'react-dom/server';
import express from 'express';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import path from 'path';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';
import rootReducer, { rootSaga } from './modules';
import PreloadContext from './lib/PreloadContext';
import { END } from 'redux-saga';
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';

const statsFile = path.resolve('./build/loadable-stats.json');

function createPage(root, tags) {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,shrink-to-fit=no"
      />
      <meta name="theme-color" content="#000000" />
      <title>React App</title>
      ${tags.styles}
      ${tags.links}
    </head>
    <body>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="root">
        ${root}
      </div>
      ${tags.scripts}
    </body>
    </html>
  `;
}

const app = express();

// handler function for server side rendering
const serverRender = async (req, res, next) => {
  // this function do server side rendering when situation is 404
  const context = {};
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(
    rootReducer, 
    applyMiddleware(thunk, sagaMiddleware)
  );

  const sagaPromise = sagaMiddleware.run(rootSaga).toPromise();

  const preloadContext = {
    done: false,
    promises: []
  };

  // 필요한 파일 추출하기 위한 ChunkExtractor
  const extractor = new ChunkExtractor({ statsFile });

  const jsx = (
    <ChunkExtractorManager extractor={extractor}>
      <PreloadContext.Provider value={preloadContext}>
        <Provider store={store}>
          <StaticRouter location={req.url} context={context}>
            <App />
          </StaticRouter>
        </Provider>
      </PreloadContext.Provider>
    </ChunkExtractorManager>
  );

  ReactDOMServer.renderToStaticMarkup(jsx);
  store.dispatch(END);
  try {
    await sagaPromise;
    await Promise.all(preloadContext.promises);
  }
  catch (e) {
    return res.status(500)
  }
  preloadContext.done = true;
  
  const root = ReactDOMServer.renderToString(jsx); // do the rendering
  const stateString = JSON.stringify(store.getState()).replace(/</g, '\\u003c');
  const stateScript = `<script>__PRELOADED_STATE__ = ${stateString}</script>`;

  const tags = {
    scripts: stateScript + extractor.getScriptTags(),// input redux state in front of script.
    links: extractor.getLinkTags(),
    styles: extractor.getStyleTags(),
  };
  res.send(createPage(root, tags)); // response result to client
}

const serve = express.static(path.resolve('./build'), {
  index: false // "/" config to do not show index.html at path
})

app.use(serve); // order is important. It need to be placed in front of serverRender
app.use(serverRender);

app.listen(5000, () => {
  console.log('Running on http://localhost:5000');
});
