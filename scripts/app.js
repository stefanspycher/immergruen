import {loadConfig}      from './config.js';
import * as index        from './index.js';
import * as router       from './router.js';
import * as scroll       from './scroll.js';
import {renderHeader}    from './panels.js';

document.title = 'Loading…';

const config = await loadConfig();
await index.loadIndex(config.indexPath);

scroll.init(config);
router.init(config);
renderHeader(config);

document.body.dataset.state = 'ready';
